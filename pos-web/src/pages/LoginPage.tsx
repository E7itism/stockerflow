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
 *
 * DEMO BUTTON:
 * Pre-fills admin@demo.com / demo123 so portfolio viewers can
 * try the POS immediately without creating an account.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authAPI.login(email, password);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleDemoLogin — logs in as the demo admin account directly.
   * Same pattern as STOCKER's demo button — one click, no typing.
   */
  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await authAPI.login('admin@demo.com', 'demo123');
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Demo login failed');
    } finally {
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

        {/* Demo credentials banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
            👋 Portfolio Demo
          </p>
          <p className="text-sm text-green-700 mb-2">
            <span className="font-medium">admin@demo.com</span> / demo123
          </p>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 text-sm font-medium transition-colors"
          >
            {loading ? 'Signing in...' : 'Try Demo Account'}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or sign in manually</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 disabled:bg-gray-400 font-medium transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
