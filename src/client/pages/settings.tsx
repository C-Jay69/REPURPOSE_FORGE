import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#7C3AED");
  const [fontName, setFontName] = useState("Poppins");
  const [saving, setSaving] = useState(false);

  const { data: kitData, isLoading } = useQuery({
    queryKey: ["branding-kit"],
    queryFn: async () => {
      const res = await api.branding.$get();
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        body: formData,
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branding-kit"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.branding.$delete();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branding-kit"] }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    if (logoFile) formData.append("logo", logoFile);
    formData.append("primaryColorHex", primaryColor);
    formData.append("fontName", fontName);
    try {
      await saveMutation.mutateAsync(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete your brand kit? This cannot be undone.")) {
      await deleteMutation.mutateAsync();
      setLogoFile(null);
      setPrimaryColor("#7C3AED");
      setFontName("Poppins");
    }
  };

  const kit = kitData?.kit;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-black mb-6" style={{ letterSpacing: "-0.02em" }}>Brand Kit</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          Customize your branding for watermarks, captions, and exports.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-12 rounded-lg skeleton" />
            <div className="h-12 rounded-lg skeleton" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "2rem" }}>
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  {kit?.logoUrl ? (
                    <img src={kit.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="M21 15l-5-5L5 17" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => { if (e.target.files?.[0]) setLogoFile(e.target.files[0]); }}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PNG, JPG, SVG, WebP · Max 2MB</p>
                </div>
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Primary Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border-0 cursor-pointer"
                  style={{ background: "none" }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl text-base font-mono"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            {/* Font */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Font Family</label>
              <select
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <option value="Poppins">Poppins (Default)</option>
                <option value="Inter">Inter</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Roboto">Roboto</option>
                <option value="DM Sans">DM Sans</option>
                <option value="Space Grotesk">Space Grotesk</option>
              </select>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Preview</p>
              <div style={{ fontFamily: fontName, color: primaryColor }}>
                <p className="font-bold text-lg">Your Brand</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This is how your watermark and captions will look</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-semibold cursor-pointer border-0 text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
              >
                {saving ? "Saving..." : "Save Brand Kit"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending || !kit}
                className="flex-1 py-3 rounded-xl font-semibold cursor-pointer"
                style={{ background: "transparent", color: "#EF4444", border: "1px solid #EF4444", opacity: kit ? 1 : 0.5 }}
              >
                Delete Brand Kit
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}