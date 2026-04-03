-- ============================================================
--  OD 项目控制塔 · Supabase Schema
--  在 Supabase Dashboard → SQL Editor 中运行此文件
-- ============================================================

-- ── 1. 项目表 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  owner       TEXT        NOT NULL,
  health      TEXT        NOT NULL DEFAULT 'green'
                          CHECK (health IN ('green', 'yellow', 'red')),
  stage       TEXT        NOT NULL
                          CHECK (stage IN ('调研诊断', '方案设计', '落地执行', '复盘总结')),
  progress    SMALLINT    NOT NULL DEFAULT 0
                          CHECK (progress BETWEEN 0 AND 100),
  due_date    DATE        NOT NULL,
  description TEXT,
  sort_order  SMALLINT    NOT NULL DEFAULT 0,   -- 控制看板显示顺序
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. 里程碑表 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  is_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  due_date     DATE,
  sort_order   SMALLINT    NOT NULL DEFAULT 0,  -- 控制每个项目内的里程碑顺序
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. 索引 ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_milestones_project_id
  ON milestones(project_id);

-- 只为"未完成里程碑"建部分索引，加速看板查询
CREATE INDEX IF NOT EXISTS idx_milestones_pending
  ON milestones(project_id, sort_order)
  WHERE NOT is_completed;

-- ── 4. updated_at 自动更新触发器 ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. Row Level Security ────────────────────────────────────
--  当前为内部工具，开放匿名读权限；后续接入 Auth 时收紧。
ALTER TABLE projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- 允许持有 anon key 的客户端读取（看板展示用）
CREATE POLICY "anon read projects"
  ON projects FOR SELECT USING (true);

CREATE POLICY "anon read milestones"
  ON milestones FOR SELECT USING (true);

-- 写操作暂只允许 service_role（后台脚本/管理员）
-- 后续加入 Auth 后可改为 auth.uid() 相关条件
CREATE POLICY "service write projects"
  ON projects FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service write milestones"
  ON milestones FOR ALL USING (auth.role() = 'service_role');
