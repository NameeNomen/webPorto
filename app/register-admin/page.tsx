'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Daftarkan user baru ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Otomatis ngirim email konfirmasi buat bikin password/aktivasi
        emailRedirectTo: `${window.location.origin}/login-admin`,
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSuccessMsg('Registrasi Sukses! Silakan cek kotak masuk email lu buat konfirmasi akun sebelum login.');
      setLoading(false);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Create Vendor Account
        </h1>
        <p className="text-xs text-slate-500 text-center mb-8 font-mono">START SELLING INTERACTIVE PORTFOLIO</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 text-red-400 text-xs rounded-lg font-mono">
            ⚠️ Error: {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 text-xs rounded-lg font-mono">
            🎉 {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">YOUR EMAIL ADDRESS</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
              placeholder="client@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">CREATE PASSWORD</label>
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
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:from-teal-800 disabled:to-emerald-800 text-slate-950 font-semibold py-3 rounded-xl text-sm transition-colors shadow-lg font-mono"
          >
            {loading ? 'PROCESSING...' : 'REGISTER ACCOUNT'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 mt-6">
          Sudah punya akun?{' '}
          <span onClick={() => router.push('/login-admin')} className="text-teal-400 hover:underline cursor-pointer">
            Login di sini
          </span>
        </p>
      </div>
    </main>
  );
}