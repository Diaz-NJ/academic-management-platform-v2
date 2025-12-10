// frontend/src/pages/Tasks.jsx - COMPLETE REPLACEMENT

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, eventAPI } from '../services/api';
import { Plus, Trash2, Edit, Filter, CheckSquare, Square, LayoutGrid, List, Clock, Calendar, Users } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatRelativeDate } from '../utils/dateUtils';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../utils/colorUtils';
import TaskIntegrationModal from '../components/TaskIntegrationModal';
import { Link } from 'lucide-react';
import { getTaskUrgency, formatTimeRemaining } from '../utils/deadlineUtils';

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
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedTaskForIntegration, setSelectedTaskForIntegration] = useState(null);

  const handleOpenIntegration = (task) => {
    setSelectedTaskForIntegration(task);
    setShowIntegrationModal(true);
  };

  // ✅ NEW: Helper to notify other components about task changes
  const notifyTasksUpdated = () => {
    window.dispatchEvent(new Event('tasksUpdated'));
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // ✅ loadTasks intentionally excluded

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filterStatus, filterPriority, filterSubject, searchQuery]); // ✅ applyFilters intentionally excluded

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
      
      // ✅ FIXED: Immediately update state
      const updatedTasks = tasks.filter(t => !selectedTasks.includes(t.id));
      setTasks(updatedTasks);
      
      // ✅ Force recalculation
      applyFilters();
      
      // ✅ NEW: Notify dashboard to refresh
      notifyTasksUpdated();
      
      setSelectedTasks([]);
      setShowBulkDeleteDialog(false);
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
      
      // ✅ FIXED: Immediately update state
      const updatedTasks = tasks.filter(t => t.id !== taskToDelete.id);
      setTasks(updatedTasks);
      
      // ✅ Force recalculation
      applyFilters();
      
      // ✅ NEW: Notify dashboard to refresh
      notifyTasksUpdated();
      
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
      
      // ✅ SAFETY NET: If completing task with linked event, delete event first
      if (newStatus === 'Completed' && task.eventId) {
        console.log('🎯 Completing task with linked event:', task.eventId);
        
        try {
          await eventAPI.deleteEvent(task.eventId);
          console.log('✅ Frontend: Event deleted successfully');
        } catch (eventError) {
          console.error('⚠️ Frontend: Failed to delete event:', eventError);
          // Continue anyway - backend should handle it
        }
      }
      
      await taskAPI.updateTask(taskId, { ...task, status: newStatus });
      showToast(`Task moved to ${newStatus}`, 'success');
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
    <div className="max-w-7xl mx-auto space-y-2 md:space-y-4 px-2 sm:px-6 lg:px-8">
      {/* Page Header - Mobile Optimized */}
      <div className="mb-3 md:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 leading-tight">All Tasks</h1>
            <p className="text-xs md:text-base text-gray-600 leading-tight">
              Manage and organize all your academic tasks
            </p>
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="btn-hover flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-lg font-medium shadow-sm text-sm md:text-base whitespace-nowrap self-end sm:self-auto"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Search Bar - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow p-2 md:p-4">
        <label className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2 block">
          Search Tasks
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 md:pl-10 pr-8 md:pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
          />
          <svg
            className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400"
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
              className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-[10px] md:text-xs text-gray-600 mt-1 md:mt-2">
            Found <span className="font-semibold">{filteredTasks.length}</span> task{filteredTasks.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"
          </p>
        )}
      </div>

      {/* Filters and View Toggle Row - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow p-2 md:p-4">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <label className="text-xs md:text-sm font-medium text-gray-700 flex items-center space-x-1 md:space-x-2">
            <Filter className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
            <span>Filters</span>
          </label>
          
          {/* ✅ View Toggle - Mobile Optimized */}
          <div className="inline-flex bg-gray-100 rounded-lg p-0.5 md:p-1">
            <button
              onClick={() => handleViewChange('list')}
              className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg flex items-center space-x-1 md:space-x-2 transition ${
                viewMode === 'list'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm font-medium hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => handleViewChange('grid')}
              className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg flex items-center space-x-1 md:space-x-2 transition ${
                viewMode === 'grid'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm font-medium hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-xs md:text-sm font-medium"
          >
            <option value="all">All Status</option>
            <option value="Pending">⏳ Pending</option>
            <option value="In Progress">🚀 In Progress</option>
            <option value="Completed">✅ Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-2 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-xs md:text-sm font-medium"
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
              className="w-full px-2 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-xs md:text-sm font-medium"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>📚 {subject}</option>
              ))}
            </select>
          )}
        </div>

        {(filterStatus !== 'all' || filterPriority !== 'all' || filterSubject !== 'all') && (
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterPriority('all');
              setFilterSubject('all');
            }}
            className="text-[10px] md:text-xs font-medium text-primary hover:text-blue-700 transition underline mt-1 md:mt-2"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Bulk Actions Bar - Mobile Optimized */}
      {selectedTasks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="font-semibold text-blue-900 text-xs md:text-base">
                {selectedTasks.length} task(s) selected
              </span>
              <button
                onClick={() => setSelectedTasks([])}
                className="text-[10px] md:text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-2 w-full sm:w-auto">
              <select
                value={bulkStatusChange}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    handleBulkStatusChange(value);
                  }
                }}
                className="flex-1 sm:flex-none px-2 md:px-3 py-1.5 md:py-2 border border-blue-300 rounded-lg bg-white text-xs md:text-sm"
              >
                <option value="">Change Status...</option>
                <option value="Pending">→ Pending</option>
                <option value="In Progress">→ In Progress</option>
                <option value="Completed">→ Completed</option>
              </select>

              <button
                onClick={() => setShowBulkDeleteDialog(true)}
                className="flex items-center space-x-1 px-2 md:px-4 py-1.5 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs md:text-sm whitespace-nowrap"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Delete</span>
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

              {/* Grid Layout - Mobile Optimized */}
              <div className="p-2 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                {filteredTasks.map((task) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.Pending;

  // ✅ NEW: Add urgency detection
  const urgency = getTaskUrgency(task.dueDate);
  const isUrgent = urgency.level === 'overdue' || urgency.level === 'critical' || urgency.level === 'urgent';
  const isCompleted = task.status === 'Completed';

  return (
    <div 
      key={task.id}
      className={`
        bg-white border-2 border-gray-200 rounded-lg p-2 md:p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-200
        ${isUrgent && !isCompleted ? 'ring-2 ring-red-500 ring-opacity-50 border-red-300' : ''}
      `}
    >
      {/* ✅ NEW: Urgency banner for grid cards */}
      {isUrgent && !isCompleted && (
        <div className={`
          -mx-2 md:-mx-4 -mt-2 md:-mt-4 mb-2 px-2 md:px-3 py-1 flex items-center justify-between text-[10px] md:text-xs font-semibold
          ${urgency.bgColor} ${urgency.textColor} border-b ${urgency.borderColor}
        `}>
          <span className="flex items-center space-x-0.5">
            <span>{urgency.icon}</span>
            <span>{urgency.label}</span>
          </span>
          <span className="text-[9px] md:text-[10px] opacity-75 truncate max-w-[80px]">
            {formatTimeRemaining(urgency.hoursRemaining)}
          </span>
        </div>
      )}
                      {/* Checkbox */}
                      <div className="flex items-start justify-between mb-2">
                        <button onClick={() => toggleTaskSelection(task.id)}>
                          {selectedTasks.includes(task.id) ? (
                            <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-primary" />
                          )}
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-1 md:mb-2 line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem] leading-tight">
                        {task.title}
                      </h3>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]">
                          {task.description}
                        </p>
                      )}

                      {/* ✅ Badges */}
                      <div className="space-y-1 md:space-y-2 mb-2 md:mb-3">
                        <span className={`inline-flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full font-semibold border-2 text-[10px] md:text-sm ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}>
                          <span>{priorityConfig.icon}</span>
                          <span>{task.priority}</span>
                        </span>

                        <span className={`inline-flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full font-semibold border-2 text-[10px] md:text-sm ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                          <span>{statusConfig.icon}</span>
                          <span>{task.status}</span>
                        </span>
                        
                        {/* Calendar badge */}
                        {task.showOnCalendar && (
                          <span className="inline-flex items-center space-x-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] md:text-xs font-medium">
                            <Calendar className="w-2 h-2 md:w-3 md:h-3" />
                            <span>Calendar</span>
                          </span>
                        )}
                        
                        {/* Group badge */}
                        {task.groupId && (
                          <span className="inline-flex items-center space-x-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[10px] md:text-xs font-medium">
                            <Users className="w-2 h-2 md:w-3 md:h-3" />
                            <span>Group</span>
                          </span>
                        )}
                      </div>

                      {/* Subject & Due Date */}
                      <div className="space-y-1 md:space-y-2 mb-2 md:mb-3">
                        {task.subject && (
                          <div className="flex items-center space-x-1 text-[10px] md:text-sm bg-indigo-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                            <span>📚</span>
                            <span className="font-medium text-indigo-800 truncate">{task.subject}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-[10px] md:text-sm text-gray-600">
                          <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{formatRelativeDate(task.dueDate)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-1 md:space-x-2 pt-2 md:pt-3 border-t">
                        <button
                          onClick={() => handleOpenIntegration(task)}
                          className="flex-1 p-1.5 md:p-2 text-purple-500 hover:bg-purple-50 rounded transition"
                          title="Link to calendar or group"
                        >
                          <Link className="w-3 h-3 md:w-4 md:h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          className="flex-1 p-1.5 md:p-2 text-primary hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3 md:w-4 md:h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="flex-1 p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4 mx-auto" />
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
                {/* Select All Header - Mobile Optimized */}
                  {filteredTasks.length > 0 && (
                    <div className="p-2 md:p-4 bg-gray-50 border-b border-gray-200">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-700 hover:text-primary"
                      >
                        {selectedTasks.length === filteredTasks.length ? (
                          <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 md:w-5 md:h-5" />
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
                  
                  // ✅ NEW: Add urgency detection
                  const urgency = getTaskUrgency(task.dueDate);
                  const isUrgent = urgency.level === 'overdue' || urgency.level === 'critical' || urgency.level === 'urgent';
                  const isCompleted = task.status === 'Completed';
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`
                        p-3 md:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4 
                        ${isEven ? 'bg-gray-50' : 'bg-white'} 
                        hover:bg-blue-50
                        ${isUrgent && !isCompleted ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                      `}
                      style={{ 
                        borderLeftColor: isUrgent && !isCompleted 
                          ? urgency.color === 'red' ? '#ef4444' : '#f97316'
                          : priorityConfig.borderColor.replace('border-', '') 
                      }}
                    >
                      {/* ✅ NEW: Add urgency banner AFTER opening div but BEFORE existing content */}
                      {isUrgent && !isCompleted && (
                        <div className={`
                          -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-3 md:mb-4 px-3 md:px-6 py-2 flex items-center justify-between text-xs md:text-sm font-semibold
                          ${urgency.bgColor} ${urgency.textColor} border-b ${urgency.borderColor}
                        `}>
                          <span className="flex items-center space-x-1">
                            <span className="text-base md:text-lg">{urgency.icon}</span>
                            <span>{urgency.label}</span>
                          </span>
                          <span className="text-[10px] md:text-xs opacity-75">
                            {formatTimeRemaining(urgency.hoursRemaining)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start space-x-2 md:space-x-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskSelection(task.id)}
                          className="mt-0.5 md:mt-1 flex-shrink-0"
                        >
                          {selectedTasks.includes(task.id) ? (
                            <CheckSquare className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 md:w-6 md:h-6 text-gray-400 hover:text-primary" />
                          )}
                        </button>

                        {/* Main content area */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-1 md:mb-2 leading-tight">
                            {task.title}
                          </h3>
                          
                          {/* Badges - Mobile: Stack vertically, Desktop: Horizontal */}
                          <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-2 md:mb-3">
                            <span className={`inline-flex items-center space-x-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium border text-[10px] md:text-xs ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}>
                              <span className="text-xs md:text-sm">{priorityConfig.icon}</span>
                              <span className="font-semibold">{task.priority}</span>
                            </span>
                            
                            <span className={`inline-flex items-center space-x-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium border text-[10px] md:text-xs ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                              <span className="text-xs md:text-sm">{statusConfig.icon}</span>
                              <span className="font-semibold">{task.status}</span>
                            </span>

                            {/* Calendar badge */}
                            {task.showOnCalendar && (
                              <span 
                                className="inline-flex items-center space-x-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] md:text-xs font-medium"
                                title="This task appears on your calendar"
                              >
                                <Calendar className="w-2 h-2 md:w-3 md:h-3" />
                                <span className="hidden sm:inline">On Calendar</span>
                                <span className="sm:hidden">📅</span>
                              </span>
                            )}
                            
                            {/* Group badge */}
                            {task.groupId && (
                              <span 
                                className="inline-flex items-center space-x-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[10px] md:text-xs font-medium"
                                title="Linked to a group"
                              >
                                <Users className="w-2 h-2 md:w-3 md:h-3" />
                                <span className="hidden sm:inline">Group Task</span>
                                <span className="sm:hidden">👥</span>
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs md:text-base text-gray-600 mb-2 md:mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Group info if linked */}
                          {task.groupId && (
                            <div className="mb-2 md:mb-3">
                              <div className="flex items-center space-x-1 md:space-x-2 text-[10px] md:text-sm bg-purple-50 px-2 md:px-3 py-1 md:py-2 rounded-lg border border-purple-200">
                                <Users className="w-3 h-3 md:w-4 md:h-4 text-purple-600 flex-shrink-0" />
                                <span className="font-medium text-purple-900">
                                  Group Task
                                </span>
                                <span className="text-purple-700 hidden sm:inline">
                                  • View in Collaboration tab
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Subject & Due Date */}
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm text-gray-600">
                            {task.subject && (
                              <span className="flex items-center space-x-1 bg-gray-100 px-2 md:px-3 py-1 rounded-lg">
                                <span>📚</span>
                                <span className="font-medium truncate max-w-[120px] md:max-w-none">{task.subject}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              <span className="truncate">{formatRelativeDate(task.dueDate)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons - Mobile: Vertical Stack, Desktop: Horizontal */}
                        <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2 ml-2 md:ml-4">
                          {task.status !== 'Completed' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'Completed')}
                              className="px-2 md:px-3 py-1 md:py-1.5 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-300 hover:bg-emerald-200 text-[10px] md:text-sm transition font-medium inline-flex items-center space-x-0.5 md:space-x-1 whitespace-nowrap"
                            >
                              <span>✅</span>
                              <span className="hidden md:inline">Complete</span>
                            </button>
                          )}
                          {task.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'In Progress')}
                              className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-100 text-blue-700 rounded-lg border border-blue-300 hover:bg-blue-200 text-[10px] md:text-sm transition font-medium inline-flex items-center space-x-0.5 md:space-x-1 whitespace-nowrap"
                            >
                              <span>🚀</span>
                              <span className="hidden md:inline">Start</span>
                            </button>
                          )}
                          
                          {/* Link button */}
                          <button
                            onClick={() => handleOpenIntegration(task)}
                            className="p-1.5 md:p-2 text-purple-500 hover:bg-purple-50 rounded transition"
                            title="Link to calendar or group"
                          >
                            <Link className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                            className="p-1.5 md:p-2 text-primary hover:bg-blue-50 rounded transition"
                            title="Edit task"
                          >
                            <Edit className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className="p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
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

      {/* ✅ ADD THIS NEW INTEGRATION MODAL HERE, AFTER THE EXISTING MODALS: */}
      {showIntegrationModal && selectedTaskForIntegration && (
        <TaskIntegrationModal
          task={selectedTaskForIntegration}
          onClose={() => {
            setShowIntegrationModal(false);
            setSelectedTaskForIntegration(null);
          }}
          onUpdate={loadTasks}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default Tasks;