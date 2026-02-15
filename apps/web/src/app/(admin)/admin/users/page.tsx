'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ users: AdminUser[]; total: number }>(
        `/admin/users?page=${page}&limit=20&search=${search}`,
      );
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (userId: string, isActive: boolean) => {
    await apiClient.patch(`/admin/users/${userId}`, { isActive: !isActive });
    fetchUsers();
  };

  const roleStyles: Record<string, string> = {
    ADMIN: 'bg-[#ffe9e7] text-[#a03a2a]',
    COMPANION: 'bg-[#dff6ed] text-[#0f7054]',
    USER: 'bg-[#edf3ef] text-[#556b61]',
  };

  return (
    <div className="py-2 sm:py-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{total} account(s) across the platform.</p>
        </div>
      </div>

      <div className="glass-shell mb-5 rounded-2xl p-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-soft)]">
          Search
        </label>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Loading users...</p>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#d9e5dc] bg-[#f3f8f4] text-[var(--ink-soft)]">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#e2ece4] last:border-b-0 hover:bg-[#f8fcf9]">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.displayName || u.firstName || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        roleStyles[u.role] || roleStyles.USER
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.isEmailVerified ? 'bg-[#dff6ed] text-[#0f7054]' : 'bg-[#fff4dd] text-[#8c6421]'
                      }`}
                    >
                      {u.isEmailVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.isActive ? 'bg-[#dff6ed] text-[#0f7054]' : 'bg-[#ffe9e7] text-[#a03a2a]'
                      }`}
                    >
                      {u.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        u.isActive
                          ? 'border border-red-200 text-red-600 hover:bg-red-50'
                          : 'bg-[#0f7e5f] text-white hover:bg-[#0d6d52]'
                      }`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="btn-secondary rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1 text-sm text-[var(--ink-soft)]">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={users.length < 20}
          className="btn-secondary rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
