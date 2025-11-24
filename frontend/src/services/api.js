import axios from 'axios';

const API_URL = 'https://amp-backend-s7o1.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add session ID to all requests
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['Session-Id'] = sessionId;
  }
  return config;
});

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  validateSession: () => api.get('/auth/session'),
};

export const taskAPI = {
  getTasks: (userId) => api.get(`/tasks/user/${userId}`),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const eventAPI = {
  getEvents: (userId) => api.get(`/events/user/${userId}`),
  createEvent: (event) => api.post('/events', event),
  updateEvent: (id, event) => api.put(`/events/${id}`, event),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  cancelInstance: (id, date) => api.post(`/events/${id}/cancel-instance`, { date }),
  getExceptions: (parentId) => api.get(`/events/${parentId}/exceptions`),
};

export const groupAPI = {
  getGroups: (userId) => api.get(`/groups/user/${userId}`),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (group) => api.post('/groups', group),
  updateGroup: (id, group) => api.put(`/groups/${id}`, group),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  addMember: (groupId, member) => api.post(`/groups/${groupId}/members`, member),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
};

export default api;