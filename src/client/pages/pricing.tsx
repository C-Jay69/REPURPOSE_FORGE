import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../../components/layout";

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["5 repurposes/month", "12 output formats", "Brand voice training", "Copy + Markdown export"],
  pro: ["200 repurposes/month", "12 output formats", "Brand voice training", "Copy + Markdown export", "Priority AI generation", "Full history access"],
  unlimited: ["Unlimited repurposes", "12 output formats", "Brand voice training", "All export formats", "Priority AI generation", "Full history access", "Early access to new features"],
};

const PLANS = [
  { id: "free", name: "Free", price: null },
  { id: "pro", name: "Pro", price: { amount: 1900 } }, // $19.00
  { id: "unlimited", name: "Unlimited", price: { amount: 4900 } }, // $49.00
];

export default function PricingPage() {
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/me/subscription");
      return res.json();
    },
  });

  const activePlan = subscriptionData?.planId ?? "free";

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.02em" }}>Plans & Billing</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {subscriptionData
              ? `You have ${subscriptionData.remaining ?? 0} / ${subscriptionData.granted ?? 0} repurposes left this month.`
              : "Loading..."}
          </p>
        </div>

        {/* Current plan badge */}
        {activePlan && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Current plan: <strong className="capitalize">{activePlan}</strong>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          {PLANS.map((plan) => {
            const isActive = plan.id === activePlan;
            const features = PLAN_FEATURES[plan.id] || [];
            const isPopular = plan.id === "pro";

            return (
              <div
                key={plan.id}
                className="rounded-2xl p-6 relative transition-all"
                style={{
                  background: isPopular ? "rgba(124,58,237,0.08)" : "var(--bg-secondary)",
                  border: isPopular ? "1px solid rgba(124,58,237,0.5)" : "1px solid var(--border)",
                  boxShadow: isPopular ? "0 0 30px rgba(124,58,237,0.15)" : "none",
                }}
              >
                {isPopular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
                  >
                    Most popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold capitalize">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    {plan.price ? (
                      <>
                        <span className="text-3xl font-black">${plan.price.amount / 100}</span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>/mo</span>
                      </>
                    ) : (
                      <span className="text-3xl font-black">Free</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <div
                    className="w-full py-3 rounded-xl text-center text-sm font-semibold"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
                  >
                    Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      // Redirect to Stripe checkout
                      const planId = plan.id;
                      if (planId === "pro" || planId === "unlimited") {
                        window.location.href = `/api/stripe/create-checkout?planId=${planId}`;
                      }
                    }}
                    className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all border-0"
                    style={isPopular ? {
                      background: "linear-gradient(135deg, #7C3AED, #A855F7)",
                      color: "white",
                      boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                    } : {
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {activePlan === "unlimited" && plan.id !== "unlimited" ? "Downgrade" :
                      activePlan === "pro" && plan.id === "free" ? "Downgrade" :
                      plan.price ? "Upgrade →" : "Downgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
          Your data is never used for AI training. Cancel anytime. Billed via Stripe.
        </p>
      </div>
    </DashboardLayout>
  );
}
