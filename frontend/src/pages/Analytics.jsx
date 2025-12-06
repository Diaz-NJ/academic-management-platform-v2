import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/api';
import { TrendingUp, CheckCircle, AlertCircle, Target, Calendar, Zap } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Analytics = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Load once on mount only
useEffect(() => {
  let mounted = true;
  
  const loadTasksOnce = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasks(user.id);
      if (mounted) {
        const taskData = response.data;
        setTasks(taskData);
        const calculatedStats = calculateStats(taskData);
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };
  
  loadTasksOnce();
  
  return () => {
    mounted = false;
  };
}, [user.id]); // ✅ Added user.id // Empty array - load ONCE only

  // ✅ Memoized calculation - returns data instead of setting state
const calculateStats = (taskData) => {
  if (!taskData || taskData.length === 0) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      overdue: 0,
      thisWeek: 0,
      completionRate: 0,
      subjectBreakdown: {},
      priorityBreakdown: {}
    };
  }

  const total = taskData.length;
  const completed = taskData.filter(t => t.status === 'Completed').length;
  const inProgress = taskData.filter(t => t.status === 'In Progress').length;
  const pending = taskData.filter(t => t.status === 'Pending').length;
  
  const now = new Date();
  const overdue = taskData.filter(t => 
    new Date(t.dueDate) < now && t.status !== 'Completed'
  ).length;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const thisWeek = taskData.filter(t => {
    const taskDate = new Date(t.dueDate);
    return taskDate >= startOfWeek && taskDate <= endOfWeek;
  }).length;

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

  return {
    total,
    completed,
    pending,
    inProgress,
    overdue,
    thisWeek,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    subjectBreakdown,
    priorityBreakdown
  };
};

  if (loading) {
    return <LoadingSpinner message="Analyzing your progress..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-2 md:space-y-4 px-2 sm:px-6 lg:px-8">
      {/* Enhanced Page Header */}
      <div className="mb-3 md:mb-6">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 leading-tight">Progress & Analytics</h1>
        <p className="text-xs md:text-base text-gray-600 leading-tight">
          Track your academic performance and task completion
        </p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-3 md:mb-6">
        <div className="card-hover bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-[10px] md:text-sm font-medium text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide leading-tight">Total Tasks</p>
              <p className="text-2xl md:text-4xl font-bold text-gray-800 tabular-nums">{stats.total || 0}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1">All time</p>
            </div>
            <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-hover bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-[10px] md:text-sm font-medium text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide leading-tight">Completed</p>
              <p className="text-2xl md:text-4xl font-bold text-green-600 tabular-nums">{stats.completed || 0}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1">Finished</p>
            </div>
            <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card-hover bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-[10px] md:text-sm font-medium text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide leading-tight">This Week</p>
              <p className="text-2xl md:text-4xl font-bold text-blue-600 tabular-nums">{stats.thisWeek || 0}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1">Due soon</p>
            </div>
            <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-hover bg-white rounded-lg shadow p-3 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-[10px] md:text-sm font-medium text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide leading-tight">Overdue</p>
              <p className="text-2xl md:text-4xl font-bold text-red-600 tabular-nums">{stats.overdue || 0}</p>
              <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1">Need attention</p>
            </div>
            <div className="w-8 h-8 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-6">
      {/* 📊 Pie Chart - Task Status Distribution */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-3 md:p-6">
          <div className="mb-3 md:mb-6">
            <h2 className="text-base md:text-2xl lg:text-3xl font-bold text-gray-800 mb-0.5 md:mb-1 leading-tight">Task Status</h2>
            <p className="text-xs md:text-sm text-gray-600">Distribution overview</p>
          </div>
    
        {loading ? (
          <div className="flex items-center justify-center h-48 md:h-64">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary"></div>
          </div>
          ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center h-48 md:h-64 text-gray-400">
            <div className="text-center">
              <p className="text-xs md:text-sm">No tasks yet</p>
              <p className="text-[10px] md:text-xs mt-1">Create tasks to see distribution</p>
              </div>
            </div>
            ) : (
            <PieChart 
              data={[
                { label: 'Pending', value: stats.pending || 0, color: '#64748b' },
                { label: 'In Progress', value: stats.inProgress || 0, color: '#3b82f6' },
                { label: 'Completed', value: stats.completed || 0, color: '#10b981' }
              ]}
            />
          )}
        </div>

        {/* ⭕ Progress Ring - Completion Rate */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-3 md:p-6">
          <div className="mb-3 md:mb-6">
            <h2 className="text-base md:text-2xl lg:text-3xl font-bold text-gray-800 mb-0.5 md:mb-1 leading-tight">Completion Rate</h2>
            <p className="text-xs md:text-sm text-gray-600">Overall progress</p>
          </div>
          
          <ProgressRing percentage={stats.completionRate || 0} />
        </div>

        {/* 📈 Mini Stats */}
        <div className="lg:col-span-1 space-y-2 md:space-y-4">
          <div className="card-hover bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 md:p-6 text-white cursor-pointer">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <Target className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-2xl md:text-3xl font-bold tabular-nums">{stats.inProgress || 0}</span>
            </div>
            <p className="text-xs md:text-sm opacity-90 font-medium">Active Tasks</p>
            <p className="text-[10px] md:text-xs opacity-75 mt-0.5 md:mt-1">Currently in progress</p>
          </div>

          <div className="card-hover bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow p-4 md:p-6 text-white cursor-pointer">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <Zap className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-2xl md:text-3xl font-bold tabular-nums">{stats.pending || 0}</span>
            </div>
            <p className="text-xs md:text-sm opacity-90 font-medium">Pending Tasks</p>
            <p className="text-[10px] md:text-xs opacity-75 mt-0.5 md:mt-1">Ready to start</p>
          </div>
        </div>
      </div>

      {/* 📊 Bar Chart - Tasks by Subject */}
      <div className="bg-white rounded-lg shadow p-3 md:p-6 mb-3 md:mb-6">
        <div className="mb-3 md:mb-6">
          <h2 className="text-base md:text-2xl lg:text-3xl font-bold text-gray-800 mb-0.5 md:mb-1 leading-tight">Tasks by Subject</h2>
          <p className="text-xs md:text-sm text-gray-600">Workload distribution across subjects</p>
        </div>
          <BarChart data={stats.subjectBreakdown || {}} />
        </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {/* Tasks by Priority */}
      <div className="bg-white rounded-lg shadow p-3 md:p-6">
        <div className="mb-3 md:mb-6">
          <h2 className="text-base md:text-xl font-bold text-gray-800 mb-0.5 md:mb-1">Tasks by Priority</h2>
          <p className="text-xs md:text-sm text-gray-600">Priority distribution</p>
        </div>
        <div className="space-y-2 md:space-y-3">
            {Object.entries(stats.priorityBreakdown || {}).map(([priority, count]) => {
              const configs = {
                Low: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: '📋' },
                Medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '📌' },
                High: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: '⚠️' },
                Urgent: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '🔥' }
              };
              const config = configs[priority] || configs.Medium;
              
              return (
                <div key={priority} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <span className={`inline-flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
                    <span className="text-sm md:text-base">{config.icon}</span>
                    <span>{priority}</span>
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-gray-900 bg-white px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-gray-200">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Insights */}
        <div className="bg-white rounded-lg shadow p-3 md:p-6">
          <div className="mb-3 md:mb-6">
            <h2 className="text-base md:text-xl font-bold text-gray-800 mb-0.5 md:mb-1">Quick Insights</h2>
            <p className="text-xs md:text-sm text-gray-600">Performance summary</p>
          </div>
          <div className="space-y-2 md:space-y-4">
            <div className="p-3 md:p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="text-xs md:text-sm font-semibold text-green-800 mb-0.5 md:mb-1">
                ✅ {stats.completed || 0} tasks completed
              </p>
              <p className="text-[10px] md:text-xs text-green-600">
                Keep up the great work!
              </p>
            </div>
            
            {stats.overdue > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <p className="text-body-sm font-semibold text-red-800 mb-1">
                  ⚠️ {stats.overdue} overdue tasks
                </p>
                <p className="text-caption text-red-600">
                  Review and update these tasks
                </p>
              </div>
            )}
            
            {stats.thisWeek > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-body-sm font-semibold text-blue-800 mb-1">
                  📅 {stats.thisWeek} tasks due this week
                </p>
                <p className="text-caption text-blue-600">
                  Stay on track with your schedule
                </p>
              </div>
            )}

            {stats.completionRate >= 70 && (
              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <p className="text-body-sm font-semibold text-purple-800 mb-1">
                  🎉 {stats.completionRate}% completion rate
                </p>
                <p className="text-caption text-purple-600">
                  Excellent progress!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🥧 Pie Chart Component - COMPLETELY FIXED VERSION
const PieChart = ({ data }) => {
  // ✅ Filter out items with 0 values
  const filteredData = data.filter(item => item.value > 0);
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-body-sm">No data to display</p>
      </div>
    );
  }

  // ✅ SPECIAL CASE: If only one item with 100%, render as a full circle
  if (filteredData.length === 1) {
    const item = filteredData[0];
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64">
          {/* Full circle for 100% */}
          <circle 
            cx="100" 
            cy="100" 
            r="80" 
            fill={item.color}
            className="transition-all duration-300"
          />
          
          {/* Center circle for donut effect */}
          <circle cx="100" cy="100" r="50" fill="white" />
          <text x="100" y="100" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-gray-800">
            {total}
          </text>
          <text x="100" y="120" textAnchor="middle" className="text-xs fill-gray-500">
            Total
          </text>
        </svg>

        {/* Legend - Show ALL categories including zeros */}
        <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2 w-full">
          {data.map((dataItem, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{ backgroundColor: dataItem.color }} />
                <span className="text-xs md:text-sm text-gray-700">{dataItem.label}</span>
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-900">
                {dataItem.value} ({((dataItem.value / total) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ NORMAL CASE: Multiple slices
  let currentAngle = 0;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-64 h-64">
        {filteredData.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          
          // ✅ Prevent angle from being exactly 360 (causes rendering issues)
          const clampedAngle = Math.min(angle, 359.999);
          
          const startAngle = currentAngle;
          const endAngle = currentAngle + clampedAngle;
          currentAngle = endAngle;

          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (endAngle - 90) * (Math.PI / 180);

          const x1 = 100 + 80 * Math.cos(startRad);
          const y1 = 100 + 80 * Math.sin(startRad);
          const x2 = 100 + 80 * Math.cos(endRad);
          const y2 = 100 + 80 * Math.sin(endRad);

          const largeArc = clampedAngle > 180 ? 1 : 0;

          const pathData = [
            `M 100 100`,
            `L ${x1} ${y1}`,
            `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ');

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={item.color}
                className="transition-all duration-300 hover:opacity-80"
              />
            </g>
          );
        })}
        
        {/* Center circle for donut effect */}
        <circle cx="100" cy="100" r="50" fill="white" />
        <text x="100" y="100" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-gray-800">
          {total}
        </text>
        <text x="100" y="120" textAnchor="middle" className="text-xs fill-gray-500">
          Total
        </text>
      </svg>

      {/* Legend - Show ALL categories including zeros */}
      <div className="mt-3 md:mt-4 space-y-1.5 md:space-y-2 w-full">
        {data.map((dataItem, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{ backgroundColor: dataItem.color }} />
              <span className="text-xs md:text-sm text-gray-700">{dataItem.label}</span>
            </div>
            <span className="text-xs md:text-sm font-semibold text-gray-900">
              {dataItem.value} ({total > 0 ? ((dataItem.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ⭕ Progress Ring Component - RESIZED TO MATCH PIE CHART
const ProgressRing = ({ percentage }) => {
  // ✅ Match the pie chart dimensions (radius 80, donut hole 50)
  const radius = 80;
  const strokeWidth = 30; // 80 - 50 = 30 (outer radius - inner radius)
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  // ✅ Center point is now 100 to match pie chart viewBox
  const center = 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-48 h-48 md:w-64 md:h-64">
        <svg viewBox="0 0 200 200" className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl md:text-5xl font-bold text-gray-800">{percentage}%</span>
          <span className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">Complete</span>
        </div>
      </div>
      
      {/* Status message */}
      <div className="mt-3 md:mt-6 text-center">
        {percentage >= 80 && (
          <p className="text-sm md:text-base font-medium text-green-600">Excellent progress! 🎉</p>
        )}
        {percentage >= 50 && percentage < 80 && (
          <p className="text-sm md:text-base font-medium text-blue-600">Good progress! Keep going 💪</p>
        )}
        {percentage < 50 && percentage > 0 && (
          <p className="text-body font-medium text-amber-600">Getting started! 🚀</p>
        )}
        {percentage === 0 && (
          <p className="text-body font-medium text-gray-600">Create tasks to track progress</p>
        )}
      </div>
    </div>
  );
};

// 📊 Bar Chart Component
const BarChart = ({ data }) => {
  const entries = Object.entries(data);
  
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-body-sm">No subject data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...entries.map(([_, value]) => value));
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="space-y-4">
      {entries.map(([subject, count], index) => {
        const percentage = (count / maxValue) * 100;
        const color = colors[index % colors.length];
        
        return (
          <div key={subject}>
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="text-xs md:text-sm font-medium text-gray-700 truncate flex-1 mr-2">{subject}</span>
              <span className="text-xs md:text-sm font-semibold text-gray-900 flex-shrink-0">{count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 md:h-8 overflow-hidden">
              <div
                className="h-6 md:h-8 rounded-full transition-all duration-1000 ease-out flex items-center px-2 md:px-3"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: color,
                  minWidth: count > 0 ? '40px' : '0'
                }}
              >
                <span className="text-[10px] md:text-xs font-semibold text-white">
                  {count > 0 && `${count} tasks`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Analytics;