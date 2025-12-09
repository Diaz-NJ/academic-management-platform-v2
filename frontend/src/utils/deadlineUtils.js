// frontend/src/utils/deadlineUtils.js

/**
 * Calculate urgency level for a task based on due date
 * @param {string} dueDate - ISO date string
 * @returns {object} - { level, hoursRemaining, label, color, icon }
 */
export const getTaskUrgency = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const hoursRemaining = (due - now) / (1000 * 60 * 60);
  
  if (hoursRemaining < 0) {
    return {
      level: 'overdue',
      hoursRemaining: Math.abs(hoursRemaining),
      label: 'Overdue',
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-500',
      icon: '🚨'
    };
  } else if (hoursRemaining <= 24) {
    return {
      level: 'critical',
      hoursRemaining,
      label: 'Due Today',
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-500',
      icon: '🔴'
    };
  } else if (hoursRemaining <= 48) {
    return {
      level: 'urgent',
      hoursRemaining,
      label: 'Due Tomorrow',
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-500',
      icon: '🟠'
    };
  } else if (hoursRemaining <= 168) { // 7 days
    return {
      level: 'soon',
      hoursRemaining,
      label: 'Due This Week',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-500',
      icon: '🟡'
    };
  }
  
  return {
    level: 'normal',
    hoursRemaining,
    label: 'On Track',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-500',
    icon: '📋'
  };
};

/**
 * Get count of tasks by urgency level
 * @param {array} tasks - Array of task objects
 * @returns {object} - Counts by urgency level
 */
export const getUrgencyCounts = (tasks) => {
  const counts = {
    overdue: 0,
    critical: 0,
    urgent: 0,
    soon: 0,
    total: 0
  };
  
  tasks.forEach(task => {
    // Only count incomplete tasks
    if (task.status === 'Completed') return;
    
    const urgency = getTaskUrgency(task.dueDate);
    if (urgency.level === 'overdue' || urgency.level === 'critical' || urgency.level === 'urgent') {
      counts[urgency.level]++;
      counts.total++;
    }
  });
  
  return counts;
};

/**
 * Filter tasks by urgency level
 * @param {array} tasks - Array of task objects
 * @param {string} level - Urgency level to filter
 * @returns {array} - Filtered tasks
 */
export const filterTasksByUrgency = (tasks, level) => {
  return tasks
    .filter(task => {
      if (task.status === 'Completed') return false;
      const urgency = getTaskUrgency(task.dueDate);
      return urgency.level === level;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
};

/**
 * Get all urgent tasks (overdue + critical + urgent)
 * @param {array} tasks - Array of task objects
 * @returns {array} - Urgent tasks sorted by due date
 */
export const getUrgentTasks = (tasks) => {
  return tasks
    .filter(task => {
      if (task.status === 'Completed') return false;
      const urgency = getTaskUrgency(task.dueDate);
      return urgency.level === 'overdue' || urgency.level === 'critical' || urgency.level === 'urgent';
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
};

/**
 * Format hours remaining into human-readable text
 * @param {number} hours - Hours remaining (negative = overdue)
 * @returns {string} - Formatted text
 */
export const formatTimeRemaining = (hours) => {
  // ✅ FIXED: Properly handle negative hours for overdue tasks
  const isOverdue = hours < 0;
  const absHours = Math.abs(hours);
  
  if (absHours < 1) {
    // Less than 1 hour
    const minutes = Math.floor(absHours * 60);
    if (isOverdue) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
    }
  } else if (absHours < 24) {
    // Less than 24 hours
    const displayHours = Math.floor(absHours);
    if (isOverdue) {
      return `${displayHours} hour${displayHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${displayHours} hour${displayHours !== 1 ? 's' : ''} left`;
    }
  } else {
    // 24+ hours
    const days = Math.floor(absHours / 24);
    if (isOverdue) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} left`;
    }
  }
};