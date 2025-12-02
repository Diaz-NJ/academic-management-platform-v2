// frontend/src/hooks/useUnreadMessages.js
import { useState, useEffect, useCallback } from 'react';
import { discussionAPI } from '../services/api';

/**
 * Hook to track unread messages across all discussions in a group
 */
export const useUnreadMessages = (groupId, userId) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load unread counts for all discussions
  const loadUnreadCounts = useCallback(async () => {
    if (!groupId || !userId) return;
    
    try {
      const response = await discussionAPI.getGroupUnreadCounts(groupId, userId);
      
      if (response.data.success) {
        const counts = response.data.unreadCounts;
        setUnreadCounts(counts);
        
        // Calculate total unread
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        setTotalUnread(total);
      }
    } catch (error) {
      console.error('Error loading unread counts:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, userId]);

  // Load on mount
  useEffect(() => {
    loadUnreadCounts();
  }, [loadUnreadCounts]);

  // Get unread count for a specific discussion
  const getUnreadCount = useCallback((discussionId) => {
    return unreadCounts[discussionId] || 0;
  }, [unreadCounts]);

  // Mark a discussion as read
  const markAsRead = useCallback(async (discussionId) => {
    if (!discussionId || !userId) return;
    
    try {
      await discussionAPI.markDiscussionAsRead(discussionId, userId);
      
      // Update local state immediately
      setUnreadCounts(prev => ({
        ...prev,
        [discussionId]: 0
      }));
      
      // Recalculate total
      setTotalUnread(prev => Math.max(0, prev - (unreadCounts[discussionId] || 0)));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [userId, unreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    loading,
    getUnreadCount,
    markAsRead,
    refresh: loadUnreadCounts
  };
};

export default useUnreadMessages;