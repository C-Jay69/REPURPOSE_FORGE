import { Link, useLocation } from "wouter";
import { authClient, clearToken } from "../lib/auth";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { href: "/dashboard", label: "Projects", icon: "📁" },
  { href: "/scheduler", label: "Scheduler", icon: "📅" },
  { href: "/settings", label: "Brand Kit", icon: "🎨" },
  { href: "/pricing", label: "Upgrade", icon: "✨" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    queryClient.clear();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full w-64 flex flex-col z-20"
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link to="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
              >
                VCF
              </div>
              <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                Viral Clip<span style={{ color: "var(--accent-2)" }}>Forge</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{
                    background: isActive ? "rgba(124, 58, 237, 0.15)" : "transparent",
                    color: isActive ? "var(--accent-2)" : "var(--text-secondary)",
                    border: isActive ? "1px solid rgba(124, 58, 237, 0.3)" : "1px solid transparent",
                  }}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.href === "/pricing" && (
                    <span
                      className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(236, 72, 153, 0.2)", color: "#EC4899", fontSize: "10px" }}
                    >
                      PRO
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-xs py-2 rounded-lg transition-all duration-150 cursor-pointer"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              background: "transparent",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}