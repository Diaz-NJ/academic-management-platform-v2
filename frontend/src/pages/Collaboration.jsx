import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupAPI } from '../services/api';
import { Users, Plus, Edit, Trash2, FileText, BookOpen, CheckSquare, Square } from 'lucide-react';
import GroupModal from '../components/GroupModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

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
  
  // ✅ NEW: Bulk Actions State
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [user]);

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

  const loadGroups = useCallback(async() => {
    try {
      const response = await groupAPI.getGroups(user.id);
      setGroups(response.data);
      setSelectedGroups([]); // Clear selections on reload
    } catch (error) {
      console.error('Error loading groups:', error);
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id, showToast]);

  // ✅ NEW: Toggle individual group selection
  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // ✅ NEW: Select/Deselect all groups
  const toggleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map(g => g.id));
    }
  };

  // ✅ NEW: Bulk delete
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
      loadGroups();
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

  if (loading) {
    return <LoadingSpinner message="Loading your groups..." />;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* ✨ Enhanced Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-page-title mb-2">Collaboration Groups</h1>
            <p className="text-body text-gray-600">
              Manage your group projects and assignments
            </p>
          </div>
          <button
            onClick={handleCreateGroup}
            className="btn-hover flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="btn-text">Create Group</span>
          </button>
        </div>
      </div>

      {/* ✨ Enhanced Search Bar */}
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

      {/* ✅ NEW: Bulk Actions Bar */}
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
              {/* Bulk Delete */}
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
          {/* ✅ NEW: Select All Header */}
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

              {/* ✨ Enhanced Group Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredGroups.map(group => (
                <div 
                  key={group.id} 
                  className="card-hover bg-white rounded-lg shadow"
                >
                {/* ✅ NEW: Checkbox */}
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
                    <div className="flex items-center space-x-1">
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

                {/* Card Footer - Members Preview */}
                <div className="px-6 pb-6">
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
                      className="text-xs text-primary hover:underline ml-2"
                    >
                      View all members
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📌 Coming Soon</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Real-time chat with group members</li>
          <li>• File sharing and document collaboration</li>
          <li>• Add registered users to groups via email/student ID</li>
          <li>• Group task assignments and progress tracking</li>
        </ul>
      </div>

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

      {/* ✅ NEW: Bulk Delete Dialog */}
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
    </div>
  );
};

export default Collaboration;