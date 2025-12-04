
// frontend/src/components/GroupTaskView.jsx - COMPLETE REPLACEMENT

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { taskAPI } from '../services/api';
import { formatRelativeDate } from '../utils/dateUtils';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../utils/colorUtils';
import { useAuth } from '../context/AuthContext';

const GroupTasksView = ({ group, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
    const isMember = group.members?.some(m => m.userId === user.id);

      if (!isMember) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Access Denied</h3>
          <p className="text-gray-600 mb-6">
            You are not a member of this group and cannot view its tasks.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadGroupTasks();
  }, [group.id]);

  const loadGroupTasks = async () => {
  try {
    console.log('🔍 Loading tasks for group:', group.id);
    const response = await taskAPI.getGroupTasks(group.id);
    console.log('📦 Tasks loaded:', response.data.length, 'tasks');
    console.log('📋 Task details:', response.data);
    
    // ✅ Filter to only show tasks that are actually linked to this group
    const linkedTasks = response.data.filter(task => {
      const isLinked = task.groupId === group.id;
      if (!isLinked) {
        console.log('⚠️ Task not linked to group:', task.title, 'groupId:', task.groupId);
      }
      return isLinked;
    });
    
    console.log('✅ Filtered tasks:', linkedTasks.length, 'tasks linked to this group');
    setTasks(linkedTasks);
  } catch (error) {
    console.error('❌ Error loading group tasks:', error);
  } finally {
    setLoading(false);
  }
};

  const getStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    
    return { total, completed, inProgress, pending };
  };

  const stats = getStatistics();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {group.groupName} - Tasks
              </h2>
              <p className="text-sm text-gray-600">{group.subject}</p>
              {group.members && (
                <p className="text-xs text-gray-500 mt-1">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Tasks</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-700">{stats.pending}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-600">In Progress</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Tasks Assigned
              </h3>
              <p className="text-gray-600">
                Link tasks to this group from the Tasks tab to see them here.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: When creating or editing a task, select this group from the dropdown.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;

                return (
                  <div
                    key={task.id}
                    className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 flex-1">
                        {task.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}>
                          <span>{priorityConfig.icon}</span>
                          <span>{task.priority}</span>
                        </span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                          <span>{statusConfig.icon}</span>
                          <span>{task.status}</span>
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        {task.subject && (
                          <span className="flex items-center space-x-1">
                            <span>📚</span>
                            <span>{task.subject}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatRelativeDate(task.dueDate)}</span>
                        </span>
                      </div>
                      {task.showOnCalendar && (
                        <span className="flex items-center space-x-1 text-blue-600">
                          <CalendarIcon className="w-3 h-3" />
                          <span className="text-xs">On Calendar</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupTasksView;