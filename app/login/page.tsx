import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4EFE6] px-4">

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-300/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1C1410]">
            <div className="grid grid-cols-2 gap-[4px]">
              <span className="h-[9px] w-[9px] rounded-[2px] bg-amber-400" />
              <span className="h-[9px] w-[9px] rounded-[2px] bg-amber-400/40" />
              <span className="h-[9px] w-[9px] rounded-[2px] bg-amber-400/40" />
              <span className="h-[9px] w-[9px] rounded-[2px] bg-amber-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1C1512]">OD 项目控制塔</h1>
          <p className="mt-1 text-sm text-[#A8A29E]">HR · Organization Development</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#FFFCF8] p-8 shadow-sm ring-1 ring-[#E5DDD3]">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-[#C7BFB5]">
          仅限内部团队使用
        </p>
      </div>
    </div>
  );
}
