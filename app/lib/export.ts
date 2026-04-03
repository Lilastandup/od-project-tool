/**
 * 将项目看板数据导出为 .xlsx 文件，直接在浏览器触发下载。
 */
import * as XLSX from 'xlsx';
import type { Project, Milestone } from './types';

const HEALTH_LABEL: Record<string, string> = {
  green:  '正常',
  yellow: '有风险',
  red:    '延期',
};

export function exportProjectsToExcel(
  projects: Project[],
  milestones: Milestone[]
) {
  const rows = projects.map((p) => {
    const nextMilestone = milestones.find(
      (m) => m.projectId === p.id && !m.isCompleted
    );
    return {
      '项目名称':       p.name,
      '负责人':         p.owner,
      '健康状态':       HEALTH_LABEL[p.health] ?? p.health,
      '当前阶段':       p.stages[p.currentStageIndex] ?? '—',
      '阶段进度':       `${p.currentStageIndex + 1}/${p.stages.length}`,
      '完成进度 (%)':   p.progress,
      '预期完成日期':   p.dueDate,
      '项目描述':       p.description ?? '',
      '下一里程碑':     nextMilestone?.title ?? '—',
      '里程碑截止日':   nextMilestone?.dueDate ?? '—',
    };
  });

  const worksheet  = XLSX.utils.json_to_sheet(rows);
  const workbook   = XLSX.utils.book_new();

  // Column widths (in chars)
  worksheet['!cols'] = [
    { wch: 28 }, // 项目名称
    { wch: 10 }, // 负责人
    { wch: 10 }, // 健康状态
    { wch: 10 }, // 当前阶段
    { wch: 14 }, // 完成进度
    { wch: 14 }, // 预期完成日期
    { wch: 36 }, // 项目描述
    { wch: 28 }, // 下一里程碑
    { wch: 14 }, // 里程碑截止日
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '项目看板');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `OD项目看板_${today}.xlsx`);
}
