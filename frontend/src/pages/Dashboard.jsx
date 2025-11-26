import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { taskAPI, eventAPI } from '../services/api';
import { 
  LogOut, 
  Plus, 
  Calendar as CalendarIcon, 
  Users, 
  BarChart3 
} from 'lucide-react';
import TaskBoard from '../components/TaskBoard';
import TaskModal from '../components/TaskModal';
import Tasks from './Tasks';
import Collaboration from './Collaboration';
import Analytics from './Analytics';
import Calendar from './Calendar';
import Settings from './Settings';
import WeeklyEvents from '../components/WeeklyEvents';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  useEffect(() => {
    loadTasks();
    loadEvents();
  }, [user]);

  useEffect(() => {
  if (activeTab === 'dashboard') {
    console.log('Dashboard tab active - refreshing data');
    loadTasks();
    loadEvents();
  }
}, [activeTab]);

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

  const loadEvents = async () => {
    try {
      const response = await eventAPI.getEvents(user.id);
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStats = () => {
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { pending, inProgress, completed, completionRate };
  };

  const stats = getStats();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading your dashboard..." />
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
     <nav className="bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold text-primary">AMP</h1>
        
        {/* ✨ ENHANCED Desktop Navigation */}
        <div className="hidden md:flex space-x-4">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              loadTasks();
              loadEvents();
            }}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'tasks'
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            Tasks
          </button>
          
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              activeTab === 'calendar'
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            <CalendarIcon className={`w-4 h-4 ${activeTab === 'calendar' ? '' : 'icon-hover-blue'}`} />
            <span>Calendar</span>
          </button>
          
          <button
            onClick={() => setActiveTab('collaboration')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              activeTab === 'collaboration'
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'collaboration' ? '' : 'icon-hover-blue'}`} />
            <span>Collaborate</span>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              activeTab === 'analytics'
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? '' : 'icon-hover-blue'}`} />
            <span>Analytics</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-primary text-white shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700 hidden sm:block">
          {user.name} ({user.section})
        </span>
        {/* ✨ ENHANCED Logout Button */}
        <button
          onClick={handleLogout}
          className="btn-hover flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
        >
          <LogOut className="w-4 h-4 interactive-scale" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>

    {/* Mobile Navigation Menu */}
    {mobileMenuOpen && (
      <div className="md:hidden pb-4 space-y-2">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'dashboard'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => {
            setActiveTab('tasks');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'tasks'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => {
            setActiveTab('calendar');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'calendar'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          Calendar
        </button>
        <button
          onClick={() => {
            setActiveTab('collaboration');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'collaboration'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Collaborate
        </button>
        <button
          onClick={() => {
            setActiveTab('analytics');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'analytics'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          Analytics
        </button>
        <button
          onClick={() => {
            setActiveTab('settings');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
            activeTab === 'settings'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          ⚙️ Settings
        </button>
      </div>
    )}
  </div>
</nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>

              {/* ✨ ENHANCED Stats Cards with Hover Effects */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card-hover bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg cursor-pointer">
                  <h3 className="text-sm font-medium opacity-90">Pending Tasks</h3>
                  <p className="text-3xl font-bold mt-2 animate-bounce-subtle">{stats.pending}</p>
                  <div className="mt-3 opacity-75 text-xs">Tasks waiting to start</div>
                </div>
                
                <div className="card-hover bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg cursor-pointer">
                  <h3 className="text-sm font-medium opacity-90">In Progress</h3>
                  <p className="text-3xl font-bold mt-2">{stats.inProgress}</p>
                  <div className="mt-3 opacity-75 text-xs">Currently working on</div>
                </div>
                
                <div className="card-hover bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg cursor-pointer">
                  <h3 className="text-sm font-medium opacity-90">Completed</h3>
                  <p className="text-3xl font-bold mt-2">{stats.completed}</p>
                  <div className="mt-3 opacity-75 text-xs">Successfully finished</div>
                </div>
                
                <div className="card-hover bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg cursor-pointer">
                  <h3 className="text-sm font-medium opacity-90">Completion Rate</h3>
                  <p className="text-3xl font-bold mt-2">{stats.completionRate}%</p>
                  <div className="mt-3 opacity-75 text-xs">Overall progress</div>
                </div>
              </div>

              {/* ✨ ENHANCED Events Card */}
              <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="card-hover bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg cursor-pointer">
                  <h3 className="text-sm font-medium opacity-90">This Week's Events</h3>
                  <p className="text-3xl font-bold mt-2">
                    {events.filter(e => {
                      const eventDate = new Date(e.startDateTime);
                      const now = new Date();
                      const startOfWeek = new Date(now);
                      startOfWeek.setDate(now.getDate() - now.getDay());
                      startOfWeek.setHours(0, 0, 0, 0);
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(startOfWeek.getDate() + 6);
                      endOfWeek.setHours(23, 59, 59, 999);
                      return eventDate >= startOfWeek && eventDate <= endOfWeek;
                    }).length} Events
                  </p>
                  <div className="mt-3 opacity-75 text-xs">Scheduled activities</div>
                </div>
              </div>

               {/*Weekly Events*/} 
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">This Week's Events</h2>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="text-sm text-primary hover:underline flex items-center"
                >
                  View Calendar
                  <CalendarIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              <WeeklyEvents events={events} />
            </div>

            {/* Task Board */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Task Board</h2>
                {/* ✨ ENHANCED Buttons */}
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setShowTaskModal(true);
                    }}
                    className="btn-hover flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg font-medium"
                  >
                    <Plus className="w-5 h-5 interactive-scale" />
                    <span>New Task</span>
                  </button>
              </div>
               <TaskBoard 
                  tasks={tasks} 
                  onTasksChange={loadTasks}
                />
                
            </div>
          </>
        )}

        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'collaboration' && <Collaboration />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
      </div>

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

export default Dashboard;