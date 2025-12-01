// frontend/src/components/DiscussionBoard.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { X, Plus, MessageSquare, Pin, Lock, Send, ArrowLeft, Edit, Trash2, MoreVertical, ArrowDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatRelativeDate } from '../utils/dateUtils';
import ConfirmDialog from './ConfirmDialog';

const DiscussionBoard = ({ group, onClose, currentUser, discussionAPI }) => {
  const { showToast } = useToast();
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);
  const [showEditThread, setShowEditThread] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [discussionToDelete, setDiscussionToDelete] = useState(null);

  // ✅ Check if current user is a leader
  const isLeader = group.members?.some(
    m => m.userId === currentUser.id && m.role === 'Leader'
  );

  useEffect(() => {
    loadDiscussions();
  }, [group.id]);

  const loadDiscussions = async () => {
    try {
      const response = await discussionAPI.getDiscussions(group.id);
      setDiscussions(response.data);
    } catch (error) {
      console.error('Error loading discussions:', error);
      showToast('Failed to load discussions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (threadData) => {
    try {
      await discussionAPI.createDiscussion({
        ...threadData,
        groupId: group.id,
        createdBy: currentUser.id
      });
      showToast('Discussion thread created!', 'success');
      setShowNewThread(false);
      loadDiscussions();
    } catch (error) {
      showToast('Failed to create thread', 'error');
    }
  };

  const handleEditThread = async (threadData) => {
    try {
      await discussionAPI.updateDiscussion(editingDiscussion.id, threadData);
      showToast('Discussion updated!', 'success');
      setShowEditThread(false);
      setEditingDiscussion(null);
      loadDiscussions();
      if (selectedDiscussion?.id === editingDiscussion.id) {
        setSelectedDiscussion(null);
      }
    } catch (error) {
      showToast('Failed to update thread', 'error');
    }
  };

  const handleDeleteThread = async () => {
    try {
      await discussionAPI.deleteDiscussion(discussionToDelete.id);
      showToast('Discussion deleted', 'success');
      setShowDeleteConfirm(false);
      setDiscussionToDelete(null);
      loadDiscussions();
      if (selectedDiscussion?.id === discussionToDelete.id) {
        setSelectedDiscussion(null);
      }
    } catch (error) {
      showToast('Failed to delete thread', 'error');
    }
  };

  const handleTogglePin = async (discussion) => {
    try {
      const response = await discussionAPI.togglePin(discussion.id);
      showToast(response.data.isPinned ? 'Thread pinned' : 'Thread unpinned', 'success');
      
      if (selectedDiscussion?.id === discussion.id) {
        setSelectedDiscussion(response.data);
      }
      
      loadDiscussions();
    } catch (error) {
      showToast('Failed to toggle pin', 'error');
    }
  };

  const handleToggleLock = async (discussion) => {
    try {
      const response = await discussionAPI.toggleLock(discussion.id);
      showToast(response.data.isLocked ? 'Thread locked' : 'Thread unlocked', 'success');
      
      if (selectedDiscussion?.id === discussion.id) {
        setSelectedDiscussion(response.data);
      }
      
      loadDiscussions();
    } catch (error) {
      showToast('Failed to toggle lock', 'error');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Discussion Board
                  </h2>
                  <p className="text-sm text-gray-600">
                    {group.groupName} • {discussions.length} threads
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!selectedDiscussion && (
                  <button
                    onClick={() => setShowNewThread(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Thread</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {selectedDiscussion ? (
              <DiscussionThread
                discussion={selectedDiscussion}
                currentUser={currentUser}
                isLeader={isLeader}
                onBack={() => {
                  setSelectedDiscussion(null);
                  loadDiscussions();
                }}
                onEdit={(disc) => {
                  setEditingDiscussion(disc);
                  setShowEditThread(true);
                }}
                onDelete={(disc) => {
                  setDiscussionToDelete(disc);
                  setShowDeleteConfirm(true);
                }}
                onTogglePin={handleTogglePin}
                onToggleLock={handleToggleLock}
                discussionAPI={discussionAPI}
                showToast={showToast}
              />
            ) : (
              <DiscussionList
                discussions={discussions}
                loading={loading}
                currentUser={currentUser}
                isLeader={isLeader}
                onSelectDiscussion={setSelectedDiscussion}
                onEdit={(disc) => {
                  setEditingDiscussion(disc);
                  setShowEditThread(true);
                }}
                onDelete={(disc) => {
                  setDiscussionToDelete(disc);
                  setShowDeleteConfirm(true);
                }}
                onTogglePin={handleTogglePin}
                onToggleLock={handleToggleLock}
                showNewThread={showNewThread}
                onCreateThread={handleCreateThread}
                onCancelNew={() => setShowNewThread(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Edit Thread Modal */}
      {showEditThread && editingDiscussion && (
        <ThreadEditModal
          discussion={editingDiscussion}
          onSave={handleEditThread}
          onCancel={() => {
            setShowEditThread(false);
            setEditingDiscussion(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDiscussionToDelete(null);
        }}
        onConfirm={handleDeleteThread}
        title="Delete Discussion Thread"
        message={`Are you sure you want to delete "${discussionToDelete?.title}"? All messages in this thread will be permanently deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

// ===== DISCUSSION LIST COMPONENT =====
const DiscussionList = ({ 
  discussions, 
  loading, 
  currentUser,
  isLeader,
  onSelectDiscussion, 
  onEdit,
  onDelete,
  onTogglePin,
  onToggleLock,
  showNewThread, 
  onCreateThread, 
  onCancelNew 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateThread({ title, description });
    setTitle('');
    setDescription('');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ FIXED: Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6 pb-40" style={{ position: 'relative' }}>
        {showNewThread && (
          <form onSubmit={handleSubmit} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Create New Thread</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-primary"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What would you like to discuss?"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-primary"
            />
            <div className="flex space-x-2">
              <button 
                type="button" 
                onClick={onCancelNew} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
              >
                Create Thread
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {discussions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Discussions Yet</h3>
              <p className="text-gray-600">Start a new thread to begin the conversation!</p>
            </div>
          ) : (
            discussions.map(discussion => (
              <div
                key={discussion.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition relative z-0"
                style={{ zIndex: openMenuId === discussion.id ? 10 : 0 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectDiscussion(discussion)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {discussion.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
                      {discussion.isLocked && <Lock className="w-4 h-4 text-red-600" />}
                      <h3 className="font-semibold text-gray-800">{discussion.title}</h3>
                    </div>
                    {discussion.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{discussion.description}</p>
                    )}
                  </div>
                  
                  {/* Menu for thread creator or leaders */}
                  {(discussion.createdBy === currentUser.id || isLeader) && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === discussion.id ? null : discussion.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {openMenuId === discussion.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
                          style={{ 
                            maxHeight: '80vh',
                            overflowY: 'auto'
                          }}
                        >
                          {isLeader && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePin(discussion);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm"
                              >
                                <Pin className="w-4 h-4" />
                                <span>{discussion.isPinned ? 'Unpin' : 'Pin'} Thread</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLock(discussion);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm"
                              >
                                <Lock className="w-4 h-4" />
                                <span>{discussion.isLocked ? 'Unlock' : 'Lock'} Thread</span>
                              </button>
                              <div className="border-t border-gray-200 my-1"></div>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(discussion);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit Thread</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(discussion);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Thread</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full ml-2">
                    {discussion.messageCount || 0} replies
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>By {discussion.creatorName || 'Unknown'}</span>
                  <span>{formatRelativeDate(discussion.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ ENHANCED: Footer with scroll hint and design */}
            {discussions.length > 1 && (
            <div className="flex-shrink-0 relative">
                {/* Gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 via-gray-50/50 to-transparent pointer-events-none border-t border-gray-100"></div>
                
                {/* Scroll hint content */}
                <div className="relative p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                    <span>Scroll for more threads</span>
                </div>
                </div>
            </div>
            )}
    </>
  );
};

const DiscussionThread = ({ 
  discussion, 
  currentUser, 
  isLeader,
  onBack, 
  onEdit,
  onDelete,
  onTogglePin,
  onToggleLock,
  discussionAPI, 
  showToast 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  // ✅ NEW: Auto-scroll reference
  const messagesEndRef = React.useRef(null);
  const messageContainerRef = React.useRef(null);
  
  // ✅ NEW: Track if user is near bottom
  const [isNearBottom, setIsNearBottom] = useState(true);

  // ✅ NEW: Load messages with auto-refresh
  useEffect(() => {
    loadMessages();
    
    // ✅ Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      loadMessagesQuietly();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [discussion.id]);

  // ✅ NEW: Scroll to bottom when new messages arrive (only if user was near bottom)
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // ✅ NEW: Track scroll position
  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider "near bottom" if within 100px of bottom
    setIsNearBottom(distanceFromBottom < 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await discussionAPI.getMessages(discussion.id);
      setMessages(response.data);
    } catch (error) {
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Load messages quietly (no loading state)
  const loadMessagesQuietly = async () => {
    try {
      const response = await discussionAPI.getMessages(discussion.id);
      
      // Only update if there are new messages
      if (response.data.length !== messages.length) {
        setMessages(response.data);
      }
    } catch (error) {
      // Silently fail - don't show error toast for background polling
      console.error('Error polling messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await discussionAPI.createMessage({
        discussionId: discussion.id,
        userId: currentUser.id,
        content: newMessage.trim()
      });
      setNewMessage('');
      
      // ✅ Load messages immediately after sending
      loadMessages();
      
      // ✅ Force scroll to bottom when you send a message
      setIsNearBottom(true);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      showToast('Failed to send message', 'error');
    }
  };

  return (
    <>
      {/* Thread Header */}
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button 
                onClick={onBack} 
                className="text-primary hover:underline flex items-center space-x-1 relative"
                >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to threads</span>
                {/* ✅ Show message count */}
                {messages.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {messages.length} messages
                    </span>
                )}
                </button>
          
          {/* Menu for thread creator or leaders */}
          {(discussion.createdBy === currentUser.id || isLeader) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {isLeader && (
                    <>
                      <button
                        onClick={() => {
                          onTogglePin(discussion);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Pin className="w-4 h-4" />
                        <span>{discussion.isPinned ? 'Unpin' : 'Pin'} Thread</span>
                      </button>
                      <button
                        onClick={() => {
                          onToggleLock(discussion);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{discussion.isLocked ? 'Unlock' : 'Lock'} Thread</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      onEdit(discussion);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Thread</span>
                  </button>
                  <button
                    onClick={() => {
                      onDelete(discussion);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Thread</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mb-1">
          {discussion.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
          {discussion.isLocked && <Lock className="w-4 h-4 text-red-600" />}
          <h3 className="text-xl font-bold text-gray-800">{discussion.title}</h3>
        </div>
        {discussion.description && <p className="text-sm text-gray-600">{discussion.description}</p>}
      </div>

      {/* ✅ UPDATED: Messages with scroll tracking */}
      <div 
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No messages yet. Start the discussion!</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {msg.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{msg.userName || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{formatRelativeDate(msg.createdAt)}</p>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            
            {/* ✅ NEW: Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* ✅ NEW: Show "new messages" indicator when not at bottom */}
        {!isNearBottom && messages.length > 0 && (
          <button
            onClick={() => {
              setIsNearBottom(true);
              scrollToBottom();
            }}
            className="fixed bottom-24 right-8 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition flex items-center space-x-2 z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>New messages</span>
          </button>
        )}
      </div>

      {/* Message Input */}
      {!discussion.isLocked ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t bg-red-50 text-center">
          <Lock className="w-6 h-6 mx-auto mb-2 text-red-600" />
          <p className="text-sm text-red-800 font-medium">This thread is locked. No new messages can be posted.</p>
        </div>
      )}
    </>
  );
};

// ===== THREAD EDIT MODAL =====
const ThreadEditModal = ({ discussion, onSave, onCancel }) => {
  const [title, setTitle] = useState(discussion.title);
  const [description, setDescription] = useState(discussion.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Discussion Thread</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thread Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this thread about?"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiscussionBoard;