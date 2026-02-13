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

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Users ({total})</h1>
      <input
        type="text"
        placeholder="Search by email or name..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="mb-4 w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
      />
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-gray-400">
            <tr>
              <th className="py-2">Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Active</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-800">
                <td className="py-2">{u.email}</td>
                <td>{u.displayName || u.firstName || '\u2014'}</td>
                <td>
                  <span className={`rounded px-2 py-0.5 text-xs ${u.role === 'ADMIN' ? 'bg-red-800' : u.role === 'COMPANION' ? 'bg-green-800' : 'bg-gray-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td>{u.isEmailVerified ? 'Yes' : 'No'}</td>
                <td>{u.isActive ? 'Yes' : 'No'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => toggleActive(u.id, u.isActive)}
                    className={`rounded px-2 py-1 text-xs ${u.isActive ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'}`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded bg-gray-700 px-3 py-1 text-sm disabled:opacity-50">Prev</button>
        <span className="px-2 py-1 text-sm text-gray-400">Page {page}</span>
        <button onClick={() => setPage(page + 1)} disabled={users.length < 20} className="rounded bg-gray-700 px-3 py-1 text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
