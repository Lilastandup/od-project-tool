import { createBrowserSupabase } from './supabase';
import type { Project, Milestone, Subtask, Profile, HealthStatus } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ProjectRow {
  id: string;
  name: string;
  owner: string;
  owner_id: string | null;
  health: string;
  stages: string[];
  current_stage_index: number;
  stage_due_dates: string[] | null;
  progress: number;
  due_date: string;
  description: string | null;
  sort_order: number;
  updated_at: string | null;
  updated_by: string | null;
}

interface MilestoneRow {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  sort_order: number;
}

function toProject(row: ProjectRow): Project {
  return {
    id:                row.id,
    name:              row.name,
    owner:             row.owner,
    health:            row.health as HealthStatus,
    stages:            Array.isArray(row.stages) ? row.stages : [],
    currentStageIndex: row.current_stage_index ?? 0,
    stageDueDates:     row.stage_due_dates ?? [],
    progress:          row.progress,
    dueDate:           row.due_date ?? '',
    description:       row.description ?? undefined,
    updatedAt:         row.updated_at ?? undefined,
    updatedBy:         row.updated_by ?? undefined,
    ownerId:           row.owner_id ?? undefined,
  };
}

function toMilestone(row: MilestoneRow): Milestone {
  return {
    id:          row.id,
    projectId:   row.project_id,
    title:       row.title,
    isCompleted: row.is_completed,
    dueDate:     row.due_date ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>;

export async function fetchProjects(client?: AnyClient): Promise<Project[]> {
  const supabase = client ?? createBrowserSupabase();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, owner, owner_id, health, stages, current_stage_index, stage_due_dates, progress, due_date, description, sort_order, updated_at, updated_by')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`[fetchProjects] ${error.message}`);
  return (data as ProjectRow[]).map(toProject);
}

export async function fetchMilestones(client?: AnyClient): Promise<Milestone[]> {
  const supabase = client ?? createBrowserSupabase();
  const { data, error } = await supabase
    .from('milestones')
    .select('id, project_id, title, is_completed, due_date, sort_order')
    .order('project_id', { ascending: true })
    .order('sort_order',  { ascending: true });
  if (error) throw new Error(`[fetchMilestones] ${error.message}`);
  return (data as MilestoneRow[]).map(toMilestone);
}

interface SubtaskRow {
  id: string;
  project_id: string;
  stage_index: number;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  sort_order: number;
}

function toSubtask(row: SubtaskRow): Subtask {
  return {
    id:          row.id,
    projectId:   row.project_id,
    stageIndex:  row.stage_index,
    title:       row.title,
    isCompleted: row.is_completed,
    dueDate:     row.due_date ?? undefined,
    sortOrder:   row.sort_order,
  };
}

export async function fetchSubtasks(projectId: string, client?: AnyClient): Promise<Subtask[]> {
  const supabase = client ?? createBrowserSupabase();
  const { data, error } = await supabase
    .from('subtasks')
    .select('id, project_id, stage_index, title, is_completed, due_date, sort_order')
    .eq('project_id', projectId)
    .order('stage_index', { ascending: true })
    .order('sort_order',  { ascending: true });
  if (error) throw new Error(`[fetchSubtasks] ${error.message}`);
  return (data as SubtaskRow[]).map(toSubtask);
}

/** 获取所有团队成员（用于共享选人） */
export async function fetchProfiles(client?: AnyClient): Promise<Profile[]> {
  const supabase = client ?? createBrowserSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .order('name');
  if (error) throw new Error(`[fetchProfiles] ${error.message}`);
  return data as Profile[];
}

/** 获取某项目的所有成员 userId 列表 */
export async function fetchProjectMemberIds(projectId: string): Promise<string[]> {
  const supabase = createBrowserSupabase();
  const { data, error } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId);
  if (error) throw new Error(`[fetchProjectMemberIds] ${error.message}`);
  return (data as { user_id: string }[]).map((r) => r.user_id);
}

/** 获取当前用户可见的所有项目的成员记录（用于卡片展示） */
export async function fetchAllProjectMembers(): Promise<{ projectId: string; userId: string }[]> {
  const supabase = createBrowserSupabase();
  const { data, error } = await supabase
    .from('project_members')
    .select('project_id, user_id');
  if (error) return [];
  return (data as { project_id: string; user_id: string }[]).map((r) => ({
    projectId: r.project_id,
    userId:    r.user_id,
  }));
}
