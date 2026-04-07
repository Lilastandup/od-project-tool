export type HealthStatus = 'green' | 'yellow' | 'red';

export interface Subtask {
  id: string;
  projectId: string;
  stageIndex: number;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  sortOrder: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  ownerId?: string;
  health: HealthStatus;
  /** 阶段名称数组，有序，e.g. ["需求调研","方案设计","试点运行","效果评估"] */
  stages: string[];
  /** 当前阶段在 stages 数组中的下标（0-based） */
  currentStageIndex: number;
  stageDueDates?: string[];
  progress: number;
  dueDate: string;
  description?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/** 常用 OD 项目阶段模板，用于新建时快速填充 */
export const STAGE_PRESETS: Record<string, string[]> = {
  '通用四阶段':    ['调研诊断', '方案设计', '落地执行', '复盘总结'],
  '培训发展项目':  ['需求分析', '方案设计', '课程开发', '试点实施', '全面推广', '效果评估'],
  '人才盘点项目':  ['准备校准', '数据采集', '九宫格校准', '结果校准', '发展计划制定'],
  '组织文化调研':  ['问卷设计', '数据收集', '分析诊断', '报告输出', '改进落地'],
  '体系建设项目':  ['现状诊断', '标准设计', '评审定稿', '试点验证', '推广落地'],
};
