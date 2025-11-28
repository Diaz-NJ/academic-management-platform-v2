// frontend/src/components/TaskModal.jsx - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import { taskAPI, groupAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { X, Users, Calendar, Info } from 'lucide-react';

const TaskModal = ({ onClose, onSave, userId, task = null }) => {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  
  // ✅ Better datetime formatting
  const formatDateTimeLocal = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Pending',
    groupId: null, // ✅ NEW: Group linking
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [userId]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        subject: task.subject || '',
        dueDate: formatDateTimeLocal(new Date(task.dueDate)),
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        groupId: task.groupId || null, // ✅ NEW: Load existing group link
      });
    }
  }, [task]);

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getGroups(userId);
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value === '' ? null : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formatDateTimeForBackend = (datetimeLocal) => {
        return datetimeLocal.includes(':00', datetimeLocal.length - 3) 
          ? datetimeLocal 
          : datetimeLocal + ':00';
      };

      const taskData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        priority: formData.priority,
        status: formData.status,
        userId,
        dueDate: formatDateTimeForBackend(formData.dueDate),
        groupId: formData.groupId ? Number(formData.groupId) : null, // ✅ NEW: Include group
      };

      if (task) {
        await taskAPI.updateTask(task.id, taskData);
        showToast('✅ Task updated! Calendar automatically synced.', 'success');
      } else {
        await taskAPI.createTask(taskData);
        showToast('✅ Task created! Added to calendar automatically.', 'success');
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      showToast(
        task ? 'Failed to update task. Please try again.' : 'Failed to create task. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add details about this task"
            />
          </div>

          {/* Subject and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., System Analysis"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Low">📋 Low</option>
                <option value="Medium">📌 Medium</option>
                <option value="High">⚠️ High</option>
                <option value="Urgent">🔥 Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Pending">⏳ Pending</option>
                <option value="In Progress">🚀 In Progress</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>
          </div>

          {/* ✅ NEW: Group Linking Section */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Link to Group (Optional)</span>
            </label>
            
            {loadingGroups ? (
              <div className="text-sm text-gray-500">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  No groups available. Create a group first to link tasks.
                </p>
              </div>
            ) : (
              <select
                name="groupId"
                value={formData.groupId || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">No group (personal task)</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.groupName} - {group.subject}
                  </option>
                ))}
              </select>
            )}
            
            {formData.groupId && (
              <p className="text-xs text-blue-600 mt-1 flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>This task will be visible to your group members</span>
              </p>
            )}
          </div>

          {/* ✅ NEW: Calendar Auto-Sync Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  📅 Automatic Calendar Sync
                </h4>
                <p className="text-xs text-blue-800">
                  This task will automatically appear on your calendar as a deadline event.
                  You can manage it from the Calendar tab.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;