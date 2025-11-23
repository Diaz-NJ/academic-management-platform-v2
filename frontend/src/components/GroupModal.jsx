import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const GroupModal = ({ onClose, onSave, group, currentUser }) => {
  const [formData, setFormData] = useState({
    groupNumber: '',
    groupName: '',
    subject: '',
    taskDescription: '',
    members: []
  });
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('Member');
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

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      showToast('Please enter a member name', 'warning');
      return;
    }

    const newMember = {
      userId: Date.now() + Math.random(),
      name: newMemberName.trim(),
      role: 'Member'
    };

    setFormData(prevData => ({
      ...prevData,
      members: [...prevData.members, newMember]
    }));
    
    setNewMemberName('');
    showToast('Member added', 'success');
  };

  const handleStartEdit = (member) => {
    setEditingMemberId(member.userId);
    setEditMemberName(member.name);
    setEditMemberRole(member.role);
  };

  const handleSaveEdit = () => {
    if (!editMemberName.trim()) {
      showToast('Member name cannot be empty', 'warning');
      return;
    }

    setFormData(prevData => ({
      ...prevData,
      members: prevData.members.map(m => 
        m.userId === editingMemberId 
          ? { ...m, name: editMemberName.trim(), role: editMemberRole }
          : m
      )
    }));

    setEditingMemberId(null);
    setEditMemberName('');
    setEditMemberRole('Member');
    showToast('Member updated', 'success');
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditMemberName('');
    setEditMemberRole('Member');
  };

  const handleRemoveMember = (userId) => {
    setFormData(prevData => ({
      ...prevData,
      members: prevData.members.filter(m => m.userId !== userId)
    }));
    showToast('Member removed', 'info');
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

    if (formData.members.length === 0) {
      showToast('Add at least one member', 'error');
      return;
    }

    // Check if there's at least one leader
    const hasLeader = formData.members.some(m => m.role === 'Leader');
    if (!hasLeader) {
      showToast('Group must have at least one leader', 'error');
      return;
    }

    setLoading(true);

    const groupData = {
      ...formData,
      createdBy: currentUser.id
    };

    try {
      await onSave(groupData);
      showToast(group ? 'Group updated successfully!' : 'Group created successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
      showToast('Failed to save group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    return role === 'Leader' 
      ? 'bg-purple-100 text-purple-800 border border-purple-300' 
      : 'bg-blue-100 text-blue-800 border border-blue-300';
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members ({formData.members.length})
            </label>
            
            {/* Add Member Input */}
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Enter member name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Members List */}
            <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
              {formData.members.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No members added yet
                </div>
              ) : (
                formData.members.map((member) => (
                  <div
                    key={member.userId}
                    className="p-3 hover:bg-gray-50"
                  >
                    {editingMemberId === member.userId ? (
                      // EDIT MODE
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="Member name"
                        />
                        <div className="flex items-center space-x-2">
                          <select
                            value={editMemberRole}
                            onChange={(e) => setEditMemberRole(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          >
                            <option value="Leader">Leader</option>
                            <option value="Member">Member</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // VIEW MODE
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{member.name}</p>
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(member.role)}`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(member)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"
                            title="Edit member"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {member.userId !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.userId)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
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