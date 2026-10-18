import {
  completeLocalLesson,
  enrollLocalCourse,
  getLocalCourse,
  getLocalCourses,
  getLocalEnrollments,
  getLocalLesson,
} from "../data/localCourses";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const config = {
    ...options,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "We couldn't reach the CareerCraft server. Please try again in a moment.",
      0,
      { cause: error },
    );
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};

export const getProfile = () => api.get("/profile");
export const updateProfile = (data) => api.put("/profile", data);

export const getSkills = () => api.get("/skills");
export const createSkill = (data) => api.post("/skills", data);
export const updateSkill = (id, data) => api.put(`/skills/${id}`, data);
export const deleteSkill = (id) => api.delete(`/skills/${id}`);

export const getDashboard = () => api.get("/dashboard");
export const getActivity = (limit = 10) => api.get(`/activity${limit ? `?limit=${limit}` : ""}`);
export const getAchievements = () => api.get("/achievements");

export const getCodingProblems = (params = {}) => {
  const query = new URLSearchParams();
  if (params.difficulty) query.append("difficulty", params.difficulty);
  if (params.category) query.append("category", params.category);
  if (params.search) query.append("search", params.search);
  const qStr = query.toString();
  return api.get(`/coding/problems${qStr ? `?${qStr}` : ""}`);
};

export const getCodingProblem = (slug) => api.get(`/coding/problems/${slug}`);

export const submitCodingProblem = (problemId, data) =>
  api.post(`/coding/problems/${problemId}/submissions`, data);

export const getCodingSubmissions = (params = {}) => {
  const query = new URLSearchParams();
  if (params.problemId) query.append("problemId", params.problemId);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/coding/submissions${qStr ? `?${qStr}` : ""}`);
};

export const getCodingProgress = (problemId) =>
  api.get(`/coding/problems/${problemId}/progress`);

export const getProjects = () => api.get("/projects");
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post("/projects", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const getPublicProjects = (userId) => api.get(`/projects/public/${userId}`);

export const getCourses = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.level) query.append("level", params.level);
  const qStr = query.toString();
  return api.get(`/courses${qStr ? `?${qStr}` : ""}`).then((result) => {
    if (result?.success && Array.isArray(result.courses) && result.courses.length > 0) {
      const serverSlugs = new Set(result.courses.map((course) => course.slug));
      const localCourses = getLocalCourses().filter((course) => !serverSlugs.has(course.slug));
      return { ...result, courses: [...result.courses, ...localCourses], source: localCourses.length ? "combined" : "api" };
    }
    return { success: true, courses: getLocalCourses(), source: "local" };
  }).catch(() => ({ success: true, courses: getLocalCourses(), source: "local" }));
};
export const getCourse = (slug) => api.get(`/courses/${slug}`).then((result) => {
  if (result?.success && result.course) return result;
  const course = getLocalCourse(slug);
  return course ? { success: true, course, source: "local" } : result;
}).catch(() => {
  const course = getLocalCourse(slug);
  if (course) return { success: true, course, source: "local" };
  throw new Error("Course not found");
});
export const getCourseLesson = (slug, lessonSlug) => api.get(`/courses/${slug}/lessons/${lessonSlug}`).then((result) => {
  if (result?.success && result.lesson) return result;
  return getLocalLesson(slug, lessonSlug) || result;
}).catch(() => {
  const lesson = getLocalLesson(slug, lessonSlug);
  if (lesson) return lesson;
  throw new Error("Lesson not found");
});
export const enrollCourse = (courseId) => api.post(`/courses/${courseId}/enroll`).catch(() => enrollLocalCourse(courseId));
export const getEnrollments = () => api.get("/courses/enrollments").then((result) => {
  if (result?.success && Array.isArray(result.enrollments)) {
    const serverIds = new Set(result.enrollments.map((course) => course.id || course.courseId));
    const localEnrollments = getLocalEnrollments().filter((course) => !serverIds.has(course.id));
    return { ...result, enrollments: [...result.enrollments, ...localEnrollments] };
  }
  return { success: true, enrollments: getLocalEnrollments(), source: "local" };
}).catch(() => ({ success: true, enrollments: getLocalEnrollments(), source: "local" }));
export const getCourseProgress = (courseId) => api.get(`/courses/${courseId}/progress`);
export const completeCourseLesson = (lessonId) => api.post(`/courses/lessons/${lessonId}/complete`).catch(() => completeLocalLesson(lessonId));

export const getJobs = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.jobType) query.append("jobType", params.jobType);
  if (params.category) query.append("category", params.category);
  if (params.location) query.append("location", params.location);
  if (params.workMode) query.append("workMode", params.workMode);
  if (params.experienceLevel) query.append("experienceLevel", params.experienceLevel);
  const qStr = query.toString();
  return api.get(`/jobs${qStr ? `?${qStr}` : ""}`);
};
export const getJob = (id) => api.get(`/jobs/${id}`);
export const applyToJob = (jobId, data) => api.post(`/jobs/${jobId}/apply`, data);
export const getApplications = () => api.get("/jobs/applications");
export const getApplication = (id) => api.get(`/jobs/applications/${id}`);
export const withdrawApplication = (id) =>
  api.patch(`/jobs/applications/${id}/status`, { status: "withdrawn" });
export const saveJob = (jobId) => api.post(`/jobs/${jobId}/save`);
export const unsaveJob = (jobId) => api.delete(`/jobs/${jobId}/save`);
export const getSavedJobs = () => api.get("/jobs/saved");

// Freelance Marketplace APIs
export const getFreelanceProjects = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.budgetType) query.append("budgetType", params.budgetType);
  if (params.experienceLevel) query.append("experienceLevel", params.experienceLevel);
  if (params.status) query.append("status", params.status);
  if (params.skill) query.append("skill", params.skill);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/freelance/projects${qStr ? `?${qStr}` : ""}`);
};
export const getFreelanceProject = (id) => api.get(`/freelance/projects/${id}`);
export const createFreelanceProject = (data) => api.post("/freelance/projects", data);
export const updateFreelanceProject = (id, data) => api.put(`/freelance/projects/${id}`, data);
export const deleteFreelanceProject = (id) => api.delete(`/freelance/projects/${id}`);

export const submitProposal = (projectId, data) =>
  api.post(`/freelance/projects/${projectId}/proposals`, data);
export const getMyProposals = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/freelance/proposals${qStr ? `?${qStr}` : ""}`);
};
export const getProposal = (id) => api.get(`/freelance/proposals/${id}`);
export const withdrawProposal = (id) => api.patch(`/freelance/proposals/${id}/withdraw`);
export const getProjectProposals = (projectId) =>
  api.get(`/freelance/projects/${projectId}/proposals`);
export const acceptProposal = (proposalId) =>
  api.post(`/freelance/proposals/${proposalId}/accept`);
export const rejectProposal = (proposalId) =>
  api.post(`/freelance/proposals/${proposalId}/reject`);

export const getContracts = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/freelance/contracts${qStr ? `?${qStr}` : ""}`);
};
export const getContract = (id) => api.get(`/freelance/contracts/${id}`);
export const completeContract = (id) => api.post(`/freelance/contracts/${id}/complete`);
export const cancelContract = (id) => api.post(`/freelance/contracts/${id}/cancel`);

export const saveFreelanceProject = (id) => api.post(`/freelance/projects/${id}/save`);
export const unsaveFreelanceProject = (id) => api.delete(`/freelance/projects/${id}/save`);
export const getSavedFreelanceProjects = () => api.get("/freelance/saved");
export const getFreelanceEarnings = () => api.get("/freelance/earnings");

// Notifications Platform APIs
export const getNotifications = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.unreadOnly !== undefined && params.unreadOnly !== null) {
    query.append("unreadOnly", params.unreadOnly);
  }
  const qStr = query.toString();
  return api.get(`/notifications${qStr ? `?${qStr}` : ""}`);
};
export const getUnreadNotificationCount = () => api.get("/notifications/unread-count");
export const markNotificationAsRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.patch("/notifications/read-all");
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// ======================================================
// ADMIN PANEL APIS
// ======================================================
export const getAdminStats = () => api.get("/admin/stats");

export const getAdminUsers = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.role) query.append("role", params.role);
  if (params.status) query.append("status", params.status);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/admin/users${qStr ? `?${qStr}` : ""}`);
};

export const getAdminUserDetail = (id) => api.get(`/admin/users/${id}`);
export const updateAdminUserStatus = (id, status) => api.patch(`/admin/users/${id}/status`, { status });
export const updateAdminUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });

export const getAdminCourses = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.level) query.append("level", params.level);
  if (params.isPublished !== undefined && params.isPublished !== "") query.append("isPublished", params.isPublished);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/admin/courses${qStr ? `?${qStr}` : ""}`);
};

export const getAdminCourseDetail = (id) => api.get(`/admin/courses/${id}`);
export const publishAdminCourse = (id) => api.patch(`/admin/courses/${id}/publish`);
export const unpublishAdminCourse = (id) => api.patch(`/admin/courses/${id}/unpublish`);

export const getAdminJobs = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.jobType) query.append("jobType", params.jobType);
  if (params.isActive !== undefined && params.isActive !== "") query.append("isActive", params.isActive);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/admin/jobs${qStr ? `?${qStr}` : ""}`);
};

export const getAdminJobDetail = (id) => api.get(`/admin/jobs/${id}`);
export const updateAdminJobStatus = (id, data) => api.patch(`/admin/jobs/${id}/status`, data);

export const getAdminCodingProblems = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.difficulty) query.append("difficulty", params.difficulty);
  if (params.category) query.append("category", params.category);
  if (params.isActive !== undefined && params.isActive !== "") query.append("isActive", params.isActive);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/admin/coding/problems${qStr ? `?${qStr}` : ""}`);
};

export const getAdminCodingProblemDetail = (id) => api.get(`/admin/coding/problems/${id}`);
export const updateAdminCodingProblemStatus = (id, data) => api.patch(`/admin/coding/problems/${id}/status`, data);

export const getAdminProjects = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.projectType) query.append("projectType", params.projectType);
  if (params.status) query.append("status", params.status);
  if (params.isPublic !== undefined && params.isPublic !== "") query.append("isPublic", params.isPublic);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/admin/projects${qStr ? `?${qStr}` : ""}`);
};

export const getAdminProjectDetail = (id) => api.get(`/admin/projects/${id}`);
export const updateAdminProjectStatus = (id, data) => api.patch(`/admin/projects/${id}/status`, data);

export const getAdminFreelanceProjects = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.status) query.append("status", params.status);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/freelance/projects${qStr ? `?${qStr}` : ""}`);
};

export const getAdminFreelanceProjectDetail = (id) => api.get(`/admin/freelance/projects/${id}`);
export const updateAdminFreelanceProjectStatus = (id, status) => api.patch(`/admin/freelance/projects/${id}/status`, { status });

export const getAdminNotifications = (params = {}) => {
  const query = new URLSearchParams();
  if (params.userId) query.append("userId", params.userId);
  if (params.type) query.append("type", params.type);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/admin/notifications${qStr ? `?${qStr}` : ""}`);
};

export const getAdminAuditLogs = (params = {}) => {
  const query = new URLSearchParams();
  if (params.action) query.append("action", params.action);
  if (params.entityType) query.append("entityType", params.entityType);
  if (params.adminId) query.append("adminId", params.adminId);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qStr = query.toString();
  return api.get(`/admin/audit-logs${qStr ? `?${qStr}` : ""}`);
};


// ======================================================
// SETTINGS APIs
// ======================================================
export const getSettings = () => api.get("/settings");
export const updateSettings = (data) => api.patch("/settings", data);
export const changePassword = (data) => api.patch("/settings/password", data);

// ======================================================
// CAREER RECOMMENDATION & ROADMAP APIs (STEP 19)
// ======================================================
export const getCareerProfile = () => api.get("/career/profile");
export const getCareerRecommendations = () => api.get("/career/recommendations");
export const regenerateCareerRecommendations = () => api.post("/career/recommendations/regenerate");
export const getCareerHistory = () => api.get("/career/history");
export const updateCareerPreferences = (data) => api.patch("/career/preferences", data);
export const getCareerPaths = () => api.get("/career/paths");
export const getCareerPathDetail = (slug) => api.get(`/career/paths/${slug}`);

export default api;

