import { useState } from "react";
import { Link, useLocation } from "wouter";
import { authClient, captureToken } from "../lib/auth";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authClient.signIn.email(
      { email, password },
      { onSuccess: captureToken }
    );

    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Invalid credentials");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-60 h-60 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #A855F7, transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="inline-flex items-center gap-2 cursor-pointer mb-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
              >
                R
              </div>
              <span className="font-bold text-xl">
                Repurpose<span style={{ color: "var(--accent-2)" }}>AI</span>
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-black mb-2">Welcome back</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className="p-6 rounded-2xl gradient-border"
          style={{ background: "var(--bg-secondary)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124, 58, 237, 0.6)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124, 58, 237, 0.6)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-800/40">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full text-white font-semibold py-3 rounded-xl cursor-pointer border-0 text-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/sign-up">
            <span className="font-semibold cursor-pointer" style={{ color: "var(--accent-2)" }}>
              Sign up free
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
