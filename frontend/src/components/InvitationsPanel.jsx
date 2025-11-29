import React, { useState, useEffect } from 'react';
import { Mail, Check, X } from 'lucide-react';
import { invitationAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const InvitationsPanel = ({ userId, onUpdate }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadInvitations();
  }, [userId]);

  const loadInvitations = async () => {
    try {
      const response = await invitationAPI.getReceivedInvitations(userId);
      setInvitations(response.data);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await invitationAPI.acceptInvitation(id);
      showToast('Invitation accepted! You are now a member.', 'success');
      loadInvitations();
      onUpdate();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showToast('Failed to accept invitation', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await invitationAPI.rejectInvitation(id);
      showToast('Invitation rejected', 'info');
      loadInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      showToast('Failed to reject invitation', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading invitations...</span>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
        <Mail className="w-5 h-5 mr-2" />
        Group Invitations ({invitations.length})
      </h3>
      <div className="space-y-2">
        {invitations.map(inv => (
          <div key={inv.id} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{inv.groupName}</p>
              <p className="text-sm text-gray-600">Invited by {inv.invitedByName}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAccept(inv.id)}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                title="Accept"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(inv.id)}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvitationsPanel;