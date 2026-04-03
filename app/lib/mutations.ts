import { createBrowserSupabase } from './supabase';
import type { HealthStatus } from './types';

export interface CreateProjectData {
  name: string;
  owner: string;
  health: HealthStatus;
  stages: string[];
  currentStageIndex: number;
  progress: number;
  dueDate: string;
  description?: string;
}

export interface UpdateProjectData {
  health?: HealthStatus;
  stages?: string[];
  currentStageIndex?: number;
  progress?: number;
  description?: string;
  dueDate?: string;
  updatedBy?: string;
}

export async function createProject(data: CreateProjectData): Promise<void> {
  const supabase = createBrowserSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('projects').insert({
    name:                data.name,
    owner:               data.owner,
    health:              data.health,
    stages:              data.stages,
    current_stage_index: data.currentStageIndex,
    progress:            data.progress,
    due_date:            data.dueDate,
    description:         data.description ?? null,
    sort_order:          9999,
    owner_id:            user?.id ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function updateProject(id: string, data: UpdateProjectData): Promise<void> {
  const supabase = createBrowserSupabase();
  const patch: Record<string, unknown> = {};
  if (data.health             !== undefined) patch.health              = data.health;
  if (data.stages             !== undefined) patch.stages              = data.stages;
  if (data.currentStageIndex  !== undefined) patch.current_stage_index = data.currentStageIndex;
  if (data.progress           !== undefined) patch.progress            = data.progress;
  if (data.description        !== undefined) patch.description         = data.description || null;
  if (data.dueDate            !== undefined) patch.due_date            = data.dueDate;
  if (data.updatedBy          !== undefined) patch.updated_by          = data.updatedBy;

  const { error } = await supabase.from('projects').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createBrowserSupabase();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Subtask mutations ────────────────────────────────────────

export async function createSubtask(data: {
  projectId: string;
  stageIndex: number;
  title: string;
  dueDate?: string;
}): Promise<void> {
  const supabase = createBrowserSupabase();
  const { error } = await supabase.from('subtasks').insert({
    project_id:  data.projectId,
    stage_index: data.stageIndex,
    title:       data.title,
    due_date:    data.dueDate ?? null,
    sort_order:  9999,
  });
  if (error) throw new Error(error.message);
}

export async function updateSubtask(id: string, data: {
  title?: string;
  isCompleted?: boolean;
  dueDate?: string | null;
}): Promise<void> {
  const supabase = createBrowserSupabase();
  const patch: Record<string, unknown> = {};
  if (data.title       !== undefined) patch.title        = data.title;
  if (data.isCompleted !== undefined) patch.is_completed = data.isCompleted;
  if (data.dueDate     !== undefined) patch.due_date     = data.dueDate;
  const { error } = await supabase.from('subtasks').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSubtask(id: string): Promise<void> {
  const supabase = createBrowserSupabase();
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Sharing mutations ────────────────────────────────────────

/** 设置项目成员（覆盖式：先删全部，再批量插入） */
export async function shareProject(projectId: string, userIds: string[]): Promise<void> {
  const supabase = createBrowserSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { error: delError } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId);
  if (delError) throw new Error(delError.message);

  if (userIds.length === 0) return;

  const { error } = await supabase.from('project_members').insert(
    userIds.map((uid) => ({
      project_id:  projectId,
      user_id:     uid,
      invited_by:  user?.id ?? null,
    }))
  );
  if (error) throw new Error(error.message);
}

/** 删除某项目某阶段的所有子任务（阶段被删除时调用） */
export async function deleteSubtasksByStage(projectId: string, stageIndex: number): Promise<void> {
  const supabase = createBrowserSupabase();
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('project_id', projectId)
    .eq('stage_index', stageIndex);
  if (error) throw new Error(error.message);
}
