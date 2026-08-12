import { Link } from "wouter";

const features = [
  { icon: "🎯", title: "AI Clip Detection", desc: "Smart AI finds the most viral moments in your long-form videos automatically." },
  { icon: "✂️", title: "Smart Clipping", desc: "Extract 30s-5min clips with precision timestamps and confidence scoring." },
  { icon: "🎨", title: "Studio Editor", desc: "Timeline editor with waveforms, aspect ratios (9:16, 1:1, 4:5), captions & branding." },
  { icon: "📝", title: "Auto-Captions", desc: "AI-generated transcripts with editable text, Hormozi/MrBeast/minimal styles." },
  { icon: "📅", title: "Content Scheduler", desc: "Calendar view, connect TikTok/IG/YouTube/LinkedIn, drag clips to schedule." },
  { icon: "🚀", title: "One-Click Export", desc: "Burn captions, add watermarks, reformat for any platform instantly." },
];

const steps = [
  { num: "01", title: "Upload Video", desc: "Drag & drop MP4, MOV, or WebM files. Multiple videos per project." },
  { num: "02", title: "AI Analysis", desc: "Set clip length (30s-5min), add keywords, let AI find viral hooks." },
  { num: "03", title: "Review & Edit", desc: "Rate clips, tweak in Studio, add captions & branding." },
  { num: "04", title: "Schedule & Post", desc: "Connect social accounts, drag to calendar, auto-publish." },
];

const plans = [
  { name: "Free", price: 0, features: ["3 projects/month", "5 clips per project", "720p export", "Watermarked", "Basic captions"], cta: "Start Free" },
  { name: "Pro", price: 29, features: ["20 projects/month", "Unlimited clips", "1080p export", "No watermark", "Custom branding", "All caption styles", "Priority processing"], cta: "Get Pro", highlight: true },
  { name: "Agency", price: 99, features: ["Unlimited projects", "Unlimited clips", "4K export", "No watermark", "Team seats (5)", "API access", "White-label", "Dedicated support"], cta: "Contact Sales" },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(10, 10, 15, 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(30,30,46,0.6)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
          >
            VCF
          </div>
          <span className="font-bold text-lg">
            Viral Clip<span style={{ color: "var(--accent-2)" }}>Forge</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/sign-in">
            <span className="text-sm cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>
              Sign in
            </span>
          </Link>
          <Link to="/sign-up">
            <button className="btn-glow text-white text-sm font-semibold px-5 py-2 rounded-xl cursor-pointer border-0">
              Get started free
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        {/* Orbs */}
        <div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 animate-orb pointer-events-none"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)", filter: "blur(40px)" }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #A855F7, transparent 70%)", filter: "blur(60px)", animationDelay: "3s", animation: "orb-float 10s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/2 right-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #EC4899, transparent 70%)", filter: "blur(50px)", animationDelay: "5s", animation: "orb-float 12s ease-in-out infinite" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8 animate-fade-up"
            style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.3)", color: "var(--accent-2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ boxShadow: "0 0 6px #10B981" }} />
            v2.0 • AI Clip Detection • Studio Editor • Scheduler
          </div>

          <h1
            className="text-6xl font-black leading-tight mb-6 animate-fade-up stagger-1"
            style={{ letterSpacing: "-0.03em" }}
          >
            Turn long videos into
            <br />
            <span style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              viral clips in minutes
            </span>
          </h1>

          <p
            className="text-xl max-w-2xl mx-auto mb-10 animate-fade-up stagger-2"
            style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}
          >
            Upload long-form content, let AI find the best moments, edit in our Studio with captions & branding,
            then schedule to TikTok, Reels, Shorts & LinkedIn — all in one workflow.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link to="/sign-up">
              <button className="btn-glow text-white font-bold px-8 py-4 rounded-2xl text-base cursor-pointer border-0">
                Start for free →
              </button>
            </Link>
            <Link to="/sign-in">
              <button
                className="font-semibold px-8 py-4 rounded-2xl text-base cursor-pointer transition-all"
                style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", background: "transparent" }}
              >
                See demo
              </button>
            </Link>
          </div>

          <p className="mt-4 text-sm animate-fade-up stagger-4" style={{ color: "var(--text-muted)" }}>
            No credit card • 3 free projects/month • Cancel anytime
          </p>
        </div>

        {/* Features grid */}
        <div className="relative z-10 mt-20 w-full max-w-4xl mx-auto animate-fade-up stagger-5">
          <p className="text-xs font-semibold tracking-widest mb-6 uppercase" style={{ color: "var(--text-muted)" }}>
            Core features
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl gradient-border"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Four steps to viral clips
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>From raw footage to scheduled posts in under 10 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl gradient-border"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div
                  className="text-4xl font-black mb-4"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>Start free. Upgrade when you're ready to scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-2xl ${plan.highlight ? 'relative' : ''}`}
                style={{
                  background: plan.highlight ? "rgba(124,58,237,0.08)" : "var(--bg-secondary)",
                  border: plan.highlight ? "1px solid rgba(124,58,237,0.4)" : "1px solid var(--border)",
                  boxShadow: plan.highlight ? "0 0 40px rgba(124, 58, 237, 0.1)" : "none",
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
                <Link to="/sign-up">
                  <button
                    className="w-full py-3 rounded-xl font-semibold cursor-pointer border-0 transition-all"
                    style={{
                      background: plan.highlight ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "transparent",
                      color: plan.highlight ? "white" : "var(--text-secondary)",
                      border: plan.highlight ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="p-12 rounded-3xl relative overflow-hidden"
            style={{ background: "var(--bg-secondary)", border: "1px solid rgba(124, 58, 237, 0.3)" }}
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: "radial-gradient(circle at center, #7C3AED, transparent 70%)" }}
            />
            <h2 className="text-4xl font-black mb-4 relative z-10" style={{ letterSpacing: "-0.02em" }}>
              Ready to forge viral clips?
            </h2>
            <p className="mb-8 relative z-10" style={{ color: "var(--text-secondary)" }}>
              Join creators saving 10+ hours/week on content repurposing.
            </p>
            <Link to="/sign-up">
              <button className="btn-glow text-white font-bold px-10 py-4 rounded-2xl text-base cursor-pointer border-0 relative z-10">
                Start free →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
        <p>© 2026 Viral Clip Forge • Your content is never used for training.</p>
      </footer>
    </div>
  );
}