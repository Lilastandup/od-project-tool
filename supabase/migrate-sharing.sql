-- ============================================================
--  Migration: 项目共享 / 多人协作
-- ============================================================

-- ── 1. 项目成员表 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 成员记录：本人可见，或项目 owner 可见
CREATE POLICY "project_members: 可读"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

-- 只有项目 owner 可以增删成员
CREATE POLICY "project_members: owner 可写"
  ON project_members FOR ALL
  TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );

-- ── 2. 重建 projects RLS（成员也可读写）─────────────────────
DROP POLICY IF EXISTS "projects: 只读自己的"      ON projects;
DROP POLICY IF EXISTS "projects: 只创建属于自己的" ON projects;
DROP POLICY IF EXISTS "projects: owner 可更新"    ON projects;
DROP POLICY IF EXISTS "projects: owner 可删除"    ON projects;

CREATE POLICY "projects: 可读"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "projects: 只创建属于自己的"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects: 可更新"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "projects: owner 可删除"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ── 3. 重建 milestones RLS ───────────────────────────────────
DROP POLICY IF EXISTS "milestones: 随项目可读" ON milestones;
DROP POLICY IF EXISTS "milestones: 随项目可写" ON milestones;

CREATE POLICY "milestones: 随项目可读"
  ON milestones FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "milestones: 随项目可写"
  ON milestones FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- ── 4. 重建 subtasks RLS ─────────────────────────────────────
DROP POLICY IF EXISTS "subtasks: 随项目可读" ON subtasks;
DROP POLICY IF EXISTS "subtasks: 随项目可写" ON subtasks;

CREATE POLICY "subtasks: 随项目可读"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "subtasks: 随项目可写"
  ON subtasks FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
