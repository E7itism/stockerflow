/**
 * LoginPage.tsx
 *
 * Entry point for cashiers accessing the POS system.
 *
 * Auth flow:
 *   1. Cashier submits email + password
 *   2. Calls POST /api/auth/login (shared endpoint with STOCKER)
 *   3. On success, stores user + JWT in localStorage under 'pos_user'
 *   4. Redirects to the main POS screen (/)
 *
 * Note: Cashier accounts are created by the admin in STOCKER.
 * There is no self-registration on this app intentionally.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

export default function LoginPage() {
  // Controlled inputs for the login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Error message shown to the user if login fails
  const [error, setError] = useState('');

  // Prevents double submission while the API call is in flight
  const [loading, setLoading] = useState(false);

  // login() saves the user to localStorage and updates auth state
  const { login } = useAuth();

  // Used to redirect to POS screen after successful login
  const navigate = useNavigate();

  /**
   * handleSubmit
   *
   * Sends credentials to the backend. On success, persists the
   * user session and navigates to the POS screen. On failure,
   * displays the error message returned by the API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default HTML form behavior (page reload)
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // authAPI.login returns the full user object including JWT token
      const user = await authAPI.login(email, password);

      // Persist session — stores in localStorage so it survives page refresh
      login(user);

      // Redirect to main cashier screen
      navigate('/');
    } catch (err: any) {
      // Show the server's error message if available, otherwise a fallback
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      // Always re-enable the button whether login succeeded or failed
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Header — green theme distinguishes POS from STOCKER (blue) */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧾 STOCKER POS</h1>
          <p className="text-gray-500 mt-2">Cashier sign in</p>
        </div>

        {/* Error banner — only rendered when there is an error message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {/*
           * Submit button
           * Disabled while loading to prevent duplicate API calls.
           * Text changes to give the user feedback that something is happening.
           */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300 font-medium transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
