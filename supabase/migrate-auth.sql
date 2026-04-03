-- ============================================================
--  Migration: 引入用户身份体系
--  在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- ── 1. 用户信息表（与 auth.users 1:1）────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可读取所有 profile（显示协作成员姓名需要）
CREATE POLICY "profiles: 登录用户可读"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 只能更新自己的 profile
CREATE POLICY "profiles: 只能更新自己"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── 2. 新用户注册时自动创建 profile ──────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 3. projects 表加 owner_id ────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 把现有数据的 owner_id 先设为 null（旧数据），不影响运行
-- 新建项目时会由代码写入登录用户的 uid

-- ── 4. 重建 projects RLS（按登录用户隔离）────────────────────
-- 先删旧策略
DROP POLICY IF EXISTS "anon read projects"   ON projects;
DROP POLICY IF EXISTS "anon write projects"  ON projects;
DROP POLICY IF EXISTS "service write projects" ON projects;

-- 登录用户只能读取自己的项目
CREATE POLICY "projects: 只读自己的"
  ON projects FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- 登录用户只能创建属于自己的项目
CREATE POLICY "projects: 只创建属于自己的"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 只有 owner 可以更新/删除
CREATE POLICY "projects: owner 可更新"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "projects: owner 可删除"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ── 5. 重建 milestones RLS（跟随项目权限）───────────────────
DROP POLICY IF EXISTS "anon read milestones"  ON milestones;
DROP POLICY IF EXISTS "anon write milestones" ON milestones;
DROP POLICY IF EXISTS "service write milestones" ON milestones;

-- 能看到项目的人才能看到里程碑
CREATE POLICY "milestones: 随项目可读"
  ON milestones FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "milestones: 随项目可写"
  ON milestones FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );
