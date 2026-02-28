/**
 * UsersPage.tsx
 *
 * Admin-only page for managing user accounts.
 *
 * WHAT THIS PAGE DOES:
 * - Lists all users with their role, status, and join date
 * - Allows admins to change any user's role (except their own)
 * - Allows admins to deactivate / reactivate accounts (except their own)
 * - Shows a "You" badge on the current user's row so they know which is theirs
 *
 * WHAT IT DOES NOT DO:
 * - Create new users (that's what RegisterPage is for — or a future invite flow)
 * - Delete users (soft delete only — data preservation)
 * - Edit passwords (security concern — separate reset flow if needed later)
 */

import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { usersAPI, UserRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Format an ISO timestamp as a short date. */
const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));

/** Role badge colors — consistent with the rest of the app's color system. */
const roleBadgeClass = (role: string): string => {
  if (role === 'admin') return 'bg-purple-100 text-purple-700';
  if (role === 'manager') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600'; // staff
};

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Per-user loading state — tracks which user row has a pending action.
   * This lets us show a spinner on just the affected row without
   * blocking the entire page.
   */
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersAPI.getAll();
      console.log(data);
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  /**
   * handleRoleChange — updates a user's role via the API,
   * then updates local state so the UI reflects the change immediately
   * without a full refetch.
   *
   * WHY update local state instead of refetching?
   * Refetching would cause the whole list to flash/reload for a small change.
   * Optimistic/immediate local update feels faster and smoother.
   */
  const handleRoleChange = async (userId: number, newRole: string) => {
    setActionLoading(userId);
    try {
      const updated = await usersAPI.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
      );
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'reactivate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${action} this user?`))
      return;

    setActionLoading(userId);
    try {
      const updated = await usersAPI.updateStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: updated.is_active } : u,
        ),
      );
      toast.success(newStatus ? 'User reactivated' : 'User deactivated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // LOADING / ERROR STATES
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        </div>
      </Layout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* ── Page Header ──────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage staff accounts, roles, and access.
          </p>
        </div>

        {/* ── Summary Strip ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              Total Users
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              Active
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <p className="text-2xl font-bold text-red-500">{inactiveCount}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              Inactive
            </p>
          </div>
        </div>

        {/* ── Users Table (Desktop) ─────────────────────────────── */}
        <div className="hidden md:block">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const isLoading = actionLoading === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-60' : ''}`}
                    >
                      {/* User info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/**
                           * Avatar with initials — consistent with Navbar pattern.
                           * Color changes for inactive users to visually
                           * reinforce their deactivated state.
                           */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                              user.is_active ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                          >
                            {user.first_name[0]}
                            {user.last_name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              {/**
                               * "You" badge — helps admin identify their own row.
                               * Also serves as a visual reminder that they
                               * can't edit their own account.
                               */}
                              {isSelf && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role selector */}
                      <td className="px-6 py-4">
                        {isSelf ? (
                          // Can't change own role — show static badge
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadgeClass(user.role)}`}
                          >
                            {user.role}
                          </span>
                        ) : (
                          /**
                           * Role dropdown — updates immediately on change.
                           * Disabled while any action is loading on this row.
                           */
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            disabled={isLoading || !user.is_active}
                            className={`text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${roleBadgeClass(user.role)}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                          </select>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Join date */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        {isSelf ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : isLoading ? (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusToggle(user.id, user.is_active)
                            }
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              user.is_active
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Users Cards (Mobile) ──────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const isLoading = actionLoading === user.id;

            return (
              <div
                key={user.id}
                className={`bg-white rounded-lg shadow-md p-4 ${!user.is_active ? 'opacity-60' : ''}`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        user.is_active ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                    >
                      {user.first_name[0]}
                      {user.last_name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        {isSelf && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <p>
                      <span
                        className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <p className="text-gray-900 font-medium">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {!isSelf && (
                  <div className="flex gap-2">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      disabled={isLoading || !user.is_active}
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                    <button
                      onClick={() =>
                        handleStatusToggle(user.id, user.is_active)
                      }
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        user.is_active
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isLoading
                        ? '...'
                        : user.is_active
                          ? 'Deactivate'
                          : 'Reactivate'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};
