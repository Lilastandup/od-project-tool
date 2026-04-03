'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, GripVertical, ChevronDown, Trash2 } from 'lucide-react';
import { STAGE_PRESETS } from '../lib/types';

interface Props {
  stages: string[];
  onChange: (stages: string[]) => void;
}

export default function StageEditor({ stages, onChange }: Props) {
  const [input,       setInput]       = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [editingIdx,  setEditingIdx]  = useState<number | null>(null);
  const [editingVal,  setEditingVal]  = useState('');
  const [dragging,    setDragging]    = useState<number | null>(null);
  const dragOver                      = useRef<number | null>(null);
  const editInputRef                  = useRef<HTMLInputElement>(null);

  // 进入编辑态时自动聚焦并全选
  useEffect(() => {
    if (editingIdx !== null) {
      editInputRef.current?.select();
    }
  }, [editingIdx]);

  // ── 新增 ──────────────────────────────────────────────────────
  const addStage = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...stages, v]);
    setInput('');
  };

  // ── 删除 ──────────────────────────────────────────────────────
  const removeStage = (i: number) => {
    if (editingIdx === i) setEditingIdx(null);
    onChange(stages.filter((_, idx) => idx !== i));
  };

  // ── 清空 ──────────────────────────────────────────────────────
  const clearAll = () => {
    setEditingIdx(null);
    onChange([]);
  };

  // ── 模板 ──────────────────────────────────────────────────────
  const applyPreset = (key: string) => {
    setEditingIdx(null);
    onChange([...STAGE_PRESETS[key]]);
    setShowPresets(false);
  };

  // ── Inline edit ───────────────────────────────────────────────
  const startEdit = (i: number) => {
    setEditingIdx(i);
    setEditingVal(stages[i]);
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    const v = editingVal.trim();
    if (v && v !== stages[editingIdx]) {
      const next = [...stages];
      next[editingIdx] = v;
      onChange(next);
    }
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

  // ── Drag-to-reorder ───────────────────────────────────────────
  const onDragStart = (i: number) => { setEditingIdx(null); setDragging(i); };
  const onDragEnter = (i: number) => { dragOver.current = i; };
  const onDragEnd   = () => {
    if (dragging !== null && dragOver.current !== null && dragging !== dragOver.current) {
      const next = [...stages];
      const [item] = next.splice(dragging, 1);
      next.splice(dragOver.current, 0, item);
      onChange(next);
    }
    setDragging(null);
    dragOver.current = null;
  };

  return (
    <div className="space-y-2">

      {/* ── Preset picker + clear button ─────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowPresets((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] px-3 py-2 text-xs font-medium text-[#6B635C] transition hover:bg-[#EDE9E3]"
          >
            <span>从模板快速填入…</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
          </button>

          {showPresets && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[#E5DDD3] bg-[#FFFCF8] shadow-lg">
              {Object.entries(STAGE_PRESETS).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-[#F4EFE6]"
                >
                  <span className="text-xs font-semibold text-[#1C1512]">{key}</span>
                  <span className="mt-0.5 text-[11px] text-[#A8A29E]">{val.join(' → ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear all */}
        {stages.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            title="清空所有阶段"
            className="flex items-center justify-center rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] px-3 py-2 text-[#C7BFB5] transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Stage list ───────────────────────────────────────── */}
      {stages.length > 0 && (
        <div className="space-y-1.5">
          {stages.map((s, i) => (
            <div
              key={i}
              draggable={editingIdx !== i}
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-2 rounded-lg border bg-[#F9F7F3] px-2.5 py-1.5 transition ${
                dragging === i
                  ? 'border-amber-300 opacity-50'
                  : editingIdx === i
                  ? 'border-amber-400 ring-2 ring-amber-100'
                  : 'border-[#E5DDD3] hover:border-[#D5CFC7]'
              }`}
            >
              {/* Drag handle */}
              <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-[#C7BFB5] active:cursor-grabbing" />

              {/* Index badge */}
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#E5DDD3] text-[10px] font-bold text-[#6B635C]">
                {i + 1}
              </span>

              {/* Inline edit input OR label */}
              {editingIdx === i ? (
                <input
                  ref={editInputRef}
                  value={editingVal}
                  onChange={(e) => setEditingVal(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 bg-transparent text-xs font-medium text-[#1C1512] outline-none"
                />
              ) : (
                <span
                  onClick={() => startEdit(i)}
                  title="点击修改阶段名称"
                  className="flex-1 cursor-text text-xs font-medium text-[#1C1512] hover:text-amber-700"
                >
                  {s}
                </span>
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeStage(i)}
                className="flex h-4 w-4 items-center justify-center rounded text-[#C7BFB5] transition hover:text-rose-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit hint */}
      {stages.length > 0 && editingIdx === null && (
        <p className="text-[11px] text-[#C7BFB5]">点击阶段名称可直接修改，拖动 ⠿ 调整顺序</p>
      )}

      {/* ── Add stage input ──────────────────────────────────── */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStage(); } }}
          placeholder="输入新阶段名称，回车添加…"
          className="flex-1 rounded-xl border border-[#E5DDD3] bg-[#F9F7F3] px-3 py-2 text-xs text-[#1C1512] placeholder-[#C7BFB5] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <button
          type="button"
          onClick={addStage}
          disabled={!input.trim()}
          className="flex items-center justify-center rounded-xl border border-[#E5DDD3] bg-[#F4EFE6] px-3 py-2 transition hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5 text-[#6B635C]" />
        </button>
      </div>

      {stages.length === 0 && (
        <p className="text-[11px] text-rose-400">至少添加一个阶段</p>
      )}
    </div>
  );
}
