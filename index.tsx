import { Link } from "wouter";

const formats = [
  { label: "X Thread", color: "#1DA1F2", icon: "𝕏" },
  { label: "LinkedIn Post", color: "#0A66C2", icon: "in" },
  { label: "Instagram Caption", color: "#E1306C", icon: "◎" },
  { label: "Email Newsletter", color: "#10B981", icon: "✉" },
  { label: "YouTube Script", color: "#FF0000", icon: "▶" },
  { label: "Blog Summary", color: "#7C3AED", icon: "≡" },
  { label: "TikTok Hook", color: "#FF004F", icon: "♪" },
  { label: "Podcast Intro", color: "#F59E0B", icon: "🎙" },
  { label: "Facebook Post", color: "#1877F2", icon: "f" },
  { label: "WhatsApp Blast", color: "#25D366", icon: "◉" },
  { label: "SMS Campaign", color: "#A855F7", icon: "✉" },
  { label: "IG Hooks (5)", color: "#F77737", icon: "⚡" },
];

const steps = [
  { num: "01", title: "Drop your content", desc: "Paste text, a URL, or upload an audio/video file. We handle the rest." },
  { num: "02", title: "AI does the work", desc: "GPT-4o analyzes your content and generates 12 platform-native variants in seconds." },
  { num: "03", title: "Copy, edit, export", desc: "One-click copy, inline editing, export to Markdown or PDF. Done." },
];

const testimonials = [
  { name: "Sarah K.", role: "Creator & Coach", text: "I used to spend 4 hours turning each podcast into social content. Now it's 4 minutes.", avatar: "S" },
  { name: "Marcus D.", role: "Marketing Lead", text: "The brand voice training is insane. It actually writes like me, not like a robot.", avatar: "M" },
  { name: "Priya R.", role: "Solo Founder", text: "Shipped my first 30 days of content in one afternoon. Game over.", avatar: "P" },
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
            R
          </div>
          <span className="font-bold text-lg">
            Repurpose<span style={{ color: "var(--accent-2)" }}>AI</span>
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
            12 formats. One click. Your voice.
          </div>

          <h1
            className="text-6xl font-black leading-tight mb-6 animate-fade-up stagger-1"
            style={{ letterSpacing: "-0.03em" }}
          >
            One input.
            <br />
            <span style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Infinite reach.
            </span>
          </h1>

          <p
            className="text-xl max-w-2xl mx-auto mb-10 animate-fade-up stagger-2"
            style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}
          >
            Transform any blog post, podcast, or video into 12 platform-optimized pieces of content —
            in your voice, in seconds.
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
                See a demo
              </button>
            </Link>
          </div>

          <p className="mt-4 text-sm animate-fade-up stagger-4" style={{ color: "var(--text-muted)" }}>
            5 free repurposes/month · No credit card required
          </p>
        </div>

        {/* Formats grid */}
        <div className="relative z-10 mt-20 w-full max-w-4xl mx-auto animate-fade-up stagger-5">
          <p className="text-xs font-semibold tracking-widest mb-6 uppercase" style={{ color: "var(--text-muted)" }}>
            Output formats
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {formats.map((fmt) => (
              <div
                key={fmt.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <span style={{ color: fmt.color, fontSize: "11px" }}>{fmt.icon}</span>
                {fmt.label}
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
              Dead simple workflow
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>From raw content to 12 polished posts in under 30 seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Creators save 2+ hours/week
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl gradient-border"
                style={{ background: "var(--bg-secondary)" }}
              >
                <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#7c3aed" }}>How It Works</span>
            <h2 className="text-4xl font-black mt-3 mb-4" style={{ letterSpacing: "-0.02em" }}>
              Three steps. Twelve platforms.
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>No learning curve. Just paste, pick, and publish.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px" style={{ background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />

            {[
              {
                step: "01",
                title: "Paste your content",
                description: "Drop in a blog post, newsletter, podcast transcript, tweet thread — anything you've already written.",
                icon: "✍️",
                color: "#7c3aed",
              },
              {
                step: "02",
                title: "Pick your platforms",
                description: "Choose from 12 output formats — X threads, LinkedIn posts, Instagram captions, YouTube scripts, newsletters, SMS and more.",
                icon: "🎯",
                color: "#06b6d4",
              },
              {
                step: "03",
                title: "Copy & publish",
                description: "Your AI-adapted content is ready in seconds. Copy each format and post natively — no reformatting needed.",
                icon: "🚀",
                color: "#10b981",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl p-8"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-6"
                  style={{ background: `${item.color}20` }}
                >
                  {item.icon}
                </div>
                <div
                  className="absolute top-6 right-6 text-5xl font-black opacity-10 select-none"
                  style={{ color: item.color }}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Bonus: Brand Voice callout */}
          <div
            className="mt-8 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <div className="text-3xl">🎙️</div>
            <div>
              <p className="font-semibold mb-1">Bonus: Train your Brand Voice</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Paste examples of your writing, adjust tone sliders, and every repurpose will sound like <em>you</em> — not a generic AI.
              </p>
            </div>
            <Link to="/sign-up" className="ml-auto shrink-0">
              <button
                className="text-sm font-medium px-5 py-2 rounded-xl cursor-pointer border-0 whitespace-nowrap"
                style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
              >
                Try it free →
              </button>
            </Link>
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
              Start repurposing today
            </h2>
            <p className="mb-8 relative z-10" style={{ color: "var(--text-secondary)" }}>
              5 free repurposes every month. No credit card. Cancel anytime.
            </p>
            <Link to="/sign-up">
              <button className="btn-glow text-white font-bold px-10 py-4 rounded-2xl text-base cursor-pointer border-0 relative z-10">
                Get started for free →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
        <p>© 2026 RepurposeAI · Your data is never used for training.</p>
      </footer>
    </div>
  );
}
