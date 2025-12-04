// frontend/src/pages/Settings.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, IdCard, BookOpen, Save, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { authAPI } from '../services/api'; // ✅ FIXED: Use centralized API
import axios from 'axios';

const Settings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    section: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete Account State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const nameParts = user.name.trim().split(' ');
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
      
      setFormData({
        firstName: lastName ? firstName : nameParts[0] || '',
        lastName: lastName,
        email: user.email || '',
        studentId: user.studentId || '',
        section: user.section || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ FIXED: Use centralized API instead of axios directly
      const response = await authAPI.updateUser(user.id, formData);

      if (response.data.success) {
        const updatedUser = {
          ...user,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          studentId: formData.studentId,
          section: formData.section
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showToast('Profile updated successfully!', 'success');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    
    setPasswordLoading(true);

    try {
      // ✅ FIXED: Use centralized API
      const response = await authAPI.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        showToast('Password changed successfully!', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      showToast(errorMessage, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
  e.preventDefault();
  
  if (!deletePassword) {
    showToast('Please enter your password', 'error');
    return;
  }

  setDeleteLoading(true);

  try {
    const sessionId = localStorage.getItem('sessionId');
    
    // ✅ FIX: Use the correct API URL
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    
    const response = await axios.delete(
      `${API_URL}/auth/users/${user.id}`,
      {
        headers: {
          'Session-Id': sessionId,
          'Content-Type': 'application/json'
        },
        data: {
          password: deletePassword
        }
      }
    );

    if (response.data.success) {
      showToast('Account deleted successfully', 'success');
      
      // Clear local storage
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      
      // Redirect to login after short delay
      setTimeout(() => {
        navigate('/login');
        window.location.reload();
      }, 1500);
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    const errorMessage = error.response?.data?.message || 'Failed to delete account';
    showToast(errorMessage, 'error');
    setDeletePassword('');
  } finally {
    setDeleteLoading(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
      </div>

      {/* Profile Information Section */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{user?.name}</h3>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <IdCard className="w-4 h-4 inline mr-1" />
              Student ID *
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Course/Year/Section *
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="e.g., BSIT 3A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Change Password
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full md:w-auto px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              <Lock className="w-5 h-5" />
              <span>{passwordLoading ? 'Changing...' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Note</h4>
        <p className="text-blue-800 text-sm">
          Changes to your profile will take effect immediately. Make sure your email is correct as it's used for login.
        </p>
      </div>

      {/* Delete Account Section */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-2xl">
        <h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
          <Trash2 className="w-5 h-5 mr-2" />
          Delete Account
        </h3>
        
        <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-2">
                Warning: This action is permanent
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• All your tasks will be permanently deleted</li>
                <li>• All your events will be permanently deleted</li>
                <li>• All your groups will be permanently deleted</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center space-x-2"
        >
          <Trash2 className="w-5 h-5" />
          <span>Delete My Account</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Delete Account?
                  </h3>
                  <p className="text-sm text-gray-600">
                    This will permanently delete your account and all associated data.
                  </p>
                </div>
              </div>

              {/* Password Confirmation */}
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium mb-3">
                    ⚠️ To confirm deletion, please enter your password:
                  </p>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeletePassword('');
                    }}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || !deletePassword}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Forever</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                This action cannot be undone. Please be certain.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;