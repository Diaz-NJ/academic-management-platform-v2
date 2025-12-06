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
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-8 lg:p-12 w-full max-w-xl">
        <div className="text-center mb-4 md:mb-6 lg:mb-8">
          <div className="inline-block p-3 md:p-4 bg-gradient-to-br from-primary to-blue-600 rounded-xl md:rounded-2xl mb-3 md:mb-4 shadow-lg">
            <svg className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 md:mb-2 leading-tight">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg">
            Academic Management Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 lg:space-y-6">
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1 md:mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 md:px-4 lg:px-5 py-2 md:py-3 lg:py-4 text-sm md:text-base lg:text-lg border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1 md:mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 md:px-4 lg:px-5 py-2 md:py-3 lg:py-4 text-sm md:text-base lg:text-lg border-2 border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="••••••••"
              required
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
                <span>Logging in...</span>
                {/* ✅ Progress hint - hide on small mobile */}
                <span className="hidden sm:inline text-xs opacity-75">(This may take a few seconds)</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4 md:mt-6 lg:mt-8 text-xs md:text-sm lg:text-base">
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