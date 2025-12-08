import React, { useState, useEffect } from 'react';
import { Mail, Check, X } from 'lucide-react';
import { invitationAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { playNotificationSoundEnhanced } from '../utils/notificationSound';

const InvitationsPanel = ({ userId, onUpdate }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
  loadInvitations();
  
  // ✅ Poll for new invitations every 5 seconds
  const interval = setInterval(() => {
    loadInvitationsQuietly();
  }, 5000);
  
  return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userId]);

const loadInvitationsQuietly = async () => {
  try {
    const response = await invitationAPI.getReceivedInvitations(userId);
    const newData = response.data;
    
    // ✅ FIXED: Only trigger sound for TRULY NEW invitations
    if (invitations.length > 0) { // Only check if we have previous data
      const newInvitationCount = newData.length - invitations.length;
      
      if (newInvitationCount > 0) {
        // ✅ Only play sound if there are MORE invitations than before
        showToast(`🔔 You have ${newInvitationCount} new group invitation(s)!`, 'info');
        playNotificationSoundEnhanced();
      }
    }
    
    // Update state regardless
    setInvitations(newData);
  } catch (error) {
    console.error('Error polling invitations:', error);
  }
};

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
      // ✅ FIXED: Force refresh parent groups
      if (onUpdate) {
        await onUpdate(true); // Pass true to force refresh
      }
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
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-blue-200 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
      <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3 flex items-center">
        <Mail className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
        Group Invitations ({invitations.length})
      </h3>
      <div className="space-y-1.5 md:space-y-2">
        {invitations.map(inv => (
          <div key={inv.id} className="bg-white rounded-lg p-2 md:p-3 flex items-center justify-between shadow-sm">
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm md:text-base font-medium text-gray-800 truncate">{inv.groupName}</p>
              <p className="text-xs md:text-sm text-gray-600 truncate">Invited by {inv.invitedByName}</p>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
              <button
                onClick={() => handleAccept(inv.id)}
                className="p-1.5 md:p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                title="Accept"
              >
                <Check className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <button
                onClick={() => handleReject(inv.id)}
                className="p-1.5 md:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                title="Reject"
              >
                <X className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvitationsPanel;