import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

const ASPECT_RATIOS = [
  { key: "9:16", label: "9:16", platforms: "Reels/TikTok/Shorts" },
  { key: "1:1", label: "1:1", platforms: "Instagram Feed" },
  { key: "4:5", label: "4:5", platforms: "Instagram Portrait" },
  { key: "16:9", label: "16:9", platforms: "YouTube/Original" },
];

const CAPTION_STYLES = [
  { key: "hormozi", label: "Hormozi", color: "#FF6B35" },
  { key: "mrbeast", label: "MrBeast", color: "#00D4FF" },
  { key: "minimal", label: "Minimal", color: "#10B981" },
];

export default function StudioPage() {
  const [clipId] = useParams();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionStyle, setCaptionStyle] = useState("hormozi");
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [captionSegments, setCaptionSegments] = useState<Array<{ start: number; end: number; text: string }>>([]);
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [duration, setDuration] = useState(0);

  const { data: clipData, isLoading } = useQuery({
    queryKey: ["clip", clipId],
    queryFn: async () => {
      const res = await api.clips[":clipId"].$get({ param: { clipId: clipId! } });
      return res.json();
    },
    enabled: !!clipId,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await api.clips[":clipId"].export.$post({
        param: { clipId: clipId! },
        json: {
          aspectRatio,
          captionStyle,
          watermarkEnabled,
          captionSegments: captionsEnabled ? captionSegments : [],
          watermarkPath: watermarkEnabled ? clipData?.clip?.brandingKit?.logoUrl : undefined,
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      setExportProgress("Export completed!");
      setTimeout(() => setExportProgress(null), 3000);
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: 1 | -1) => {
      await api.clips[":clipId"].$patch({ param: { clipId: clipId! }, json: { userRating: rating } });
    },
  });

  useEffect(() => {
    if (clipData?.clip) {
      const clip = clipData.clip;
      setTrimStart(clip.startTime);
      setTrimEnd(clip.endTime);
      setDuration(clip.endTime - clip.startTime);
    }
  }, [clipData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportMutation.mutateAsync();
    } finally {
      setExporting(false);
    }
  };

  const handleSegmentEdit = (index: number) => {
    setEditingSegment(index);
    setEditText(captionSegments[index].text);
  };

  const handleSegmentSave = () => {
    if (editingSegment !== null) {
      setCaptionSegments(prev => prev.map((s, i) => i === editingSegment ? { ...s, text: editText } : s));
      setEditingSegment(null);
      setEditText("");
    }
  };

  const handleSegmentDelete = (index: number) => {
    setCaptionSegments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "9:16": return "aspect-[9/16]";
      case "1:1": return "aspect-square";
      case "4:5": return "aspect-[4/5]";
      case "16:9": return "aspect-video";
      default: return "aspect-[9/16]";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--accent-2)]" />
        </div>
      </DashboardLayout>
    );
  }

  const clip = clipData?.clip;
  const videoUrl = clip?.originalUrl;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link to={`/project/${clip?.sourceVideoId}/review`} className="inline-flex items-center gap-2 mb-2 text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Clips
            </Link>
            <h1 className="text-2xl font-black">Studio Editor</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Trim, reformat, add captions & branding, then export
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-glow text-white font-bold px-6 py-3 rounded-xl cursor-pointer border-0 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Finalize & Export"}
            </button>
          </div>
        </div>

        {exportProgress && (
          <div className="mb-6 p-4 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>
            {exportProgress}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Video Preview & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#000" }}>
              <div className={getAspectRatioClass()} style={{ position: "relative", background: "#000" }}>
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    controls
                    onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
                  />
                )}
                {!videoUrl && (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                    Video not available
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="font-semibold mb-4">Timeline</h3>

              {/* Waveform placeholder */}
              <div className="h-24 rounded-lg mb-4 flex items-end gap-1" style={{ background: "var(--bg-elevated)" }}>
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{
                    height: `${Math.max(4, Math.random() * 80)}%`,
                    background: "linear-gradient(to top, var(--accent-1), var(--accent-2))",
                  }} />
                ))}
              </div>

              {/* Trim Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-20 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Start</label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, duration)}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd - 0.5))}
                    className="flex-1"
                    style={{ accentColor: "var(--accent-1)" }}
                  />
                  <span className="w-16 text-right font-mono text-sm">{formatTime(trimStart)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-20 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>End</label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, duration)}
                    step={0.1}
                    value={trimEnd || duration}
                    onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart + 0.5))}
                    className="flex-1"
                    style={{ accentColor: "var(--accent-1)" }}
                  />
                  <span className="w-16 text-right font-mono text-sm">{formatTime(trimEnd || duration)}</span>
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Duration: {formatTime((trimEnd || duration) - trimStart)}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Social Formatting, Captions, Branding */}
          <div className="space-y-6">
            {/* Aspect Ratio */}
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="font-semibold mb-4">Aspect Ratio</h3>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.key}
                    onClick={() => setAspectRatio(ar.key)}
                    className={`p-3 rounded-xl text-center transition-all ${aspectRatio === ar.key ? "relative" : ""}`}
                    style={{
                      background: aspectRatio === ar.key ? "rgba(124,58,237,0.15)" : "var(--bg-elevated)",
                      border: aspectRatio === ar.key ? "2px solid var(--accent-1)" : "1px solid var(--border)",
                      color: aspectRatio === ar.key ? "var(--accent-1)" : "var(--text-secondary)",
                    }}
                  >
                    <div className="font-bold">{ar.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{ar.platforms}</div>
                    {aspectRatio === ar.key && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ background: "var(--accent-1)" }}>
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Captions */}
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Auto-Captions</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captionsEnabled}
                    onChange={(e) => setCaptionsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                    style={{ background: captionsEnabled ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "var(--border)" }} />
                </label>
              </div>

              {captionsEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Caption Style</label>
                    <div className="flex gap-2">
                      {CAPTION_STYLES.map((style) => (
                        <button
                          key={style.key}
                          onClick={() => setCaptionStyle(style.key)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${captionStyle === style.key ? "relative" : ""}`}
                          style={{
                            background: captionStyle === style.key ? style.color : "var(--bg-elevated)",
                            color: captionStyle === style.key ? "white" : "var(--text-secondary)",
                            border: captionStyle === style.key ? "none" : "1px solid var(--border)",
                          }}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2" style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", background: "var(--bg-elevated)" }}>
                    {captionSegments.length === 0 ? (
                      <div className="p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                        No caption segments yet. Add them manually or generate from transcript.
                      </div>
                    ) : (
                      captionSegments.map((seg, i) => (
                        <div key={i} className="p-3 border-b border-[var(--border)] flex items-center gap-2" style={{ background: editingSegment === i ? "rgba(124,58,237,0.05)" : "transparent" }}>
                          <span className="w-16 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                            {formatTime(seg.start)} - {formatTime(seg.end)}
                          </span>
                          {editingSegment === i ? (
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSegmentSave(); if (e.key === "Escape") setEditingSegment(null); }}
                              className="flex-1 px-3 py-1 rounded text-sm"
                              style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-1)", color: "var(--text-primary)" }}
                              autoFocus
                            />
                          ) : (
                            <span className="flex-1 text-sm cursor-pointer" onClick={() => handleSegmentEdit(i)} style={{ color: "var(--text-primary)" }}>
                              {seg.text}
                            </span>
                          )}
                          <button
                            onClick={() => handleSegmentEdit(i)}
                            className="p-1 text-muted hover:text-accent-1"
                            style={{ background: "transparent", border: "none" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleSegmentDelete(i)}
                            className="p-1 text-muted hover:text-red-400"
                            style={{ background: "transparent", border: "none" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setCaptionSegments(prev => [...prev, { start: trimStart, end: trimStart + 3, text: "New caption..." }])}
                    className="w-full py-2 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: "transparent", color: "var(--accent-1)", border: "1px dashed var(--accent-1)" }}
                  >
                    + Add Caption Segment
                  </button>
                </div>
              )}
            </div>

            {/* Branding */}
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Branding</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                    style={{ background: watermarkEnabled ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "var(--border)" }} />
                </label>
              </div>

              {watermarkEnabled && (
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Your logo will be applied to the top-right corner of the exported video.
                  <Link to="/settings" className="ml-2" style={{ color: "var(--accent-2)" }}>Manage Brand Kit →</Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={`/scheduler`}>
                  <button className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer border-0 text-white"
                    style={{ background: "linear-gradient(135deg, #EC4899, #F59E0B)" }}>
                    Schedule This Clip
                  </button>
                </Link>
                <button
                  onClick={() => rateMutation.mutate(1)}
                  className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: "transparent", color: "var(--success)", border: "1px solid var(--success)" }}>
                  👍 This clip is good
                </button>
                <button
                  onClick={() => rateMutation.mutate(-1)}
                  className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: "transparent", color: "#EF4444", border: "1px solid #EF4444" }}>
                  👎 This clip needs work
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}