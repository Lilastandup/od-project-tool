'use client';

import { useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import type { Subtask } from '../lib/types';
import {
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from '../lib/mutations';

interface Props {
  projectId:  string;
  stageIndex: number;
  stageName:  string;
  subtasks:   Subtask[];
  onChange:   () => void; // trigger parent refresh
}

function formatDue(dateStr: string): { label: string; overdue: boolean } {
  const d    = new Date(dateStr);
  const now  = new Date();
  now.setHours(0, 0, 0, 0);
  const overdue = d < now;
  const label   = `${d.getMonth() + 1}/${d.getDate()}`;
  return { label: overdue ? `逾期 · ${label}` : label, overdue };
}

export default function SubtaskPanel({
  projectId, stageIndex, stageName, subtasks, onChange,
}: Props) {
  const [newTitle,      setNewTitle]      = useState('');
  const [newDate,       setNewDate]       = useState('');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  const stageSubtasks = subtasks.filter((t) => t.stageIndex === stageIndex);
  const doneCount     = stageSubtasks.filter((t) => t.isCompleted).length;

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  const handleToggle = async (task: Subtask) => {
    try {
      await updateSubtask(task.id, { isCompleted: !task.isCompleted });
      onChange();
    } catch {
      showError('更新失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubtask(id);
      onChange();
    } catch {
      showError('删除失败，请重试');
    }
  };

  const handleDateSave = async (task: Subtask, value: string) => {
    setEditingDateId(null);
    const newDueDate = value || null;
    if (newDueDate === (task.dueDate ?? null)) return; // no change
    try {
      await updateSubtask(task.id, { dueDate: newDueDate });
      onChange();
    } catch {
      showError('修改截止日期失败，请重试');
    }
  };

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      await createSubtask({
        projectId,
        stageIndex,
        title,
        dueDate: newDate || undefined,
      });
      setNewTitle('');
      setNewDate('');
      onChange();
    } catch {
      showError('添加失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B635C]">
          {stageName} · 子任务
        </span>
        {stageSubtasks.length > 0 && (
          <span className="text-[11px] text-[#A8A29E]">
            {doneCount}/{stageSubtasks.length} 已完成
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E5DDD3]">
        {/* Task list */}
        {stageSubtasks.length === 0 ? (
          <div className="bg-white px-4 py-4 text-center text-xs text-[#C7BFB5]">
            暂无子任务，在下方添加
          </div>
        ) : (
          <div>
            {stageSubtasks.map((task) => {
              const due = task.dueDate ? formatDue(task.dueDate) : null;
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 border-b border-[#F4EFE6] px-3 py-2.5 last:border-b-0 ${
                    task.isCompleted ? 'bg-[#FAFAF9]' : 'bg-white'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      task.isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[#D5CFC7] bg-white hover:border-emerald-400'
                    }`}
                  >
                    {task.isCompleted && (
                      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-current">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className={`text-xs font-medium leading-snug ${
                      task.isCompleted ? 'text-[#A8A29E] line-through' : 'text-[#1C1512]'
                    }`}>
                      {task.title}
                    </span>
                    {editingDateId === task.id ? (
                      <input
                        type="date"
                        autoFocus
                        defaultValue={task.dueDate ?? ''}
                        onBlur={(e) => handleDateSave(task, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleDateSave(task, e.currentTarget.value); }
                          if (e.key === 'Escape') setEditingDateId(null);
                        }}
                        className="mt-0.5 w-[110px] bg-transparent text-[11px] text-[#6B635C] outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingDateId(task.id)}
                        className={`mt-0.5 flex items-center gap-1 text-[10px] transition-opacity hover:opacity-70 ${
                          due
                            ? due.overdue ? 'font-semibold text-rose-500' : 'text-[#A8A29E]'
                            : 'text-[#D5CFC7]'
                        }`}
                      >
                        <Calendar className="h-2.5 w-2.5 shrink-0" />
                        {due ? due.label : '添加截止日期'}
                      </button>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#D5CFC7] transition hover:bg-rose-50 hover:text-rose-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add row */}
        <div className="flex items-center gap-2 border-t border-[#EDE9E3] bg-[#F9F7F3] px-3 py-2">
          <Plus className="h-3.5 w-3.5 shrink-0 text-[#C7BFB5]" />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder="添加子任务…"
            className="flex-1 bg-transparent text-xs text-[#1C1512] placeholder-[#C7BFB5] outline-none"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            title="截止日期（可选）"
            className="w-[90px] bg-transparent text-[11px] text-[#A8A29E] outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTitle.trim() || saving}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#E5DDD3] bg-[#F4EFE6] text-[#6B635C] transition hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40"
          >
            <svg viewBox="0 0 10 10" className="h-3 w-3 fill-current">
              <path d="M1 5h8M5 1v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-rose-500">{error}</p>
      )}
      {!error && (
        <p className="mt-1.5 text-[10px] text-[#C7BFB5]">子任务不影响整体完成进度</p>
      )}
    </div>
  );
}
