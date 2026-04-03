import { LayoutDashboard, FolderKanban, Users, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: '总览', active: true },
  { icon: FolderKanban, label: '项目', active: false },
  { icon: Users, label: '成员', active: false },
  { icon: BarChart3, label: '报告', active: false },
];

const teamMembers = [
  { name: '张雪', initials: '张', bg: 'bg-violet-100', text: 'text-violet-700', online: true },
  { name: '李明', initials: '李', bg: 'bg-sky-100', text: 'text-sky-700', online: true },
  { name: '王芳', initials: '王', bg: 'bg-rose-100', text: 'text-rose-700', online: false },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[220px] flex-col border-r border-slate-200/80 bg-white">
      {/* Brand */}
      <div className="flex h-[56px] shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
          <LayoutDashboard className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[13.5px] font-semibold tracking-tight text-slate-800">
          OD 项目控制塔
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.label}>
              <span
                className={`flex w-full cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  item.active
                    ? 'bg-violet-50 font-semibold text-violet-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon className="h-[15px] w-[15px] shrink-0" />
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        {/* Team members */}
        <div className="mt-7">
          <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            团队成员
          </p>
          <ul className="space-y-0.5">
            {teamMembers.map((m) => (
              <li key={m.name}>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-1.5">
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${m.bg} ${m.text}`}
                    >
                      {m.initials}
                    </div>
                    {m.online && (
                      <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full bg-emerald-400 ring-[1.5px] ring-white" />
                    )}
                  </div>
                  <span className="text-[13px] text-slate-600">{m.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
            张
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-slate-700">张雪</p>
            <p className="truncate text-[11px] text-slate-400">HR OD 团队</p>
          </div>
          <Settings className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </div>
      </div>
    </aside>
  );
}
