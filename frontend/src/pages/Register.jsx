import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    section: '' // ✅ Changed: Now empty by default
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      showToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">
            Create Account
          </h2>
          <p className="text-gray-600">
            Join Academic Management Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="e.g., 2021-00123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition"
              required
            />
          </div>

          {/* ✅ CHANGED: Dropdown replaced with text input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course/Year/Section
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="e.g., BSIT 3A, BSCS 4B, BSA 2C"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your course, year, and section (e.g., BSIT 3A)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition"
              required
              minLength={6}
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline font-medium">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;