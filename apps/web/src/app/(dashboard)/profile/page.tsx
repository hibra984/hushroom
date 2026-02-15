'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient, ApiClientError } from '@/lib/api-client';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    displayName: user?.displayName ?? '',
    preferredLanguage: user?.preferredLanguage ?? 'en',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      await apiClient.patch('/users/me', form);
      setMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-2 sm:py-4">
      <h1 className="mb-2 text-3xl font-bold">Profile</h1>
      <p className="mb-6 text-sm text-[var(--ink-soft)]">
        Manage identity details, language preference, and verification status.
      </p>

      {message && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="surface-card rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-semibold text-[#0f7a5b] hover:text-[#0a6047]"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary rounded-xl px-3 py-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary rounded-xl px-3 py-1 text-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Email</label>
            <p className="text-sm">{user?.email}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Role</label>
            <p className="text-sm capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">First Name</label>
            {isEditing ? (
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="input-field text-sm"
              />
            ) : (
              <p className="text-sm">{user?.firstName || '-'}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Last Name</label>
            {isEditing ? (
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="input-field text-sm"
              />
            ) : (
              <p className="text-sm">{user?.lastName || '-'}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Display Name</label>
            {isEditing ? (
              <input
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                className="input-field text-sm"
              />
            ) : (
              <p className="text-sm">{user?.displayName || '-'}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--ink-soft)]">Language</label>
            {isEditing ? (
              <select
                name="preferredLanguage"
                value={form.preferredLanguage}
                onChange={handleChange}
                className="input-field text-sm"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
              </select>
            ) : (
              <p className="text-sm">{user?.preferredLanguage?.toUpperCase() || '-'}</p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-[#d8e4db] pt-6">
          <h3 className="mb-2 text-sm font-semibold text-[var(--ink-soft)]">Verification Status</h3>
          <div className="flex gap-4">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user?.isEmailVerified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              Email: {user?.isEmailVerified ? 'Verified' : 'Pending'}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user?.isAgeVerified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              Age: {user?.isAgeVerified ? 'Verified' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
