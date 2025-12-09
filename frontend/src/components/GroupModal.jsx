import React, { useState, useEffect } from 'react';
import { X, Trash2, Users, Edit } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const GroupModal = ({ onClose, onSave, group, currentUser, mode = 'edit' }) => {
  const [formData, setFormData] = useState({
    groupNumber: '',
    groupName: '',
    subject: '',
    taskDescription: '',
    members: []
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState(mode); // 'view' or 'edit'

  // ✅ Check if current user is admin
  const isAdmin = group?.createdBy === currentUser.id;

  useEffect(() => {
    if (group) {
      setFormData({
        groupNumber: group.groupNumber || '',
        groupName: group.groupName || '',
        subject: group.subject || '',
        taskDescription: group.taskDescription || '',
        members: group.members || []
      });
    } else {
      // Auto-add current user as admin when creating new group
      setFormData(prev => ({
        ...prev,
        members: [{
          userId: currentUser.id,
          name: currentUser.name,
          role: 'Leader'
        }]
      }));
    }
  }, [group, currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.groupName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }

    if (!formData.subject.trim()) {
      showToast('Subject is required', 'error');
      return;
    }

    if (!formData.taskDescription.trim()) {
      showToast('Task description is required', 'error');
      return;
    }

    if (group && formData.members.length === 0) {
      showToast('Group must have at least one member', 'error');
      return;
    }

    // Check if there's at least one admin (for editing)
    if (group) {
      const hasAdmin = formData.members.some(m => m.userId === group.createdBy);
      if (!hasAdmin) {
        showToast('Group must have the original admin', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const groupData = {
        groupName: formData.groupName,
        groupNumber: formData.groupNumber,
        subject: formData.subject,
        taskDescription: formData.taskDescription,
        createdBy: currentUser.id,
        ...(group && {
          members: formData.members.map(m => ({
            userId: Number(m.userId),
            name: m.name,
            role: m.role
          }))
        })
      };

      await onSave(groupData);
    } catch (error) {
      console.error('Error in GroupModal handleSubmit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ VIEW MODE RENDER
  if (viewMode === 'view' && group) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-blue-50 border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Group Information</h2>
              <p className="text-sm text-gray-600 mt-1">Read-only view</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Group Number */}
            {formData.groupNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Number/ID
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800">{formData.groupNumber}</p>
                </div>
              </div>
            )}

            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800 font-semibold">{formData.groupName}</p>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800">{formData.subject}</p>
              </div>
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task/Project Description
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px]">
                <p className="text-gray-800 whitespace-pre-wrap">{formData.taskDescription}</p>
              </div>
            </div>

            {/* Members Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Members ({formData.members.length})</span>
              </label>
              
              <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
                {formData.members.map((member) => {
                  const isMemberAdmin = group?.createdBy === member.userId;
                  const isCurrentUserItself = member.userId === currentUser.id;
                  
                  return (
                    <div
                      key={member.userId}
                      className="p-3 bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-full border-2 border-white flex items-center justify-center text-sm font-medium text-white shadow-md">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {member.name}
                            {isCurrentUserItself && (
                              <span className="ml-2 text-xs text-blue-600 font-semibold">(You)</span>
                            )}
                          </p>
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs rounded-full ${
                            isMemberAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                              : member.role === 'Leader'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}>
                            <span>{isMemberAdmin ? '👑' : member.role === 'Leader' ? '⭐' : '👤'}</span>
                            <span className="hidden">{isMemberAdmin ? 'Admin' : member.role || 'Member'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Created Date */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Created:</strong> {new Date(group.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex space-x-3">
            {isAdmin && (
              <button
                onClick={() => setViewMode('edit')}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition font-medium flex items-center justify-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Group</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`${isAdmin ? 'flex-1' : 'w-full'} px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ EDIT MODE RENDER (existing form)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {group ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Number (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Number/ID <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              name="groupNumber"
              value={formData.groupNumber}
              onChange={handleChange}
              placeholder="e.g., Group 1, Team A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
              placeholder="e.g., System Analysis Project Team"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., System Analysis and Design"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task/Project Description *
            </label>
            <textarea
              name="taskDescription"
              value={formData.taskDescription}
              onChange={handleChange}
              rows="4"
              placeholder="Describe what this group is working on..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Members Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Current Members ({formData.members.length})</span>
            </label>
            
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-800">
                ℹ️ <strong>To add new members:</strong> Save the group first, then use the "Invite" button to send invitations by email.
              </p>
            </div>
            
            {/* Members List */}
            <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
             {formData.members.map((member) => {
                const isMemberAdmin = group?.createdBy === member.userId;
                const isCurrentUserItself = member.userId === currentUser.id;
                
                return (
                  <div
                    key={member.userId}
                    className="p-3 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white shadow-md">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {member.name}
                          {isCurrentUserItself && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">(You)</span>
                          )}
                        </p>
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs rounded-full ${
                          isMemberAdmin
                            ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                            : member.role === 'Leader'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                        }`}>
                          <span>{!group && isCurrentUserItself ? '👑' : (isMemberAdmin ? '👑' : member.role === 'Leader' ? '⭐' : '👤')}</span>
                          <span className="hidden sm:inline">{!group && isCurrentUserItself ? 'Admin' : (isMemberAdmin ? 'Admin' : member.role || 'Member')}</span>
                        </span>
                      </div>
                    </div>
                      
                    {group && isAdmin && !isCurrentUserItself && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const newRole = member.role === 'Leader' ? 'Member' : 'Leader';
                            
                            try {
                              const { groupAPI } = await import('../services/api');
                              await groupAPI.changeMemberRole(group.id, member.userId, newRole);
                              showToast(`Role changed to ${newRole}`, 'success');
                              
                              setFormData(prevData => ({
                                ...prevData,
                                members: prevData.members.map(m =>
                                  m.userId === member.userId
                                    ? { ...m, role: newRole }
                                    : m
                                )
                              }));
                            } catch (error) {
                              console.error('Error changing role:', error);
                              showToast('Failed to change role', 'error');
                            }
                          }}
                          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                          title={member.role === 'Leader' ? 'Remove Leader title' : 'Give Leader title'}
                        >
                          {member.role === 'Leader' ? '👤 Make Member' : '⭐ Make Leader'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prevData => ({
                              ...prevData,
                              members: prevData.members.filter(m => m.userId !== member.userId)
                            }));
                            showToast('Member removed', 'info');
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                          title="Remove member (Admin only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Explanation for new groups */}
            {!group && (
              <p className="text-xs text-gray-500 mt-2">
                💡 You'll be added as the group admin. Invite others after creating the group.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Saving...' : group ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupModal;