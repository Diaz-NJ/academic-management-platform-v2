// frontend/src/utils/colorUtils.js
// ✨ Centralized color and icon configuration

export const PRIORITY_CONFIG = {
  Urgent: {
    icon: '🔥',
    label: 'Urgent',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    hoverBg: 'hover:bg-red-200',
  },
  High: {
    icon: '⚠️',
    label: 'High',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    hoverBg: 'hover:bg-orange-200',
  },
  Medium: {
    icon: '📌',
    label: 'Medium',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    hoverBg: 'hover:bg-yellow-200',
  },
  Low: {
    icon: '📋',
    label: 'Low',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    hoverBg: 'hover:bg-blue-200',
  },
};

export const STATUS_CONFIG = {
  Pending: {
    icon: '⏳',
    label: 'Pending',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    hoverBg: 'hover:bg-slate-200',
  },
  'In Progress': {
    icon: '🚀',
    label: 'In Progress',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    hoverBg: 'hover:bg-blue-200',
  },
  Completed: {
    icon: '✅',
    label: 'Completed',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    hoverBg: 'hover:bg-emerald-200',
  },
};

export const EVENT_TYPE_CONFIG = {
  Class: {
    icon: '📚',
    label: 'Class',
    color: '#3b82f6', // blue-500
    lightBg: 'bg-blue-50',
    mediumBg: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-400',
  },
  Exam: {
    icon: '📝',
    label: 'Exam',
    color: '#ef4444', // red-500
    lightBg: 'bg-red-50',
    mediumBg: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-400',
  },
  Deadline: {
    icon: '⏰',
    label: 'Deadline',
    color: '#f59e0b', // amber-500
    lightBg: 'bg-amber-50',
    mediumBg: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-400',
  },
  Meeting: {
    icon: '👥',
    label: 'Meeting',
    color: '#10b981', // emerald-500
    lightBg: 'bg-emerald-50',
    mediumBg: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-400',
  },
  Other: {
    icon: '📌',
    label: 'Other',
    color: '#8b5cf6', // violet-500
    lightBg: 'bg-violet-50',
    mediumBg: 'bg-violet-100',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-400',
  },
};

// Helper function to get priority color classes
export const getPriorityColor = (priority) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
};

// Helper function to get status color classes
export const getStatusColor = (status) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
};

// Helper function to get event type color
export const getEventTypeColor = (eventType) => {
  const config = EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.Other;
  return config.color;
};