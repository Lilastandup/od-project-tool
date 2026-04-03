import { FolderOpen, ShieldAlert, CalendarClock } from 'lucide-react';
import type { Project, Milestone } from '../lib/types';

interface Props {
  projects: Project[];
  milestones: Milestone[];
}

export default function StatsCards({ projects, milestones }: Props) {
  const activeCount = projects.length;
  const atRiskCount = projects.filter(
    (p) => p.health === 'yellow' || p.health === 'red'
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekLater = new Date(today);
  weekLater.setDate(today.getDate() + 7);

  const weekMilestones = milestones.filter((m) => {
    if (m.isCompleted || !m.dueDate) return false;
    const due = new Date(m.dueDate);
    return due >= today && due <= weekLater;
  });

  const cards = [
    {
      label: '进行中项目',
      value: activeCount,
      unit: '个',
      description: '并行推进中',
      icon: FolderOpen,
      accentTop: 'bg-sky-500',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      valueColor: 'text-[#1C1512]',
    },
    {
      label: '存在风险',
      value: atRiskCount,
      unit: '个',
      description: '需重点关注',
      icon: ShieldAlert,
      accentTop: 'bg-amber-500',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: atRiskCount > 0 ? 'text-amber-700' : 'text-[#1C1512]',
    },
    {
      label: '本周截止里程碑',
      value: weekMilestones.length,
      unit: '项',
      description: '7天内到期',
      icon: CalendarClock,
      accentTop: 'bg-rose-500',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      valueColor: weekMilestones.length > 0 ? 'text-rose-700' : 'text-[#1C1512]',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative overflow-hidden rounded-2xl bg-[#FFFCF8] shadow-sm ring-1 ring-[#E5DDD3]"
        >
          {/* Top accent stripe */}
          <div className={`absolute inset-x-0 top-0 h-0.5 ${card.accentTop}`} />

          <div className="flex items-start gap-4 px-5 py-4 pt-5">
            {/* Icon */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#A8A29E] uppercase tracking-wider">
                {card.label}
              </p>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className={`text-3xl font-bold leading-none tabular-nums ${card.valueColor}`}>
                  {card.value}
                </span>
                <span className="text-sm font-medium text-[#A8A29E]">{card.unit}</span>
              </div>
              <p className="mt-1 text-xs text-[#A8A29E]">{card.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
