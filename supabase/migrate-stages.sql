-- ============================================================
--  Migration: 用自定义阶段数组替代硬编码 stage 枚举
--  在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- 1. 添加新列
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS stages             JSONB    NOT NULL DEFAULT '["调研诊断","方案设计","落地执行","复盘总结"]',
  ADD COLUMN IF NOT EXISTS current_stage_index SMALLINT NOT NULL DEFAULT 0;

-- 2. 将旧 stage 字段的值迁移到新列
UPDATE projects SET current_stage_index =
  CASE stage
    WHEN '调研诊断' THEN 0
    WHEN '方案设计' THEN 1
    WHEN '落地执行' THEN 2
    WHEN '复盘总结' THEN 3
    ELSE 0
  END;

-- 3. 删除旧的 stage 列（及其 CHECK 约束）
ALTER TABLE projects DROP COLUMN IF EXISTS stage;
