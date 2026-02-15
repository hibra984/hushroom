'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        dateOfBirth: form.dateOfBirth,
      });
      router.push('/dashboard');
    } catch {
      // Error is set in the store
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div>
      <h2 className="text-2xl font-bold">Create Your Account</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Start with a profile and book your first structured focus session.
      </p>

      {displayError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-semibold text-[#314f43]">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={handleChange}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-semibold text-[#314f43]">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleChange}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-[#314f43]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="input-field text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="mb-1 block text-sm font-semibold text-[#314f43]">
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            value={form.dateOfBirth}
            onChange={handleChange}
            className="input-field text-sm"
          />
          <p className="mt-1 text-xs text-[var(--ink-soft)]">You must be at least 18 years old.</p>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-[#314f43]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            className="input-field text-sm"
            placeholder="Min 8 characters, uppercase, lowercase, number"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            className="input-field text-sm"
          />
        </div>

        <div className="rounded-xl border border-[#d6e6dc] bg-[#f5fbf7] p-3 text-xs text-[#3f5f52]">
          By creating an account, you confirm that this is{' '}
          <strong>not therapy, coaching, or medical advice</strong>. Hushroom provides structured
          human presence only.
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#0f7a5b] hover:text-[#095f47]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
