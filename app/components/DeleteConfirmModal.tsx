'use client';

import { useState } from 'react';
import { Trash2, Loader2, TriangleAlert } from 'lucide-react';
import type { Project } from '../lib/types';

interface Props {
  project: Project | null;
  onClose: () => void;
  onConfirm: (id: string, name: string) => Promise<void>;
}

export default function DeleteConfirmModal({ project, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const isOpen = project !== null;

  const handleConfirm = async () => {
    if (!project) return;
    setLoading(true);
    try {
      await onConfirm(project.id, project.name);
    } catch {
      // error toast handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      {/* Panel */}
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-[#FFFCF8] shadow-2xl transition-all duration-200 ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <TriangleAlert className="h-6 w-6 text-rose-500" />
          </div>

          {/* Text */}
          <h3 className="text-center text-[15px] font-bold text-[#1C1512]">
            确认删除项目？
          </h3>
          <p className="mt-2 text-center text-sm leading-relaxed text-[#6B635C]">
            即将删除
            <span className="mx-1 font-semibold text-[#1C1512]">
              「{project?.name}」
            </span>
          </p>
          <p className="mt-1 text-center text-xs text-[#A8A29E]">
            此操作不可撤销，项目下所有子任务将一并删除。
          </p>

          {/* Buttons */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] py-2.5 text-sm font-medium text-[#6B635C] transition hover:bg-[#EDE9E3] disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-60 active:scale-95"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />
              }
              {loading ? '删除中…' : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
