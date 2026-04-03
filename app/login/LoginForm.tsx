'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { createBrowserSupabase } from '../lib/supabase';

export default function LoginForm() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password,
      });

      if (authError) {
        // Map common Supabase error messages to friendly Chinese
        if (authError.message.includes('Invalid login credentials')) {
          setError('邮箱或密码不正确，请重试');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('请先在邮箱中确认注册链接');
        } else {
          setError(authError.message);
        }
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#6B635C]">
          邮箱
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-3.5 py-2.5 text-sm text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[#6B635C]">
          密码
        </label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-3.5 py-2.5 pr-10 text-sm text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C7BFB5] transition hover:text-[#6B635C]"
            aria-label={showPwd ? '隐藏密码' : '显示密码'}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1C1410] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2C2318] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {loading ? '登录中…' : '登录'}
      </button>
    </form>
  );
}
