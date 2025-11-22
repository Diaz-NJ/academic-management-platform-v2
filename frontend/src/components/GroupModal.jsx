import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
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
      // Auto-add current user as admin when creating new group
      setFormData(prev => ({
        ...prev,
        members: [{
          userId: currentUser.id,
          name: currentUser.name,
          role: 'Admin'
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
      userId: Date.now(), // Temporary ID for now
      name: newMemberName.trim(),
      role: 'Member'
    };

    setFormData({
      ...formData,
      members: [...formData.members, newMember]
    });
    setNewMemberName('');
  };

  const handleRemoveMember = (userId) => {
    setFormData({
      ...formData,
      members: formData.members.filter(m => m.userId !== userId)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.groupName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }

    if (formData.members.length === 0) {
      showToast('Add at least one member', 'error');
      return;
    }

    setLoading(true);

    const groupData = {
      ...formData,
      createdBy: currentUser.id
    };

    onSave(groupData);
    setLoading(false);
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
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
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
            <div className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
              {formData.members.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No members added yet
                </div>
              ) : (
                formData.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    {member.userId !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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