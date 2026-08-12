import { useState } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { authClient, captureToken } from "../lib/auth";

export default function SignInPage() {
  const [location] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session } = authClient.useSession();
  if (session) return <Redirect to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authClient.signIn.email({ email, password, callbackURL: "/dashboard" }, {
        onSuccess: (ctx) => captureToken(ctx),
      });
      if (res.error) setError(res.error.message);
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
              VCF
            </div>
            <span className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>
              Viral Clip<span style={{ color: "var(--accent-2)" }}>Forge</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black mb-2" style={{ letterSpacing: "-0.02em" }}>Welcome back</h1>
          <p style={{ color: "var(--text-secondary)" }}>Sign in to continue to your projects</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "2rem" }}>
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </div>
          )}

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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Don't have an account? <Link to="/sign-up" style={{ color: "var(--accent-2)", fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}