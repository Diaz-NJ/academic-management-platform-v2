// frontend/src/pages/Tasks.jsx - COMPLETE REPLACEMENT

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/api';
import { Plus, Trash2, Edit, Filter, CheckSquare, Square, LayoutGrid, List, Clock } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatRelativeDate } from '../utils/dateUtils';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../utils/colorUtils';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk Actions State
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkStatusChange, setBulkStatusChange] = useState('');

  // ✅ NEW: View Mode State
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('tasksPageView');
    if (savedView) {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference
  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('tasksPageView', mode);
    showToast(`Switched to ${mode} view`, 'success');
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filterStatus, filterPriority, filterSubject, searchQuery]);

  const loadTasks = async () => {
    try {
      const response = await taskAPI.getTasks(user.id);
      setTasks(response.data);
      setSelectedTasks([]);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }
    if (filterSubject !== 'all') {
      filtered = filtered.filter(t => t.subject === filterSubject);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.subject?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedTasks.map(id => taskAPI.deleteTask(id)));
      showToast(`${selectedTasks.length} task(s) deleted successfully`, 'success');
      setSelectedTasks([]);
      setShowBulkDeleteDialog(false);
      loadTasks();
    } catch (error) {
      console.error('Error deleting tasks:', error);
      showToast('Failed to delete some tasks', 'error');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      const tasksToUpdate = tasks.filter(t => selectedTasks.includes(t.id));
      await Promise.all(
        tasksToUpdate.map(task => 
          taskAPI.updateTask(task.id, { ...task, status: newStatus })
        )
      );
      showToast(`${selectedTasks.length} task(s) updated to ${newStatus}`, 'success');
      setSelectedTasks([]);
      setBulkStatusChange('');
      loadTasks();
    } catch (error) {
      console.error('Error updating tasks:', error);
      showToast('Failed to update some tasks', 'error');
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      await taskAPI.deleteTask(taskToDelete.id);
      showToast('Task deleted successfully', 'success');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    } finally {
      setShowDeleteDialog(false);
      setTaskToDelete(null);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await taskAPI.updateTask(taskId, { ...task, status: newStatus });
      showToast(`Task marked as ${newStatus}`, 'success');
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task status', 'error');
    }
  };

  const uniqueSubjects = [...new Set(tasks.map(t => t.subject).filter(Boolean))];

  if (loading) {
    return <LoadingSpinner message="Loading your tasks..." />;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-page-title mb-2">All Tasks</h1>
            <p className="text-body text-gray-600">
              Manage and organize all your academic tasks
            </p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="btn-hover flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="btn-text">New Task</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-3 md:p-4">
        <label className="text-label mb-2 block">
          Search Tasks
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title, subject, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-body"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-caption mt-2">
            Found <span className="font-semibold">{filteredTasks.length}</span> task{filteredTasks.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"
          </p>
        )}
      </div>

      {/* Filters and View Toggle Row */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-label flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span>Filter Tasks</span>
          </label>
          
          {/* ✅ View Toggle */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewChange('list')}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition ${
                viewMode === 'list'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => handleViewChange('grid')}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition ${
                viewMode === 'grid'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-body-sm font-medium"
          >
            <option value="all">All Status</option>
            <option value="Pending">⏳ Pending</option>
            <option value="In Progress">🚀 In Progress</option>
            <option value="Completed">✅ Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-body-sm font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="Low">📋 Low</option>
            <option value="Medium">📌 Medium</option>
            <option value="High">⚠️ High</option>
            <option value="Urgent">🔥 Urgent</option>
          </select>

          {uniqueSubjects.length > 0 && (
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-body-sm font-medium"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>📚 {subject}</option>
              ))}
            </select>
          )}

          {(filterStatus !== 'all' || filterPriority !== 'all' || filterSubject !== 'all') && (
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterPriority('all');
                setFilterSubject('all');
              }}
              className="text-caption font-medium text-primary hover:text-blue-700 transition underline"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-blue-900">
                {selectedTasks.length} task(s) selected
              </span>
              <button
                onClick={() => setSelectedTasks([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={bulkStatusChange}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    handleBulkStatusChange(value);
                  }
                }}
                className="px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm"
              >
                <option value="">Change Status...</option>
                <option value="Pending">→ Pending</option>
                <option value="In Progress">→ In Progress</option>
                <option value="Completed">→ Completed</option>
              </select>

              <button
                onClick={() => setShowBulkDeleteDialog(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== GRID VIEW ===== */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-lg shadow">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title={searchQuery ? "No Tasks Found" : "No Tasks Yet"}
              message={
                searchQuery 
                  ? `No tasks match "${searchQuery}". Try a different search term or clear filters.`
                  : "Create your first task to get started!"
              }
              actionLabel={searchQuery ? undefined : "Create Your First Task"}
              onAction={searchQuery ? undefined : () => setShowTaskModal(true)}
            />
          ) : (
            <>
              {/* Select All */}
              {filteredTasks.length > 0 && (
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary"
                  >
                    {selectedTasks.length === filteredTasks.length ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      {selectedTasks.length === filteredTasks.length 
                        ? 'Deselect All' 
                        : 'Select All'}
                    </span>
                  </button>
                </div>
              )}

              {/* Grid Layout */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTasks.map((task) => {
                  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;

                  return (
                    <div
                      key={task.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                    >
                      {/* Checkbox */}
                      <div className="flex items-start justify-between mb-3">
                        <button
                          onClick={() => toggleTaskSelection(task.id)}
                          className="flex-shrink-0"
                        >
                          {selectedTasks.includes(task.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 hover:text-primary" />
                          )}
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                        {task.title}
                      </h3>

                      {/* Description */}
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                          {task.description}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="space-y-2 mb-3">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full font-semibold border-2 text-sm ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}>
                          <span>{priorityConfig.icon}</span>
                          <span>{task.priority}</span>
                        </span>

                        <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full font-semibold border-2 text-sm ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                          <span>{statusConfig.icon}</span>
                          <span>{task.status}</span>
                        </span>
                      </div>

                      {/* Subject & Due Date */}
                      <div className="space-y-2 mb-3">
                        {task.subject && (
                          <div className="flex items-center space-x-1 text-sm bg-indigo-50 px-2 py-1 rounded">
                            <span>📚</span>
                            <span className="font-medium text-indigo-800">{task.subject}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatRelativeDate(task.dueDate)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-3 border-t">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          className="flex-1 p-2 text-primary hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="flex-1 p-2 text-red-500 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title={searchQuery ? "No Tasks Found" : "No Tasks Yet"}
                message={
                  searchQuery 
                    ? `No tasks match "${searchQuery}". Try a different search term or clear filters.`
                    : "Create your first task to get started!"
                }
                actionLabel={searchQuery ? undefined : "Create Your First Task"}
                onAction={searchQuery ? undefined : () => setShowTaskModal(true)}
              />
            ) : (
              <>
                {/* Select All Header */}
                {filteredTasks.length > 0 && (
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary"
                    >
                      {selectedTasks.length === filteredTasks.length ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {selectedTasks.length === filteredTasks.length 
                          ? 'Deselect All' 
                          : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Task items */}
                {filteredTasks.map((task, index) => {
                  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4 ${
                        isEven ? 'bg-gray-50' : 'bg-white'
                      } hover:bg-blue-50`}
                      style={{ borderLeftColor: priorityConfig.borderColor.replace('border-', '') }}
                    >
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={() => toggleTaskSelection(task.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          {selectedTasks.includes(task.id) ? (
                            <CheckSquare className="w-6 h-6 text-primary" />
                          ) : (
                            <Square className="w-6 h-6 text-gray-400 hover:text-primary" />
                          )}
                        </button>

                        <div className="flex-1">
                          <h3 className="text-card-title mb-2">
                            {task.title}
                          </h3>
                          
                          <div className="flex items-center space-x-2 mb-3 flex-wrap gap-2">
                            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full font-medium border transition-all duration-200 hover:scale-105 ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}>
                              <span className="text-sm">{priorityConfig.icon}</span>
                              <span className="text-xs font-semibold">{task.priority}</span>
                            </span>
                            
                            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full font-medium border transition-all duration-200 hover:scale-105 ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                              <span className="text-sm">{statusConfig.icon}</span>
                              <span className="text-xs font-semibold">{task.status}</span>
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-body mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-body-sm text-gray-600">
                            {task.subject && (
                              <span className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-lg">
                                <span>📚</span>
                                <span className="font-medium">{task.subject}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>{formatRelativeDate(task.dueDate)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          {task.status !== 'Completed' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'Completed')}
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-300 hover:bg-emerald-200 text-sm transition font-medium inline-flex items-center space-x-1"
                            >
                              <span>✅</span>
                              <span>Complete</span>
                            </button>
                          )}
                          {task.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'In Progress')}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg border border-blue-300 hover:bg-blue-200 text-sm transition font-medium inline-flex items-center space-x-1"
                            >
                              <span>🚀</span>
                              <span>Start</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                            className="p-2 text-primary hover:bg-blue-50 rounded transition"
                            title="Edit task"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Single Task Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Tasks"
        message={`Are you sure you want to delete ${selectedTasks.length} task(s)? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={loadTasks}
          userId={user.id}
          task={editingTask}
        />
      )}
    </div>
  );
};

export default Tasks;