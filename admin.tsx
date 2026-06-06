import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const ADMIN_STORAGE_KEY = "admin_token";

function getAdminToken() {
  return localStorage.getItem(ADMIN_STORAGE_KEY);
}

function adminFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  return fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ── Login ──────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = btoa(`${email}:${password}`);
    localStorage.setItem(ADMIN_STORAGE_KEY, token);
    const res = await fetch("/api/admin/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      onLogin();
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      setError("Invalid credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="text-white font-semibold">Admin Portal</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────
function BarChart({ data, color = "#7c3aed" }: { data: { date: string; count: number }[]; color?: string }) {
  if (!data.length) return <p className="text-white/30 text-sm">No data yet.</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t"
            style={{ height: `${(d.count / max) * 80}px`, background: color, minHeight: 4 }}
          />
          <span className="text-[9px] text-white/30 rotate-45 origin-left">{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"overview" | "users" | "sessions" | "maintenance">("overview");
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/stats").then(r => r.json()).then(setStats);
    adminFetch("/analytics").then(r => r.json()).then(setAnalytics);
    adminFetch("/maintenance").then(r => r.json()).then(d => {
      setMaintenance(d);
      setMaintenanceMsg(d.message ?? "");
    });
  }, []);

  useEffect(() => {
    if (tab === "users" && !users.length) {
      adminFetch("/users").then(r => r.json()).then(d => setUsers(d.users ?? []));
    }
    if (tab === "sessions" && !sessions.length) {
      adminFetch("/sessions").then(r => r.json()).then(d => setSessions(d.sessions ?? []));
    }
  }, [tab]);

  const saveMaintenance = async (enabled: boolean) => {
    setSaving(true);
    const res = await adminFetch("/maintenance", {
      method: "POST",
      body: JSON.stringify({ enabled, message: maintenanceMsg }),
    });
    const d = await res.json();
    setMaintenance(d);
    setSaving(false);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user? This is irreversible.")) return;
    setDeletingId(id);
    await adminFetch(`/users/${id}`, { method: "DELETE" });
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeletingId(null);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "sessions", label: "Sessions" },
    { id: "maintenance", label: "Maintenance" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="font-semibold text-white">RepurposeAI Admin</span>
          <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-white/40 hover:text-white transition-colors">← Back to site</a>
          <button
            onClick={onLogout}
            className="text-xs text-white/40 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 px-6">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? "border-violet-500 text-white"
                  : "border-transparent text-white/40 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 max-w-6xl mx-auto">

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stat grid */}
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total Users" value={stats.totalUsers} />
                <StatCard label="New Users (24h)" value={stats.todayUsers} />
                <StatCard label="Total Sessions" value={stats.totalSessions} />
                <StatCard label="Sessions (24h)" value={stats.todaySessions} />
                <StatCard label="Total Outputs" value={stats.totalOutputs} />
              </div>
            ) : (
              <div className="text-white/30 text-sm">Loading stats...</div>
            )}

            {/* Charts */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111] border border-white/10 rounded-xl p-5">
                  <p className="text-sm font-medium mb-4">Sessions — last 7 days</p>
                  <BarChart data={analytics.sessions} color="#7c3aed" />
                </div>
                <div className="bg-[#111] border border-white/10 rounded-xl p-5">
                  <p className="text-sm font-medium mb-4">Signups — last 7 days</p>
                  <BarChart data={analytics.signups} color="#06b6d4" />
                </div>
                <div className="bg-[#111] border border-white/10 rounded-xl p-5 md:col-span-2">
                  <p className="text-sm font-medium mb-4">Top Formats Used</p>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topFormats.map((f: any) => (
                      <div key={f.format} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-xs text-white/60">{f.format}</span>
                        <span className="text-xs font-bold text-violet-400">{f.count}</span>
                      </div>
                    ))}
                    {!analytics.topFormats.length && <p className="text-white/30 text-sm">No data yet.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <p className="text-sm font-medium">All Users ({users.length})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Name</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Email</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Sessions</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 text-white/80">{u.name}</td>
                      <td className="px-5 py-3 text-white/50">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className="text-violet-400 font-medium">{u.sessionCount}</span>
                      </td>
                      <td className="px-5 py-3 text-white/40 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.email !== process.env.ADMIN_EMAIL && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={deletingId === u.id}
                            className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            {deletingId === u.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30">No users yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Sessions ── */}
        {tab === "sessions" && (
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <p className="text-sm font-medium">Recent Sessions (last 50)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Title</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Type</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-xs text-white/40 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 text-white/70 max-w-xs truncate">{s.inputTitle}</td>
                      <td className="px-5 py-3 text-white/40 text-xs capitalize">{s.inputType}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.status === "done" ? "bg-green-500/20 text-green-400" :
                          s.status === "error" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-5 py-3 text-white/40 text-xs">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!sessions.length && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-white/30">No sessions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Maintenance ── */}
        {tab === "maintenance" && (
          <div className="max-w-lg space-y-6">
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
              <div>
                <p className="text-sm font-medium mb-1">Maintenance Mode</p>
                <p className="text-xs text-white/40">When enabled, a banner is shown to all users on the site.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveMaintenance(!maintenance.enabled)}
                  disabled={saving}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    maintenance.enabled ? "bg-violet-600" : "bg-white/10"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    maintenance.enabled ? "translate-x-7" : "translate-x-1"
                  }`} />
                </button>
                <span className="text-sm text-white/60">
                  {maintenance.enabled ? "Enabled — users see banner" : "Disabled"}
                </span>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Banner Message</label>
                <input
                  type="text"
                  value={maintenanceMsg}
                  onChange={e => setMaintenanceMsg(e.target.value)}
                  placeholder="e.g. We're doing maintenance, back in 30 mins!"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                onClick={() => saveMaintenance(maintenance.enabled)}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save Message"}
              </button>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <p className="text-sm font-medium mb-3">Admin Credentials</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Email</span>
                  <span className="text-xs text-white/70 font-mono">{import.meta.env.VITE_ADMIN_EMAIL || "Set in .env"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Password</span>
                  <span className="text-xs text-white/70 font-mono">••••••••••••••</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { setChecking(false); return; }
    fetch("/api/admin/verify", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.ok) setAuthed(true); })
      .finally(() => setChecking(false));
  }, []);

  const logout = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAuthed(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return authed ? <AdminDashboard onLogout={logout} /> : <AdminLogin onLogin={() => setAuthed(true)} />;
}
