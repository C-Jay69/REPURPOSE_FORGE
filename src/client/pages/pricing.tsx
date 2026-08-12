import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    features: [
      "3 projects/month",
      "5 clips per project",
      "720p export",
      "Watermarked exports",
      "Basic caption styles",
      "Community support",
    ],
    limits: { projects: 3, clipsPerProject: 5, exportQuality: "720p", watermark: true },
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    period: "month",
    features: [
      "20 projects/month",
      "Unlimited clips",
      "1080p export",
      "No watermark",
      "Custom branding kit",
      "All caption styles (Hormozi, MrBeast, Minimal)",
      "Priority AI processing",
      "Email support",
    ],
    limits: { projects: 20, clipsPerProject: Infinity, exportQuality: "1080p", watermark: false },
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 99,
    period: "month",
    features: [
      "Unlimited projects",
      "Unlimited clips",
      "4K export",
      "No watermark",
      "Custom branding kit",
      "All caption styles",
      "Team seats (5 included)",
      "API access",
      "White-label exports",
      "Dedicated support",
      "Custom integrations",
    ],
    limits: { projects: Infinity, clipsPerProject: Infinity, exportQuality: "4K", watermark: false },
  },
];

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await api.stripe.plans.$get();
      return res.json();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await api.stripe["create-checkout"].$post({ json: { planId } });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await api.stripe.portal.$post();
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const currentPlan = subscriptionData?.currentPlan || "free";

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
            Simple, transparent pricing
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Start free. Upgrade when you're ready to scale. No hidden fees.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${billingCycle === "monthly" ? "bg-white text-black" : ""}`}
              style={{ background: billingCycle === "monthly" ? "white" : "transparent", color: billingCycle === "monthly" ? "black" : "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${billingCycle === "yearly" ? "bg-white text-black" : ""}`}
              style={{ background: billingCycle === "yearly" ? "white" : "transparent", color: billingCycle === "yearly" ? "black" : "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Yearly <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.2)", color: "#10B981" }}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Current Plan */}
        {currentPlan !== "free" && (
          <div className="mb-8 p-4 rounded-2xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Current plan: <span className="text-[var(--accent-1)]">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span></p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage or cancel anytime from your Stripe dashboard.</p>
              </div>
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: "transparent", color: "var(--accent-1)", border: "1px solid var(--accent-1)" }}
              >
                {portalMutation.isPending ? "Opening..." : "Manage Subscription"}
              </button>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl relative ${plan.highlight ? "" : ""}`}
              style={{
                background: plan.highlight ? "rgba(124,58,237,0.08)" : "var(--bg-secondary)",
                border: plan.highlight ? "2px solid rgba(124,58,237,0.5)" : "1px solid var(--border)",
                boxShadow: plan.highlight ? "0 0 40px rgba(124, 58, 237, 0.1)" : "none",
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "white" }}>
                  Most Popular
                </div>
              )}

              <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-5xl font-black">${plan.price}</span>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>/mo</span>
                {plan.price > 0 && billingCycle === "yearly" && (
                  <span className="ml-2 text-sm font-medium" style={{ color: "#10B981" }}>
                    ${Math.round(plan.price * 12 * 0.8)}/yr
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--success)" }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {currentPlan === plan.id ? (
                <button disabled className="w-full py-3 rounded-xl font-semibold cursor-not-allowed"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                Current Plan
              </button>
              ) : (
                <button
                  onClick={() => checkoutMutation.mutate(plan.id)}
                  disabled={checkoutMutation.isPending || plan.id === "free"}
                  className="w-full py-3 rounded-xl font-semibold cursor-pointer border-0 text-white disabled:opacity-50"
                  style={{
                    background: plan.highlight ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "transparent",
                    color: plan.highlight ? "white" : "var(--text-secondary)",
                    border: plan.highlight ? "none" : "1px solid var(--border)",
                  }}
                >
                  {checkoutMutation.isPending ? "Redirecting..." : plan.id === "free" ? "Current Plan" : plan.id === "pro" ? "Start 7-day Trial" : "Contact Sales"}
                </button>
              )}

              {plan.id === "free" && (
                <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                  No credit card required
                </p>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: "Can I change plans later?", a: "Yes, you can upgrade or downgrade anytime. Changes take effect immediately for upgrades, or at the end of your billing period for downgrades." },
              { q: "What happens when I hit my project limit?", a: "You won't be able to create new projects until you upgrade or the next billing cycle begins (Free plan resets monthly)." },
              { q: "Is there a free trial for Pro?", a: "Yes, Pro includes a 7-day free trial. You won't be charged until the trial ends." },
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your Stripe dashboard anytime. You'll keep access until the end of your billing period." },
              { q: "What payment methods do you accept?", a: "All major credit cards via Stripe. We don't store any payment information." },
              { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee on paid plans. Contact support for a refund." },
            ].map((faq, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
                <p className="font-semibold mb-1">{faq.q}</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}