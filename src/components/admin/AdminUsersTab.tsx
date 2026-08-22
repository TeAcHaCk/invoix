import React, { useState, useEffect } from 'react';
import {
  fetchAdminUsersList,
  updateUserPlanOrRole,
} from '../../services/adminService';
import type { UserProfile } from '../../context/AuthContext';
import {
  Search,
  Ban,
  Filter,
  Loader2,
  Crown,
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'all' | 'free' | 'pro' | 'agency' | 'admin'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    const list = await fetchAdminUsersList();
    setUsers(list);
    setFilteredUsers(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let result = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.business_name && u.business_name.toLowerCase().includes(q))
      );
    }

    if (selectedPlanFilter !== 'all') {
      if (selectedPlanFilter === 'admin') {
        result = result.filter((u) => u.role === 'admin' || u.role === 'superadmin');
      } else {
        result = result.filter((u) => u.plan === selectedPlanFilter);
      }
    }

    setFilteredUsers(result);
  }, [searchQuery, selectedPlanFilter, users]);

  const handlePlanChange = async (userId: string, newPlan: 'free' | 'pro' | 'agency' | 'enterprise') => {
    setUpdatingUserId(userId);
    const success = await updateUserPlanOrRole(userId, { plan: newPlan });
    if (success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
      );
    }
    setUpdatingUserId(null);
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setUpdatingUserId(userId);
    const success = await updateUserPlanOrRole(userId, { role: newRole });
    if (success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
    setUpdatingUserId(null);
  };

  const handleToggleSuspend = async (user: UserProfile) => {
    const nextState = !user.is_suspended;
    if (
      window.confirm(
        `Are you sure you want to ${nextState ? 'SUSPEND' : 'RE-ACTIVATE'} ${user.email}?`
      )
    ) {
      setUpdatingUserId(user.id);
      const success = await updateUserPlanOrRole(user.id, { is_suspended: nextState });
      if (success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_suspended: nextState } : u))
        );
      }
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter & Search Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, business or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Plan Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {(['all', 'free', 'pro', 'agency', 'admin'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedPlanFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedPlanFilter === filter
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading user database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No users found matching your search query or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 font-['Outfit']">
                <tr>
                  <th className="px-6 py-3.5">User & Business</th>
                  <th className="px-6 py-3.5">Plan Tier</th>
                  <th className="px-6 py-3.5">System Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-['Plus_Jakarta_Sans',sans-serif]">
                {filteredUsers.map((u) => {
                  const isBusy = updatingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 flex items-center justify-center font-bold text-sm">
                            {u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 flex items-center space-x-1.5">
                              <span>{u.business_name || 'Studio Owner'}</span>
                              {u.role === 'admin' || u.role === 'superadmin' ? (
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                              ) : null}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          disabled={isBusy}
                          value={u.plan}
                          onChange={(e) => handlePlanChange(u.id, e.target.value as any)}
                          className={`bg-slate-950 border rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider focus:outline-none ${
                            u.plan === 'agency'
                              ? 'text-purple-300 border-purple-500/40'
                              : u.plan === 'pro'
                              ? 'text-amber-300 border-amber-500/40'
                              : 'text-slate-400 border-slate-700'
                          }`}
                        >
                          <option value="free">Free Tier (3 quotes/mo)</option>
                          <option value="pro">Pro Plan ($9/mo)</option>
                          <option value="agency">Agency Plan ($29/mo)</option>
                          <option value="enterprise">Enterprise VIP</option>
                        </select>
                      </td>

                      {/* Role Dropdown */}
                      <td className="px-6 py-4">
                        <select
                          disabled={isBusy}
                          value={u.role === 'superadmin' ? 'admin' : u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 focus:outline-none"
                        >
                          <option value="user">Standard User</option>
                          <option value="admin">Platform Admin</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {u.is_suspended ? (
                          <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleSuspend(u)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.is_suspended
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-red-400 hover:border-red-500/40'
                          }`}
                          title={u.is_suspended ? 'Re-activate Account' : 'Suspend User Access'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
