'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // Jika sukses login, tendang ke halaman dashboard admin
      router.push('/dashboard-admin');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Admin Hub Control
        </h1>
        <p className="text-xs text-slate-500 text-center mb-8 font-mono">AUTHORIZED PERSONNEL ONLY</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 text-red-400 text-xs rounded-lg font-mono">
            ⚠️ Error: {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">EMAIL ADDRESS</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
              placeholder="admin@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-800 text-slate-950 font-semibold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-teal-500/10 font-mono"
          >
            {loading ? 'AUTHENTICATING...' : 'BYPASS INTO SYSTEM'}
          </button>
        </form>
      </div>
    </main>
  );
}