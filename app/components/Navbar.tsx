'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, KeyRound } from 'lucide-react';
import { createBrowserSupabase } from '../lib/supabase';
import type { AuthUser } from '../page';
import ChangePasswordModal from './ChangePasswordModal';

interface Props {
  user: AuthUser;
}

export default function Navbar({ user }: Props) {
  const router = useRouter();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Display name initial (first char)
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <>
    <header className="sticky top-0 z-30 bg-[#1C1410] border-b border-white/5">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-amber-500/20" />
            <div className="relative grid grid-cols-2 gap-[3px]">
              <span className="h-[7px] w-[7px] rounded-[2px] bg-amber-400" />
              <span className="h-[7px] w-[7px] rounded-[2px] bg-amber-400/40" />
              <span className="h-[7px] w-[7px] rounded-[2px] bg-amber-400/40" />
              <span className="h-[7px] w-[7px] rounded-[2px] bg-amber-400" />
            </div>
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-white">
              OD 项目控制塔
            </span>
            <span className="hidden text-[11px] font-medium tracking-widest text-white/30 uppercase sm:block">
              HR · Organization Development
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <div className="mx-2 h-5 w-px bg-white/10" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/8"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[13px] font-bold text-white shadow-sm">
                {initial}
              </div>
              <div className="hidden flex-col items-start leading-none sm:flex">
                <span className="text-[13px] font-medium text-white/80">{user.name}</span>
                <span className="text-[11px] text-white/35">{user.email}</span>
              </div>
              <ChevronDown className={`hidden h-3.5 w-3.5 text-white/30 transition-transform sm:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                {/* Dropdown */}
                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[#E5DDD3] bg-[#FFFCF8] shadow-lg">
                  <div className="border-b border-[#F0EAE1] px-4 py-3">
                    <p className="text-xs font-semibold text-[#1C1512]">{user.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#A8A29E]">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); setShowChangePwd(true); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#6B635C] transition hover:bg-[#F4EFE6] hover:text-[#1C1512]"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    修改密码
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#6B635C] transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    {loggingOut ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>

    <ChangePasswordModal
      open={showChangePwd}
      onClose={() => setShowChangePwd(false)}
    />
    </>
  );
}
