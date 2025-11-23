import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, IdCard, BookOpen, Save, Lock } from 'lucide-react';
import axios from 'axios';

const Settings = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
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

useEffect(() => {
  if (user) {
    // Better name splitting: everything before last space = firstName
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
      const sessionId = localStorage.getItem('sessionId');
      const response = await axios.put(
        `http://localhost:8080/api/auth/users/${user.id}`,
        formData,
        {
          headers: {
            'Session-Id': sessionId,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update local storage with new user data
        const updatedUser = {
          ...user,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          studentId: formData.studentId,
          section: formData.section
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showToast('Profile updated successfully!', 'success');
        
        // Reload page to reflect changes
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
        const sessionId = localStorage.getItem('sessionId');
        const response = await axios.put(
        `http://localhost:8080/api/auth/users/${user.id}/password`,
        {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        },
        {
            headers: {
            'Session-Id': sessionId,
            'Content-Type': 'application/json'
            }
        }
        );

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
      </div>

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
            {/* First Name */}
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

            {/* Last Name */}
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

          {/* Email */}
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

          {/* Student ID */}
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

          {/* Section */}
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

          {/* Save Button */}
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
            {/* Current Password */}
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

            {/* New Password */}
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

            {/* Confirm New Password */}
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

            {/* Change Password Button */}
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
    </div>
  );
};

export default Settings;