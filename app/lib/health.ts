import type { HealthStatus, Subtask } from './types';

const rank: Record<HealthStatus, number> = { green: 0, yellow: 1, red: 2 };

export function effectiveHealth(
  manualHealth: HealthStatus,
  dueDate: string,
  currentStageIndex: number,
  subtasks: Subtask[],
): HealthStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / 86400000);

  let autoLevel: HealthStatus = 'green';

  if (daysLeft < 0) {
    autoLevel = 'red';
  } else if (daysLeft <= 2) {
    autoLevel = 'yellow';
  }

  if (autoLevel !== 'red') {
    const stageTasks = subtasks.filter(
      (t) => t.stageIndex === currentStageIndex && !t.isCompleted && t.dueDate
    );
    for (const t of stageTasks) {
      const tDays = Math.ceil((new Date(t.dueDate!).getTime() - now.getTime()) / 86400000);
      if (tDays < 0 || tDays <= 2) {
        autoLevel = 'yellow';
        break;
      }
    }
  }

  return rank[autoLevel] > rank[manualHealth] ? autoLevel : manualHealth;
}

export function autoReason(
  dueDate: string,
  currentStageIndex: number,
  subtasks: Subtask[],
): string | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / 86400000);

  if (daysLeft < 0) return `项目已超期 ${Math.abs(daysLeft)} 天`;
  if (daysLeft <= 2) return `距截止日期仅 ${daysLeft} 天`;

  const stageTasks = subtasks.filter(
    (t) => t.stageIndex === currentStageIndex && !t.isCompleted && t.dueDate
  );
  for (const t of stageTasks) {
    const tDays = Math.ceil((new Date(t.dueDate!).getTime() - now.getTime()) / 86400000);
    if (tDays < 0) return '当前阶段有子任务已逾期';
    if (tDays <= 2) return '当前阶段有子任务即将到期';
  }

  return null;
}
