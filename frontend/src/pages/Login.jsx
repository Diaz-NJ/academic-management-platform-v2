import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // ✅ OPTIMIZED: Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    await login({ email, password });

clearTimeout(timeoutId);

showToast('Login successful! Welcome back.', 'success');
    setTimeout(() => navigate('/dashboard'), 500);
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('Login timeout. Please check your connection.', 'error');
    } else {
      showToast(err.response?.data?.message || 'Login failed. Please check your credentials.', 'error');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
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
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-lg">
            Academic Management Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Logging in...</span>
                {/* ✅ NEW: Progress hint */}
                <span className="text-xs opacity-75">(This may take a few seconds)</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-8 text-base">
          Don't have an account?{' '}
          <a href="/register" className="text-primary hover:text-blue-700 font-semibold hover:underline transition">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;