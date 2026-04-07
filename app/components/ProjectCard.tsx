'use client';

import { User2, CalendarDays, CircleArrowRight, Pencil, Trash2, Zap, Share2 } from 'lucide-react';
import type { Project, Milestone, Subtask, HealthStatus } from '../lib/types';
import { effectiveHealth, autoReason as getAutoReason } from '../lib/health';

interface Props {
  project:       Project;
  nextMilestone: Milestone | undefined;
  subtasks:      Subtask[];
  currentUserId?: string;
  sharedByName?: string;
  onEdit:        () => void;
  onDelete:      () => void;
  onShare?:      () => void;
}

const healthConfig: Record<
  HealthStatus,
  { dot: string; ping: string; badge: string; badgeText: string; label: string; hasPing: boolean }
> = {
  green:  { dot: 'bg-emerald-500', ping: 'bg-emerald-400', badge: 'bg-emerald-50 ring-emerald-200/70', badgeText: 'text-emerald-700', label: '正常',   hasPing: false },
  yellow: { dot: 'bg-amber-400',   ping: 'bg-amber-300',   badge: 'bg-amber-50 ring-amber-200/70',     badgeText: 'text-amber-700',   label: '有风险', hasPing: true  },
  red:    { dot: 'bg-rose-500',    ping: 'bg-rose-400',    badge: 'bg-rose-50 ring-rose-200/70',       badgeText: 'text-rose-700',    label: '延期',   hasPing: true  },
};

/** Progress bar color driven by how far along the stage index is */
function stageBarColor(index: number, total: number): string {
  if (total <= 1) return 'from-slate-400 to-slate-500';
  const ratio = index / (total - 1);
  if (ratio < 0.34) return 'from-sky-400 to-sky-500';
  if (ratio < 0.67) return 'from-violet-400 to-violet-500';
  return 'from-emerald-400 to-emerald-500';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isOverdue(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function getDaysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

function getRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return '刚刚';
  if (hours <  1) return `${mins}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days  <  2) return '昨天';
  if (days  < 30) return `${days}天前`;
  return new Date(isoStr).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}


export default function ProjectCard({ project, nextMilestone, subtasks, currentUserId, sharedByName, onEdit, onDelete, onShare }: Props) {
  const total     = project.stages.length;
  const idx       = Math.min(project.currentStageIndex, total - 1);
  const barColor  = stageBarColor(idx, total);
  const stageName = total > 0 ? project.stages[idx] : '—';

  const overdue   = isOverdue(project.dueDate);
  const daysUntil = getDaysUntil(project.dueDate);

  const effective  = effectiveHealth(project.health, project.dueDate, idx, subtasks);
  const autoReason = getAutoReason(project.dueDate, idx, subtasks);
  const health     = healthConfig[effective];

  // 判断当前用户是否为项目 owner
  const isOwner = currentUserId && project.ownerId ? currentUserId === project.ownerId : false;
  // 当前用户是被共享的成员（不是 owner，但有 ownerId 说明这是别人的项目）
  const isSharedWith = currentUserId && project.ownerId && currentUserId !== project.ownerId;

  return (
    <div className="project-card group flex flex-col rounded-2xl bg-[#FFFCF8] shadow-sm ring-1 ring-[#E5DDD3]">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="relative mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {health.hasPing && <span className={`absolute h-full w-full rounded-full ${health.ping} health-ping`} />}
            <span className={`relative h-2.5 w-2.5 rounded-full ${health.dot} shadow-sm`} />
          </div>
          <h3 className="text-[15px] font-semibold leading-snug text-[#1C1512]">
            {project.name}
          </h3>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${health.badge} ${health.badgeText}`}
          title={autoReason ?? undefined}
        >
          {autoReason && <Zap className="h-3 w-3" />}
          {health.label}
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 px-5 pb-3">
        {project.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-[#A8A29E]">
            {project.description}
          </p>
        )}

        {/* Shared-with badge */}
        {isSharedWith && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 ring-1 ring-violet-200/60">
              <Share2 className="h-2.5 w-2.5" />
              来自 {sharedByName ?? project.owner}
            </span>
          </div>
        )}

        {/* Owner + Due date */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 text-xs text-[#6B635C]">
            <User2 className="h-3.5 w-3.5 text-[#A8A29E]" />
            {project.owner}
          </span>
          <span className={`flex items-center gap-1.5 text-xs ${
            overdue ? 'font-semibold text-rose-600'
            : daysUntil <= 7 ? 'font-medium text-amber-600'
            : 'text-[#6B635C]'
          }`}>
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#A8A29E]" />
            {overdue ? `已逾期 · ${formatDate(project.dueDate)}`
              : daysUntil === 0 ? '今日截止'
              : daysUntil <= 7 ? `${daysUntil}天后截止`
              : `截止 ${formatDate(project.dueDate)}`}
          </span>
        </div>

        {/* Stage progress dots */}
        {total > 0 && (
          <div className="flex items-center gap-1.5">
            {project.stages.map((s, i) => (
              <div
                key={i}
                title={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < idx   ? 'w-3 bg-[#B5ADA5]'        // 已完成阶段：中灰棕
                  : i === idx ? 'w-7 bg-amber-500'       // 当前阶段：品牌色，更宽
                  : 'w-3 bg-[#E5DDD3]'                   // 未开始阶段：浅灰
                }`}
              />
            ))}
            <span className="ml-1 rounded-full bg-[#F4EFE6] px-2 py-0.5 text-[11px] font-medium text-[#6B635C] ring-1 ring-[#E5DDD3]">
              {stageName}
            </span>
            <span className="ml-auto text-[11px] text-[#C7BFB5]">
              {idx + 1}/{total}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="mt-auto border-t border-[#EDE9E3] px-5 pb-4 pt-3 space-y-3">

        {/* Progress bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#A8A29E]">完成进度</span>
            <span className="text-xs font-bold tabular-nums text-[#1C1512]">{project.progress}%</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#EDE9E3]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
              style={{ width: `${project.progress}%` }}
            />
            {project.progress > 0 && project.progress < 100 && (
              <div className="absolute inset-y-0 left-0 rounded-full progress-shimmer"
                style={{ width: `${project.progress}%` }} />
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-[#C7BFB5]">
            {project.updatedBy ?? project.owner} 填报
            {project.updatedAt && (
              <> · 更新于 {getRelativeTime(project.updatedAt)}</>
            )}
          </p>
        </div>

        {/* Subtask mini list — current stage, max 3 items */}
        {(() => {
          const stageTasks = subtasks.filter((t) => t.stageIndex === idx);
          if (stageTasks.length === 0) {
            // Fall back to next milestone if no subtasks
            return nextMilestone ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-[#F4EFE6] px-3 py-2.5">
                <CircleArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A8A29E]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#44403C]">{nextMilestone.title}</p>
                  {nextMilestone.dueDate && (
                    <p className="mt-0.5 text-[11px] text-[#A8A29E]">
                      截止 {new Date(nextMilestone.dueDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ) : null;
          }
          const shown   = stageTasks.slice(0, 3);
          const more    = stageTasks.length - shown.length;
          const doneAll = stageTasks.filter((t) => t.isCompleted).length;
          return (
            <div className="rounded-xl bg-[#F9F7F3] px-3 py-2 ring-1 ring-[#EDE9E3]">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#A8A29E]">当前阶段子任务</span>
                <span className="text-[10px] text-[#C7BFB5]">{doneAll}/{stageTasks.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                {shown.map((t) => {
                  const due     = t.dueDate ? new Date(t.dueDate) : null;
                  const overdue = due ? due < new Date() : false;
                  return (
                    <div key={t.id} className="flex items-center gap-2">
                      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px] ${
                        t.isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[#D5CFC7]'
                      }`}>
                        {t.isCompleted && '✓'}
                      </span>
                      <span className={`flex-1 truncate text-[11px] ${
                        t.isCompleted ? 'text-[#A8A29E] line-through' : 'text-[#44403C]'
                      }`}>{t.title}</span>
                      {due && (
                        <span className={`shrink-0 text-[10px] ${overdue ? 'font-semibold text-rose-500' : 'text-[#C7BFB5]'}`}>
                          {`${due.getMonth() + 1}/${due.getDate()}`}
                        </span>
                      )}
                    </div>
                  );
                })}
                {more > 0 && (
                  <p className="pt-0.5 text-center text-[10px] text-[#C7BFB5]">还有 {more} 项…</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Action buttons — visible on hover */}
        <div className="flex gap-2 pt-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2 text-xs font-semibold text-[#44403C] transition hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 active:scale-95">
            <Pencil className="h-3.5 w-3.5" />编辑
          </button>
          {isOwner && onShare && (
            <button onClick={onShare}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2 text-xs font-semibold text-[#44403C] transition hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 active:scale-95">
              <Share2 className="h-3.5 w-3.5" />共享
            </button>
          )}
          {isOwner && (
            <button onClick={onDelete}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2 text-xs font-semibold text-[#44403C] transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 active:scale-95">
              <Trash2 className="h-3.5 w-3.5" />删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
