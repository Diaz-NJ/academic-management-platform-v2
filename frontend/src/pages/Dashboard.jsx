import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { taskAPI, eventAPI, groupAPI, discussionAPI } from '../services/api';
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
import { invitationAPI } from '../services/api';

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
  const [pendingInvitations, setPendingInvitations] = useState(0);
    const [totalUnreadMessages, setTotalUnreadMessages] = useState(0); 

  // ✅ FIXED: Wrapped in useCallback with proper dependencies
  const loadTasks = useCallback(async () => {
    try {
      const response = await taskAPI.getTasks(user.id);
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [user.id]);

  // ✅ FIXED: Also wrapped in useCallback
  const loadEvents = useCallback(async () => {
    try {
      const response = await eventAPI.getEvents(user.id);
      const allEvents = response.data;
      
      const allEventIds = new Set(allEvents.map(e => e.id));
      
      const filteredEvents = allEvents.filter(event => 
        !event.parentEventId || allEventIds.has(event.parentEventId)
      );
      
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const expandedEvents = expandRecurringEvents(filteredEvents, startOfWeek, endOfWeek);
      const visibleEvents = expandedEvents.filter(e => !e.isCanceled);
      
      setEvents(visibleEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, [user.id]);

  // ✅ FIXED: Load data only once on mount with proper dependencies
  useEffect(() => {
    let mounted = true;
    
    const initialLoad = async () => {
      if (mounted) {
        try {
          await Promise.all([
            loadTasks(),
            loadEvents()
          ]);
        } catch (error) {
          console.error('Error loading dashboard:', error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    };
    
    initialLoad();
    
    return () => {
      mounted = false;
    };
  }, [loadTasks, loadEvents]); // ✅ Proper dependencies

  // ✅ REMOVED: Duplicate loading on tab change
  // The data is already loaded, no need to reload when switching tabs

  // ✅ OPTIMIZED: Poll for notifications less frequently and only when on dashboard
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        // Check invitations
        const invitationsResponse = await invitationAPI.getReceivedInvitations(user.id);
        setPendingInvitations(invitationsResponse.data.length);
        
        // ✅ OPTIMIZED: Only check unread messages if on collaboration tab
        // Dashboard doesn't need real-time unread counts
        if (activeTab === 'collaboration') {
          try {
            const groupsResponse = await groupAPI.getGroups(user.id);
            const groups = groupsResponse.data;
            
            let totalUnread = 0;
            
            // Get unread counts for each group
            await Promise.all(
              groups.map(async (group) => {
                try {
                  const unreadResponse = await discussionAPI.getGroupUnreadCounts(group.id, user.id);
                  if (unreadResponse.data.success) {
                    const unreadCounts = unreadResponse.data.unreadCounts;
                    const groupTotal = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
                    totalUnread += groupTotal;
                  }
                } catch (error) {
                  // Silently fail for individual groups
                  console.error(`Error loading unread for group ${group.id}:`, error);
                }
              })
            );
            
            setTotalUnreadMessages(totalUnread);
          } catch (error) {
            console.error('Error checking unread messages:', error);
          }
        }
        
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // ✅ Check immediately on mount
    checkNotifications();
    
    // ✅ OPTIMIZED: Poll every 30 seconds instead of 10 (less aggressive)
    const interval = setInterval(checkNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [user.id, activeTab]); // Re-run when tab changes

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
    <div 
    className="min-h-screen relative"
    style={{
      backgroundImage: 'url(/images/bg-science.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}
  >
    <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>
    <div className="relative z-10">
      {/* Navigation Bar - ENLARGED */}
        <nav className="bg-white/95 backdrop-blur-sm shadow-md border-b-2 border-gray-100">
  <div className="max-w-8xl mx-auto px-3 sm:px-8 lg:px-12">
    <div className="flex justify-between items-center h-14 md:h-24">
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center space-x-2 md:space-x-10">
        {/* Logo - MOBILE OPTIMIZED */}
        <h1 className="text-xl md:text-4xl font-bold text-primary tracking-tight">
          AMP
        </h1>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-2 lg:space-x-3">
          {/* Desktop buttons stay the same */}
          <button
  onClick={() => {
    setActiveTab('dashboard');
    if (activeTab !== 'dashboard') {
      loadTasks();
      loadEvents();
    }
  }}
  className={`flex items-center space-x-2 px-3 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 ${
    activeTab === 'dashboard'
      ? 'bg-primary text-white shadow-lg transform scale-105'
      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
  }`}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
  <span className="hidden sm:inline">Dashboard</span>
</button>
          
          {/* Rest of desktop buttons... */}
          <button
  onClick={() => setActiveTab('tasks')}
  className={`flex items-center space-x-2 px-3 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 ${
    activeTab === 'tasks'
      ? 'bg-primary text-white shadow-lg transform scale-105'
      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
  }`}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
  <span className="hidden sm:inline">Tasks</span>
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
            className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold transition-all duration-200 flex items-center space-x-2 relative ${
              activeTab === 'collaboration'
                ? 'bg-primary text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'collaboration' ? '' : 'icon-hover-blue'}`} />
            <span>Collaborate</span>
            {(pendingInvitations > 0 || totalUnreadMessages > 0) && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingInvitations + totalUnreadMessages}
              </span>
            )}
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

        {/* Mobile menu button - SMALLER */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Right side - MOBILE OPTIMIZED */}
      <div className="flex items-center space-x-2">
        <div className="hidden sm:flex items-center space-x-2">
          {/* User Avatar - SMALLER ON MOBILE */}
          <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-base md:text-xl font-bold shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          {/* User Info - HIDDEN ON SMALL SCREENS */}
          <div className="hidden lg:block">
            <p className="text-xs md:text-sm font-semibold text-gray-800 leading-tight">
              {user.name}
            </p>
            <p className="text-xs text-gray-600">
              {user.section}
            </p>
          </div>
        </div>
        
        {/* Logout Button - MOBILE OPTIMIZED */}
        <button
          onClick={handleLogout}
          className="btn-hover flex items-center space-x-1 md:space-x-2 px-2 md:px-5 py-1.5 md:py-3 bg-red-500 text-white rounded-lg font-semibold shadow-md text-xs md:text-base"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5 interactive-scale" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>

    {/* Mobile Navigation Menu - SMALLER */}
    {mobileMenuOpen && (
      <div className="md:hidden pb-3 space-y-1">
        <button
  onClick={() => {
    setActiveTab('dashboard');
    setMobileMenuOpen(false);
    if (activeTab !== 'dashboard') {
      loadTasks();
      loadEvents();
    }
  }}
  className={`flex items-center space-x-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
    activeTab === 'dashboard'
      ? 'bg-primary text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
  <span>Dashboard</span>
</button>
        <button
  onClick={() => {
    setActiveTab('tasks');
    setMobileMenuOpen(false);
  }}
  className={`flex items-center space-x-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
    activeTab === 'tasks'
      ? 'bg-primary text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
  <span>Tasks</span>
</button>
        <button
          onClick={() => {
            setActiveTab('calendar');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'calendar'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4 inline mr-2" />
          Calendar
        </button>
        <button
          onClick={() => {
            setActiveTab('collaboration');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold relative ${
            activeTab === 'collaboration'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Collaborate
          {(pendingInvitations > 0 || totalUnreadMessages > 0) && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[18px] h-4 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {pendingInvitations + totalUnreadMessages}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('analytics');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'analytics'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
        <button
          onClick={() => {
            setActiveTab('settings');
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-4 md:py-6">
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
        {activeTab === 'collaboration' && (
          <Collaboration 
            onUnreadCountChange={setTotalUnreadMessages}
          />
        )}
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
    </div>
  );
};

export default Dashboard;