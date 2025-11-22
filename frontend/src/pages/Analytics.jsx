import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/api';
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    try {
      const response = await taskAPI.getTasks(user.id);
      const taskData = response.data;
      setTasks(taskData);
      calculateStats(taskData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const calculateStats = (taskData) => {
    const total = taskData.length;
    const completed = taskData.filter(t => t.status === 'Completed').length;
    const pending = taskData.filter(t => t.status === 'Pending').length;
    const inProgress = taskData.filter(t => t.status === 'In Progress').length;
    
    const overdue = taskData.filter(t => 
      new Date(t.dueDate) < new Date() && t.status !== 'Completed'
    ).length;

    const subjectBreakdown = taskData.reduce((acc, task) => {
      if (task.subject) {
        acc[task.subject] = (acc[task.subject] || 0) + 1;
      }
      return acc;
    }, {});

    const priorityBreakdown = taskData.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      subjectBreakdown,
      priorityBreakdown
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Progress & Analytics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.inProgress || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdue || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Completion Rate</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${stats.completionRate || 0}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-bold text-gray-800">
            {stats.completionRate || 0}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Tasks by Subject</h3>
          <div className="space-y-3">
            {Object.entries(stats.subjectBreakdown || {}).map(([subject, count]) => (
              <div key={subject} className="flex items-center justify-between">
                <span className="text-gray-700">{subject}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(stats.subjectBreakdown || {}).length === 0 && (
              <p className="text-gray-500 text-center py-4">No subject data available</p>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
          <div className="space-y-3">
            {Object.entries(stats.priorityBreakdown || {}).map(([priority, count]) => {
              const colors = {
                Low: 'bg-blue-100 text-blue-800',
                Medium: 'bg-yellow-100 text-yellow-800',
                High: 'bg-orange-100 text-orange-800',
                Urgent: 'bg-red-100 text-red-800'
              };
              return (
                <div key={priority} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm ${colors[priority]}`}>
                    {priority}
                  </span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;