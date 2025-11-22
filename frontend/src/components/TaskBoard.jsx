import React from 'react';
import { taskAPI } from '../services/api';
import { Clock, AlertCircle } from 'lucide-react';

const TaskBoard = ({ tasks, onTasksChange }) => {
  const columns = [
    { id: 'Pending', title: 'Pending', color: 'border-blue-500' },
    { id: 'In Progress', title: 'In Progress', color: 'border-yellow-500' },
    { id: 'Completed', title: 'Completed', color: 'border-green-500' },
  ];

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await taskAPI.updateTask(taskId, { ...task, status: newStatus });
      onTasksChange();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="bg-gray-50 rounded-lg p-4">
          <h3 className={`font-semibold text-lg mb-4 pb-2 border-b-2 ${column.color}`}>
            {column.title}
          </h3>
          <div className="space-y-3">
            {tasks
              .filter((task) => task.status === column.id)
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-800 mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="flex items-center text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                  {task.subject && (
                    <div className="mt-2 text-xs text-gray-500">
                      📚 {task.subject}
                    </div>
                  )}
                  
                  {/* Status Change Buttons */}
                  <div className="mt-3 flex gap-2">
                    {column.id !== 'Pending' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'Pending')}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ← Pending
                      </button>
                    )}
                    {column.id !== 'In Progress' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'In Progress')}
                        className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        In Progress
                      </button>
                    )}
                    {column.id !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'Completed')}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Complete →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {tasks.filter((task) => task.status === column.id).length === 0 && (
              <p className="text-gray-400 text-center py-8 text-sm">
                No tasks in {column.title.toLowerCase()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;