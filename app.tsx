import { useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import { RunableBadge } from "./components/runable-badge";
import { ProtectedRoute } from "./components/protected-route";
import IndexPage from "./pages/index";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import DashboardPage from "./pages/dashboard";
import HistoryPage from "./pages/history";
import SettingsPage from "./pages/settings";
import PricingPage from "./pages/pricing";
import AdminPage from "./pages/admin";

function MaintenanceBanner() {
  const [banner, setBanner] = useState<{ enabled: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/maintenance")
      .then(r => r.json())
      .then(setBanner)
      .catch(() => {});
  }, []);

  if (!banner?.enabled) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-sm font-medium text-center py-2 px-4">
      🔧 {banner.message || "We're doing some maintenance. Back shortly!"}
    </div>
  );
}

export default function App() {
  return (
    <>
      <MaintenanceBanner />
      <Switch>
        <Route path="/" component={IndexPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/dashboard">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/history">
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/pricing">
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        </Route>
      </Switch>
      <RunableBadge />
    </>
  );
}
