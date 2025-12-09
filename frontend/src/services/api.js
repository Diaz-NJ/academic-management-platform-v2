// frontend/src/services/api.js - COMPLETE VERSION
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  console.error('⚠️ REACT_APP_API_URL is not set! Check your .env file');
}

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
  updateUser: (userId, userData) => api.put(`/auth/users/${userId}`, userData),
  changePassword: (userId, passwordData) => 
    api.put(`/auth/users/${userId}/password`, passwordData),
  deleteUser: (userId, password) => 
    api.delete(`/auth/users/${userId}`, { data: { password } }),
};

export const taskAPI = {
  getTasks: (userId) => api.get(`/tasks/user/${userId}`),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  addToCalendar: (taskId) => api.post(`/tasks/${taskId}/add-to-calendar`),
  removeFromCalendar: (taskId) => api.delete(`/tasks/${taskId}/remove-from-calendar`),
  // ✅ FIXED: Correct endpoint paths
  linkToGroup: (taskId, groupId) => api.post(`/tasks/${taskId}/link-group/${groupId}`),
  unlinkFromGroup: (taskId) => api.delete(`/tasks/${taskId}/unlink-group`),
  getGroupTasks: (groupId) => api.get(`/tasks/group/${groupId}`),
};

export const eventAPI = {
  getEvents: (userId) => api.get(`/events/user/${userId}`),
  createEvent: (event) => api.post('/events', event),
  updateEvent: (id, event) => api.put(`/events/${id}`, event),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  linkToGroup: (eventId, groupId) => api.post(`/events/${eventId}/link-to-group/${groupId}`),
  unlinkFromGroup: (eventId) => api.delete(`/events/${eventId}/unlink-from-group`),
  getGroupEvents: (groupId) => api.get(`/events/group/${groupId}`),
  cancelInstance: (eventId, date) => 
    api.post(`/events/${eventId}/cancel-instance`, { date }),
  uncancelInstance: (eventId, date) => 
    api.delete(`/events/${eventId}/cancel-instance`, { data: { date } }),
  deleteInstance: (eventId, date) =>
    api.post(`/events/${eventId}/delete-instance`, { date }),
  getExceptions: (parentId) => api.get(`/events/${parentId}/exceptions`),
  cancelEvent: (eventId) => 
    api.post(`/events/${eventId}/cancel`),
  uncancelEvent: (eventId) => 
    api.delete(`/events/${eventId}/cancel`),
};

export const groupAPI = {
  getGroups: (userId) => api.get(`/groups/user/${userId}`),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (group) => api.post('/groups', group),
  updateGroup: (id, group) => api.put(`/groups/${id}`, group),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  addMember: (groupId, member) => api.post(`/groups/${groupId}/members`, member),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  leaveGroup: (groupId, userId) => api.post(`/groups/${groupId}/leave`, { userId }), // ✅ NEW
  changeMemberRole: (groupId, userId, role) => 
    api.put(`/groups/${groupId}/members/${userId}/role`, { role }),
};

export const invitationAPI = {
  sendInvitation: (data) => api.post('/invitations/send', data),
  getReceivedInvitations: (userId) => api.get(`/invitations/received/${userId}`),
  getSentInvitations: (userId) => api.get(`/invitations/sent/${userId}`),
  acceptInvitation: (id) => api.post(`/invitations/${id}/accept`),
  rejectInvitation: (id) => api.post(`/invitations/${id}/reject`),
  cancelInvitation: (id) => api.delete(`/invitations/${id}`),
};

export const discussionAPI = {
  getDiscussions: (groupId) => api.get(`/discussions/group/${groupId}`),
  createDiscussion: (data) => api.post('/discussions', data),
  updateDiscussion: (id, data) => api.put(`/discussions/${id}`, data),
  deleteDiscussion: (id) => api.delete(`/discussions/${id}`),
  togglePin: (id) => api.post(`/discussions/${id}/pin`),
  toggleLock: (id) => api.post(`/discussions/${id}/lock`),
  getMessages: (discussionId) => api.get(`/discussions/${discussionId}/messages`),
  createMessage: (data) => api.post('/discussions/messages', data),
  
  // ✅ NEW: Message read status endpoints
  markDiscussionAsRead: (discussionId, userId) => 
    api.post(`/discussions/${discussionId}/mark-read`, { userId }),
  getUnreadCount: (discussionId, userId) => 
    api.get(`/discussions/${discussionId}/unread-count`, { params: { userId } }),
  getGroupUnreadCounts: (groupId, userId) => 
    api.get(`/discussions/group/${groupId}/unread-counts`, { params: { userId } }),
};

export default api;