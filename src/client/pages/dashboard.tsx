import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DashboardLayout } from "../components/layout";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.projects.$get();
      return res.json();
    },
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await api.stripe.plans.$get();
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.projects.$post({ json: { name } });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowCreateModal(false);
      setNewProjectName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.projects[":projectId"].$delete({ param: { projectId: id } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) createMutation.mutate(newProjectName.trim());
  };

  const plan = subscriptionData?.currentPlan || "free";
  const planLimits = { free: 3, pro: 20, agency: 100 };
  const maxProjects = planLimits[plan as keyof typeof planLimits] || 3;
  const projectCount = projectsData?.projects?.length || 0;
  const atLimit = projectCount >= maxProjects;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ letterSpacing: "-0.02em" }}>Projects</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {projectCount} / {maxProjects === 100 ? "∞" : maxProjects} projects · {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={atLimit || createMutation.isPending}
            className="btn-glow text-white font-bold px-6 py-3 rounded-xl cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Creating..." : "Create New Project"}
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <div className="h-6 w-48 rounded skeleton mb-4" />
                <div className="h-4 w-32 rounded skeleton" />
              </div>
            ))
          ) : projectsData?.projects?.length === 0 ? (
            <div className="col-span-full rounded-2xl p-12 text-center" style={{ border: "2px dashed var(--border)", background: "var(--bg-secondary)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <p className="font-semibold mb-2">No projects yet</p>
              <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-secondary)" }}>
                Create your first project to start turning long videos into viral clips.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={atLimit}
                className="btn-glow text-white font-bold px-6 py-3 rounded-xl mt-4 inline-block cursor-pointer border-0 disabled:opacity-50"
              >
                Create New Project
              </button>
            </div>
          ) : (
            projectsData?.projects?.map((project: any) => (
              <Link key={project.id} to={`/project/${project.id}`}>
                <div
                  className="rounded-2xl p-6 gradient-border card-hover group"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate mb-1">{project.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: project.status === "processing" ? "rgba(245,158,11,0.2)" :
                                    project.status === "completed" ? "rgba(16,185,129,0.2)" :
                                    "rgba(124,58,237,0.2)",
                          color: project.status === "processing" ? "#F59E0B" :
                                 project.status === "completed" ? "#10B981" :
                                 "var(--accent-2)",
                        }}>
                        {project.status || "draft"}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteMutation.mutate(project.id); }}
                      className="ml-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: "var(--text-muted)", background: "transparent", border: "none" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl text-base"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    placeholder="My Viral Clips Project"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold cursor-pointer"
                    style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !newProjectName.trim()}
                    className="flex-1 py-3 rounded-xl font-semibold cursor-pointer border-0 text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Project"}
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