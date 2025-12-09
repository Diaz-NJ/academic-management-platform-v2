import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupAPI, invitationAPI, discussionAPI, taskAPI, eventAPI } from '../services/api';
import { Users, Plus, Trash2, FileText, BookOpen, CheckSquare, Square, UserPlus, MessageSquare, Calendar } from 'lucide-react';
import GroupModal from '../components/GroupModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import InviteUserModal from '../components/InviteUserModal';
import DiscussionBoard from '../components/DiscussionBoard';
import InvitationsPanel from '../components/InvitationsPanel';
import UnreadBadge from '../components/UnreadBadge'; 
import GroupTasksView from '../components/GroupTaskView';
import GroupEventsView from '../components/GroupEventsView';

const Collaboration = ({ onUnreadCountChange }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDiscussionBoard, setShowDiscussionBoard] = useState(false);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [groupToLeave, setGroupToLeave] = useState(null);
  const [groupTaskCounts, setGroupTaskCounts] = useState({});
  const [groupEventCounts, setGroupEventCounts] = useState({});
  const [showTaskView, setShowTaskView] = useState(false);
  const [showEventView, setShowEventView] = useState(false);

  const loadAllGroupUnreadCounts = useCallback(async (groupsList) => {
    if (!groupsList || groupsList.length === 0) return;
    
    try {
      const counts = {};
      
      await Promise.all(
        groupsList.map(async (group) => {
          try {
            const response = await discussionAPI.getGroupUnreadCounts(group.id, user.id);
            if (response.data.success) {
              const unreadCounts = response.data.unreadCounts;
              const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
              counts[group.id] = totalUnread;
            }
          } catch (error) {
            console.error(`Error loading unread for group ${group.id}:`, error);
          }
        })
      );
      
      setGroupUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading group unread counts:', error);
    }
  }, [user.id]);

  // ✅ NEW FUNCTION: Load task counts for all groups
const loadAllGroupTaskCounts = useCallback(async (groupsList) => {
  if (!groupsList || groupsList.length === 0) return;
  
  try {
    const counts = {};
    
    await Promise.all(
      groupsList.map(async (group) => {
        try {
          const response = await taskAPI.getGroupTasks(group.id);
          counts[group.id] = response.data.length;
        } catch (error) {
          console.error(`Error loading tasks for group ${group.id}:`, error);
          counts[group.id] = 0;
        }
      })
    );
    
    setGroupTaskCounts(counts);
  } catch (error) {
    console.error('Error loading group task counts:', error);
  }
}, []);

const loadAllGroupEventCounts = useCallback(async (groupsList) => {
  if (!groupsList || groupsList.length === 0) return;
  
  try {
    const counts = {};
    
    await Promise.all(
      groupsList.map(async (group) => {
        try {
          const response = await eventAPI.getGroupEvents(group.id);
          // Filter out canceled events
          counts[group.id] = response.data.filter(e => !e.isCanceled).length;
        } catch (error) {
          console.error(`Error loading events for group ${group.id}:`, error);
          counts[group.id] = 0;
        }
      })
    );
    
    setGroupEventCounts(counts);
  } catch (error) {
    console.error('Error loading group event counts:', error);
  }
}, []);

useEffect(() => {
  if (groups.length > 0) {
    // Load immediately
    loadAllGroupUnreadCounts(groups);
    loadAllGroupTaskCounts(groups);
    loadAllGroupEventCounts(groups); // ✅ ADD THIS LINE
    
    // Poll every 10 seconds
    const interval = setInterval(() => {
      loadAllGroupUnreadCounts(groups);
      loadAllGroupTaskCounts(groups);
      loadAllGroupEventCounts(groups); // ✅ ADD THIS LINE
    }, 10000);
    
    return () => clearInterval(interval);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [groups.length]);

  // ✅ NEW: Notify parent when unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      const totalUnread = Object.values(groupUnreadCounts).reduce((sum, count) => sum + count, 0);
      onUnreadCountChange(totalUnread);
    }
  }, [groupUnreadCounts, onUnreadCountChange]);

// ✅ FIXED: Search filtering with better performance
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = groups.filter(group =>
        group.groupName.toLowerCase().includes(query) ||
        group.subject.toLowerCase().includes(query) ||
        (group.groupNumber && group.groupNumber.toLowerCase().includes(query)) ||
        group.taskDescription.toLowerCase().includes(query)
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [groups, searchQuery]);// ✅ FIXED: Search filtering with better performance

const loadGroups = useCallback(async (force = false) => {
    try {
      console.log('📥 loadGroups called, force:', force, 'current count:', groups.length);
      
      // ✅ FIXED: Always show loading for forced refresh
      if (force) {
        setLoading(true);
      } else if (groups.length > 0) {
        // Skip if not forced and already loaded
        setLoading(false);
        return;
      }

      const response = await groupAPI.getGroups(user.id);
      const newGroups = response.data;
      
      console.log('📦 Received groups from API:', newGroups.length);
      
      // ✅ FIXED: Always update when forced, no comparison
      if (force) {
        console.log('🔄 Force update: Setting groups directly');
        setGroups(newGroups);
        setFilteredGroups(newGroups);
        setSelectedGroups([]);
      } else {
        // Only compare when not forced
        setGroups(prevGroups => {
          if (JSON.stringify(prevGroups) === JSON.stringify(newGroups)) {
            return prevGroups;
          }
          return newGroups;
        });
        setSelectedGroups([]);
      }
      
    } catch (error) {
      console.error('Error loading groups:', error);
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id, showToast]); // ✅ REMOVED groups.length from dependencies

  useEffect(() => {
  loadGroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ✅ Empty array = run once on mount, loadGroups intentionally excluded

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map(g => g.id));
    }
  };

  const handleBulkDelete = async () => {
  try {
    await Promise.all(selectedGroups.map(id => groupAPI.deleteGroup(id)));
    showToast(`${selectedGroups.length} group(s) deleted successfully`, 'success');
    
    // ✅ FIXED: Immediately update state
    setGroups(prevGroups => prevGroups.filter(g => !selectedGroups.includes(g.id)));
    setFilteredGroups(prevFiltered => prevFiltered.filter(g => !selectedGroups.includes(g.id)));
    
    setSelectedGroups([]);
    setShowBulkDeleteDialog(false);
  } catch (error) {
    console.error('Error deleting groups:', error);
    showToast('Failed to delete some groups', 'error');
  }
};

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setShowGroupModal(true);
  };

const handleSaveGroup = async (groupData) => {
  try {
    if (selectedGroup) {
      await groupAPI.updateGroup(selectedGroup.id, groupData);
      showToast('Group updated successfully!', 'success');
    } else {
      await groupAPI.createGroup(groupData);
      showToast('Group created successfully!', 'success');
    }
    setShowGroupModal(false);
    
    // ✅ Optimized refresh - no loading state
    await loadGroups();
  } catch (error) {
    console.error('Error saving group:', error);
    showToast('Failed to save group', 'error');
  }
};

  const handleDeleteClick = (group) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
  try {
    await groupAPI.deleteGroup(groupToDelete.id);
    showToast('Group deleted successfully', 'success');
    
    // ✅ FIXED: Immediately update state
    setGroups(prevGroups => prevGroups.filter(g => g.id !== groupToDelete.id));
    setFilteredGroups(prevFiltered => prevFiltered.filter(g => g.id !== groupToDelete.id));
    
    setShowDeleteConfirm(false);
    setGroupToDelete(null);
  } catch (error) {
    console.error('Error deleting group:', error);
    showToast('Failed to delete group', 'error');
  }
};

  // ✅ NEW: Leave group handler
  const handleLeaveGroup = (group) => {
    setGroupToLeave(group);
    setShowLeaveConfirm(true);
  };

  const handleLeaveConfirm = async () => {
    try {
      console.log('🚪 Leaving group:', groupToLeave.id);
      const leftGroupId = groupToLeave.id;
      
      // Show loading state
      setLoading(true);
      
      // Make API call
      const response = await groupAPI.leaveGroup(leftGroupId, user.id);
      
      console.log('✅ Leave response:', response.data);
      
      if (response.data.groupDeleted) {
        showToast('Left group successfully. Group was deleted as no members remain.', 'success');
      } else {
        showToast('Left group successfully', 'success');
      }
      
      // ✅ FIX: Force immediate reload with proper cleanup
      setShowLeaveConfirm(false);
      setGroupToLeave(null);
      
      // Force full page reload to refresh all data
      window.location.reload();
      
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMessage = error.response?.data?.message || 'Failed to leave group';
      showToast(errorMessage, 'error');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your groups..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-2 md:space-y-4 px-2 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-3 md:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 leading-tight">Collaboration Groups</h1>
            <p className="text-xs md:text-base text-gray-600 leading-tight">
              Manage your group projects and assignments
            </p>
          </div>
          {/* Buttons in upper right corner */}
          <div className="flex items-center space-x-1 md:space-x-2 self-end sm:self-auto">
            <button
              onClick={async () => {
                setLoading(true);
                // ✅ CHANGED: Pass force=true to refresh
                await loadGroups(true);
                await loadAllGroupUnreadCounts(groups);
                showToast('Groups refreshed', 'success');
              }}
               className="btn-hover flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-200 text-sm md:text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden md:inline">Refresh</span>
            </button>
            
            <button
              onClick={handleCreateGroup}
              className="btn-hover flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-lg font-medium shadow-sm text-sm md:text-base whitespace-nowrap"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span>New Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Invitations Panel */}
      <InvitationsPanel 
        userId={user.id} 
        onUpdate={(force) => loadGroups(force || true)} // ✅ Always force refresh
      />

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-2 md:p-4">
        <label className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2 block">
          Search Groups
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search groups..."
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
      </div>

      {/* Bulk Actions Bar */}
      {selectedGroups.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-sm md:text-base font-semibold text-blue-900">
                {selectedGroups.length} Group(s) Selected
              </span>
              <button
                onClick={() => setSelectedGroups([])}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkDeleteDialog(true)}
                 className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs md:text-sm whitespace-nowrap"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Groups Grid */}
{filteredGroups.length === 0 ? (
  <div className="bg-white rounded-lg shadow">
    <EmptyState
      icon={Users}
      title={groups.length === 0 ? "No Groups Yet" : "No Results Found"}
      message={
        groups.length === 0
          ? "Create your first group to collaborate on projects and assignments with your classmates!"
          : `No groups match "${searchQuery}". Try a different search term.`
      }
      actionLabel={groups.length === 0 ? "Create Your First Group" : "Clear Search"}
      onAction={groups.length === 0 ? handleCreateGroup : () => setSearchQuery('')}
    />
  </div>
) : (
  <>
    {/* Select All Header */}
    <div className="bg-white rounded-lg shadow p-2 md:p-4">
      <button
        onClick={toggleSelectAll}
        className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-700 hover:text-primary"
      >
        {selectedGroups.length === filteredGroups.length ? (
          <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        ) : (
          <Square className="w-4 h-4 md:w-5 md:h-5" />
        )}
        <span className="font-medium">
          {selectedGroups.length === filteredGroups.length 
            ? 'Deselect All' 
            : 'Select All'}
        </span>
      </button>
    </div>

     {/* ✨ REDESIGNED Group Cards - SIMPLIFIED BLUE THEME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {filteredGroups.map(group => {
        const currentMember = group.members?.find(m => m.userId === user.id);
        const isAdmin = group.createdBy === user.id;
        const unreadCount = groupUnreadCounts[group.id] || 0;
        const taskCount = groupTaskCounts[group.id] || 0;
        const eventCount = groupEventCounts[group.id] || 0; // ✅ CHANGED: Get from state 
          
          return (
            <div 
              key={group.id} 
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-blue-500"
            >
              {/* ✨ SIMPLIFIED HEADER - Blue Theme */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 relative">
                <div className="flex items-start justify-between mb-3">
                  {/* Group Icon & Info */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white/50">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {group.groupName}
                      </h3>
                      {group.groupNumber && (
                        <p className="text-xs text-white/80 truncate">
                          {group.groupNumber}
                        </p>
                      )}
                      <p className="text-sm text-white/90 truncate flex items-center space-x-1 mt-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{group.subject}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Checkbox for bulk actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupSelection(group.id);
                    }}
                    className="flex-shrink-0"
                  >
                    {selectedGroups.includes(group.id) ? (
                      <CheckSquare className="w-6 h-6 text-white" />
                    ) : (
                      <Square className="w-6 h-6 text-white/70 hover:text-white" />
                    )}
                  </button>
                </div>
                
                {/* ✅ User Role Badge - Bottom Right */}
                <div className="absolute bottom-3 right-3">
                  {isAdmin ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-white/90 text-blue-800 rounded-full text-xs font-bold border border-white shadow-sm">
                      <span>👑</span>
                      <span>Admin</span>
                    </span>
                  ) : currentMember?.role === 'Leader' ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-white/90 text-blue-700 rounded-full text-xs font-bold border border-white shadow-sm">
                      <span>⭐</span>
                      <span>Leader</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-white/90 text-gray-700 rounded-full text-xs font-semibold border border-white shadow-sm">
                      <span>👤</span>
                      <span>Member</span>
                    </span>
                  )}
                </div>
              </div>

              {/* ✨ CARD BODY */}
              <div className="p-4">
                {/* ✅ Stats Row - Members, Tasks, Events */}
                <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
                  {/* Members */}
                  <div className="text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-800 leading-none">{group.members.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Members</p>
                  </div>
                  
                  {/* Tasks */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(group);
                      setShowTaskView(true);
                    }}
                    className="text-center hover:bg-blue-50 rounded-lg p-2 transition"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1 ${
                      taskCount > 0 ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <CheckSquare className={`w-5 h-5 ${
                        taskCount > 0 ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <p className={`text-xl font-bold leading-none ${
                      taskCount > 0 ? 'text-gray-800' : 'text-gray-400'
                    }`}>{taskCount}</p>
                    <p className="text-xs text-gray-500 mt-1">Tasks</p>
                  </button>
                  
                  {/* Events */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(group);
                      setShowEventView(true);
                    }}
                    className="text-center hover:bg-blue-50 rounded-lg p-2 transition"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1 ${
                      eventCount > 0 ? 'bg-cyan-100' : 'bg-gray-100'
                    }`}>
                      <Calendar className={`w-5 h-5 ${
                        eventCount > 0 ? 'text-cyan-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <p className={`text-xl font-bold leading-none ${
                      eventCount > 0 ? 'text-gray-800' : 'text-gray-400'
                    }`}>{eventCount}</p>
                    <p className="text-xs text-gray-500 mt-1">Events</p>
                  </button>
                </div>

                {/* ✅ Action Buttons Row - Invite & Discuss */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(group);
                      setShowInviteModal(true);
                    }}
                    className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(group);
                      setShowDiscussionBoard(true);
                    }}
                    className="relative flex items-center justify-center space-x-1 px-3 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-semibold"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Discuss</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1">
                        <UnreadBadge count={unreadCount} size="small" />
                      </span>
                    )}
                  </button>
                </div>

                {/* ✅ Team Members Preview */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Team Members</p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 5).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold text-white shadow-md hover:scale-110 transition cursor-pointer"
                          title={member.name}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {group.members.length > 5 && (
                        <div className="w-10 h-10 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-gray-700 shadow-md">
                          +{group.members.length - 5}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(group.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* ✅ Bottom Buttons - View Info & Delete/Leave */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(group);
                      setShowGroupModal(true);
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                  >
                    <FileText className="w-5 h-5" />
                    <span>{isAdmin ? 'View/Edit Info' : 'View Info'}</span>
                  </button>
                  
                  {isAdmin ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(group);
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Delete</span>
                    </button>
                  ) : currentMember ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveGroup(group);
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Leave</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
  </>
)}

      {/* Group Modal */}
      {showGroupModal && (
        <GroupModal
          onClose={() => {
            setShowGroupModal(false);
            setSelectedGroup(null);
          }}
          onSave={handleSaveGroup}
          group={selectedGroup}
          currentUser={user}
          mode={selectedGroup ? 'view' : 'edit'}
        />
      )}

      {/* ✅ NEW: Invite Modal */}
      {showInviteModal && selectedGroup && (
        <InviteUserModal
          group={selectedGroup}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedGroup(null);
          }}
          onInviteSent={loadGroups}
          currentUserId={user.id}
          invitationAPI={invitationAPI}
        />
      )}

      {/* ✅ NEW: Discussion Board */}
      {showDiscussionBoard && selectedGroup && (
        <DiscussionBoard
          group={selectedGroup}
          onClose={() => {
            setShowDiscussionBoard(false);
            setSelectedGroup(null);
            // ✅ Refresh unread counts when closing
            loadAllGroupUnreadCounts();
          }}
          currentUser={user}
          discussionAPI={discussionAPI}
        />
      )}

      {/* ✅ NEW: Task View Modal */}
      {showTaskView && selectedGroup && (
        <GroupTasksView
          group={selectedGroup}
          onClose={() => {
            setShowTaskView(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {/* ✅ NEW: Event View Modal */}
      {showEventView && selectedGroup && (
        <GroupEventsView
          group={selectedGroup}
          onClose={() => {
            setShowEventView(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {/* Delete Single Group Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete "${groupToDelete?.groupName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Groups"
        message={`Are you sure you want to delete ${selectedGroups.length} group(s)? This action cannot be undone and will remove all group data.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />

      {/* Leave Group Confirmation */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => {
          setShowLeaveConfirm(false);
          setGroupToLeave(null);
        }}
        onConfirm={handleLeaveConfirm}
        title="Leave Group"
        message={`Are you sure you want to leave "${groupToLeave?.groupName}"? ${
          groupToLeave?.members?.length === 1 
            ? 'Since you are the only member, the group will be permanently deleted.' 
            : 'You will no longer have access to this group.'
        }`}
        confirmText="Leave Group"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default Collaboration;