import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

const PLATFORMS = [
  { key: "tiktok", label: "TikTok", icon: "🎵", color: "#000000" },
  { key: "instagram", label: "Instagram", icon: "📷", color: "#E1306C" },
  { key: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000" },
  { key: "linkedin", label: "LinkedIn", icon: "💼", color: "#0A66C2" },
  { key: "facebook", label: "Facebook", icon: "👥", color: "#1877F2" },
];

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "#000000",
  instagram: "#E1306C",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
};

export default function SchedulerPage() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("tiktok");
  const [postTime, setPostTime] = useState("");

  const { data: clipsData, isLoading: clipsLoading } = useQuery({
    queryKey: ["clips-library"],
    queryFn: async () => {
      // Get all user's clips from all projects
      const res = await api.projects.$get();
      const projects = (await res.json()).projects || [];
      let allClips: any[] = [];
      for (const p of projects) {
        const clipsRes = await api.analysis[":projectId"].clips.$get({ param: { projectId: p.id } });
        const clips = (await clipsRes.json()).clips || [];
        allClips = [...allClips, ...clips.map((c: any) => ({ ...c, projectName: p.name }))];
      }
      return allClips;
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: async () => {
      const res = await api.scheduler.accounts.$get();
      return res.json();
    },
  });

  const { data: postsData } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const res = await api.scheduler.posts.$get();
      return res.json();
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: { generatedClipId: string; socialPlatform: string; postTime: string }) => {
      const res = await api.scheduler.posts.$post({ json: data });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      setShowScheduleModal(false);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await api.scheduler.posts[":postId"].$delete({ param: { postId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] }),
  });

  const oauthMutation = useMutation({
    mutationFn: async (platform: string) => {
      window.location.href = `/api/scheduler/oauth/${platform}`;
    },
  });

  const connectedAccounts = accountsData?.accounts || [];
  const scheduledPosts = postsData?.posts || [];
  const clips = clipsData || [];

  // Build posts map by date
  const postsByDate = new Map<string, any[]>();
  scheduledPosts.forEach((post: any) => {
    const dateKey = new Date(post.postTime).toDateString();
    if (!postsByDate.has(dateKey)) postsByDate.set(dateKey, []);
    postsByDate.get(dateKey)!.push(post);
  });

  // Calendar grid
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleScheduleClick = (clip: any) => {
    setSelectedClip(clip);
    setShowScheduleModal(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setPostTime(tomorrow.toISOString().slice(0, 16));
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClip || !postTime) return;
    scheduleMutation.mutate({
      generatedClipId: selectedClip.id,
      socialPlatform: selectedPlatform,
      postTime: new Date(postTime).toISOString(),
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">Content Scheduler</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Connect accounts, drag clips to calendar, auto-publish
            </p>
          </div>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => {
              const connected = connectedAccounts.find((a: any) => a.platform === p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => connected ? undefined : oauthMutation.mutate(p.key)}
                  disabled={connected}
                  className="px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1"
                  style={{
                    background: connected ? p.color : "var(--bg-elevated)",
                    color: connected ? "white" : "var(--text-secondary)",
                    border: connected ? "none" : "1px solid var(--border)",
                    opacity: connected ? 1 : 0.7,
                  }}
                >
                  {p.icon} {p.label} {connected && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Clips Library */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="font-semibold mb-4">Clips Library</h3>
              {clipsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-lg skeleton" />
                  ))}
                </div>
              ) : clips.length === 0 ? (
                <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  No clips yet. Generate clips in a project first.
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {clips.map((clip: any) => (
                    <div
                      key={clip.id}
                      className="p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/json", JSON.stringify(clip));
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(124,58,237,0.2)", color: "var(--accent-1)" }}>
                          {clip.hookType || "Clip"}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {Math.round(clip.endTime - clip.startTime)}s
                        </span>
                      </div>
                      <p className="text-sm truncate">{clip.projectName}</p>
                      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {Math.round(clip.confidence * 100)}% confidence
                        </span>
                        <button
                          onClick={() => handleScheduleClick(clip)}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: "rgba(124,58,237,0.1)", color: "var(--accent-1)", border: "none" }}
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connected Accounts */}
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="font-semibold mb-4">Connected Accounts</h3>
              {PLATFORMS.map((p) => {
                const connected = connectedAccounts.find((a: any) => a.platform === p.key);
                return (
                  <div key={p.key} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.icon}</span>
                      <div>
                        <p className="font-medium">{p.label}</p>
                        <p className="text-xs" style={{ color: connected ? "var(--success)" : "var(--text-muted)" }}>
                          {connected ? `Connected as ${connected.platformUserId}` : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {connected ? (
                      <button
                        onClick={() => oauthMutation.mutate(p.key)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "none" }}
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => oauthMutation.mutate(p.key)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "rgba(124,58,237,0.1)", color: "var(--accent-1)", border: "none" }}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Calendar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-2 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <h2 className="text-xl font-bold">{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</h2>
              <button onClick={nextMonth} className="p-2 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 px-4 py-2" style={{ borderBottom: "1px solid var(--border)", background: "rgba(124,58,237,0.05)" }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold py-2" style={{ color: "var(--text-muted)" }}>{day}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {/* Empty cells before month start */}
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square p-1" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const dateKey = date.toDateString();
                  const isToday = date.getTime() === today.getTime();
                  const dayPosts = postsByDate.get(dateKey) || [];

                  return (
                    <div
                      key={day}
                      className={`relative aspect-square p-1 transition-all ${isToday ? "ring-2" : ""}`}
                      style={{
                        border: "1px solid var(--border)",
                        background: isToday ? "rgba(124,58,237,0.05)" : "transparent",
                        ringColor: "var(--accent-1)",
                      }}
                    >
                      <div className="text-sm font-medium" style={{ color: isToday ? "var(--accent-1)" : "var(--text-primary)" }}>
                        {day}
                      </div>
                      <div className="mt-1 space-y-1 max-h-[200px] overflow-y-auto">
                        {dayPosts.slice(0, 3).map((post: any) => (
                          <div
                            key={post.id}
                            className="px-1.5 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80"
                            style={{ background: PLATFORM_COLORS[post.socialPlatform] || "var(--accent-1)" }}
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            {post.socialPlatform} - {new Date(post.postTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="px-1.5 py-1 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                            +{dayPosts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty cells after month end */}
                {Array.from({ length: 42 - startDay - daysInMonth }).map((_, i) => (
                  <div key={`empty-end-${i}`} className="aspect-square p-1" />
                ))}
              </div>
            </div>

            {/* Upcoming Posts List */}
            <div className="rounded-2xl p-6 gradient-border" style={{ background: "var(--bg-secondary)" }}>
              <h3 className="font-semibold mb-4">Upcoming Posts</h3>
              {scheduledPosts.length === 0 ? (
                <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  No posts scheduled yet. Drag clips from the library to the calendar.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scheduledPosts
                    .filter((p: any) => new Date(p.postTime) > new Date())
                    .sort((a: any, b: any) => new Date(a.postTime).getTime() - new Date(b.postTime).getTime())
                    .slice(0, 10)
                    .map((post: any) => (
                      <div key={post.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                            style={{ background: PLATFORM_COLORS[post.socialPlatform] || "var(--accent-1)" }}>
                            {PLATFORMS.find(p => p.key === post.socialPlatform)?.icon}
                          </div>
                          <div>
                            <p className="font-medium">{post.socialPlatform}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {new Date(post.postTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deletePostMutation.mutate(post.id)}
                          className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                          style={{ background: "transparent", border: "none" }}
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
          </div>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <h2 className="text-xl font-bold mb-4">Schedule Post</h2>
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Clip: {selectedClip?.projectName}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {Math.round(selectedClip?.endTime - selectedClip?.startTime)}s · {selectedClip?.hookType}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Platform</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  >
                    {PLATFORMS.filter(p => connectedAccounts.some((a: any) => a.platform === p.key)).map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                  {connectedAccounts.length === 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>Connect accounts first in the sidebar</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Post Date & Time</label>
                  <input
                    type="datetime-local"
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold cursor-pointer"
                    style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={scheduleMutation.isPending || !selectedClip || !postTime || connectedAccounts.length === 0}
                    className="flex-1 py-3 rounded-xl font-semibold cursor-pointer border-0 text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
                  >
                    {scheduleMutation.isPending ? "Scheduling..." : "Schedule Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}