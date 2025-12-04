import React, { useState, useEffect } from 'react';
import { X, Trash2, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const GroupModal = ({ onClose, onSave, group, currentUser }) => {
  const [formData, setFormData] = useState({
    groupNumber: '',
    groupName: '',
    subject: '',
    taskDescription: '',
    members: []
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

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
      // Auto-add current user as leader when creating new group
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

    // Check if there's at least one leader (for editing)
    if (group) {
      const hasLeader = formData.members.some(m => m.role === 'Leader');
      if (!hasLeader) {
        showToast('Group must have at least one leader', 'error');
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
            
            {/* ✅ UPDATED MEMBERS LIST */}
            <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
              {formData.members.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {group ? 'No members in this group' : 'You will be added as the leader'}
                </div>
              ) : (
                formData.members.map((member) => {
                  // ✅ Check if current user is a leader
                  const currentMember = group?.members?.find(m => m.userId === currentUser.id);
                  const isCurrentUserLeader = currentMember?.role === 'Leader';
                  const isMemberLeader = member.role === 'Leader';
                  const leaderCount = formData.members.filter(m => m.role === 'Leader').length;
                  
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
                          <p className="font-medium text-gray-800">{member.name}</p>
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            member.role === 'Leader' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      
                      {/* ✅ NEW: Role Management - Only for Leaders */}
                      {group && (
                        <div className="flex items-center space-x-2">
                          {/* Show role toggle ONLY if current user is a leader AND not editing themselves */}
                          {isCurrentUserLeader && member.userId !== currentUser.id && (
                            <button
                              type="button"
                              onClick={async () => {
                                // Prevent demoting last leader
                                if (isMemberLeader && leaderCount === 1) {
                                  showToast('Cannot demote the last leader', 'error');
                                  return;
                                }
                                
                                const newRole = isMemberLeader ? 'Member' : 'Leader';
                                
                                try {
                                  const { groupAPI } = await import('../services/api');
                                  await groupAPI.changeMemberRole(group.id, member.userId, newRole);
                                  showToast(`Role changed to ${newRole}`, 'success');
                                  
                                  // Update local state
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
                                  const errorMessage = error.response?.data?.message || 'Failed to change role';
                                  showToast(errorMessage, 'error');
                                }
                              }}
                              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                              title={isMemberLeader ? 'Demote to Member' : 'Promote to Leader'}
                            >
                              {isMemberLeader ? '👤 Make Member' : '⭐ Make Leader'}
                            </button>
                          )}
                          
                          {/* Only show remove button if: 
                              1. Not removing yourself
                              2. Either there are multiple leaders OR this person is not a leader
                          */}
                          {member.userId !== currentUser.id && 
                           (leaderCount > 1 || !isMemberLeader) && (
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
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Explanation for new groups */}
            {!group && (
              <p className="text-xs text-gray-500 mt-2">
                💡 You'll be added as the group leader. Invite others after creating the group.
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