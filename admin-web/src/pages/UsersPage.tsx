import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { usersAPI } from '../services/api';
import type { UserRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));

const roleBadge = (role: string) => {
  if (role === 'admin') return 'bg-violet-50 text-violet-700 border-violet-200';
  if (role === 'manager') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const selectClass =
  'text-sm border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await usersAPI.getAll());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

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
    if (
      !window.confirm(
        `Are you sure you want to ${newStatus ? 'reactivate' : 'deactivate'} this user?`,
      )
    )
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage staff accounts, roles, and access.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total Users',
              value: users.length,
              color: 'text-slate-900',
            },
            { label: 'Active', value: activeCount, color: 'text-emerald-600' },
            { label: 'Inactive', value: inactiveCount, color: 'text-red-500' },
          ].map((card) => (
            <Card
              key={card.label}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <p className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs uppercase tracking-wider">
                    User
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Role
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Joined
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const isLoading = actionLoading === user.id;
                  return (
                    <TableRow
                      key={user.id}
                      className={`hover:bg-slate-50 ${!user.is_active ? 'opacity-60' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${user.is_active ? 'bg-slate-900' : 'bg-slate-400'}`}
                          >
                            {user.first_name[0]}
                            {user.last_name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">
                                {user.first_name} {user.last_name}
                              </p>
                              {isSelf && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-600 border-blue-200"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${roleBadge(user.role)}`}
                          >
                            {user.role}
                          </Badge>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            disabled={isLoading || !user.is_active}
                            className={selectClass}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                          </select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        {isSelf ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : isLoading ? (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900" />
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusToggle(user.id, user.is_active)
                            }
                            className={`h-7 px-2.5 text-xs ${user.is_active ? 'text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50'}`}
                          >
                            {user.is_active ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const isLoading = actionLoading === user.id;
            return (
              <Card
                key={user.id}
                className={!user.is_active ? 'opacity-60' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${user.is_active ? 'bg-slate-900' : 'bg-slate-400'}`}
                      >
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 text-sm">
                            {user.first_name} {user.last_name}
                          </p>
                          {isSelf && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-600 border-blue-200"
                            >
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-xs text-slate-400">Role</p>
                      <Badge
                        variant="outline"
                        className={`text-xs mt-1 capitalize ${roleBadge(user.role)}`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Joined</p>
                      <p className="text-sm font-medium text-slate-700 mt-0.5">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  {!isSelf && (
                    <div className="flex gap-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={isLoading || !user.is_active}
                        className={`${selectClass} flex-1`}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusToggle(user.id, user.is_active)
                        }
                        disabled={isLoading}
                        className={
                          user.is_active
                            ? 'text-red-600 hover:border-red-200 hover:bg-red-50'
                            : 'text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'
                        }
                      >
                        {isLoading
                          ? '...'
                          : user.is_active
                            ? 'Deactivate'
                            : 'Reactivate'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
