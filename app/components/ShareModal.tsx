'use client';

import { useState, useEffect } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import type { Profile } from '../lib/types';
import { fetchProjectMemberIds } from '../lib/queries';
import { shareProject } from '../lib/mutations';

interface Props {
  projectId:   string;
  projectName: string;
  profiles:    Profile[];   // all team members except current user
  open:        boolean;
  onClose:     () => void;
  onSaved:     () => void;
}

export default function ShareModal({
  projectId, projectName, profiles, open, onClose, onSaved,
}: Props) {
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [initialIds,  setInitialIds]  = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchProjectMemberIds(projectId)
      .then((ids) => {
        const s = new Set(ids);
        setSelected(s);
        setInitialIds(s);
      })
      .catch(() => { setSelected(new Set()); setInitialIds(new Set()); })
      .finally(() => setLoading(false));
  }, [open, projectId]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await shareProject(projectId, [...selected]);
      onSaved();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-[#FFFCF8] shadow-xl ring-1 ring-[#E5DDD3]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDE9E3] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1512]">共享项目</h2>
              <p className="text-[11px] text-[#A8A29E]">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#A8A29E] transition hover:bg-[#F4EFE6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="mb-3 text-xs text-[#A8A29E]">勾选后对方可查看并编辑此项目</p>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#C7BFB5]" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#C7BFB5]">暂无其他团队成员</p>
          ) : (
            <div className="space-y-1.5">
              {profiles.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      checked ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-[#F9F7F3] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      checked ? 'bg-amber-500 text-white' : 'bg-[#E5DDD3] text-[#6B635C]'
                    }`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1C1512]">{p.name}</p>
                      <p className="truncate text-[11px] text-[#A8A29E]">{p.email}</p>
                    </div>
                    {/* Checkbox */}
                    <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                      checked ? 'border-amber-500 bg-amber-500' : 'border-[#D5CFC7] bg-white'
                    }`}>
                      {checked && (
                        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-none stroke-white stroke-[1.5]">
                          <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {saveError && (
          <p className="px-5 pb-2 text-xs text-rose-600">{saveError}</p>
        )}

        {/* Footer */}
        <div className="flex gap-2 border-t border-[#EDE9E3] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2.5 text-sm font-medium text-[#6B635C] transition hover:bg-[#EDE9E3]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1C1410] py-2.5 text-sm font-semibold text-white transition hover:bg-[#2C2318] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? '保存中…' : (() => {
              if (selected.size === 0 && initialIds.size > 0) return '取消全部共享';
              const hasRemoved = [...initialIds].some((id) => !selected.has(id));
              const hasAdded   = [...selected].some((id) => !initialIds.has(id));
              if (hasRemoved || hasAdded) return `保存更改（${selected.size} 人）`;
              return selected.size > 0 ? `确认共享（${selected.size} 人）` : '确认共享';
            })()}
          </button>
        </div>
      </div>
    </div>
  );
}
