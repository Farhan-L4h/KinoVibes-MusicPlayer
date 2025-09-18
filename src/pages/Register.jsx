import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { signUp, signInWithGoogle } from '../services/auth';
import { useAuthStore } from '../stores/auth';

const Register = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.displayName);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-3000"></div>
      </div>

      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md mx-auto relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8 lg:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-xl lg:rounded-2xl mb-4 lg:mb-6 shadow-2xl">
            <span className="text-2xl lg:text-3xl">🎵</span>
          </div>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 lg:mb-3 tracking-tight">
            Join <span className="text-gray-400">KinoVibe</span>
          </h1>
          <p className="text-gray-400 text-sm lg:text-base">Create your music journey today</p>
        </div>

        {/* Register Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 lg:p-4 rounded-xl mb-4 lg:mb-6 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
            <div>
              <label className="block text-gray-300 text-sm lg:text-base font-medium mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 pl-10 lg:pl-12 pr-4 py-3 lg:py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-600 text-sm lg:text-base"
                  placeholder="Enter your display name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm lg:text-base font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 pl-10 lg:pl-12 pr-4 py-3 lg:py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-600 text-sm lg:text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm lg:text-base font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 pl-10 lg:pl-12 pr-10 lg:pr-12 py-3 lg:py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-600 text-sm lg:text-base"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm lg:text-base font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 pl-10 lg:pl-12 pr-10 lg:pr-12 py-3 lg:py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-600 text-sm lg:text-base"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 lg:py-4 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] mt-4 lg:mt-6 text-sm lg:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-black mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 lg:my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 lg:px-4 bg-gray-900/50 text-gray-400 text-xs lg:text-sm">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Register */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-gray-800 border border-gray-700 text-white font-semibold py-3 lg:py-4 rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Login link */}
          <div className="mt-4 lg:mt-6 text-center">
            <p className="text-gray-400 text-sm lg:text-base">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-gray-300 font-semibold underline underline-offset-4 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;