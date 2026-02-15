'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      setIsSubmitting(true);
      await login(email, password);
      router.push('/dashboard');
    } catch {
      // Error is set in the store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Welcome Back</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Sign in to continue your focus sessions.</p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-[#314f43]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-[#314f43]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field text-sm"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <Link href="/forgot-password" className="text-sm font-medium text-[#0f7a5b] hover:text-[#095f47]">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[#0f7a5b] hover:text-[#095f47]">
          Sign up
        </Link>
      </p>
    </div>
  );
}
