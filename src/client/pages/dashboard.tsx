import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { DashboardLayout } from "../../components/layout";

const ALL_FORMATS = [
  { id: "twitter_thread", label: "X Thread", color: "#1DA1F2" },
  { id: "linkedin_post", label: "LinkedIn Post", color: "#0A66C2" },
  { id: "instagram_caption", label: "Instagram Caption", color: "#E1306C" },
  { id: "instagram_hooks", label: "IG Hooks (5)", color: "#F77737" },
  { id: "email_newsletter", label: "Email Newsletter", color: "#10B981" },
  { id: "youtube_script", label: "YouTube Script", color: "#FF0000" },
  { id: "blog_summary", label: "Blog Summary", color: "#7C3AED" },
  { id: "tiktok_hook", label: "TikTok Hook", color: "#FF004F" },
  { id: "podcast_intro", label: "Podcast Intro", color: "#F59E0B" },
  { id: "facebook_post", label: "Facebook Post", color: "#1877F2" },
  { id: "whatsapp_broadcast", label: "WhatsApp Blast", color: "#25D366" },
  { id: "sms_campaign", label: "SMS Campaign", color: "#A855F7" },
];

type Output = {
  id: string;
  format: string;
  formatLabel: string;
  content: string;
};

function OutputCard({ output, onRegenerate }: { output: Output; onRegenerate: (formatId: string, instruction: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(output.content);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [instruction, setInstruction] = useState("");

  const fmtDef = ALL_FORMATS.find(f => f.id === output.format);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMd = () => {
    const blob = new Blob([`# ${output.formatLabel}\n\n${editContent}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output.format}.md`;
    a.click();
  };

  return (
    <div
      className="output-card rounded-2xl gradient-border card-hover"
      style={{ background: "var(--bg-secondary)", animationDelay: `${Math.random() * 0.3}s` }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: fmtDef?.color || "var(--accent-2)", boxShadow: `0 0 6px ${fmtDef?.color || "var(--accent-2)"}80` }}
          />
          <span className="text-sm font-semibold">{output.formatLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRegenerate(!showRegenerate)}
            title="Regenerate"
            className="p-1.5 rounded-lg transition-all cursor-pointer"
            style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Edit"
            className="p-1.5 rounded-lg transition-all cursor-pointer"
            style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={handleExportMd}
            title="Export Markdown"
            className="p-1.5 rounded-lg transition-all cursor-pointer"
            style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: copied ? "rgba(16, 185, 129, 0.2)" : "rgba(124, 58, 237, 0.15)",
              color: copied ? "#10B981" : "var(--accent-2)",
              border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(124,58,237,0.3)"}`,
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Regenerate bar */}
      {showRegenerate && (
        <div className="px-4 py-3 flex gap-2" style={{ borderBottom: "1px solid var(--border)", background: "rgba(124,58,237,0.05)" }}>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder='E.g. "Make it more casual" or "Add a CTA"'
            className="flex-1 text-xs px-3 py-2 rounded-lg"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            onFocus={(e) => e.target.style.borderColor = "rgba(124, 58, 237, 0.6)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
          <button
            onClick={() => { onRegenerate(output.format, instruction); setShowRegenerate(false); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", border: "none" }}
          >
            Regenerate
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-sm leading-relaxed rounded-xl p-3 font-mono resize-none"
            rows={8}
            style={{ background: "var(--bg-elevated)", border: "1px solid rgba(124,58,237,0.3)", color: "var(--text-primary)" }}
          />
        ) : (
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace", fontSize: "12.5px", lineHeight: "1.7" }}
          >
            {editContent}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [inputContent, setInputContent] = useState("");
  const [inputType] = useState<"text">("text");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(ALL_FORMATS.map(f => f.id));
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Fetch user's subscription info
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await api.me.subscription.$get();
      return res.json();
    },
  });

  const remaining = subscriptionData?.remaining ?? 0;
  const granted = subscriptionData?.granted ?? 0;

  const toggleFormat = (id: string) => {
    setSelectedFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const repurposeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.repurpose.$post({
        json: {
          inputContent,
          inputType,
          formats: selectedFormats,
        },
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Generation failed");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      setOutputs(data.outputs || []);
      setSessionId(data.session?.id || null);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async ({ formatId, instruction }: { formatId: string; instruction: string }) => {
      if (!sessionId) throw new Error("No session");
      const res = await api.repurpose[":sessionId"].regenerate.$post({
        param: { sessionId },
        json: { formatId, customInstruction: instruction },
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.output) {
        setOutputs(prev => {
          const existingIndex = prev.findIndex(o => o.format === data.output.format);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = data.output;
            return updated;
          }
          return [...prev, data.output];
        });
      }
    },
  });

  const charCount = inputContent.length;
  const wordCount = inputContent.trim() ? inputContent.trim().split(/\s+/).length : 0;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.02em" }}>Repurpose Content</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Paste your content below and generate 12 platform variants instantly.
            </p>
          </div>
          {/* Usage meter */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Monthly usage</p>
              <p className="text-sm font-bold">
                <span style={{ color: remaining > 0 ? "var(--accent-2)" : "#ef4444" }}>{remaining}</span>
                <span style={{ color: "var(--text-muted)" }}> / {granted} left</span>
              </p>
            </div>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(0, (remaining / granted) * 100)}%`,
                  background: remaining > 2 ? "linear-gradient(90deg, #7C3AED, #A855F7)" : "#ef4444"
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel - Input */}
          <div className="lg:col-span-2 space-y-4">
            {/* Input */}
            <div
              className="rounded-2xl p-4 gradient-border"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Source content</h2>
                <div className="flex gap-1">
                  {["text"].map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-lg capitalize"
                      style={{ background: "rgba(124,58,237,0.15)", color: "var(--accent-2)", border: "1px solid rgba(124,58,237,0.3)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Paste your blog post, article, essay, transcript, or any long-form content here..."
                className="w-full text-sm leading-relaxed rounded-xl p-3 resize-none transition-all"
                rows={12}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "'Poppins', sans-serif",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124, 58, 237, 0.4)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {wordCount} words · {charCount} chars
                </span>
                {charCount > 0 && (
                  <button
                    onClick={() => setInputContent("")}
                    className="text-xs cursor-pointer"
                    style={{ color: "var(--text-muted)", background: "none", border: "none" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Format selector */}
            <div
              className="rounded-2xl p-4 gradient-border"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Output formats</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedFormats(ALL_FORMATS.map(f => f.id))}
                    className="text-xs cursor-pointer"
                    style={{ color: "var(--accent-2)", background: "none", border: "none" }}
                  >
                    All
                  </button>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <button
                    onClick={() => setSelectedFormats([])}
                    className="text-xs cursor-pointer"
                    style={{ color: "var(--text-muted)", background: "none", border: "none" }}
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {ALL_FORMATS.map((fmt) => {
                  const selected = selectedFormats.includes(fmt.id);
                  return (
                    <label
                      key={fmt.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: selected ? "rgba(124,58,237,0.08)" : "transparent",
                        border: selected ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: selected ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "var(--bg-elevated)",
                          border: selected ? "none" : "1px solid var(--border)",
                        }}
                      >
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <input type="checkbox" checked={selected} onChange={() => toggleFormat(fmt.id)} className="hidden" />
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: fmt.color }} />
                      <span className="text-sm" style={{ color: selected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {fmt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={() => repurposeMutation.mutate()}
              disabled={repurposeMutation.isPending || !inputContent.trim() || selectedFormats.length === 0 || remaining <= 0}
              className="w-full py-4 rounded-2xl font-bold text-base cursor-pointer border-0 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #A855F7)",
                boxShadow: repurposeMutation.isPending ? "none" : "0 0 24px rgba(124, 58, 237, 0.4)",
              }}
            >
              {repurposeMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                  Generating {selectedFormats.length} variants...
                </span>
              ) : remaining <= 0 ? (
                "Upgrade to continue ↗"
              ) : (
                `��� Generate ${selectedFormats.length} variants`
              )}
            </button>

            {repurposeMutation.isError && (
              <p
                className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-xl"
                style={{ border: "1px solid rgba(239,68,68,0.3)" }}
              >
                {(repurposeMutation.error as Error).message}
              </p>
            )}
          </div>

          {/* Right panel - Outputs */}
          <div className="lg:col-span-3">
            {outputs.length === 0 && !repurposeMutation.isPending ? (
              <div
                className="h-full min-h-64 rounded-2xl flex flex-col items-center justify-center"
                style={{ border: "2px dashed var(--border)", background: "var(--bg-secondary)" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <p className="font-semibold mb-2">Your outputs will appear here</p>
                <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-secondary)" }}>
                  Paste content on the left and click Generate to create 12 platform-optimized variants.
                </p>
              </div>
            ) : repurposeMutation.isPending ? (
              <div className="space-y-4">
                {selectedFormats.slice(0, 6).map((id) => {
                  const fmt = ALL_FORMATS.find(f => f.id === id);
                  return (
                    <div key={id} className="rounded-2xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full skeleton" />
                        <div className="h-4 w-28 rounded skeleton" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 rounded skeleton w-full" />
                        <div className="h-3 rounded skeleton w-4/5" />
                        <div className="h-3 rounded skeleton w-3/5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {outputs.map((output) => (
                  <OutputCard
                    key={output.id}
                    output={output}
                    onRegenerate={(formatId, instruction) =>
                      regenerateMutation.mutate({ formatId, instruction })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
