'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { HealthStatus } from '../lib/types';
import { STAGE_PRESETS } from '../lib/types';
import type { CreateProjectData } from '../lib/mutations';
import StageEditor from './StageEditor';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateProjectData) => Promise<void>;
}

const HEALTH_OPTS = [
  { value: 'green'  as HealthStatus, label: '正常',  dot: 'bg-emerald-500', active: 'bg-emerald-50 ring-emerald-300 text-emerald-700' },
  { value: 'yellow' as HealthStatus, label: '有风险', dot: 'bg-amber-400',   active: 'bg-amber-50 ring-amber-300 text-amber-700' },
  { value: 'red'    as HealthStatus, label: '延期',  dot: 'bg-rose-500',    active: 'bg-rose-50 ring-rose-300 text-rose-700' },
];

const DEFAULT_STAGES = STAGE_PRESETS['通用四阶段'];

const INPUT_BASE  = 'w-full rounded-xl border px-4 py-2.5 text-sm text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:ring-2';
const INPUT_OK    = `${INPUT_BASE} border-[#E5DDD3] bg-[#F9F7F3] focus:border-amber-400 focus:ring-amber-100`;
const INPUT_ERROR = `${INPUT_BASE} border-rose-300 bg-[#F9F7F3] focus:border-rose-400 focus:ring-rose-100`;

export default function NewProjectModal({ open, onClose, onCreate }: Props) {
  const [name,              setName]              = useState('');
  const [owner,             setOwner]             = useState('');
  const [health,            setHealth]            = useState<HealthStatus>('green');
  const [stages,            setStages]            = useState<string[]>([...DEFAULT_STAGES]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [dueDate,           setDueDate]           = useState('');
  const [description,       setDescription]       = useState('');
  const [loading,           setLoading]           = useState(false);
  const [errors,            setErrors]            = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(''); setOwner(''); setHealth('green');
      setStages([...DEFAULT_STAGES]); setCurrentStageIndex(0);
      setDueDate(''); setDescription(''); setErrors({});
    }
  }, [open]);

  // Keep currentStageIndex in bounds when stages list changes
  const handleStagesChange = (next: string[]) => {
    setStages(next);
    if (currentStageIndex >= next.length) setCurrentStageIndex(Math.max(0, next.length - 1));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())      e.name    = '请输入项目名称';
    if (!owner.trim())     e.owner   = '请输入负责人';
    if (!dueDate)          e.dueDate = '请选择预期完成日期';
    if (stages.length < 1) e.stages  = '至少添加一个阶段';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        owner: owner.trim(),
        health,
        stages,
        currentStageIndex,
        progress: 0,
        dueDate,
        description: description.trim() || undefined,
      });
    } catch {
      // error toast handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-0 transition-opacity duration-200 sm:items-center sm:p-4 ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[#FFFCF8] shadow-2xl transition-all duration-200 sm:rounded-2xl sm:max-h-[90vh] ${
          open ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDE9E3] px-6 py-4">
          <h2 className="text-base font-bold text-[#1C1512]">新建项目</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A8A29E] transition hover:bg-[#F4EFE6] hover:text-[#1C1512]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">
              项目名称 <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="例：2025 管理者领导力项目"
              className={errors.name ? INPUT_ERROR : INPUT_OK} />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
          </div>

          {/* Owner */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">
              负责人 <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)}
              placeholder="例：daxing" list="owner-list"
              className={errors.owner ? INPUT_ERROR : INPUT_OK} />
            <datalist id="owner-list">
              <option value="daxing" /><option value="zhihong" /><option value="yawei" />
            </datalist>
            {errors.owner && <p className="mt-1 text-xs text-rose-500">{errors.owner}</p>}
          </div>

          {/* Health + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">健康状态</label>
              <div className="flex gap-1.5">
                {HEALTH_OPTS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setHealth(opt.value)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium ring-1 transition-all ${
                      health === opt.value ? opt.active : 'bg-[#F4EFE6] ring-[#E5DDD3] text-[#6B635C] hover:bg-[#EDE9E3]'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">
                预期完成日期 <span className="text-rose-500">*</span>
              </label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className={errors.dueDate ? INPUT_ERROR : INPUT_OK} />
              {errors.dueDate && <p className="mt-1 text-xs text-rose-500">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Stage editor */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">
              阶段设置 <span className="text-rose-500">*</span>
            </label>
            <StageEditor stages={stages} onChange={handleStagesChange} />
            {errors.stages && <p className="mt-1 text-xs text-rose-500">{errors.stages}</p>}
          </div>

          {/* Current stage selector */}
          {stages.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">
                当前所处阶段
              </label>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((s, i) => (
                  <button key={i} type="button" onClick={() => setCurrentStageIndex(i)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-all ${
                      currentStageIndex === i
                        ? 'bg-[#1C1410] ring-[#1C1410] text-white'
                        : 'bg-[#F4EFE6] ring-[#E5DDD3] text-[#6B635C] hover:bg-[#EDE9E3]'
                    }`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      currentStageIndex === i ? 'bg-white/20 text-white' : 'bg-[#E5DDD3] text-[#6B635C]'
                    }`}>{i + 1}</span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B635C]">
              项目描述（选填）
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="简要描述项目目标和范围…"
              className="w-full resize-none rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-4 py-2.5 text-sm text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2.5 text-sm font-medium text-[#6B635C] transition hover:bg-[#EDE9E3]">
              取消
            </button>
            <button type="submit" disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1C1410] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2D2018] disabled:opacity-60 active:scale-95">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? '创建中…' : '创建项目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
