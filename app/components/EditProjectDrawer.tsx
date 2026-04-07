'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Pencil, Check } from 'lucide-react';
import type { HealthStatus, Project, Subtask } from '../lib/types';
import type { UpdateProjectData } from '../lib/mutations';
import { deleteSubtasksByStage, updateSubtaskStageIndex } from '../lib/mutations';
import { fetchSubtasks } from '../lib/queries';
import StageEditor from './StageEditor';
import SubtaskPanel from './SubtaskPanel';

interface Props {
  project: Project | null;
  onClose: () => void;
  onSave: (id: string, data: UpdateProjectData) => Promise<void>;
}

const HEALTH_OPTS = [
  { value: 'green'  as HealthStatus, label: '正常',  dot: 'bg-emerald-500', active: 'bg-emerald-50 ring-emerald-300 text-emerald-700' },
  { value: 'yellow' as HealthStatus, label: '有风险', dot: 'bg-amber-400',   active: 'bg-amber-50 ring-amber-300 text-amber-700' },
  { value: 'red'    as HealthStatus, label: '延期',  dot: 'bg-rose-500',    active: 'bg-rose-50 ring-rose-300 text-rose-700' },
];

export default function EditProjectDrawer({ project, onClose, onSave }: Props) {
  const [health,            setHealth]            = useState<HealthStatus>('green');
  const [stages,            setStages]            = useState<string[]>([]);
  const [initialStages,     setInitialStages]     = useState<string[]>([]);
  const [stageDueDates,     setStageDueDates]     = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress,          setProgress]          = useState(0);
  const [description,       setDescription]       = useState('');
  const [dueDate,           setDueDate]           = useState('');
  const [editingStages,       setEditingStages]       = useState(false);
  const [editingStageDateIdx, setEditingStageDateIdx] = useState<number | null>(null);
  const [stageDateError,      setStageDateError]      = useState<string | null>(null);
  const [loading,             setLoading]             = useState(false);
  const [subtaskLoadError,    setSubtaskLoadError]    = useState(false);
  const [subtasks,            setSubtasks]            = useState<Subtask[]>([]);

  const loadSubtasks = useCallback(async (projectId: string) => {
    setSubtaskLoadError(false);
    try {
      const data = await fetchSubtasks(projectId);
      setSubtasks(data);
    } catch {
      setSubtaskLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (project) {
      setHealth(project.health);
      setStages(project.stages);
      setInitialStages(project.stages);
      setStageDueDates(project.stageDueDates ?? []);
      setCurrentStageIndex(project.currentStageIndex);
      setProgress(project.progress);
      setDescription(project.description ?? '');
      setDueDate(project.dueDate ?? '');
      setEditingStages(false);
      loadSubtasks(project.id);
    }
  }, [project, loadSubtasks]);

  const handleStagesChange = (next: string[]) => {
    setStages(next);
    setStageDueDates((prev) => prev.slice(0, next.length));
    if (currentStageIndex >= next.length) {
      setCurrentStageIndex(Math.max(0, next.length - 1));
    }
  };

  const isOpen = project !== null;

  // 阶段变更时迁移子任务：删除已移除阶段的子任务，重排保留阶段的 stage_index
  const migrateSubtasks = async (projectId: string) => {
    const stagesUnchanged =
      initialStages.length === stages.length &&
      initialStages.every((s, i) => s === stages[i]);
    if (stagesUnchanged) return;

    // 为每个旧阶段找到新位置（名称匹配；改名视为同位置保留）
    const oldToNew = initialStages.map((oldName, oldIdx) => {
      const newIdx = stages.indexOf(oldName);
      if (newIdx !== -1) return newIdx;                          // 找到同名阶段
      if (oldIdx < stages.length && !initialStages.includes(stages[oldIdx]))
        return oldIdx;                                           // 同位置改了名，视为改名保留
      return -1;                                                 // 已删除
    });

    // 先删除已移除阶段的子任务
    for (let i = 0; i < oldToNew.length; i++) {
      if (oldToNew[i] === -1) await deleteSubtasksByStage(projectId, i);
    }

    // 再用临时偏移量做两阶段重排，避免 index 冲突
    const OFFSET = 10000;
    for (let i = 0; i < oldToNew.length; i++) {
      const newIdx = oldToNew[i];
      if (newIdx !== -1 && newIdx !== i) {
        await updateSubtaskStageIndex(projectId, i, i + OFFSET);
      }
    }
    for (let i = 0; i < oldToNew.length; i++) {
      const newIdx = oldToNew[i];
      if (newIdx !== -1 && newIdx !== i) {
        await updateSubtaskStageIndex(projectId, i + OFFSET, newIdx);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || stages.length === 0) return;
    setLoading(true);
    try {
      await migrateSubtasks(project.id);
      // 规范化：确保长度与 stages 一致，空洞填为空字符串
      const normalizedDueDates = Array.from({ length: stages.length }, (_, i) => stageDueDates[i] ?? '');

      await onSave(project.id, {
        health,
        stages,
        currentStageIndex,
        stageDueDates: normalizedDueDates,
        progress,
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
      });
    } catch {
      // error toast handled in parent
    } finally {
      setLoading(false);
    }
  };

  // subtask count badge per stage
  const subtaskBadge = (i: number) => {
    const all  = subtasks.filter((t) => t.stageIndex === i);
    const done = all.filter((t) => t.isCompleted).length;
    if (all.length === 0) return null;
    return `${done}/${all.length}`;
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={loading ? undefined : onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#FFFCF8] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EDE9E3] px-6 py-5">
          <div className="min-w-0 pr-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#A8A29E]">编辑项目</p>
            <h2 className="mt-1 truncate text-base font-bold leading-snug text-[#1C1512]">
              {project?.name}
            </h2>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#A8A29E] transition hover:bg-[#F4EFE6] hover:text-[#1C1512]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-6 px-6 py-6">

            {/* ── 健康状态 ── */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">健康状态</label>
              <div className="flex gap-2">
                {HEALTH_OPTS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setHealth(opt.value)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold ring-1 transition-all ${
                      health === opt.value ? opt.active : 'bg-[#F4EFE6] ring-[#E5DDD3] text-[#6B635C] hover:bg-[#EDE9E3]'
                    }`}>
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── 整体完成进度 + 截止日期（同一卡片，避免歧义）── */}
            <div className="rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-4 py-3 space-y-3">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#6B635C]">整体完成进度</label>
                  <span className="text-2xl font-bold tabular-nums text-[#1C1512]">{progress}%</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-amber-600" />
                <div className="mt-1 flex justify-between text-[10px] text-[#C7BFB5]">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>
              <div className="border-t border-[#EDE9E3] pt-3">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">截止日期</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DDD3] bg-white px-3 py-2 text-sm text-[#1C1512] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* ── 分隔线 ── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#EDE9E3]" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#C7BFB5]">阶段 & 子任务</span>
              <div className="h-px flex-1 bg-[#EDE9E3]" />
            </div>

            {/* ── 当前所处阶段 + 修改阶段 ── */}
            {stages.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#6B635C]">
                    当前所处阶段
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingStages((v) => !v)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      editingStages
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-300'
                        : 'text-[#A8A29E] hover:text-[#6B635C]'
                    }`}
                  >
                    {editingStages
                      ? <><Check className="h-3 w-3" />完成修改</>
                      : <><Pencil className="h-3 w-3" />修改阶段</>
                    }
                  </button>
                </div>

                {editingStages && (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                    <p className="mb-2 text-[11px] text-amber-700/70">修改完成后点击右上角「完成修改」</p>
                    <StageEditor stages={stages} onChange={handleStagesChange} />
                  </div>
                )}

                {/* Stage buttons with subtask badge */}
                <div className="flex flex-col gap-1.5">
                  {stages.map((s, i) => {
                    const badge      = subtaskBadge(i);
                    const stageDate  = stageDueDates[i] ?? '';
                    const isActive   = currentStageIndex === i;
                    const isOverdue  = stageDate
                      ? (() => { const d = new Date(stageDate); d.setHours(0,0,0,0); return d < new Date(new Date().setHours(0,0,0,0)); })()
                      : false;
                    return (
                      <div key={i} className={`flex flex-col rounded-xl ring-1 transition-all overflow-hidden ${
                        isActive ? 'bg-[#1C1410] ring-[#1C1410]' : 'bg-[#F4EFE6] ring-[#E5DDD3] hover:bg-[#EDE9E3]'
                      }`}>
                        <button type="button" onClick={() => setCurrentStageIndex(i)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-[#E5DDD3] text-[#6B635C]'
                          }`}>{i + 1}</span>
                          <span className={`flex-1 text-left ${isActive ? 'text-white' : 'text-[#6B635C]'}`}>{s}</span>
                          <span className="ml-auto flex items-center gap-2">
                            {badge && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isActive ? 'bg-white/15 text-white/80' : 'bg-[#E5DDD3] text-[#6B635C]'
                              }`}>{badge}</span>
                            )}
                            {i < currentStageIndex && <span className="text-[10px] text-emerald-400">✓ 已完成</span>}
                            {isActive && <span className="text-[10px] text-amber-300">← 当前</span>}
                          </span>
                        </button>

                        {/* Stage due date row */}
                        <div className={`flex items-center gap-1.5 px-4 pb-2 text-[11px] ${isActive ? 'text-white/50' : 'text-[#A8A29E]'}`}>
                          <span>截止：</span>
                          {editingStageDateIdx === i ? (
                            <input
                              type="date"
                              autoFocus
                              defaultValue={stageDate}
                              style={{ colorScheme: isActive ? 'dark' : 'light' }}
                              className={`bg-transparent outline-none text-[11px] ${isActive ? 'text-white' : 'text-[#1C1512]'}`}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val && dueDate && val > dueDate) {
                                  setStageDateError(`阶段截止日期不能晚于项目截止日期（${dueDate}）`);
                                  setTimeout(() => setStageDateError(null), 4000);
                                  setEditingStageDateIdx(null);
                                  return;
                                }
                                setStageDueDates((prev) => {
                                  const next = [...prev];
                                  next[i] = val;
                                  return next;
                                });
                                setEditingStageDateIdx(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                                if (e.key === 'Escape') setEditingStageDateIdx(null);
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingStageDateIdx(i)}
                              className={`hover:opacity-70 transition-opacity ${
                                stageDate
                                  ? isOverdue
                                    ? 'font-semibold text-rose-400'
                                    : isActive ? 'text-white/70' : 'text-[#6B635C]'
                                  : 'italic opacity-50'
                              }`}
                            >
                              {stageDate
                                ? (() => { const d = new Date(stageDate); return `${d.getMonth()+1}/${d.getDate()}${isOverdue ? ' · 已逾期' : ''}`; })()
                                : '点击设置'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stageDateError && (
              <p className="text-xs text-rose-500">{stageDateError}</p>
            )}

            {/* ── 子任务面板（当前阶段）── */}
            {subtaskLoadError && (
              <p className="text-xs text-rose-500">子任务加载失败，请关闭后重试</p>
            )}
            {project && stages.length > 0 && !subtaskLoadError && (
              <SubtaskPanel
                projectId={project.id}
                stageIndex={currentStageIndex}
                stageName={stages[currentStageIndex] ?? ''}
                subtasks={subtasks}
                onChange={() => loadSubtasks(project.id)}
              />
            )}

            {/* ── 项目描述 ── */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">项目描述</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="简要描述项目目标和范围…"
                className="w-full resize-none rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-4 py-3 text-sm text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto border-t border-[#EDE9E3] px-6 py-4">
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2.5 text-sm font-medium text-[#6B635C] transition hover:bg-[#EDE9E3]">
                取消
              </button>
              <button type="submit" disabled={loading || stages.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60 active:scale-95">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? '保存中…' : '保存修改'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
