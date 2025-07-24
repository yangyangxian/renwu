// =================================================================
// API ENDPOINT CONSTANTS
// =================================================================

// --- Auth ---
export const authLogin = () => '/api/auth/login';
export const authSignup = () => '/api/auth/signup';
export const authLogout = () => '/api/auth/logout';
export const authMe = () => '/api/auth/me';

// --- Tasks ---
export const getTasks = () => '/api/tasks';
export const getMyTasks = () => '/api/users/me/tasks';
export const getTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const updateTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const deleteTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const getTasksByProjectSlug = (projectSlug: string) => `/api/tasks/project/${projectSlug}`;

// --- Projects ---
export const getProjects = () => '/api/projects';
export const getMyProjects = () => '/api/projects/me';
export const getProjectBySlug = (projectSlug: string) => `/api/projects/${projectSlug}`;
export const updateProjectById = (projectId: string) => `/api/projects/${projectId}`;
export const deleteProjectById = (projectId: string) => `/api/projects/${projectId}`;
export const checkSlugAvailability = (slug: string) => `/api/projects/check-slug/${slug}`;
export const addProjectMember = (projectId: string) => `/api/projects/${projectId}/members`;
export const removeProjectMember = (projectId: string, userId: string) => `/api/projects/${projectId}/members/${userId}`;

// --- Users ---
export const getUserByEmail = (email: string) => `/api/users/email/${encodeURIComponent(email)}`;
export const updateMe = () => '/api/users/me';

// --- Hello ---
export const getHello = () => '/api/hello';

