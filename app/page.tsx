import { redirect } from 'next/navigation';
import DashboardClient from './components/DashboardClient';
import { createServerSupabase } from './lib/supabase-server';
import { fetchProjects, fetchMilestones } from './lib/queries';
import type { Project, Milestone } from './lib/types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export default async function DashboardPage() {
  // ── No env vars → fall back to mock data (local dev without Supabase) ──
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('\n⚠  [OD] Supabase 环境变量未配置，当前使用 Mock 数据。\n');
    const { MOCK_PROJECTS, MOCK_MILESTONES } = await import('./lib/mock-data');
    const mockUser: AuthUser = { id: 'mock', email: 'dev@example.com', name: '开发模式' };
    return (
      <DashboardClient
        initialProjects={MOCK_PROJECTS}
        initialMilestones={MOCK_MILESTONES}
        user={mockUser}
      />
    );
  }

  // ── Session check ────────────────────────────────────────────
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ── Fetch profile name ───────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const authUser: AuthUser = {
    id:    user.id,
    email: user.email ?? '',
    name:  profile?.name || user.email?.split('@')[0] || '用户',
  };

  // ── Fetch data ───────────────────────────────────────────────
  let projects: Project[]     = [];
  let milestones: Milestone[] = [];
  try {
    [projects, milestones] = await Promise.all([
      fetchProjects(supabase),
      fetchMilestones(supabase),
    ]);
  } catch (err) {
    console.error('[OD] 数据加载失败:', err);
  }

  return (
    <DashboardClient
      initialProjects={projects}
      initialMilestones={milestones}
      user={authUser}
    />
  );
}
