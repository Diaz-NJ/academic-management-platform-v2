// Update TaskBoard.jsx with enhanced colors
// Replace the getPriorityColor function and task card rendering

import React from 'react';
import { taskAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Clock } from 'lucide-react';
import { formatShortDate } from '../utils/dateUtils';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../utils/colorUtils';

const TaskBoard = ({ tasks, onTasksChange }) => {
  const { showToast } = useToast();
  
  const columns = [
    { 
      id: 'Pending', 
      title: 'Pending', 
      icon: STATUS_CONFIG.Pending.icon,
      color: 'border-slate-400',
      bgGradient: 'from-slate-500 to-slate-600'
    },
    { 
      id: 'In Progress', 
      title: 'In Progress', 
      icon: STATUS_CONFIG['In Progress'].icon,
      color: 'border-blue-400',
      bgGradient: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'Completed', 
      title: 'Completed', 
      icon: STATUS_CONFIG.Completed.icon,
      color: 'border-emerald-400',
      bgGradient: 'from-emerald-500 to-emerald-600'
    },
  ];

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await taskAPI.updateTask(taskId, { ...task, status: newStatus });
      showToast(`Task moved to ${newStatus}`, 'success');
      onTasksChange();
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task status', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
          {/* ✨ Enhanced Column Header */}
          <div className={`flex items-center space-x-2 font-semibold text-lg mb-4 pb-3 border-b-3 ${column.color}`}>
            <span className="text-2xl">{column.icon}</span>
            <h3 className={`bg-gradient-to-r ${column.bgGradient} bg-clip-text text-transparent`}>
              {column.title}
            </h3>
            <span className="ml-auto text-sm font-normal text-gray-500">
              {tasks.filter((task) => task.status === column.id).length}
            </span>
          </div>

          <div className="space-y-3">
            {tasks
              .filter((task) => task.status === column.id)
              .map((task) => {
                const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                
                return (
                  <div
                    key={task.id}
                    className="card-hover-subtle bg-white p-4 rounded-lg shadow-sm cursor-pointer border-l-4"
                    style={{ borderLeftColor: priorityConfig.borderColor.replace('border-', '') }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 flex-1 hover:text-primary transition-colors">
                        {task.title}
                      </h4>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs mb-3">
                      {/* ✨ Enhanced Priority Badge */}
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full font-medium border transition-all duration-200 hover:scale-105 ${priorityConfig.bgColor} ${priorityConfig.textColor} ${priorityConfig.borderColor}`}>
                        <span className="text-sm">{priorityConfig.icon}</span>
                        <span>{task.priority}</span>
                      </span>
                      
                      <span className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatShortDate(task.dueDate)}
                      </span>
                    </div>
                    
                    {task.subject && (
                      <div className="mb-3 text-xs text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded">
                        <span>📚</span>
                        <span>{task.subject}</span>
                      </div>
                    )}
                    
                    {/* ✨ Enhanced Status Change Buttons */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {column.id !== 'Pending' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'Pending')}
                          className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-all duration-200 hover:bg-slate-200 hover:scale-105 active:scale-95 font-medium"
                        >
                          ⏳ Pending
                        </button>
                      )}
                      {column.id !== 'In Progress' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'In Progress')}
                          className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg border border-blue-300 transition-all duration-200 hover:bg-blue-200 hover:scale-105 active:scale-95 font-medium"
                        >
                          🚀 In Progress
                        </button>
                      )}
                      {column.id !== 'Completed' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'Completed')}
                          className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-300 transition-all duration-200 hover:bg-emerald-200 hover:scale-105 active:scale-95 font-medium"
                        >
                          ✅ Complete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            {tasks.filter((task) => task.status === column.id).length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2 opacity-20">{column.icon}</div>
                <p className="text-gray-400 text-sm">
                  No tasks in {column.title.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;