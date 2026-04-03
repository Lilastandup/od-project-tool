-- ============================================================
--  开放匿名写权限（内部工具，暂无 Auth）
--  在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- 移除之前仅限 service_role 的写策略
DROP POLICY IF EXISTS "service write projects"   ON projects;
DROP POLICY IF EXISTS "service write milestones" ON milestones;

-- 允许 anon 进行所有写操作（INSERT / UPDATE / DELETE）
-- 后续接入 Supabase Auth 后，将 USING(true) 替换为 auth.uid() 相关条件
CREATE POLICY "anon write projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon write milestones"
  ON milestones FOR ALL
  USING (true)
  WITH CHECK (true);
