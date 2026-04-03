'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, KeyRound } from 'lucide-react';
import { createBrowserSupabase } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setNewPwd(''); setConfirmPwd('');
    setError(null); setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPwd.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error: authError } = await supabase.auth.updateUser({ password: newPwd });
      if (authError) {
        setError(authError.message);
        return;
      }
      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl bg-[#FFFCF8] p-6 shadow-xl ring-1 ring-[#E5DDD3]">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
              <KeyRound className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-[#1C1512]">修改密码</h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#A8A29E] transition hover:bg-[#F4EFE6] hover:text-[#1C1512]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-2 text-2xl">✓</div>
            <p className="font-semibold text-emerald-700">密码修改成功</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6B635C]">
                新密码
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="至少 6 位"
                  className="w-full rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-3.5 py-2.5 pr-10 text-sm text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C7BFB5] transition hover:text-[#6B635C]"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6B635C]">
                确认新密码
              </label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-3.5 py-2.5 pr-10 text-sm text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C7BFB5] transition hover:text-[#6B635C]"
                >
                  {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2.5 text-sm font-semibold text-[#6B635C] transition hover:bg-[#EDE9E3]"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !newPwd || !confirmPwd}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1C1410] py-2.5 text-sm font-semibold text-white transition hover:bg-[#2C2318] disabled:opacity-50"
              >
                {loading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {loading ? '保存中…' : '确认修改'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
