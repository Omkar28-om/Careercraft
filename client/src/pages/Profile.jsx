import { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  MapPin,
  FileText,
  Code2,
  Award,
  Layers,
  Flame,
  Trophy,
  CheckCircle2,
  Mail,
  Edit3,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
  X,
  Phone,
  Globe,
  Loader2,
  AlertCircle,
  Star,
  ExternalLink,
  FolderGit2,
  Calendar,
  Briefcase,
  RefreshCw,
  Target,
  ArrowRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { GithubIcon, LinkedinIcon } from "../components/SocialIcons";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ProtectedRoute";
import {
  getProfile,
  updateProfile,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getDashboard,
  getAchievements,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getEnrollments,
  getApplications,
  getContracts,
  getCareerProfile,
} from "../api";

const generateHandle = (name) => {
  if (!name || typeof name !== "string") return "@student";
  const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return sanitized ? `@${sanitized}` : "@student";
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "ST";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Profile data & editing states
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [formData, setFormData] = useState({
    bio: "",
    college: "",
    degree: "",
    graduation_year: "",
    location: "",
    phone: "",
    avatar_url: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    career_domain: "",
  });

  // Skills data & editing states
  const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillModalMode, setSkillModalMode] = useState("create"); // "create" | "edit"
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillFormData, setSkillFormData] = useState({
    name: "",
    category: "Programming",
    proficiency: "Intermediate",
  });
  const [skillSaving, setSkillSaving] = useState(false);
  const [skillError, setSkillError] = useState("");
  const [skillSuccess, setSkillSuccess] = useState("");
  const [deleteConfirmSkill, setDeleteConfirmSkill] = useState(null);
  const [deletingSkill, setDeletingSkill] = useState(false);

  // Projects data & editing states
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState("create"); // "create" | "edit"
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFormData, setProjectFormData] = useState({
    title: "",
    description: "",
    project_type: "personal",
    status: "in_progress",
    technologies: [],
    github_url: "",
    live_url: "",
    image_url: "",
    start_date: "",
    end_date: "",
    is_featured: false,
    is_public: true,
  });
  const [techInput, setTechInput] = useState("");
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [projectSuccess, setProjectSuccess] = useState("");
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [careerGoals, setCareerGoals] = useState(null);

  const [skillsError, setSkillsError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  const fetchUserSkills = async () => {
    try {
      setSkillsLoading(true);
      setSkillsError(null);
      const res = await getSkills();
      if (res?.success && Array.isArray(res.skills)) {
        setSkills(res.skills);
      } else {
        setSkills([]);
      }
    } catch (err) {
      console.error("Failed to load skills:", err);
      setSkillsError(err.message || "Unable to load skills from database.");
    } finally {
      setSkillsLoading(false);
    }
  };

  // Fetch PostgreSQL profile, skills, projects, and enrollments on mount or user change
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await getProfile();
        if (isMounted && res?.success && res?.profile) {
          setProfileData(res.profile);
          setFormData({
            bio: res.profile.bio || "",
            college: res.profile.college || "",
            degree: res.profile.degree || "",
            graduation_year: res.profile.graduation_year || "",
            location: res.profile.location || "",
            phone: res.profile.phone || "",
            avatar_url: res.profile.avatar_url || "",
            github_url: res.profile.github_url || "",
            linkedin_url: res.profile.linkedin_url || "",
            portfolio_url: res.profile.portfolio_url || "",
            career_domain: res.profile.career_domain || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    const fetchUserProjects = async () => {
      try {
        setProjectsLoading(true);
        const res = await getProjects();
        if (isMounted && res?.success && Array.isArray(res.projects)) {
          setProjects(res.projects);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        if (isMounted) {
          setProjectsLoading(false);
        }
      }
    };

    const fetchUserEnrollments = async () => {
      try {
        const res = await getEnrollments();
        if (isMounted && res?.success && Array.isArray(res.enrollments)) {
          setEnrolledCourses(res.enrollments);
        }
      } catch (err) {
        console.error("Failed to load enrollments:", err);
      }
    };

    const fetchUserApplications = async () => {
      try {
        const res = await getApplications();
        if (isMounted && res?.success && Array.isArray(res.applications)) {
          setApplications(res.applications);
        }
      } catch (err) {
        console.error("Failed to load applications:", err);
      }
    };

    const fetchUserContracts = async () => {
      try {
        const res = await getContracts();
        if (isMounted && res?.success && Array.isArray(res.contracts)) {
          setContracts(res.contracts);
        }
      } catch (err) {
        console.error("Failed to load contracts:", err);
      }
    };

    const fetchUserStats = async () => {
      try {
        const res = await getDashboard();
        if (isMounted && res?.success && res?.data?.stats) {
          setDashboardStats(res.data.stats);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats in profile:", err);
      }
    };

    const fetchAchievementsData = async () => {
      try {
        setAchievementsLoading(true);
        const res = await getAchievements();
        if (isMounted && res?.success) {
          const list = Array.isArray(res.achievements)
            ? res.achievements
            : Array.isArray(res.data?.achievements)
            ? res.data.achievements
            : [];
          setUserAchievements(list);
        }
      } catch (err) {
        console.error("Failed to load achievements in profile:", err);
      } finally {
        if (isMounted) {
          setAchievementsLoading(false);
        }
      }
    };

    const fetchCareerGoals = async () => {
      try {
        const res = await getCareerProfile();
        if (isMounted && res?.success && res.careerProfile) {
          setCareerGoals(res.careerProfile);
        }
      } catch (err) {
        console.warn("Failed to load career goals in profile:", err);
      }
    };

    if (user) {
      fetchUserProfile();
      fetchUserSkills();
      fetchUserProjects();
      fetchUserEnrollments();
      fetchUserApplications();
      fetchUserContracts();
      fetchUserStats();
      fetchAchievementsData();
      fetchCareerGoals();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (authLoading || (profileLoading && !profileData)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const displayName = profileData?.name || user?.name || "Student";
  const displayEmail = profileData?.email || user?.email || "Not added yet";
  const rawRole = profileData?.role || user?.role || "student";
  const displayRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
  const displayHandle = generateHandle(displayName);
  const initials = getInitials(displayName);

  // Read actual columns from PostgreSQL profiles table with safe fallback to "Not added yet"
  const profile = {
    name: displayName,
    handle: displayHandle,
    role: displayRole,
    id: user.id || null,
    bio: profileData?.bio || "Not added yet",
    university: profileData?.college || "Not added yet",
    degree: profileData?.degree || "Not added yet",
    graduation: profileData?.graduation_year
      ? `Class of ${profileData.graduation_year}`
      : "Not added yet",
    graduation_year: profileData?.graduation_year || null,
    location: profileData?.location || "Not added yet",
    phone: profileData?.phone || null,
    email: displayEmail,
    avatar_url: profileData?.avatar_url || null,
    github: profileData?.github_url || null,
    linkedin: profileData?.linkedin_url || null,
    portfolio_url: profileData?.portfolio_url || null,
    career_domain: profileData?.career_domain || user?.career_domain || null,
    stats: {
      solved: dashboardStats?.problemsSolved ?? (user?.problems_solved ?? 0),
      streak: dashboardStats?.currentStreak ?? 0,
      xp: dashboardStats?.xp ?? (user?.xp ?? 0),
      level: dashboardStats?.level ?? (user?.level ?? 1),
      projectsCount: projects.length,
      applicationsCount: applications.length,
      contractsCount: contracts.length,
    },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const payload = {
        bio: formData.bio.trim() || null,
        college: formData.college.trim() || null,
        degree: formData.degree.trim() || null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null,
        location: formData.location.trim() || null,
        phone: formData.phone.trim() || null,
        avatar_url: formData.avatar_url.trim() || null,
        github_url: formData.github_url.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        portfolio_url: formData.portfolio_url.trim() || null,
        career_domain: formData.career_domain || null,
      };

      const res = await updateProfile(payload);
      if (res?.success && res?.profile) {
        setProfileData(res.profile);
        setSaveMessage("Profile updated successfully");
        setIsEditing(false);
      } else {
        setSaveError(res?.message || "Failed to update profile");
      }
    } catch (err) {
      setSaveError(err?.message || "An error occurred while saving your profile");
    } finally {
      setSaving(false);
    }
  };

  // Skill management handlers
  const handleOpenCreateSkill = () => {
    setSkillModalMode("create");
    setSelectedSkill(null);
    setSkillFormData({ name: "", category: "Programming", proficiency: "Intermediate" });
    setSkillError("");
    setIsSkillModalOpen(true);
  };

  const handleOpenEditSkill = (skill) => {
    setSkillModalMode("edit");
    setSelectedSkill(skill);
    setSkillFormData({
      name: skill.name,
      category: skill.category || "Programming",
      proficiency: skill.proficiency || "Intermediate",
    });
    setSkillError("");
    setIsSkillModalOpen(true);
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    const trimmedName = skillFormData.name.trim();
    if (!trimmedName) {
      setSkillError("Please enter a skill name.");
      return;
    }

    setSkillSaving(true);
    setSkillError("");

    try {
      if (skillModalMode === "create") {
        const res = await createSkill({
          name: trimmedName,
          category: skillFormData.category,
          proficiency: skillFormData.proficiency,
        });

        if (res?.success && res?.skill) {
          setSkills((prev) => [...prev, res.skill]);
          setSkillSuccess(`Added "${res.skill.name}" to skills`);
          setIsSkillModalOpen(false);
          setTimeout(() => setSkillSuccess(""), 4000);
        } else {
          setSkillError(res?.message || "Failed to add skill");
        }
      } else if (skillModalMode === "edit" && selectedSkill) {
        const res = await updateSkill(selectedSkill.id, {
          name: trimmedName,
          category: skillFormData.category,
          proficiency: skillFormData.proficiency,
        });

        if (res?.success && res?.skill) {
          setSkills((prev) =>
            prev.map((s) => (s.id === selectedSkill.id ? res.skill : s))
          );
          setSkillSuccess(`Updated "${res.skill.name}"`);
          setIsSkillModalOpen(false);
          setTimeout(() => setSkillSuccess(""), 4000);
        } else {
          setSkillError(res?.message || "Failed to update skill");
        }
      }
    } catch (err) {
      setSkillError(err?.message || "Failed to save skill. Please try again.");
    } finally {
      setSkillSaving(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deleteConfirmSkill) return;
    setDeletingSkill(true);
    try {
      const res = await deleteSkill(deleteConfirmSkill.id);
      if (res?.success) {
        setSkills((prev) => prev.filter((s) => s.id !== deleteConfirmSkill.id));
        setSkillSuccess(`Removed "${deleteConfirmSkill.name}"`);
        setDeleteConfirmSkill(null);
        setTimeout(() => setSkillSuccess(""), 4000);
      }
    } catch (err) {
      alert(err?.message || "Failed to delete skill.");
    } finally {
      setDeletingSkill(false);
    }
  };

  // Project Handlers
  const handleOpenCreateProject = () => {
    setProjectModalMode("create");
    setSelectedProject(null);
    setProjectFormData({
      title: "",
      description: "",
      project_type: "personal",
      status: "in_progress",
      technologies: [],
      github_url: "",
      live_url: "",
      image_url: "",
      start_date: "",
      end_date: "",
      is_featured: false,
      is_public: true,
    });
    setTechInput("");
    setProjectError("");
    setProjectSuccess("");
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj) => {
    setProjectModalMode("edit");
    setSelectedProject(proj);
    setProjectFormData({
      title: proj.title || "",
      description: proj.description || "",
      project_type: proj.projectType || proj.project_type || "personal",
      status: proj.status || "in_progress",
      technologies: Array.isArray(proj.technologies) ? [...proj.technologies] : [],
      github_url: proj.githubUrl || proj.github_url || "",
      live_url: proj.liveUrl || proj.live_url || "",
      image_url: proj.imageUrl || proj.image_url || "",
      start_date: proj.startDate ? String(proj.startDate).slice(0, 10) : "",
      end_date: proj.endDate ? String(proj.endDate).slice(0, 10) : "",
      is_featured: Boolean(proj.isFeatured ?? proj.is_featured),
      is_public: Boolean(proj.isPublic ?? proj.is_public ?? true),
    });
    setTechInput("");
    setProjectError("");
    setProjectSuccess("");
    setIsProjectModalOpen(true);
  };

  const handleAddTechnology = () => {
    const trimmed = techInput.trim();
    if (!trimmed) return;
    const exists = projectFormData.technologies.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      setProjectFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, trimmed],
      }));
    }
    setTechInput("");
  };

  const handleRemoveTechnology = (indexToRemove) => {
    setProjectFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleTechKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTechnology();
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectFormData.title.trim()) {
      setProjectError("Project title is required.");
      return;
    }

    setProjectSaving(true);
    setProjectError("");
    setProjectSuccess("");

    try {
      const payload = {
        title: projectFormData.title.trim(),
        description: projectFormData.description.trim() || null,
        project_type: projectFormData.project_type,
        status: projectFormData.status,
        technologies: projectFormData.technologies,
        github_url: projectFormData.github_url.trim() || null,
        live_url: projectFormData.live_url.trim() || null,
        image_url: projectFormData.image_url.trim() || null,
        start_date: projectFormData.start_date || null,
        end_date: projectFormData.end_date || null,
        is_featured: projectFormData.is_featured,
        is_public: projectFormData.is_public,
      };

      if (projectModalMode === "create") {
        const res = await createProject(payload);
        if (res?.success && res?.project) {
          setProjects((prev) => [res.project, ...prev]);
          setProjectSuccess("Project created successfully!");
          setTimeout(() => {
            setIsProjectModalOpen(false);
          }, 800);
        } else {
          setProjectError(res?.message || "Failed to create project");
        }
      } else {
        const res = await updateProject(selectedProject.id, payload);
        if (res?.success && res?.project) {
          setProjects((prev) =>
            prev.map((p) => (p.id === selectedProject.id ? res.project : p))
          );
          setProjectSuccess("Project updated successfully!");
          setTimeout(() => {
            setIsProjectModalOpen(false);
          }, 800);
        } else {
          setProjectError(res?.message || "Failed to update project");
        }
      }
    } catch (err) {
      setProjectError(err?.message || "Failed to save project. Please check input values.");
    } finally {
      setProjectSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirmProject) return;
    setDeletingProject(true);
    try {
      const res = await deleteProject(deleteConfirmProject.id);
      if (res?.success) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteConfirmProject.id));
        setDeleteConfirmProject(null);
      }
    } catch (err) {
      alert(err?.message || "Failed to delete project.");
    } finally {
      setDeletingProject(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col tech-grid-pattern">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Global Save Message Banner */}
        {saveMessage && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{saveMessage}</span>
            </div>
            <button
              onClick={() => setSaveMessage("")}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        {/* ================= 1. PROFILE HEADER ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070d19] p-6 sm:p-8 backdrop-blur-xl">
          <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 text-2xl sm:text-3xl font-black text-slate-950 shadow-xl shadow-cyan-500/10 overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#070d19] bg-emerald-400" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.name}</h1>
                  <span className="text-xs text-cyan-400 font-medium">{profile.handle}</span>
                  <Badge variant="cyan" size="xs">
                    {profile.role}
                  </Badge>
                  {profile.career_domain && (
                    <Link
                      to="/domains"
                      className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300 hover:bg-violet-500/20 transition"
                      title="Click to change your career domain"
                    >
                      <Sparkles size={11} />
                      {profile.career_domain}
                    </Link>
                  )}
                  {profile.id && (
                    <span
                      className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5"
                      title={`User ID: ${profile.id}`}
                    >
                      ID: {profile.id.slice(0, 8)}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                  {profile.location && profile.location !== "Not added yet" && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-cyan-400" />
                      {profile.location}
                    </span>
                  )}
                  {profile.university && profile.university !== "Not added yet" && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-cyan-400" />
                      {profile.university}
                    </span>
                  )}
                  {profile.email && profile.email !== "Not added yet" && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-400" />
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Edit Profile, GitHub, LinkedIn, Download Resume */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                iconPosition="left"
                onClick={() => {
                  setSaveError("");
                  setIsEditing(true);
                }}
              >
                Edit Profile
              </Button>

              <a
                href={profile.github || "#"}
                target={profile.github ? "_blank" : undefined}
                rel="noreferrer"
                onClick={!profile.github ? (e) => { e.preventDefault(); setIsEditing(true); } : undefined}
                title={profile.github ? `GitHub: ${profile.github}` : "Add your GitHub link"}
                className={`flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold ${
                  profile.github
                    ? "text-slate-200 hover:border-cyan-400/40 hover:text-white"
                    : "text-slate-500 hover:text-slate-400"
                } transition cursor-pointer`}
              >
                <GithubIcon size={14} />
                <span>GitHub</span>
              </a>

              <a
                href={profile.linkedin || "#"}
                target={profile.linkedin ? "_blank" : undefined}
                rel="noreferrer"
                onClick={!profile.linkedin ? (e) => { e.preventDefault(); setIsEditing(true); } : undefined}
                title={profile.linkedin ? `LinkedIn: ${profile.linkedin}` : "Add your LinkedIn link"}
                className={`flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold ${
                  profile.linkedin
                    ? "text-slate-200 hover:border-cyan-400/40 hover:text-white"
                    : "text-slate-500 hover:text-slate-400"
                } transition cursor-pointer`}
              >
                <LinkedinIcon size={14} />
                <span>LinkedIn</span>
              </a>

              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/40 hover:text-white transition"
                  title={profile.portfolio_url}
                >
                  <Globe size={14} className="text-cyan-400" />
                  <span>Portfolio</span>
                </a>
              )}

              <Button
                variant="primary"
                size="sm"
                icon={FileText}
                iconPosition="left"
                onClick={() => alert(`Downloading ${profile.name.replace(/\s+/g, "_")}_Resume.pdf`)}
              >
                Download Resume
              </Button>
            </div>
          </div>
        </div>

        {/* ================= 2. ABOUT ================= */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              About
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              {profile.bio && profile.bio !== "Not added yet" ? "Edit Summary" : "Add Introduction"}
            </button>
          </div>
          {profile.bio && profile.bio.trim() && profile.bio !== "Not added yet" ? (
            <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
              {profile.bio}
            </p>
          ) : (
            <div className="py-4 text-center sm:text-left">
              <p className="text-sm text-slate-400 mb-3">No professional summary added yet.</p>
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                iconPosition="left"
                onClick={() => setIsEditing(true)}
              >
                Add your introduction
              </Button>
            </div>
          )}
        </div>

        {/* ================= CAREER GOALS (COMPACT STEP 19) ================= */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Target size={15} className="text-cyan-400" />
                <span>Career Goals</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Strategic role targets and verified readiness level.
              </p>
            </div>
            <Link
              to="/career"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
            >
              <span>View Career Plan</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-[11px] text-slate-400 font-medium">Target Roles</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {careerGoals?.preferences?.target_roles?.length > 0 ? (
                  careerGoals.preferences.target_roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 capitalize"
                    >
                      {role.replace(/-/g, " ")}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No roles selected yet</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-[11px] text-slate-400 font-medium">Preferred Domains</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {careerGoals?.preferences?.preferred_domains?.length > 0 ? (
                  careerGoals.preferences.preferred_domains.map((dom) => (
                    <span
                      key={dom}
                      className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[11px] font-semibold text-purple-300"
                    >
                      {dom}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Flexible domains</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Career Readiness</span>
                <div className="mt-1 text-2xl font-black text-cyan-400">
                  {careerGoals?.readiness?.percentage ?? 0}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {careerGoals?.readiness?.label || "Getting Started"}
                </div>
              </div>
              <Link to="/career">
                <Button variant="outline" size="sm" className="text-xs">
                  Plan &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ================= 3. CAREER STATISTICS ================= */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Career Statistics
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">100% Real Database Values</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
              <div className="flex items-center justify-center text-cyan-400 mb-1">
                <Code2 size={17} />
              </div>
              <p className="text-xl font-bold text-white">{profile.stats.solved}</p>
              <p className="text-[11px] text-slate-400">Problems Solved</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
              <div className="flex items-center justify-center text-orange-400 mb-1">
                <Flame size={17} />
              </div>
              <p className="text-xl font-bold text-white">{profile.stats.streak} Days</p>
              <p className="text-[11px] text-slate-400">Current Streak</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
              <div className="flex items-center justify-center text-yellow-400 mb-1">
                <Trophy size={17} />
              </div>
              <p className="text-xl font-bold text-white">{profile.stats.xp} XP</p>
              <p className="text-[11px] text-slate-400">Level {profile.stats.level} Explorer</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
              <div className="flex items-center justify-center text-emerald-400 mb-1">
                <FolderGit2 size={17} />
              </div>
              <p className="text-xl font-bold text-white">{profile.stats.projectsCount}</p>
              <p className="text-[11px] text-slate-400">Verified Projects</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PROJECTS SECTION */}
        {/* ========================================================================= */}
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <FolderGit2 size={20} className="text-cyan-400" />
                <h3 className="font-bold text-white text-lg">Projects & Portfolio</h3>
                {projects.length > 0 && (
                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                    {projects.length}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Real-world applications, open-source code, and hackathon prototypes.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              iconPosition="left"
              onClick={handleOpenCreateProject}
            >
              Add Project
            </Button>
          </div>

          {/* Projects Loading State - Skeleton */}
          {projectsLoading && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-5 w-20 bg-white/10 rounded-full" />
                    <div className="h-5 w-12 bg-white/5 rounded" />
                  </div>
                  <div className="h-5 w-48 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-full bg-white/5 rounded mb-1" />
                  <div className="h-3 w-3/4 bg-white/5 rounded mb-4" />
                  <div className="flex gap-2">
                    <div className="h-5 w-14 bg-white/5 rounded" />
                    <div className="h-5 w-14 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects Empty State */}
          {!projectsLoading && projects.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 mb-3">
                <FolderGit2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-white">No projects added yet</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Showcase your full-stack applications, hackathons, and personal tools to stand out to hiring managers.
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  iconPosition="left"
                  onClick={handleOpenCreateProject}
                >
                  Add your first project
                </Button>
              </div>
            </div>
          )}

          {/* Projects Cards Grid */}
          {!projectsLoading && projects.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((proj) => {
                const statusVariant =
                  proj.status === "completed"
                    ? "emerald"
                    : proj.status === "in_progress"
                    ? "cyan"
                    : "default";

                const statusLabel =
                  proj.status === "completed"
                    ? "Completed"
                    : proj.status === "in_progress"
                    ? "In Progress"
                    : "Planned";

                return (
                  <div
                    key={proj.id}
                    className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-cyan-400/30 hover:bg-white/[0.035] transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Top Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {proj.isFeatured && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <Star size={11} className="fill-amber-400" />
                              <span>Featured</span>
                            </span>
                          )}
                          <Badge variant={statusVariant} size="xs">
                            {statusLabel}
                          </Badge>
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 capitalize">
                            {proj.projectType || proj.project_type || "Personal"}
                          </span>
                        </div>

                        {/* Owner Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProject(proj)}
                            title="Edit project"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-cyan-300 transition cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmProject(proj)}
                            title="Delete project"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Image Thumbnail (if present) */}
                      {proj.imageUrl && (
                        <div className="mb-3 h-36 w-full rounded-xl overflow-hidden border border-white/5 bg-black/40">
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {/* Title & Description */}
                      <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition">
                        {proj.title}
                      </h4>
                      {proj.description && (
                        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">
                          {proj.description}
                        </p>
                      )}

                      {/* Technologies Chips */}
                      {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {proj.technologies.map((t, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-mono text-cyan-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom Links */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition font-medium"
                          >
                            <GithubIcon size={13} />
                            <span>Code</span>
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition font-medium"
                          >
                            <ExternalLink size={13} />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>

                      {(proj.startDate || proj.endDate) && (
                        <span className="text-[11px] text-slate-500">
                          {proj.startDate ? String(proj.startDate).slice(0, 7) : ""}
                          {proj.endDate ? ` – ${String(proj.endDate).slice(0, 7)}` : " – Present"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 5. SKILLS SECTION */}
        {/* ========================================================================= */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Code2 size={20} className="text-cyan-400" />
                <h3 className="font-bold text-white text-lg">Technical Skills</h3>
                {skills.length > 0 && (
                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                    {skills.length}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Programming languages, frameworks, and tools backed by PostgreSQL and career benchmarks.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              iconPosition="left"
              onClick={handleOpenCreateSkill}
            >
              Add Skill
            </Button>
          </div>

          {skillSuccess && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>{skillSuccess}</span>
            </div>
          )}

          {/* State 1: Loading -> Skeleton */}
          {skillsLoading && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-24 bg-white/10 rounded" />
                    <div className="h-2.5 w-16 bg-white/5 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* State 2: Error -> Unable to load skills + Retry */}
          {!skillsLoading && skillsError && (
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
              <AlertCircle size={24} className="mx-auto text-rose-400 mb-2" />
              <p className="text-sm font-semibold text-white">Unable to load skills.</p>
              <p className="mt-1 text-xs text-slate-400">
                {skillsError || "There was a network or server issue fetching your technical skills from the database."}
              </p>
              <button
                type="button"
                onClick={fetchUserSkills}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-xs font-medium text-white hover:bg-white/15 transition cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* State 3: Empty -> No skills added yet */}
          {!skillsLoading && !skillsError && skills.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-slate-400 mb-3">
                <Sparkles size={20} className="text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white">No skills added yet.</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Add your programming languages, frameworks, and technical proficiencies to calculate your career readiness score.
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  iconPosition="left"
                  onClick={handleOpenCreateSkill}
                >
                  Add your first skill
                </Button>
              </div>
            </div>
          )}

          {/* State 4: Success -> Skills Grid */}
          {!skillsLoading && !skillsError && skills.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-cyan-400/30 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">
                        {skill.name}
                      </span>
                      <Badge
                        size="xs"
                        variant={
                          skill.proficiency === "Expert" || skill.proficiency === "Advanced"
                            ? "cyan"
                            : skill.proficiency === "Intermediate"
                            ? "emerald"
                            : "default"
                        }
                      >
                        {skill.proficiency}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{skill.category}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSkill(skill)}
                      title="Edit skill"
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmSkill(skill)}
                      title="Delete skill"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 6. LEARNING & CERTIFICATIONS SECTION */}
        {/* ========================================================================= */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap size={20} className="text-cyan-400" />
                <h3 className="font-bold text-white text-lg">Learning & Certifications</h3>
                {enrolledCourses.length > 0 && (
                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-400/20">
                    {enrolledCourses.length} Enrolled
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Course progress, technical tracks, and verifiable credentials earned on CareerCraft.
              </p>
            </div>

            <Link to="/courses">
              <Button variant="ghost" size="sm">
                Browse Course Catalog →
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Enrolled Courses */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" />
                  <span>Enrolled Courses</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {enrolledCourses.length} active
                </span>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <p>No active courses enrolled.</p>
                  <Link to="/courses" className="mt-2 inline-block text-cyan-400 hover:underline">
                    Enroll in technical tracks
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((c) => (
                    <Link
                      key={c.id || c.courseId || c.slug}
                      to={`/courses/${c.slug || c.courseId}`}
                      className="group block rounded-xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-cyan-400/30 hover:bg-white/[0.04] transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-white group-hover:text-cyan-300 truncate">
                          {c.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-cyan-400 shrink-0">
                          {c.progressPercent || 0}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                          style={{ width: `${c.progressPercent || 0}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Certifications */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award size={16} className="text-yellow-400" />
                  <span>Verified Credentials</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {enrolledCourses.filter((c) => c.status === "completed" || c.progressPercent === 100).length} issued
                </span>
              </div>

              {enrolledCourses.filter((c) => c.status === "completed" || c.progressPercent === 100).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <p>No verified course certificates completed yet.</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Reach 100% course completion to generate verifiable certificates.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses
                    .filter((c) => c.status === "completed" || c.progressPercent === 100)
                    .map((cert, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3.5"
                      >
                        <div>
                          <p className="font-semibold text-xs text-white">{cert.title}</p>
                          <p className="text-[11px] text-slate-400">CareerCraft Verified Certificate</p>
                        </div>
                        <Badge variant="emerald" size="xs">
                          Verified
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. ACHIEVEMENTS SECTION */}
        {/* ========================================================================= */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-yellow-400" />
                <h3 className="font-bold text-white text-lg">Achievements & Badges</h3>
                {userAchievements.filter((a) => a.unlocked || a.unlockedAt).length > 0 && (
                  <span className="rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-300 border border-yellow-400/20">
                    {userAchievements.filter((a) => a.unlocked || a.unlockedAt).length} Unlocked
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Gamified milestones earned through algorithm problem solving and project deployment.
              </p>
            </div>

            <Link to="/achievements">
              <Button variant="ghost" size="sm">
                View All Badges →
              </Button>
            </Link>
          </div>

          {achievementsLoading ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex gap-3">
                  <div className="h-10 w-10 bg-white/10 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-24 bg-white/10 rounded" />
                    <div className="h-2.5 w-32 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : userAchievements.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400 mb-3">
                <Trophy size={22} />
              </div>
              <h4 className="text-sm font-bold text-white">No achievements registered yet</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Solve coding problems, complete technical tracks, or publish verified projects to start earning badges and XP.
              </p>
              <div className="mt-4">
                <Link to="/coding">
                  <Button variant="secondary" size="sm">
                    Solve Coding Problems
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {userAchievements.slice(0, 6).map((ach, idx) => (
                <div
                  key={ach.id || idx}
                  className={`rounded-2xl border p-4 transition flex items-start gap-3.5 ${
                    ach.unlocked || ach.unlockedAt
                      ? "border-yellow-400/20 bg-yellow-400/[0.02] hover:border-yellow-400/40"
                      : "border-white/5 bg-white/[0.015] opacity-60"
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg">
                    {ach.icon || "🏆"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-white truncate">{ach.title}</h4>
                      {ach.points && (
                        <span className="text-[10px] font-mono font-semibold text-yellow-400">
                          +{ach.points} XP
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {ach.description}
                    </p>
                    <div className="mt-2">
                      {ach.unlocked || ach.unlockedAt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 size={11} />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 8. APPLICATIONS & FREELANCE SECTION */}
        {/* ========================================================================= */}
        <section className="mt-12 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-emerald-400" />
                <h3 className="font-bold text-white text-lg">Opportunities & Pipeline</h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Real-time tracking of active job applications, internships, and freelance contracts.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job & Internship Pipeline */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Job & Internship Pipeline</h4>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {applications.length}
                  </span>
                </div>
                <Link to="/applications" className="text-xs text-cyan-400 hover:text-cyan-300">
                  Full Pipeline →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-lg font-bold text-white">{applications.length}</p>
                  <p className="text-[10px] text-slate-400">Submitted</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-lg font-bold text-emerald-400">
                    {applications.filter((a) => ["interview", "shortlisted", "selected"].includes(a.status)).length}
                  </p>
                  <p className="text-[10px] text-slate-400">In Review / Interview</p>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs border-t border-white/5">
                  <p>No job applications submitted yet.</p>
                  <Link to="/jobs" className="mt-1.5 inline-block text-cyan-400 hover:underline">
                    Explore CareerCraft Listings
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  {applications.slice(0, 3).map((app) => (
                    <Link
                      key={app.id}
                      to="/applications"
                      className="flex items-center justify-between text-xs text-slate-300 hover:text-cyan-300 p-2 rounded-xl hover:bg-white/[0.02] transition"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{app.jobTitle || "Role"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{app.company || "Company"}</p>
                      </div>
                      <span className="capitalize text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        {app.status ? app.status.replace("_", " ") : "applied"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Freelance Engagements */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Freelance Engagements</h4>
                  <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    {contracts.length}
                  </span>
                </div>
                <Link to="/freelance/contracts" className="text-xs text-cyan-400 hover:text-cyan-300">
                  All Contracts →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-lg font-bold text-white">
                    {contracts.filter((c) => c.status === "active").length}
                  </p>
                  <p className="text-[10px] text-slate-400">Active Contracts</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="text-lg font-bold text-emerald-400">
                    {contracts.filter((c) => c.status === "completed").length}
                  </p>
                  <p className="text-[10px] text-slate-400">Completed Projects</p>
                </div>
              </div>

              {contracts.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs border-t border-white/5">
                  <p>No freelance contracts yet.</p>
                  <Link to="/freelance" className="mt-1.5 inline-block text-cyan-400 hover:underline">
                    Browse Client Projects
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  {contracts.slice(0, 3).map((c) => (
                    <Link
                      key={c.id}
                      to="/freelance/contracts"
                      className="flex items-center justify-between text-xs text-slate-300 hover:text-cyan-300 p-2 rounded-xl hover:bg-white/[0.02] transition"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{c.projectTitle || "Contract"}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{c.status || "active"}</p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                        ${c.agreedBudget}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0B0F19] p-6 sm:p-8 shadow-2xl my-8">
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 size={18} className="text-cyan-400" />
                  <span>Edit Profile</span>
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Update your personal and academic information stored in PostgreSQL.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white hover:border-white/20 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {saveError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                <p>{saveError}</p>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Bio / About Me
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Passionate CS student obsessed with distributed systems, high-performance web applications..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* 2-Col: College & Degree */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    College / University
                  </label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleInputChange}
                    placeholder="National Institute of Technology"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Degree / Major
                  </label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    placeholder="B.Tech in Computer Science"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Career Domain Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Career Domain / Focus Track
                </label>
                <select
                  name="career_domain"
                  value={formData.career_domain}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="">Select a Career Domain</option>
                  <option value="Full Stack Development">Full Stack Development</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                  <option value="Data Science & Analytics">Data Science & Analytics</option>
                  <option value="Java Development">Java Development</option>
                  <option value="Python Development">Python Development</option>
                  <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                </select>
              </div>

              {/* 2-Col: Graduation Year & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    name="graduation_year"
                    value={formData.graduation_year}
                    onChange={handleInputChange}
                    placeholder="2026"
                    min="1990"
                    max="2035"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Bangalore, India"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* 2-Col: Phone & Avatar URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* 3-Col: Social & Portfolio URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    name="github_url"
                    value={formData.github_url}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={formData.portfolio_url}
                    onChange={handleInputChange}
                    placeholder="https://myportfolio.dev"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Skill Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0F19] p-6 sm:p-7 shadow-2xl my-8">
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code2 size={18} className="text-cyan-400" />
                  <span>
                    {skillModalMode === "create" ? "Add Technical Skill" : "Edit Technical Skill"}
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {skillModalMode === "create"
                    ? "Add a programming language, tool, or library to your profile."
                    : "Update your proficiency level or category."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSkillModalOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white hover:border-white/20 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {skillError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                <p>{skillError}</p>
              </div>
            )}

            <form onSubmit={handleSaveSkill} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  value={skillFormData.name}
                  onChange={(e) =>
                    setSkillFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. React.js, Python, PostgreSQL, Docker"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={skillFormData.category}
                  onChange={(e) =>
                    setSkillFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-sm text-white transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="Programming">Programming</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Database">Database</option>
                  <option value="AI / Machine Learning">AI / Machine Learning</option>
                  <option value="Tools">Tools</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Proficiency Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Beginner", "Intermediate", "Advanced", "Expert"].map((lvl) => {
                    const isSelected = skillFormData.proficiency === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setSkillFormData((prev) => ({ ...prev, proficiency: lvl }))
                        }
                        className={`rounded-xl border py-2 px-3 text-xs font-semibold transition cursor-pointer text-center ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-sm shadow-cyan-500/20"
                            : "border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  disabled={skillSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={skillSaving}
                >
                  {skillSaving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : (
                    "Save Skill"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Skill Confirmation Modal */}
      {deleteConfirmSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Skill</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-white">&quot;{deleteConfirmSkill.name}&quot;</strong> from your profile? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setDeleteConfirmSkill(null)}
                disabled={deletingSkill}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleDeleteSkill}
                disabled={deletingSkill}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition disabled:opacity-50 cursor-pointer"
              >
                {deletingSkill ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0B0F19] p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <FolderGit2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {projectModalMode === "create" ? "Add Project to Portfolio" : "Edit Project"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {projectModalMode === "create"
                      ? "Share your engineering work with peers and recruiters (+5 XP)"
                      : "Update project metadata and technologies"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {projectError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0" />
                <span>{projectError}</span>
              </div>
            )}

            {projectSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{projectSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="mt-5 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={projectFormData.title}
                  onChange={(e) =>
                    setProjectFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Real-Time Distributed Task Queue"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={projectFormData.description}
                  onChange={(e) =>
                    setProjectFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What does this application do? Key technical achievements, architecture, and impact..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 resize-y"
                />
              </div>

              {/* Project Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Type</label>
                  <select
                    value={projectFormData.project_type}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, project_type: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-white outline-none focus:border-cyan-400/50 cursor-pointer"
                  >
                    <option value="personal">Personal Project</option>
                    <option value="academic">Academic / Coursework</option>
                    <option value="hackathon">Hackathon Prototype</option>
                    <option value="freelance">Freelance Client Work</option>
                    <option value="open_source">Open Source Contribution</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-white outline-none focus:border-cyan-400/50 cursor-pointer"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed (+10 XP)</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
              </div>

              {/* Technology Chips Input UX */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Technologies Used
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={handleTechKeyDown}
                    placeholder="Type technology (e.g. React, PostgreSQL) and press Enter"
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTechnology}
                  >
                    Add
                  </Button>
                </div>

                {projectFormData.technologies.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {projectFormData.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-mono text-cyan-300"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTechnology(idx)}
                          className="hover:text-rose-400 transition cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* GitHub & Live Demo URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={projectFormData.github_url}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, github_url: e.target.value }))
                    }
                    placeholder="https://github.com/username/repo"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={projectFormData.live_url}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, live_url: e.target.value }))
                    }
                    placeholder="https://myproject.dev"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 font-mono"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Image / Screenshot URL</label>
                <input
                  type="url"
                  value={projectFormData.image_url}
                  onChange={(e) =>
                    setProjectFormData((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="https://images.unsplash.com/... or hosted screenshot"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 font-mono"
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={projectFormData.start_date}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, start_date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-white outline-none focus:border-cyan-400/50 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={projectFormData.end_date}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, end_date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-white outline-none focus:border-cyan-400/50 cursor-pointer"
                  />
                </div>
              </div>

              {/* Checkboxes: Featured & Public */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={projectFormData.is_featured}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, is_featured: e.target.checked }))
                    }
                    className="rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-0"
                  />
                  <span>Feature on profile (max 3)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={projectFormData.is_public}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({ ...prev, is_public: e.target.checked }))
                    }
                    className="rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-0"
                  />
                  <span>Visible on public portfolio</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  disabled={projectSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={projectSaving}
                >
                  {projectSaving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : projectModalMode === "create" ? (
                    "Create Project"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Project</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-white">&quot;{deleteConfirmProject.title}&quot;</strong> from your portfolio? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setDeleteConfirmProject(null)}
                disabled={deletingProject}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deletingProject}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition disabled:opacity-50 cursor-pointer"
              >
                {deletingProject ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
