-- ============================================================
--  Migration: 为 projects 添加 updated_at 自动更新时间戳
-- ============================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 初始化现有行的 updated_at（设为当前时间）
UPDATE projects SET updated_at = NOW() WHERE updated_at IS NULL;

-- 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_set_updated_at ON projects;
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
