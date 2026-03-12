'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section className="bg-white text-black min-h-[80vh] flex items-center justify-center py-20">
        <div className="max-w-md w-full mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-heading-xl mb-4">PASSWORD UPDATED</h1>
          <p className="font-mono text-sm text-black/60 mb-8">
            Your password has been reset successfully.
          </p>
          <a
            href="/dashboard"
            className="bg-black text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black/80 transition-colors no-underline inline-block"
          >
            GO TO DASHBOARD
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white text-black min-h-[80vh] flex items-center justify-center py-20">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-heading-xl mb-3">RESET PASSWORD</h1>
          <p className="font-mono text-sm text-black/60">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border-2 border-black px-4 py-3 pr-12 font-mono text-sm bg-transparent focus:border-accent focus:outline-none"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-mono text-xs font-semibold uppercase tracking-wider mb-2">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none"
              placeholder="Confirm your password"
            />
          </div>

          {error && (
            <p className="font-mono text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </section>
  );
}
