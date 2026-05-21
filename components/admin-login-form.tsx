"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('2002nischal@gmail.com');
  const [password, setPassword] = useState('abcdefgh');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError('Invalid credentials. Please try again.');
      return;
    }

    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Yellow top strip */}
      <div className="bg-[#EDE735] py-3 px-6">
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Admin Access</span>
      </div>

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left — form */}
        <div className="flex items-center justify-center px-8 sm:px-16 py-16">
          <div className="w-full max-w-sm">
            <div className="mb-12">
              <h1 className="text-4xl font-serif tracking-widest font-normal">DANANA</h1>
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[#696969]">Admin Login</p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-7">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#696969] mb-2">Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-b border-gray-300 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent"
                  type="email"
                  placeholder="admin@email.com"
                  required
                />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#696969] mb-2">Password</div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b border-gray-300 py-2.5 text-sm outline-none focus:border-black transition-colors bg-transparent"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-[#FA5D42] -mt-2">{error}</p>
              )}

              <button
                disabled={loading}
                className="w-full bg-black text-white py-3.5 text-sm font-medium tracking-wide hover:bg-black/80 transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        {/* Right — image */}
        <div className="hidden lg:block relative overflow-hidden bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-10 left-10">
            <p className="text-white text-4xl font-serif tracking-widest">DANANA</p>
            <p className="text-white/70 text-xs uppercase tracking-[0.3em] mt-1">New season collection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
