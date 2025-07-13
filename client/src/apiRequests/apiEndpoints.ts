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
export const getMyTasks = () => '/api/tasks/me';
export const getTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const updateTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const deleteTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const getTasksByProjectId = (projectId: string) => `/api/tasks/project/${projectId}`;

// --- Projects ---
export const getProjects = () => '/api/projects';
export const getMyProjects = () => '/api/projects/me';
export const getProjectById = (projectId: string) => `/api/projects/${projectId}`;
export const updateProjectById = (projectId: string) => `/api/projects/${projectId}`;
export const addProjectMember = (projectId: string) => `/api/projects/${projectId}/members`;
export const removeProjectMember = (projectId: string, userId: string) => `/api/projects/${projectId}/members/${userId}`;

// --- Users ---
export const getUserByEmail = (email: string) => `/api/users/email/${encodeURIComponent(email)}`;
export const updateMe = () => '/api/users/me';

// --- Hello ---
export const getHello = () => '/api/hello';

