'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Download, ChevronDown, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import Navbar from './Navbar';
import StatsCards from './StatsCards';
import type { AuthUser } from '../page';
import ProjectCard from './ProjectCard';
import NewProjectModal from './NewProjectModal';
import EditProjectDrawer from './EditProjectDrawer';
import DeleteConfirmModal from './DeleteConfirmModal';
import ShareModal from './ShareModal';
import ToastContainer, { type ToastItem } from './Toast';

import { fetchProjects, fetchMilestones, fetchSubtasks, fetchProfiles, fetchAllProjectMembers } from '../lib/queries';
import {
  createProject,
  updateProject,
  deleteProject,
  type CreateProjectData,
  type UpdateProjectData,
} from '../lib/mutations';
import { exportProjectsToExcel } from '../lib/export';
import type { Project, Milestone, Subtask, Profile } from '../lib/types';

interface Props {
  initialProjects:   Project[];
  initialMilestones: Milestone[];
  user:              AuthUser;
}

export default function DashboardClient({ initialProjects, initialMilestones, user }: Props) {
  // ── Data state ──────────────────────────────────────────────
  const [projects,   setProjects]   = useState<Project[]>(initialProjects);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [subtasks,   setSubtasks]   = useState<Subtask[]>([]);
  const [profiles,   setProfiles]   = useState<Profile[]>([]);

  // 初始加载子任务、成员档案（用于卡片自动健康判定和共享选人）
  useEffect(() => {
    if (initialProjects.length > 0) {
      Promise.all(
        initialProjects.map((p) => fetchSubtasks(p.id).catch(() => [] as Subtask[]))
      ).then((all) => setSubtasks(all.flat()));
    }
    fetchProfiles().then(setProfiles).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Modal/drawer state ──────────────────────────────────────
  const [showNewModal,    setShowNewModal]    = useState(false);
  const [editingProject,  setEditingProject]  = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [sharingProject,  setSharingProject]  = useState<Project | null>(null);

  // ── Toast state ─────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Data refresh ────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    const [newProjects, newMilestones] = await Promise.all([
      fetchProjects(),
      fetchMilestones(),
    ]);
    setProjects(newProjects);
    setMilestones(newMilestones);
    // Refresh subtasks for all projects
    const allSubtasks = await Promise.all(
      newProjects.map((p) => fetchSubtasks(p.id).catch(() => [] as Subtask[]))
    );
    setSubtasks(allSubtasks.flat());
    fetchProfiles().then(setProfiles).catch(() => {});
  }, []);

  // ── Export ──────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    exportProjectsToExcel(projects, milestones);
    toast('success', `已导出 ${projects.length} 个项目数据`);
  }, [projects, milestones, toast]);

  // ── CRUD handlers ───────────────────────────────────────────
  const handleCreate = useCallback(async (data: CreateProjectData) => {
    try {
      await createProject({ ...data, updatedBy: user.name });
      await refreshData();
      setShowNewModal(false);
      toast('success', `「${data.name}」创建成功`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '创建失败，请重试');
      throw err;
    }
  }, [refreshData, toast]);

  const handleUpdate = useCallback(async (id: string, data: UpdateProjectData) => {
    try {
      await updateProject(id, { ...data, updatedBy: user.name });
      await refreshData();
      setEditingProject(null);
      toast('success', '项目信息已更新');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '保存失败，请重试');
      throw err;
    }
  }, [refreshData, toast]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    try {
      await deleteProject(id);
      await refreshData();
      setDeletingProject(null);
      toast('success', `「${name}」已删除`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '删除失败，请重试');
      throw err;
    }
  }, [refreshData, toast]);

  const [showCompleted, setShowCompleted] = useState(false);
  const completedRef = useRef<HTMLDivElement>(null);

  // ── Sort state ───────────────────────────────────────────────
  type SortKey = 'dueDate' | 'health' | 'updatedAt';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // 默认首次点击方向
  const defaultDir: Record<SortKey, 'asc' | 'desc'> = {
    dueDate:   'asc',   // 最近截止优先
    health:    'desc',  // 红→黄→绿（问题优先）
    updatedAt: 'desc',  // 最近更新优先
  };

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      // 再次点击：切换方向，或取消排序
      if (sortDir !== defaultDir[key]) {
        setSortKey(null); // 第二次反转后取消
      } else {
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
      }
    } else {
      setSortKey(key);
      setSortDir(defaultDir[key]);
    }
  }

  const healthRank: Record<string, number> = { green: 0, yellow: 1, red: 2 };

  function sortProjects(list: typeof projects) {
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'dueDate') {
        cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortKey === 'health') {
        cmp = healthRank[a.health] - healthRank[b.health];
      } else if (sortKey === 'updatedAt') {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        cmp = ta - tb;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  // ── Helpers ─────────────────────────────────────────────────
  function getNextMilestone(projectId: string) {
    return milestones.find((m) => m.projectId === projectId && !m.isCompleted);
  }

  const activeProjects    = sortProjects(projects.filter((p) => p.progress < 100));
  const completedProjects = projects.filter((p) => p.progress === 100);

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const healthCounts = {
    green:  activeProjects.filter((p) => p.health === 'green').length,
    yellow: activeProjects.filter((p) => p.health === 'yellow').length,
    red:    activeProjects.filter((p) => p.health === 'red').length,
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4EFE6]">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Page header ────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1C1512] sm:text-2xl">
              项目总览
            </h1>
            <p className="mt-1 text-xs text-[#A8A29E] sm:text-sm">{dateStr}</p>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Health pills — hidden on very small screens */}
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              正常 {healthCounts.green}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200/60 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              有风险 {healthCounts.yellow}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200/60 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              延期 {healthCounts.red}
            </span>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={projects.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-[#E5DDD3] bg-[#FFFCF8] px-3 py-2 text-xs font-semibold text-[#44403C] shadow-sm transition hover:bg-[#F4EFE6] active:scale-95 disabled:opacity-40 sm:px-4 sm:text-sm"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">导出 Excel</span>
              <span className="sm:hidden">导出</span>
            </button>

            {/* New project button */}
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#1C1410] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2D2018] active:scale-95 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">新建项目</span>
              <span className="sm:hidden">新建</span>
            </button>
          </div>
        </div>

        {/* Mobile health summary strip */}
        <div className="mb-5 flex items-center gap-2 sm:hidden">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            正常 {healthCounts.green}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            有风险 {healthCounts.yellow}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            延期 {healthCounts.red}
          </span>
        </div>

        {/* ── Stats ────────────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8">
          <StatsCards projects={activeProjects} milestones={milestones} />
        </div>

        {/* ── Section label + sort ─────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">
            项目看板
          </span>
          <div className="h-px flex-1 bg-[#E5DDD3]" />
          <span className="text-[11px] font-medium text-[#A8A29E]">
            {activeProjects.length} 个进行中
          </span>

          {/* Sort pills */}
          {((['dueDate', 'health', 'updatedAt'] as const)).map((key) => {
            const labels: Record<SortKey, string> = {
              dueDate:   '截止日期',
              health:    '健康状态',
              updatedAt: '最近更新',
            };
            const active = sortKey === key;
            const Icon = active
              ? (sortDir === 'asc' ? ArrowUp : ArrowDown)
              : ArrowUpDown;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSort(key)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                    : 'bg-[#F4EFE6] text-[#A8A29E] hover:text-[#6B635C]'
                }`}
              >
                <Icon className="h-3 w-3" />
                {labels[key]}
              </button>
            );
          })}
        </div>

        {/* ── Active project grid ───────────────────────────────── */}
        {activeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5DDD3] bg-[#FFFCF8] py-20 text-center sm:py-24">
            <p className="text-sm text-[#A8A29E]">暂无进行中的项目</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-3 text-sm font-semibold text-amber-700 hover:underline"
            >
              + 创建第一个项目
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                nextMilestone={getNextMilestone(project.id)}
                subtasks={subtasks.filter((t) => t.projectId === project.id)}
                currentUserId={user.id}
                sharedByName={profiles.find((p) => p.id === project.ownerId)?.name}
                onEdit={() => setEditingProject(project)}
                onDelete={() => setDeletingProject(project)}
                onShare={() => setSharingProject(project)}
              />
            ))}
          </div>
        )}

        {/* ── Completed projects (collapsible) ─────────────────── */}
        {completedProjects.length > 0 && (
          <div className="mt-8" ref={completedRef}>
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="mb-4 flex w-full items-center gap-3 text-left"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">
                已完成项目
              </span>
              <div className="h-px flex-1 bg-[#E5DDD3]" />
              <span className="text-[11px] font-medium text-[#A8A29E]">
                {completedProjects.length} 个
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-[#C7BFB5] transition-transform duration-200 ${showCompleted ? 'rotate-180' : ''}`} />
            </button>

            {showCompleted && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {completedProjects.map((project) => (
                  <div key={project.id} className="opacity-70 transition-opacity hover:opacity-100">
                    <ProjectCard
                      project={project}
                      nextMilestone={getNextMilestone(project.id)}
                      subtasks={subtasks.filter((t) => t.projectId === project.id)}
                      currentUserId={user.id}
                      sharedByName={profiles.find((p) => p.id === project.ownerId)?.name}
                      onEdit={() => setEditingProject(project)}
                      onDelete={() => setDeletingProject(project)}
                      onShare={() => setSharingProject(project)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 pb-6 text-center text-[11px] text-[#C7BFB5] sm:mt-12">
          OD 项目控制塔 · HR OD 团队内部工具
        </div>
      </main>

      {/* ── Overlays ─────────────────────────────────────────── */}
      <NewProjectModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
      />

      <EditProjectDrawer
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleUpdate}
      />

      <DeleteConfirmModal
        project={deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDelete}
      />

      <ShareModal
        open={sharingProject !== null}
        projectId={sharingProject?.id ?? ''}
        projectName={sharingProject?.name ?? ''}
        profiles={profiles.filter((p) => p.id !== user.id)}
        onClose={() => setSharingProject(null)}
        onSaved={() => { setSharingProject(null); toast('success', '共享设置已保存'); }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
