/**
 * AuthContext.tsx
 *
 * Global authentication state for the entire app.
 * Provides: current user, token, login, register, logout, and loading state.
 *
 * Pattern used: React Context + Provider
 * - AuthProvider wraps the whole app (in App.tsx)
 * - Any component can call useAuth() to access auth state
 * - No prop drilling needed
 *
 * Token storage: localStorage
 * - Persists across page refreshes
 * - Cleared on logout
 * - Automatically attached to API requests via axios interceptor (see api.ts)
 */

import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * loading starts as TRUE, not false.
   *
   * Why? On app startup we need to check localStorage for an existing session.
   * While that check runs, protected routes must NOT redirect to login yet.
   * If loading were false from the start, ProtectedRoute would see
   * isAuthenticated=false and redirect before we've had a chance to restore
   * the session from localStorage.
   *
   * Flow:
   * 1. App loads → loading = true
   * 2. useEffect runs → reads localStorage
   * 3. If token found → restores session
   * 4. loading = false → ProtectedRoute now makes its decision
   */
  const [loading, setLoading] = useState(true);

  /**
   * Restore session from localStorage on app startup.
   *
   * Why JSON.parse inside try/catch?
   * localStorage.getItem('user') returns a string.
   * If that string is somehow corrupted (e.g. partial write),
   * JSON.parse throws an error. We catch it and clear localStorage
   * so the user gets a clean login screen instead of a crashed app.
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // Corrupted data — clear it and force re-login
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false); // Session check complete — safe to render routes now
  }, []);

  /**
   * Login: call API, store token + user in both state and localStorage.
   *
   * Why store in both?
   * - useState: gives React components reactive access (re-renders on change)
   * - localStorage: persists across page refresh
   *
   * The axios interceptor in api.ts reads the token from localStorage
   * automatically for every subsequent request.
   */
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setUser(user);
  };

  /**
   * Logout: clear localStorage AND React state.
   * Both must be cleared — clearing only one leaves a stale session.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token, // converts token string to boolean
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — custom hook to consume auth context.
 *
 * Why throw an error if context is undefined?
 * If a component calls useAuth() without being inside <AuthProvider>,
 * it would silently get undefined and fail in confusing ways.
 * This explicit error makes the mistake obvious immediately.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
