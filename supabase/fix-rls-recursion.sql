-- ============================================================
--  Fix: 修复 project_members ↔ projects RLS 循环引用
-- ============================================================

-- 创建 SECURITY DEFINER 函数，绕过 RLS 直接读取 owner_id
-- 这样 project_members 策略不再触发 projects 的 RLS，打断循环
CREATE OR REPLACE FUNCTION get_project_owner_id(p_project_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM projects WHERE id = p_project_id
$$;

-- 重建 project_members 策略，改用函数而非子查询
DROP POLICY IF EXISTS "project_members: 可读"   ON project_members;
DROP POLICY IF EXISTS "project_members: owner 可写" ON project_members;

CREATE POLICY "project_members: 可读"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    get_project_owner_id(project_id) = auth.uid()
  );

CREATE POLICY "project_members: owner 可写"
  ON project_members FOR ALL
  TO authenticated
  USING    (get_project_owner_id(project_id) = auth.uid())
  WITH CHECK (get_project_owner_id(project_id) = auth.uid());
