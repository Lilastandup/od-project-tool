import * as XLSX from 'xlsx';
import type { Project, Subtask } from './types';
import { effectiveHealth } from './health';

const HEALTH_LABEL: Record<string, string> = {
  green:  '正常',
  yellow: '有风险',
  red:    '延期',
};

export function exportProjectsToExcel(projects: Project[], subtasks: Subtask[]) {
  const rows = projects.map((p) => {
    const idx = Math.min(p.currentStageIndex, p.stages.length - 1);
    const projectSubtasks = subtasks.filter((t) => t.projectId === p.id);
    const eff = effectiveHealth(p.health, p.dueDate, idx, projectSubtasks);

    const stageSubtasks  = projectSubtasks.filter((t) => t.stageIndex === idx);
    const doneTasks      = stageSubtasks.filter((t) => t.isCompleted).length;

    return {
      '项目名称':       p.name,
      '负责人':         p.owner,
      '健康状态':       HEALTH_LABEL[eff] ?? eff,
      '当前阶段':       p.stages[idx] ?? '—',
      '阶段进度':       `${idx + 1}/${p.stages.length}`,
      '当前阶段子任务': stageSubtasks.length > 0 ? `${doneTasks}/${stageSubtasks.length}` : '—',
      '完成进度 (%)':   p.progress,
      '预期完成日期':   p.dueDate,
      '最近更新人':     p.updatedBy ?? p.owner,
      '项目描述':       p.description ?? '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook  = XLSX.utils.book_new();

  worksheet['!cols'] = [
    { wch: 28 }, // 项目名称
    { wch: 10 }, // 负责人
    { wch: 10 }, // 健康状态
    { wch: 14 }, // 当前阶段
    { wch: 10 }, // 阶段进度
    { wch: 14 }, // 当前阶段子任务
    { wch: 12 }, // 完成进度
    { wch: 14 }, // 预期完成日期
    { wch: 14 }, // 最近更新人
    { wch: 36 }, // 项目描述
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '项目看板');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `OD项目看板_${today}.xlsx`);
}
