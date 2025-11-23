import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/api';
import { Plus, Trash2, Edit, Filter } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { CheckSquare } from 'lucide-react';
import { formatRelativeDate } from '../utils/dateUtils';

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

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-blue-100 text-blue-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const uniqueSubjects = [...new Set(tasks.map(t => t.subject).filter(Boolean))];

  if (loading) {
    return <LoadingSpinner message="Loading your tasks..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">All Tasks</h2>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {uniqueSubjects.length > 0 && (
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
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
              className="text-sm text-gray-600 hover:text-primary"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
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
            filteredTasks.map(task => (
              <div key={task.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {task.subject && (
                        <span className="flex items-center">
                          📚 {task.subject}
                        </span>
                      )}
                      <span className="flex items-center">
                        📅 {formatRelativeDate(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {task.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'Completed')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm transition"
                      >
                        Mark Complete
                      </button>
                    )}
                    {task.status === 'Pending' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'In Progress')}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm transition"
                      >
                        Start
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
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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