import { useEffect } from "react";
import { authClient } from "../lib/auth";
import { Redirect } from "wouter";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent border-t-[var(--accent-2)]" />
      </div>
    );
  }

  if (!session) {
    return <Redirect to="/sign-in" />;
  }

  return <>{children}</>;
}