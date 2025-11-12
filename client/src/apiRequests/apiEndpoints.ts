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
export const getTaskById = (taskId: string) => `/api/tasks/id/${taskId}`;
export const updateTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const deleteTaskById = (taskId: string) => `/api/tasks/${taskId}`;
export const getTasksByProjectId = (projectId: string) => `/api/tasks/project/id/${projectId}`;

// --- Task Views ---
export const createTaskView = () => '/api/tasks/views';
export const updateTaskViewById = (viewId: string) => `/api/tasks/views/${viewId}`;
export const deleteTaskViewById = (viewId: string) => `/api/tasks/views/${viewId}`;

// --- Projects ---
export const getProjects = () => '/api/projects';
export const getMyProjects = () => '/api/projects/me';
export const getProjectById = (projectId: string) => `/api/projects/id/${projectId}`;
export const updateProjectById = (projectId: string) => `/api/projects/${projectId}`;
export const deleteProjectById = (projectId: string) => `/api/projects/${projectId}`;
export const checkSlugAvailability = (slug: string) => `/api/projects/check-slug/${slug}`;
export const addProjectMember = (projectId: string) => `/api/projects/${projectId}/members`;
export const removeProjectMember = (projectId: string, userId: string) => `/api/projects/${projectId}/members/${userId}`;
export const updateProjectMemberRole = (projectId: string, memberId: string) => `/api/projects/${projectId}/members/${memberId}/role`;

// --- Users ---
export const getUsersByEmailSearch = (email: string) => `/api/users/search?email=${encodeURIComponent(email)}`;
export const updateMe = () => '/api/users/me';

// --- Roles ---
export const getProjectRoles = () => '/api/auth/roles';

// --- Permissions ---
export const getMyPermissionsEndpoint = () => '/api/users/me/permissions';

// --- Files ---
export const apiFile = () => '/api/file';

// --- Labels ---
export const getMyLabels = () => '/api/labels/me';
export const createLabel = () => '/api/labels';
export const getLabelById = (labelId: string) => `/api/labels/${labelId}`;
export const updateLabelById = (labelId: string) => `/api/labels/${labelId}`;
export const deleteLabelById = (labelId: string) => `/api/labels/${labelId}`;
export const getMyLabelSets = () => '/api/labels/sets/me';
export const createLabelSet = () => '/api/labels/sets';
export const deleteLabelSetById = (setId: string) => `/api/labels/sets/${setId}`;
export const createLabelInSet = (setId: string) => `/api/labels/sets/${setId}/labels`;
export const getLabelsInSet = (setId: string) => `/api/labels/sets/${setId}/labels`;
