// frontend/src/components/DiscussionBoard.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, MessageSquare, Pin, Lock, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatRelativeDate } from '../utils/dateUtils';

const DiscussionBoard = ({ group, onClose, currentUser, discussionAPI }) => {
  const { showToast } = useToast();
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);

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

  return (
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
        <div className="flex-1 overflow-hidden flex">
          {selectedDiscussion ? (
            <DiscussionThread
              discussion={selectedDiscussion}
              currentUser={currentUser}
              onBack={() => setSelectedDiscussion(null)}
              discussionAPI={discussionAPI}
              showToast={showToast}
            />
          ) : (
            <DiscussionList
              discussions={discussions}
              loading={loading}
              onSelectDiscussion={setSelectedDiscussion}
              showNewThread={showNewThread}
              onCreateThread={handleCreateThread}
              onCancelNew={() => setShowNewThread(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const DiscussionList = ({ discussions, loading, onSelectDiscussion, showNewThread, onCreateThread, onCancelNew }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
    <div className="flex-1 overflow-y-auto p-6">
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
              onClick={() => onSelectDiscussion(discussion)}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {discussion.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
                    {discussion.isLocked && <Lock className="w-4 h-4 text-red-600" />}
                    <h3 className="font-semibold text-gray-800">{discussion.title}</h3>
                  </div>
                  {discussion.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{discussion.description}</p>
                  )}
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
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
  );
};

const DiscussionThread = ({ discussion, currentUser, onBack, discussionAPI, showToast }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [discussion.id]);

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
      loadMessages();
    } catch (error) {
      showToast('Failed to send message', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Thread Header */}
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <button 
          onClick={onBack} 
          className="text-primary hover:underline mb-2 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to threads</span>
        </button>
        <h3 className="text-xl font-bold text-gray-800">{discussion.title}</h3>
        {discussion.description && <p className="text-sm text-gray-600 mt-1">{discussion.description}</p>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
          messages.map(msg => (
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
          ))
        )}
      </div>

      {/* Message Input */}
      {!discussion.isLocked && (
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
      )}
    </div>
  );
};

export default DiscussionBoard;