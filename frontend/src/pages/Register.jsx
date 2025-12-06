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
    section: ''
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
    // ✅ OPTIMIZED: Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    await register(formData);
    
    clearTimeout(timeoutId);
    
    showToast('Registration successful! Please login.', 'success');
    navigate('/login');
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('Registration timeout. Please try again.', 'error');
    } else {
      showToast(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-2 md:p-4 relative"
      style={{
        backgroundImage: 'url(/images/bg-chalkboard.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* ✨ Overlay for transparency/dimming */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-blue-900/80"></div>
      
      {/* ✨ Content */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-8 lg:p-12 w-full max-w-2xl my-4 md:my-8">
        <div className="text-center mb-4 md:mb-6 lg:mb-8">
          <div className="inline-block p-3 md:p-4 bg-gradient-to-br from-primary to-blue-600 rounded-xl md:rounded-2xl mb-3 md:mb-4 shadow-lg">
            <svg className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 md:mb-2 leading-tight">
            Create Account
          </h2>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg">
            Join Academic Management Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 lg:space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-5">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
              Student ID *
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="e.g., 2021-00123"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
              Course/Year/Section *
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="e.g., BSIT 3A, BSCS 4B, BSA 2C"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary transition"
              required
            />
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">
              Enter your course, year, and section
            </p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary transition"
              required
              minLength={6}
              placeholder="••••••••"
            />
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">At least 6 characters</p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary transition"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-2.5 md:py-3 lg:py-4 rounded-lg md:rounded-xl hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm md:text-base lg:text-lg flex items-center justify-center space-x-2 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 border-b-2 border-white"></div>
                <span className="text-xs md:text-sm lg:text-base">Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4 md:mt-6 lg:mt-8 text-xs md:text-sm lg:text-base">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:text-blue-700 font-semibold hover:underline transition">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;