import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { DashboardLayout } from "../../components/layout";

type Session = {
  id: string;
  inputTitle: string | null;
  inputType: string;
  status: string;
  createdAt: string | number;
};

type Output = {
  id: string;
  format: string;
  formatLabel: string;
  content: string;
};

function SessionDetail({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const res = await api.repurpose.history[":sessionId"].$get({ param: { sessionId } });
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl skeleton" />
        ))}
      </div>
    );
  }

  const outputs = (data as any)?.outputs || [];

  return (
    <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
      {outputs.map((output: Output) => (
        <OutputRow key={output.id} output={output} />
      ))}
      {outputs.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No outputs found</p>
      )}
    </div>
  );
}

function OutputRow({ output }: { output: Output }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl transition-all"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{output.formatLabel}</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {output.content.substring(0, 50)}...
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-xs px-2.5 py-1 rounded-lg cursor-pointer font-semibold"
            style={{
              background: copied ? "rgba(16,185,129,0.15)" : "rgba(124,58,237,0.1)",
              color: copied ? "#10B981" : "var(--accent-2)",
              border: "none",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--text-muted)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>
            {output.content}
          </p>
        </div>
      )}
    </div>
  );
}

function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const res = await api.repurpose.history.$get();
      return res.json();
    },
  });

  const sessions: Session[] = (data as any)?.sessions || [];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.02em" }}>History</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            All your past repurposings. Click any session to view outputs.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-2xl skeleton" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div
            className="py-24 rounded-2xl flex flex-col items-center justify-center"
            style={{ border: "2px dashed var(--border)", background: "var(--bg-secondary)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <p className="font-semibold mb-2">No repurposings yet</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Go to Dashboard and generate your first batch of content.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer card-hover"
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: session.status === "done" ? "#10B981" : "#F59E0B" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {session.inputTitle || "Untitled content"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDate(session.createdAt)} · {session.inputType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: session.status === "done" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: session.status === "done" ? "#10B981" : "#F59E0B" }}
                    >
                      {session.status}
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ color: "var(--text-muted)", transform: expandedSession === session.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
                {expandedSession === session.id && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    <SessionDetail sessionId={session.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
