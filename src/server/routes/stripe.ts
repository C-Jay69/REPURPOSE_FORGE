import { Hono } from 'hono';
import { db } from '../database';
import { subscriptions } from '../schema';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-01',
});

const PLAN_PRICES: Record<string, string | undefined> = {
  free: undefined,
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

const app = new Hono();

app.get('/plans', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
  const currentPlan = sub?.planType || 'free';

  return c.json({
    plans: [
      { id: 'free', name: 'Free', price: 0, features: ['3 projects', '5 clips/project', '720p export', 'Watermark'] },
      { id: 'pro', name: 'Pro', price: 29, features: ['20 projects', 'Unlimited clips', '1080p export', 'No watermark', 'Custom branding', 'Priority processing'] },
      { id: 'agency', name: 'Agency', price: 99, features: ['Unlimited projects', 'Unlimited clips', '4K export', 'No watermark', 'Custom branding', 'Team seats (5)', 'API access', 'White-label'] },
    ],
    currentPlan,
  });
});

app.post('/create-checkout', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const { planId } = await c.req.json();
  const priceId = PLAN_PRICES[planId];

  if (!priceId) {
    throw new HTTPException(400, { message: 'Invalid plan or price not configured' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing`,
    customer_email: user.email,
    metadata: { userId: user.id, planId },
  });

  return c.json({ url: session.url });
});

app.post('/portal', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
  if (!sub?.stripeCustomerId) throw new HTTPException(404, { message: 'No subscription found' });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`,
  });

  return c.json({ url: portalSession.url });
});

app.post('/webhook', async (c) => {
  const buf = await c.req.arrayBuffer();
  const sig = c.req.header('Stripe-Signature') ?? '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err);
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, planId } = session.metadata;
      if (!userId || !planId) break;

      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        planType: planId,
        status: session.status,
        currentPeriodEnd: session.current_period_end * 1000,
      }).onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          planType: planId,
          status: session.status,
          currentPeriodEnd: session.current_period_end * 1000,
          updatedAt: Date.now(),
        },
      });
      break;
    }
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const stripeSubscriptionId = subscription.id;
      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
      if (!sub) break;

      await db.update(subscriptions)
        .set({
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end * 1000,
          updatedAt: Date.now(),
        })
        .where(eq(subscriptions.id, sub.id));
      break;
    }
  }

  return c.json({ received: true }, 200);
});

export default app;