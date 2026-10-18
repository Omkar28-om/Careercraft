import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  ExternalLink,
  Plus,
  Loader2,
  AlertCircle,
  FolderGit2,
  Globe,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Check,
  Rocket,
  Code2,
} from "lucide-react";
import { GithubIcon } from "../components/SocialIcons";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/api";
import { getSelectedDomain } from "../utils/learningPath";

const PROJECT_TYPES = [
  "All",
  "personal",
  "academic",
  "hackathon",
  "freelance",
  "open_source",
];

const PROJECT_STARTERS = [
  {
    domain: "IT & Software",
    title: "Course & Skill Tracker",
    description: "Build a dashboard that tracks courses, lesson progress, and skills. Start with a course list, add progress states, then create a weekly learning summary.",
    technologies: ["React", "JavaScript", "CSS"],
  },
  {
    domain: "Programming Languages",
    title: "Algorithm Visualizer",
    description: "Create an interactive page that animates sorting or searching. Let users choose an algorithm, adjust the input size, and compare the number of operations.",
    technologies: ["JavaScript", "React", "Algorithms"],
  },
  {
    domain: "Business, Management & Finance",
    title: "Student Opportunity Board",
    description: "Make a searchable board for internships and entry-level jobs. Add filters for role, skill, and work mode, then design a clear opportunity detail view.",
    technologies: ["React", "Node.js", "SQL"],
  },
  {
    domain: "IT & Software",
    title: "Accessible Portfolio Website",
    description: "Build a responsive portfolio with a project gallery, semantic HTML, keyboard-friendly navigation, and a contact form with clear validation.",
    technologies: ["HTML", "CSS", "JavaScript", "Accessibility"],
  },
  {
    domain: "Data & Analytics",
    title: "Student Performance Insights",
    description: "Use a small synthetic student dataset to clean records, calculate pass rates, compare groups, and present findings with charts and caveats.",
    technologies: ["Python", "SQL", "Pandas", "Data Visualization"],
  },
  {
    domain: "Data & Analytics",
    title: "Library Usage Trends Report",
    description: "Model borrowing data, write queries for monthly trends, identify popular categories, and turn the results into a concise dashboard.",
    technologies: ["SQL", "Spreadsheets", "Charts"],
  },
  {
    domain: "Cloud & Cybersecurity",
    title: "Secure Cloud Deployment Blueprint",
    description: "Document a small web app deployment with least-privilege access, environment-based secrets, HTTPS, backups, and a simple architecture diagram.",
    technologies: ["Cloud Fundamentals", "Networking", "Security", "Documentation"],
  },
  {
    domain: "Cloud & Cybersecurity",
    title: "Security Incident Response Runbook",
    description: "Create a tabletop exercise for a sample account compromise: define detection signals, containment steps, recovery checks, and lessons learned.",
    technologies: ["Cybersecurity", "Threat Modeling", "Incident Response"],
  },
  {
    domain: "Marketing & Content",
    title: "SEO Content Calendar",
    description: "Plan a month of useful content for a student club or fictional product, map topics to search intent, and define measurable publishing goals.",
    technologies: ["SEO", "Content Strategy", "Research", "Writing"],
  },
  {
    domain: "Marketing & Content",
    title: "Campaign Performance Dashboard",
    description: "Build a report from sample campaign data showing reach, clicks, conversion rate, and cost per result, with notes on what the numbers cannot prove.",
    technologies: ["Analytics", "Spreadsheets", "Data Visualization"],
  },
  {
    domain: "Business, Management & Finance",
    title: "Student Budget Planner",
    description: "Create a monthly budget tool that groups income and expenses, compares planned with actual spending, and flags upcoming bills.",
    technologies: ["JavaScript", "React", "Finance Basics"],
  },
  {
    domain: "Business, Management & Finance",
    title: "Team Sprint Planner",
    description: "Design a small project board for a student team with priorities, owners, due dates, sprint goals, and a simple progress summary.",
    technologies: ["Project Management", "React", "UX Design"],
  },
  {
    domain: "Healthcare & Life Sciences",
    title: "Clinic Wait-Time Analysis",
    description: "Use synthetic appointment data to calculate wait-time patterns and compare service steps. Document privacy safeguards and balancing measures.",
    technologies: ["Python", "Data Analysis", "Healthcare Operations"],
  },
  {
    domain: "Healthcare & Life Sciences",
    title: "Patient Education Content Hub",
    description: "Create an accessible library of plain-language educational articles with categories, reading time, and reviewed-by metadata. Use fictional sample content.",
    technologies: ["HTML", "CSS", "React", "Content Design"],
  },
];

export default function Projects() {
  const { user } = useAuth();
  const selectedDomain = getSelectedDomain();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [techInput, setTechInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectType: "personal",
    status: "in_progress",
    technologies: [],
    githubUrl: "",
    liveUrl: "",
    isPublic: true,
  });

  const fetchUserProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getProjects();
      if (res?.success && Array.isArray(res.projects)) {
        setProjects(res.projects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(err?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  const handleOpenCreateModal = (starter = null) => {
    setModalMode("create");
    setSelectedProjectId(null);
    setFormData({
      title: starter?.title || "",
      description: starter?.description
        ? `${starter.description}\n\nLearning domain: ${starter.domain}`
        : "",
      projectType: "personal",
      status: "in_progress",
      technologies: starter?.technologies || [],
      githubUrl: "",
      liveUrl: "",
      isPublic: true,
    });
    setTechInput("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setModalMode("edit");
    setSelectedProjectId(proj.id);
    setFormData({
      title: proj.title || "",
      description: proj.description || "",
      projectType: proj.projectType || proj.project_type || "personal",
      status: proj.status || "in_progress",
      technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      githubUrl: proj.githubUrl || proj.github_url || "",
      liveUrl: proj.liveUrl || proj.live_url || "",
      isPublic: proj.isPublic !== undefined ? proj.isPublic : true,
    });
    setTechInput("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleAddTech = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = techInput.trim().replace(/^,+|,+$/g, "");
      if (val && !formData.technologies.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          technologies: [...prev.technologies, val],
        }));
      }
      setTechInput("");
    }
  };

  const handleRemoveTech = (item) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== item),
    }));
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.title.trim()) {
      setModalError("Project title is required.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        projectType: formData.projectType,
        status: formData.status,
        technologies: formData.technologies,
        githubUrl: formData.githubUrl.trim() || null,
        liveUrl: formData.liveUrl.trim() || null,
        isPublic: formData.isPublic,
      };

      if (modalMode === "create") {
        const res = await createProject(payload);
        if (res?.success) {
          await fetchUserProjects();
          setIsModalOpen(false);
        } else {
          setModalError(res?.message || "Failed to create project");
        }
      } else {
        const res = await updateProject(selectedProjectId, payload);
        if (res?.success) {
          await fetchUserProjects();
          setIsModalOpen(false);
        } else {
          setModalError(res?.message || "Failed to update project");
        }
      }
    } catch (err) {
      console.error("Save project error:", err);
      setModalError(err?.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await deleteProject(id);
      if (res?.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert(err?.message || "Failed to delete project.");
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const titleMatch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const techMatch = (project.technologies || []).some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesSearch = searchQuery === "" || titleMatch || descMatch || techMatch;

      const pType = project.projectType || project.project_type;
      const matchesType =
        selectedType === "All" || pType?.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [projects, searchQuery, selectedType]);
  const domainStarters = PROJECT_STARTERS.filter((starter) => starter.domain === selectedDomain);
  const visibleStarters = domainStarters.length ? domainStarters : PROJECT_STARTERS;

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#080B14] p-8 sm:p-10 backdrop-blur-xl">
          <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-violet-500/10 px-3 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/20">
                  Portfolio Hub
                </span>
                <span className="text-xs text-slate-400">Verified Proof of Work</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
                Student Projects & Portfolio
              </h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Recruiters hire engineers who build. Document your production applications, system prototypes, and open-source packages with live demos and repository links.
              </p>
            </div>

            {user && (
              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  icon={Plus}
                  iconPosition="left"
                  onClick={handleOpenCreateModal}
                >
                  Add Project
                </Button>
              </div>
            )}
          </div>
        </div>

        {user && (
          <section className="mt-7" aria-labelledby="project-starters-heading">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Build something</p>
                <h2 id="project-starters-heading" className="mt-1 text-xl font-extrabold text-white">{selectedDomain ? `${selectedDomain} project starters` : "Project starters"}</h2>
              </div>
              <span className="hidden text-xs text-slate-500 sm:inline">Choose an idea to add it to your portfolio</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {visibleStarters.map((starter, index) => (
                <button key={starter.title} type="button" onClick={() => handleOpenCreateModal(starter)} className="group rounded-2xl border border-white/[0.08] bg-[#101827] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-[#131f31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-300">{index === 1 ? <Code2 size={18} /> : <Rocket size={18} />}</span>
                  <span className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-violet-300">{starter.domain}</span>
                  <h3 className="mt-4 font-bold text-white group-hover:text-cyan-200">{starter.title}</h3>
                  <p className="mt-2 min-h-[4.5rem] text-xs leading-5 text-slate-400">{starter.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{starter.technologies.map((technology) => <span key={technology} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-slate-400">{technology}</span>)}</div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-cyan-300">Start project <Plus size={13} /></span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-rose-400 shrink-0" size={20} />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
            <button
              onClick={fetchUserProjects}
              className="text-xs font-semibold text-rose-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search projects by name, description, or tech stack..."
            className="w-full md:max-w-md"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <span className="text-xs text-slate-400 font-medium shrink-0">Type:</span>
            <FilterBar
              options={PROJECT_TYPES}
              active={selectedType}
              onChange={setSelectedType}
              size="xs"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-8">
          {!user ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center max-w-xl mx-auto">
              <FolderGit2 size={36} className="mx-auto text-cyan-400 mb-3" />
              <h3 className="text-lg font-bold text-white">Sign In to Manage Your Portfolio</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Create an account or log in to document your software projects, link live demos, and demonstrate competence on your public profile.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={32} className="animate-spin text-cyan-400 mb-2" />
              <p className="text-sm">Loading portfolio projects from PostgreSQL...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title={projects.length === 0 ? "No portfolio projects yet" : "No matching projects found"}
              description={
                projects.length === 0
                  ? "Add your first web application, mobile tool, or open source package to showcase on your profile."
                  : "Try adjusting your search query or project type filter."
              }
              actionLabel={projects.length === 0 ? "Add New Project" : "Clear Filters"}
              onAction={
                projects.length === 0
                  ? handleOpenCreateModal
                  : () => {
                      setSearchQuery("");
                      setSelectedType("All");
                    }
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 hover:border-cyan-400/40 hover:bg-white/[0.04] transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="rounded-md bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                        {project.projectType || project.project_type || "Project"}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {project.status?.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                      {project.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {project.description || "No project description provided."}
                    </p>

                    {/* Tech stack chips */}
                    {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {project.technologies.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Links Footer */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                        >
                          <GithubIcon size={14} />
                          <span>Code</span>
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 text-[11px]"
                        >
                          <Globe size={14} />
                          <span>Demo</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                        title="Edit project"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.title)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                        title="Delete project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#070d19] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold">
                {modalMode === "create" ? "Add Portfolio Project" : "Edit Project"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Task Queue"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain architecture, key challenges, and impact..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0c1326] p-2.5 text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="personal">Personal Project</option>
                    <option value="academic">Academic / Coursework</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="freelance">Freelance Client Build</option>
                    <option value="open_source">Open Source</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0c1326] p-2.5 text-white outline-none focus:border-cyan-400/50"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Technologies (Press Enter to add)
                </label>
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleAddTech}
                  placeholder="e.g. React, Node.js, Redis, Docker"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                />
                {formData.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {formData.technologies.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] text-white"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(t)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={formData.liveUrl}
                    onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? "Saving..." : modalMode === "create" ? "Create Project" : "Update Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
