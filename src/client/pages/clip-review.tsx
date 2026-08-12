import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

const HOOK_TYPES = ["Hot Take", "Question/Answer", "Tutorial", "Anecdote", "Story", "Listicle", "Demo", "Reaction", "Controversial", "Inspirational"];

export default function ClipReviewPage() {
  const [projectId] = useParams();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<Record<string, 1 | -1>>({});

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ["project-clips", projectId],
    queryFn: async () => {
      const res = await api.analysis[":projectId"].clips.$get({ param: { projectId: projectId! } });
      return res.json();
    },
    enabled: !!projectId,
  });

  const rateMutation = useMutation({
    mutationFn: async ({ clipId, rating }: { clipId: string; rating: 1 | -1 }) => {
      await api.clips[":clipId"].$patch({ param: { clipId }, json: { userRating: rating } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-clips", projectId] }),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--accent-2)]" />
        </div>
      </DashboardLayout>
    );
  }

  const clips = analysisData?.clips || [];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link to={`/project/${projectId}`} className="inline-flex items-center gap-2 mb-2 text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Workspace
            </Link>
            <h1 className="text-2xl font-black">Clip Review</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {clips.length} clips generated · Rate & edit your favorites
            </p>
          </div>
        </div>

        {clips.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ border: "2px dashed var(--border)", background: "var(--bg-secondary)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <p className="font-semibold mb-2">No clips yet</p>
            <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-secondary)" }}>
              Run AI Analysis in the workspace to generate clips from your videos.
            </p>
            <Link to={`/project/${projectId}`}>
              <button className="btn-glow text-white font-bold px-6 py-3 rounded-xl mt-4 inline-block cursor-pointer border-0">
                Go to Workspace
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clips.map((clip: any) => (
              <div key={clip.id} className="rounded-2xl overflow-hidden gradient-border" style={{ background: "var(--bg-secondary)" }}>
                {/* Video Preview */}
                <div className="relative aspect-[9/16] bg-black">
                  {clip.originalUrl && (
                    <video
                      src={clip.originalUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.7)", color: "white", border: "none" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Clip Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(124,58,237,0.2)",
                          color: "var(--accent-2)",
                        }}>
                        {clip.hookType || "Clip"}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {Math.round((clip.endTime - clip.startTime))}s · {Math.round(clip.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {clip.rationale || "AI-generated clip"}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Your rating:</span>
                    <button
                      onClick={() => { setRating(prev => ({ ...prev, [clip.id]: 1 })); rateMutation.mutate({ clipId: clip.id, rating: 1 }); }}
                      className={`p-1.5 rounded transition-all ${rating[clip.id] === 1 ? "bg-green-500/20 text-green-400" : "text-muted hover:text-green-400"}`}
                      style={{ background: "transparent", border: "none" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={rating[clip.id] === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => { setRating(prev => ({ ...prev, [clip.id]: -1 })); rateMutation.mutate({ clipId: clip.id, rating: -1 }); }}
                      className={`p-1.5 rounded transition-all ${rating[clip.id] === -1 ? "bg-red-500/20 text-red-400" : "text-muted hover:text-red-400"}`}
                      style={{ background: "transparent", border: "none" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={rating[clip.id] === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 22h3a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-3"/>
                      </svg>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link to={`/studio/${clip.id}`}>
                      <button className="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer border-0 text-white"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
                        Edit in Studio
                      </button>
                    </Link>
                    {clip.originalUrl && (
                      <a href={clip.originalUrl} download className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                        style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}