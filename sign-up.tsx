import { useState } from "react";
import { Link, useLocation } from "wouter";
import { authClient, captureToken } from "../lib/auth";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authClient.signUp.email(
      { name, email, password },
      { onSuccess: captureToken }
    );

    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Failed to create account");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 w-60 h-60 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #EC4899, transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
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
          <h1 className="text-2xl font-black mb-2">Create your account</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            5 free repurposes/month · No credit card
          </p>
        </div>

        <div
          className="p-6 rounded-2xl gradient-border"
          style={{ background: "var(--bg-secondary)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124, 58, 237, 0.6)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>
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
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
                placeholder="Min. 8 characters"
                minLength={8}
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
                  Creating account...
                </span>
              ) : "Create free account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/sign-in">
            <span className="font-semibold cursor-pointer" style={{ color: "var(--accent-2)" }}>
              Sign in
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
