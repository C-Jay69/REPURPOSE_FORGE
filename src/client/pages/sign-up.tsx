import { useState } from "react";
import { Link, Redirect } from "wouter";
import { authClient, captureToken } from "../lib/auth";

const plans = [
  { id: "free", name: "Free", price: 0, features: ["3 projects/month", "5 clips per project", "720p export", "Watermarked"] },
  { id: "pro", name: "Pro", price: 29, features: ["20 projects/month", "Unlimited clips", "1080p export", "No watermark", "Custom branding", "All caption styles"], highlight: true },
  { id: "agency", name: "Agency", price: 99, features: ["Unlimited projects", "Unlimited clips", "4K export", "Team seats (5)", "API access", "White-label"] },
];

export default function SignUpPage() {
  const [step, setStep] = useState<"plan" | "register">("plan");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = authClient.useSession();
  if (session) return <Redirect to="/dashboard" />;

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setStep("register");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard",
      }, {
        onSuccess: (ctx) => captureToken(ctx),
      });
      if (res.error) setError(res.error.message);
    } catch {
      setError("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "plan") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "var(--bg-primary)" }}>
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
                VCF
              </div>
              <span className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>
                Viral Clip<span style={{ color: "var(--accent-2)" }}>Forge</span>
              </span>
            </Link>
            <h1 className="text-4xl font-black mb-2" style={{ letterSpacing: "-0.02em" }}>Choose your plan</h1>
            <p style={{ color: "var(--text-secondary)" }}>All plans include a 7-day free trial. No credit card required for Free.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className={`p-6 rounded-2xl text-left transition-all ${plan.highlight ? 'relative' : ''}`}
                style={{
                  background: plan.highlight ? "rgba(124,58,237,0.08)" : "var(--bg-secondary)",
                  border: plan.highlight ? "2px solid rgba(124,58,237,0.5)" : "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
{plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "white" }}>
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--success)" }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="w-full py-3 rounded-xl font-semibold text-center block"
                  style={{
                    background: plan.highlight ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "transparent",
                    color: plan.highlight ? "white" : "var(--text-secondary)",
                    border: plan.highlight ? "none" : "1px solid var(--border)",
                  }}>
                  {plan.id === "free" ? "Start Free" : plan.id === "pro" ? "Start 7-day Trial" : "Contact Sales"}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm mt-8" style={{ color: "var(--text-muted)" }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md">
        <Link to="/" onClick={() => setStep("plan")} className="inline-flex items-center gap-2 mb-6 cursor-pointer" style={{ color: "var(--text-muted)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="text-sm">Change plan</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2" style={{ letterSpacing: "-0.02em" }}>Create your account</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {selectedPlan === "free" ? "Free plan" : selectedPlan === "pro" ? "Pro plan • 7-day trial" : "Agency plan"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "2rem" }}>
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-base"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-base"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl text-base"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-base cursor-pointer border-0 text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
          >
            {loading ? "Creating account..." : selectedPlan === "free" ? "Create Free Account" : "Start Trial"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Already have an account? <Link to="/sign-in" style={{ color: "var(--accent-2)", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}