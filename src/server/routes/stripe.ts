import { Hono } from 'hono';
import { db } from '../database';
import { subscriptions } from '../schema';
import { and, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-01',
});

const app = new Hono();

// Create a checkout session for a plan
app.post('/create-checkout', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  const { planId } = await c.req.json(); // 'pro' or 'unlimited'

  let priceId;
  if (planId === 'pro') {
    priceId = process.env.STRIPE_PRICE_PRO;
  } else if (planId === 'unlimited') {
    priceId = process.env.STRIPE_PRICE_UNLIMITED;
  } else {
    throw new HTTPException(400, { message: 'Invalid planId' });
  }

  if (!priceId) {
    throw new HTTPException(500, { message: 'Price ID not configured' });
  }

  // Create a Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
      planId,
    },
  });

  return c.json({ url: session.url });
});

// Create a customer portal session
app.post('/portal', async (c) => {
  const user = c.get('user');
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

  // Find the subscription for this user to get the stripeCustomerId
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));

  if (!sub) {
    throw new HTTPException(404, { message: 'No subscription found' });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
  });

  return c.json({ url: portalSession.url });
});

// Webhook handler for Stripe events
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

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, planId } = session.metadata;
      if (!userId || !planId) {
        console.error('Missing metadata in checkout.session.completed');
        break;
      }

      // Create a subscription record
      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        planId,
        status: session.status,
        currentPeriodEnd: session.current_period_end * 1000, // convert to ms
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
      if (!sub) {
        console.error(`Subscription not found for stripeSubscriptionId: ${stripeSubscriptionId}`);
        break;
      }

      await db.update(subscriptions)
        .set({
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end * 1000,
        })
        .where(eq(subscriptions.id, sub.id));
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return c.json({ received: true }, 200);
});

export default app;
