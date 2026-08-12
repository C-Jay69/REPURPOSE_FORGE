import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

const CLIP_DURATIONS = [30, 60, 90, 120, 180, 240, 300];

export default function ProjectWorkspacePage() {
  const [projectId] = useParams();
  const queryClient = useQueryClient();
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [keywords, setKeywords] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await api.projects[":projectId"].$get({ param: { projectId: projectId! } });
      return res.json();
    },
    enabled: !!projectId,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await api.stripe.plans.$get();
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/videos/${projectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        body: formData,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setUploading(false);
    },
    onError: () => setUploading(false),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.analysis[":projectId"].videos[":videoId"].$post({
        param: { projectId: projectId!, videoId: projectData?.videos?.[0]?.id },
        json: { clipDuration: selectedDuration, keywords: keywords.split(",").map(k => k.trim()).filter(Boolean) },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await api.videos[":projectId"][":videoId"].$delete({ param: { projectId: projectId!, videoId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("video/"));
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const plan = subscriptionData?.currentPlan || "free";
  const planLimits = { free: 5, pro: Infinity, agency: Infinity };
  const maxVideos = planLimits[plan as keyof typeof planLimits] || 5;
  const videoCount = projectData?.videos?.length || 0;
  const atVideoLimit = videoCount >= maxVideos;

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--accent-2)]" />
        </div>
      </DashboardLayout>
    );
  }

  const project = projectData?.project;
  const videos = projectData?.videos || [];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-2 text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Projects
            </Link>
            <h1 className="text-2xl font-black">{project?.name}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {videoCount} / {maxVideos === Infinity ? "∞" : maxVideos} videos · {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
            </p>
          </div>
          <Link to={`/project/${projectId}/review`}>
            <button className="btn-glow text-white font-bold px-6 py-3 rounded-xl cursor-pointer border-0" disabled={videos.length === 0}>
              Review Clips →
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Video List & Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Zone */}
            <div
              className={`rounded-2xl p-6 border-2 border-dashed transition-all ${dragging ? "border-[var(--accent-2)] bg-[rgba(124,58,237,0.05)]" : "border-[var(--border)]"}`}
              style={{ background: "var(--bg-secondary)" }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setUploading(true);
                  files.forEach(f => uploadMutation.mutateAsync(f));
                }}
                className="hidden"
                id="video-upload"
                disabled={atVideoLimit || uploading}
              />
              <div className="text-center">
                <svg className="mx-auto mb-4 w-12 h-12" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M7 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10"/>
                  <path d="M13 2v10"/>
                </svg>
                <p className="text-lg font-medium mb-1">Drag & drop videos here</p>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                  MP4, MOV, WebM · Up to 2GB each · {atVideoLimit ? `Limit reached (${maxVideos}/${plan} plan)` : `${maxVideos - videoCount} more videos allowed`}
                </p>
                <label htmlFor="video-upload" className="inline-block">
                  <button
                    type="button"
                    disabled={atVideoLimit || uploading}
                    className="btn-glow text-white font-semibold px-6 py-3 rounded-xl cursor-pointer border-0 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Browse Files"}
                  </button>
                </label>
              </div>
            </div>

            {/* Video List */}
            {videos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Source Videos</h3>
                {videos.map((video: any) => (
                  <div key={video.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    <div className="w-16 h-9 rounded-lg flex-shrink-0" style={{ background: "var(--bg-elevated)" }}>
                      <video src={`/api/files/${video.storageUrl}`} muted playsInline />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.id.slice(0, 8)}...</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : "Processing..."}
                        · {video.status}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteVideoMutation.mutate(video.id)}
                      disabled={deleteVideoMutation.isPending}
                      className="p-2 rounded-lg"
                      style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - AI Co-pilot Controls */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <h2 className="text-lg font-bold mb-6">AI Co-pilot Settings</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Clip Length
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CLIP_DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDuration(d)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all`}
                        style={{
                          background: selectedDuration === d ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "var(--bg-elevated)",
                          color: selectedDuration === d ? "white" : "var(--text-secondary)",
                          border: selectedDuration === d ? "none" : "1px solid var(--border)",
                        }}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Keywords to focus on (optional)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="AI, marketing tips, growth hack"
                    className="w-full px-4 py-3 rounded-xl text-base"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Comma-separated. AI will prioritize segments containing these terms.
                  </p>
                </div>

                <button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending || videos.length === 0}
                  className="w-full py-4 rounded-xl font-bold text-base cursor-pointer border-0 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
                >
                  {analyzeMutation.isPending ? "Analyzing..." : "Start AI Analysis"}
                </button>

                {analyzeMutation.isPending && (
                  <div className="text-center text-sm" style={{ color: "var(--accent-2)" }}>
                    AI is finding viral moments... This may take a minute.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}