import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Check, Unlink, Link } from 'lucide-react';
import { taskAPI, groupAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const TaskIntegrationModal = ({ task, onClose, onUpdate, userId }) => {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    loadGroups();
  }, [userId]);

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getGroups(userId);
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
      showToast('Failed to load groups', 'error');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleAddToCalendar = async () => {
    setLoading(true);
    try {
      await taskAPI.addToCalendar(task.id);
      showToast('Task added to calendar!', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error adding to calendar:', error);
      showToast(error.response?.data?.message || 'Failed to add to calendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCalendar = async () => {
    setLoading(true);
    try {
      await taskAPI.removeFromCalendar(task.id);
      showToast('Task removed from calendar', 'info');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error removing from calendar:', error);
      showToast(error.response?.data?.message || 'Failed to remove from calendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToGroup = async (groupId) => {
    setLoading(true);
    try {
      await taskAPI.linkToGroup(task.id, groupId);
      showToast('Task linked to group!', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error linking to group:', error);
      showToast('Failed to link to group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkFromGroup = async () => {
    setLoading(true);
    try {
      await taskAPI.unlinkFromGroup(task.id);
      showToast('Task unlinked from group', 'info');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error unlinking from group:', error);
      showToast('Failed to unlink from group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Manage Task Connections
              </h2>
              <p className="text-sm text-gray-600">
                Link "{task.title}" to calendar or groups
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Calendar Section */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Calendar Integration</h3>
                  <p className="text-sm text-gray-600">
                    {task.showOnCalendar 
                      ? '✅ Currently on calendar' 
                      : 'Show this task on your calendar'}
                  </p>
                </div>
              </div>
            </div>

            {task.showOnCalendar ? (
              <div className="space-y-3">
                <div className="bg-white border border-blue-300 rounded-lg p-3">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Status:</strong> This task appears on your calendar as a deadline event.
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Due:</strong> {new Date(task.dueDate).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={handleRemoveFromCalendar}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  <Unlink className="w-4 h-4" />
                  <span>{loading ? 'Removing...' : 'Remove from Calendar'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCalendar}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                <span>{loading ? 'Adding...' : 'Add to Calendar'}</span>
              </button>
            )}
          </div>

          {/* Groups Section */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Group Assignment</h3>
                <p className="text-sm text-gray-600">
                  {task.groupId 
                    ? '✅ Linked to a group' 
                    : 'Assign this task to a group'}
                </p>
              </div>
            </div>

            {loadingGroups ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-white border border-purple-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">
                  No groups available. Create a group first to link tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {task.groupId && (
                  <div className="bg-white border border-purple-300 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Current Group:</strong> {groups.find(g => g.id === task.groupId)?.groupName || 'Unknown'}
                    </p>
                    <button
                      onClick={handleUnlinkFromGroup}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm disabled:opacity-50"
                    >
                      <Unlink className="w-4 h-4" />
                      <span>{loading ? 'Unlinking...' : 'Unlink from Group'}</span>
                    </button>
                  </div>
                )}

                <div className="bg-white border border-purple-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {task.groupId ? 'Change to another group:' : 'Select a group:'}
                  </p>
                  <div className="space-y-2">
                    {groups
                      .filter(g => g.id !== task.groupId)
                      .map(group => (
                        <button
                          key={group.id}
                          onClick={() => handleLinkToGroup(group.id)}
                          disabled={loading}
                          className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-left disabled:opacity-50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{group.groupName}</p>
                            <p className="text-xs text-gray-600">{group.subject}</p>
                          </div>
                          <Check className="w-5 h-5 text-purple-600" />
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskIntegrationModal;