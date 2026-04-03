-- ============================================================
--  Migration: 子任务表
--  在 Supabase SQL Editor 中运行此文件
-- ============================================================

CREATE TABLE IF NOT EXISTS subtasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_index  SMALLINT    NOT NULL DEFAULT 0,
  title        TEXT        NOT NULL DEFAULT '',
  is_completed BOOLEAN     NOT NULL DEFAULT false,
  due_date     DATE,
  sort_order   INT         NOT NULL DEFAULT 9999,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- 能看到项目的人才能看到子任务
CREATE POLICY "subtasks: 随项目可读"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- 能看到项目的人才能写子任务
CREATE POLICY "subtasks: 随项目可写"
  ON subtasks FOR ALL
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

-- 索引加速按项目+阶段查询
CREATE INDEX IF NOT EXISTS subtasks_project_stage_idx ON subtasks(project_id, stage_index);
