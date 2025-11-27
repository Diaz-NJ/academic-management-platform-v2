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
import { expandRecurringEvents } from '../utils/recurringUtils';

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
      const allEvents = response.data;
      
      console.log('=== DASHBOARD ORPHAN DETECTION ===');
      console.log('Total events from API:', allEvents.length);
      
      // ✅ LOG EACH EVENT
      allEvents.forEach((event, index) => {
        console.log(`Dashboard Event ${index + 1}:`, {
          id: event.id,
          title: event.title,
          isRecurring: event.isRecurring,
          isException: event.isException,
          isCanceled: event.isCanceled,
          parentEventId: event.parentEventId,
          startDateTime: event.startDateTime
        });
      });
      
      // Create a Set of ALL event IDs
      const allEventIds = new Set(allEvents.map(e => e.id));
      console.log('All valid event IDs:', Array.from(allEventIds));
      
      // Filter out events that reference a non-existent parent
      const filteredEvents = allEvents.filter(event => {
        // Check if this event has a parentEventId
        if (event.parentEventId) {
          const parentExists = allEventIds.has(event.parentEventId);
          
          if (!parentExists) {
            console.log('❌ DASHBOARD ORPHAN:', {
              eventId: event.id,
              title: event.title,
              parentEventId: event.parentEventId
            });
            return false; // Filter it out
          }
        }
        
        return true; // Keep events without parentEventId or with valid parent
      });
      
      console.log('Dashboard after filtering:', filteredEvents.length);
      console.log('Dashboard orphans removed:', allEvents.length - filteredEvents.length);
      
      // ✅ Expand recurring events for the current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const expandedEvents = expandRecurringEvents(filteredEvents, startOfWeek, endOfWeek);
      console.log('Expanded events for this week:', expandedEvents.length);
      
      // ✅ Filter out canceled events from display
      const visibleEvents = expandedEvents.filter(e => !e.isCanceled);
      console.log('Visible events (non-canceled):', visibleEvents.length);
      
      setEvents(visibleEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      console.log('Dashboard tab active - refreshing data');
      loadTasks();
      loadEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);



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
      {/* Navigation Bar - ENLARGED */}
      <nav className="bg-white shadow-md border-b-2 border-gray-100">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-6 md:space-x-10">
              {/* Logo - LARGER */}
              <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                AMP
              </h1>
              
              {/* Desktop Navigation - LARGER BUTTONS */}
              <div className="hidden md:flex space-x-2 lg:space-x-3">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    loadTasks();
                    loadEvents();
                  }}
                  className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-primary text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  Dashboard
                </button>
                
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 ${
                    activeTab === 'tasks'
                      ? 'bg-primary text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  Tasks
                </button>
                
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'calendar'
                      ? 'bg-primary text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <CalendarIcon className={`w-5 h-5 ${activeTab === 'calendar' ? '' : 'icon-hover-blue'}`} />
                  <span>Calendar</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('collaboration')}
                  className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'collaboration'
                      ? 'bg-primary text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <Users className={`w-5 h-5 ${activeTab === 'collaboration' ? '' : 'icon-hover-blue'}`} />
                  <span>Collaborate</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'analytics'
                      ? 'bg-primary text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <BarChart3 className={`w-5 h-5 ${activeTab === 'analytics' ? '' : 'icon-hover-blue'}`} />
                  <span>Analytics</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-primary text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  ⚙️ Settings
                </button>
              </div>

              {/* Mobile menu button - LARGER */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-3 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Right side - User info and Logout - LARGER */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                {/* User Avatar */}
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-lg md:text-xl font-bold shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                
                {/* User Info */}
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {user.section}
                  </p>
                </div>
              </div>
              
              {/* Logout Button - LARGER */}
              <button
                onClick={handleLogout}
                className="btn-hover flex items-center space-x-2 px-4 md:px-5 py-2.5 md:py-3 bg-red-500 text-white rounded-lg font-semibold shadow-md text-sm md:text-base"
              >
                <LogOut className="w-5 h-5 interactive-scale" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu - LARGER BUTTONS */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold ${
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
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold ${
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
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold ${
                  activeTab === 'calendar'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CalendarIcon className="w-5 h-5 inline mr-2" />
                Calendar
              </button>
              <button
                onClick={() => {
                  setActiveTab('collaboration');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold ${
                  activeTab === 'collaboration'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Collaborate
              </button>
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold ${
                  activeTab === 'analytics'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-semibold ${
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

      {/* Main Content - OPTIMIZED LAYOUT */}
      <div className="max-w-[95%] mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Page Title - More Compact */}
            <div className="mb-4 md:mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-1">
                Welcome back, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Here's what's happening with your academic progress today
              </p>
            </div>

            {/* Stats Cards - More Compact Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="card-hover bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 md:p-5 rounded-lg shadow-lg cursor-pointer">
                <p className="text-xs font-medium opacity-90 uppercase tracking-wide mb-1">
                  Pending Tasks
                </p>
                <p className="text-4xl md:text-5xl font-bold tabular-nums mb-1">
                  {stats.pending}
                </p>
                <p className="text-xs opacity-75">Tasks waiting</p>
              </div>
              
              <div className="card-hover bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 md:p-5 rounded-lg shadow-lg cursor-pointer">
                <p className="text-xs font-medium opacity-90 uppercase tracking-wide mb-1">
                  In Progress
                </p>
                <p className="text-4xl md:text-5xl font-bold tabular-nums mb-1">
                  {stats.inProgress}
                </p>
                <p className="text-xs opacity-75">Working on</p>
              </div>
              
              <div className="card-hover bg-gradient-to-br from-green-500 to-green-600 text-white p-4 md:p-5 rounded-lg shadow-lg cursor-pointer">
                <p className="text-xs font-medium opacity-90 uppercase tracking-wide mb-1">
                  Completed
                </p>
                <p className="text-4xl md:text-5xl font-bold tabular-nums mb-1">
                  {stats.completed}
                </p>
                <p className="text-xs opacity-75">Finished</p>
              </div>
              
              <div className="card-hover bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-5 rounded-lg shadow-lg cursor-pointer">
                <p className="text-xs font-medium opacity-90 uppercase tracking-wide mb-1">
                  Completion
                </p>
                <p className="text-4xl md:text-5xl font-bold tabular-nums mb-1">
                  {stats.completionRate}%
                </p>
                <p className="text-xs opacity-75">Progress</p>
              </div>
            </div>

            {/* Two Column Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
              {/* Weekly Events - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 md:p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold mb-1">
                      This Week's Events
                    </h2>
                    <p className="text-sm text-gray-600">
                      Your upcoming schedule ({events.length} events)
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="text-sm font-medium text-primary hover:text-blue-600 transition flex items-center space-x-1 px-3 py-2 hover:bg-blue-50 rounded-lg"
                  >
                    <span>View Calendar</span>
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <WeeklyEvents events={events} />
              </div>

              {/* Quick Stats - Takes 1 column */}
              <div className="space-y-3 md:space-y-4">
                <div className="card-hover bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 md:p-5 rounded-lg shadow-lg cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <CalendarIcon className="w-8 h-8 md:w-10 md:h-10" />
                    <span className="text-3xl md:text-4xl font-bold tabular-nums">
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
                      }).length}
                    </span>
                  </div>
                  <p className="text-sm font-medium opacity-90">This Week</p>
                  <p className="text-xs opacity-75 mt-1">Scheduled events</p>
                </div>

                <div className="card-hover bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 md:p-5 rounded-lg shadow-lg cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-3xl md:text-4xl font-bold tabular-nums">
                      {tasks.length}
                    </span>
                  </div>
                  <p className="text-sm font-medium opacity-90">Total Tasks</p>
                  <p className="text-xs opacity-75 mt-1">All assignments</p>
                </div>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="w-full card-hover bg-white border-2 border-gray-200 p-4 md:p-5 rounded-lg text-left hover:border-primary transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium text-primary">View →</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Analytics</p>
                  <p className="text-xs text-gray-600 mt-1">See detailed progress</p>
                </button>
              </div>
            </div>

            {/* Task Board - Full Width, More Compact */}
            <div className="bg-white rounded-lg shadow p-4 md:p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1">
                    Task Board
                  </h2>
                  <p className="text-sm text-gray-600">
                    Organize your assignments
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskModal(true);
                  }}
                  className="btn-hover flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">New Task</span>
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