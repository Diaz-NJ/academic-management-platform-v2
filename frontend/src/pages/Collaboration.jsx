import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupAPI, invitationAPI, discussionAPI } from '../services/api';
import { Users, Plus, Edit, Trash2, FileText, BookOpen, CheckSquare, Square, UserPlus, MessageSquare } from 'lucide-react';
import GroupModal from '../components/GroupModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import InviteUserModal from '../components/InviteUserModal';
import DiscussionBoard from '../components/DiscussionBoard';
import InvitationsPanel from '../components/InvitationsPanel';
import UnreadBadge from '../components/UnreadBadge'; 

const Collaboration = () => {
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
  
  // Bulk Actions State
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // ✅ NEW: Invitation & Discussion States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDiscussionBoard, setShowDiscussionBoard] = useState(false);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  // ✅ NEW: Leave group state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [groupToLeave, setGroupToLeave] = useState(null);

  // ✅ NEW: Load unread counts for all groups - DEFINE THIS FIRST
  const loadAllGroupUnreadCounts = useCallback(async () => {
    try {
      const counts = {};
      
      // Load unread counts for each group
      await Promise.all(
        groups.map(async (group) => {
          try {
            const response = await discussionAPI.getGroupUnreadCounts(group.id, user.id);
            if (response.data.success) {
              const unreadCounts = response.data.unreadCounts;
              // Sum up all unread messages in this group
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
  }, [groups, user.id]);

  // ✅ NEW: Load and poll for unread counts - USE IT HERE
  useEffect(() => {
    if (groups.length > 0) {
      loadAllGroupUnreadCounts();
      
      // Poll for unread counts every 10 seconds
      const interval = setInterval(() => {
        loadAllGroupUnreadCounts();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [groups, loadAllGroupUnreadCounts]);

  // ✅ NEW: Quiet group loading (no loading state)
  const loadGroupsQuietly = useCallback(async () => {
    try {
      const response = await groupAPI.getGroups(user.id);
      
      // Only update if there are changes
      const hasChanges = JSON.stringify(response.data) !== JSON.stringify(groups);
      if (hasChanges) {
        setGroups(response.data);
      }
    } catch (error) {
      console.error('Error polling groups:', error);
    }
  }, [user.id, groups]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = groups.filter(group =>
        group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.groupNumber && group.groupNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        group.taskDescription.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [groups, searchQuery]);

  // ✅ NEW: Load unread counts for all groups

  const loadGroups = useCallback(async() => {
    try {
      const response = await groupAPI.getGroups(user.id);
      setGroups(response.data);
      setSelectedGroups([]);
    } catch (error) {
      console.error('Error loading groups:', error);
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id, showToast]);

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
      setSelectedGroups([]);
      setShowBulkDeleteDialog(false);
      loadGroups();
    } catch (error) {
      console.error('Error deleting groups:', error);
      showToast('Failed to delete some groups', 'error');
    }
  };

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
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
    
    // ✅ Force a complete refresh
    setLoading(true);
    await loadGroups();
    setLoading(false);
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
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
      loadGroups();
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
      const response = await groupAPI.leaveGroup(groupToLeave.id, user.id);
      
      if (response.data.groupDeleted) {
        showToast('Left group successfully. Group was deleted as no members remain.', 'success');
      } else {
        showToast('Left group successfully', 'success');
      }
      
      setShowLeaveConfirm(false);
      setGroupToLeave(null);
      loadGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMessage = error.response?.data?.message || 'Failed to leave group';
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your groups..." />;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-page-title mb-2">Collaboration Groups</h1>
            <p className="text-body text-gray-600">
              Manage your group projects and assignments
            </p>
          </div>
          {/* Buttons in upper right corner */}
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                setLoading(true);
                await loadGroups();
                setLoading(false);
                showToast('Groups refreshed', 'success');
              }}
              className="btn-hover flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={handleCreateGroup}
              className="btn-hover flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="btn-text">Create Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Invitations Panel */}
      <InvitationsPanel 
        userId={user.id} 
        onUpdate={loadGroups}
      />

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="text-label mb-2 block">
          Search Groups
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search groups by name, subject, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-body"
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

      {/* Bulk Actions Bar */}
      {selectedGroups.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-blue-900">
                {selectedGroups.length} group(s) selected
              </span>
              <button
                onClick={() => setSelectedGroups([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkDeleteDialog(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
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
          <div className="bg-white rounded-lg shadow p-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary"
            >
              {selectedGroups.length === filteredGroups.length ? (
                <CheckSquare className="w-5 h-5 text-primary" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="font-medium">
                {selectedGroups.length === filteredGroups.length 
                  ? 'Deselect All' 
                  : 'Select All'}
              </span>
            </button>
          </div>

          {/* Group Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredGroups.map(group => (
              <div 
                key={group.id} 
                className="card-hover bg-white rounded-lg shadow"
              >
                {/* Checkbox */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => toggleGroupSelection(group.id)}
                    className="flex items-center space-x-2 text-sm"
                  >
                    {selectedGroups.includes(group.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 hover:text-primary" />
                    )}
                    <span className="text-gray-700">Select</span>
                  </button>
                </div>

                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {group.groupName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {group.groupNumber && (
                          <span className="text-caption text-gray-500 font-medium">
                            {group.groupNumber}
                          </span>
                        )}
                        <h3 className="text-card-title">
                          {group.groupName}
                        </h3>
                      </div>
                    </div>
                    {/* ✅ FIXED: Role-based action buttons */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const currentMember = group.members?.find(m => m.userId === user.id);
                        const isLeader = currentMember?.role === 'Leader';
                        
                        if (isLeader) {
                          // Leaders can edit and delete
                          return (
                            <>
                              <button
                                onClick={() => handleEditGroup(group)}
                                className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded transition"
                                title="Edit group"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteClick(group);
                                }}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete group"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          );
                        } else if (currentMember) {
                          // Members can only leave
                          return (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLeaveGroup(group);
                              }}
                              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition"
                              title="Leave group"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{group.subject}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-body-sm text-gray-600 line-clamp-3">
                        {group.taskDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-body-sm text-gray-600 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="font-medium">{group.members.length}</span> member{group.members.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-caption text-gray-400">
                      {new Date(group.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* ✅ NEW: Action Buttons */}
                <div className="px-6 pb-4 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowInviteModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowDiscussionBoard(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm font-medium relative"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Discuss</span>
                    {/* ✅ NEW: Show unread badge */}
                    {groupUnreadCounts[group.id] > 0 && (
                      <span className="absolute -top-1 -right-1">
                        <UnreadBadge count={groupUnreadCounts[group.id]} size="small" />
                      </span>
                    )}
                  </button>
                </div>

                {/* Card Footer - Members Preview */}
                <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                  <p className="text-label mb-2">Members</p>
                  <div className="flex items-center space-x-2">
                    {group.members.slice(0, 4).map((member, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white shadow-md"
                        title={member.name}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {group.members.length > 4 && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="text-xs text-primary hover:underline ml-2 mt-2"
                  >
                    View all members
                  </button>
                </div>
              </div>
            ))}
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