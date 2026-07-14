import api from './client';

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  signupManager: (data) => api.post('/auth/signup/manager', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifySession: () => api.get('/auth/verify'),
  refreshToken: () => api.post('/auth/refresh'),
};

export const userAPI = {
  getDashboard: () => api.get('/users/dashboard'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getLeaveBalance: () => api.get('/users/leave-balance'),
  updateNotificationSettings: (data) => api.put('/users/notification-settings', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getPending: (params) => api.get('/users/pending', { params }),
  approve: (id) => api.put(`/users/${id}/approve`),
  reject: (id) => api.put(`/users/${id}/reject`),
  getTeam: (params) => api.get('/users/team', { params }),
};

export const leaveAPI = {
  apply: (data) => api.post('/leaves/apply', data),
  getMy: (params) => api.get('/leaves/my', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  getPending: (params) => api.get('/leaves/pending', { params }),
  getHistory: (params) => api.get('/leaves/history', { params }),
  getCalendar: () => api.get('/leaves/calendar'),
  getManagerDashboard: () => api.get('/leaves/manager-dashboard'),
  getEmployeeHistory: (id) => api.get(`/leaves/employee/${id}`),
  review: (id, data) => api.put(`/leaves/${id}/review`, data),
  update: (id, data) => api.put(`/leaves/${id}`, data),
  delete: (id) => api.delete(`/leaves/${id}`),
  updateStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
};

export const departmentAPI = {
  getAll: (params) => api.get('/departments', { params }),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const policyAPI = {
  getAll: () => api.get('/policies'),
  create: (data) => api.post('/policies', data),
  update: (id, data) => api.put(`/policies/${id}`, data),
  delete: (id) => api.delete(`/policies/${id}`),
};

export const holidayAPI = {
  getAll: (params) => api.get('/holidays', { params }),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteMany: (ids) => api.delete('/notifications/bulk', { data: { ids } }),
  deleteAll: () => api.delete('/notifications/all'),
  getAnnouncements: (params) => api.get('/notifications/announcements', { params }),
  getManageAnnouncements: (params) => api.get('/notifications/announcements/manage', { params }),
  createAnnouncement: (data) => api.post('/notifications/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/notifications/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/notifications/announcements/${id}`),
};

export const reportAPI = {
  getAdminDashboard: () => api.get('/reports/dashboard'),
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getDepartment: (id) => api.get(`/reports/department/${id}`),
  getEmployeeHistory: (id) => api.get(`/reports/employee/${id}`),
  getAnalytics: (params) => api.get('/reports/analytics', { params }),
  export: (params) => api.get('/reports/export', {
    params,
    responseType: params?.format === 'csv' ? 'blob' : 'json',
  }),
};

export const activityAPI = {
  getMy: (params) => api.get('/activities/my', { params }),
  getTeamProfile: (params) => api.get('/activities/team-profile', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  delete: (id) => api.delete(`/activities/${id}`),
  deleteMany: (ids) => api.delete('/activities/bulk', { data: { ids } }),
  deleteAllProfile: () => api.delete('/activities/all-profile'),
};
