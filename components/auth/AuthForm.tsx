'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // Debug: check if env vars are reaching the client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Debug check
    if (!supabaseUrl || !hasAnonKey) {
      setError(`Config missing — URL: ${supabaseUrl || 'MISSING'}, Key: ${hasAnonKey ? 'set' : 'MISSING'}`);
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      const detail = JSON.stringify({
        message: errObj?.message,
        status: errObj?.status,
        name: errObj?.name,
        code: errObj?.code,
        stack: typeof errObj?.stack === 'string' ? errObj.stack.split('\n').slice(0, 3).join(' | ') : undefined,
      });
      console.error('Auth error detail:', detail, err);
      setError(errObj?.message as string || `Auth error: ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === 'signup' && (
        <div>
          <label htmlFor="displayName" className="block font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            Artist / Display Name *
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none"
            placeholder="Your name or artist name"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block font-mono text-xs font-semibold uppercase tracking-wider mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block font-mono text-xs font-semibold uppercase tracking-wider mb-2">
          Password *
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full border-2 border-black px-4 py-3 font-mono text-sm bg-transparent focus:border-accent focus:outline-none"
          placeholder="Min 6 characters"
        />
      </div>

      {error && (
        <p className="font-mono text-sm text-red-600">{error}</p>
      )}

      {message && (
        <p className="font-mono text-sm text-green-700">{message}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black/80 transition-colors disabled:opacity-50"
      >
        {loading ? 'LOADING...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
          className="font-mono text-sm text-black/60 hover:text-accent transition-colors underline"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </form>
  );
}
