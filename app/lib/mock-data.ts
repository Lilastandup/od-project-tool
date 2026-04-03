import type { Project, Milestone } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1', name: '2024 人才盘点项目', owner: '张雪', health: 'green',
    stages: ['准备校准', '数据采集', '九宫格校准', '结果校准', '发展计划制定'],
    currentStageIndex: 2, progress: 72, dueDate: '2026-05-31',
    description: '完成全公司核心岗位人才九宫格评估与后备梯队建设',
  },
  {
    id: 'p2', name: '新任管理者发展项目', owner: '李明', health: 'yellow',
    stages: ['需求分析', '方案设计', '课程开发', '试点实施', '全面推广', '效果评估'],
    currentStageIndex: 1, progress: 35, dueDate: '2026-06-15',
    description: '面向新晋升管理者的6个月系统化赋能培养项目',
  },
  {
    id: 'p3', name: '组织文化健康度调研', owner: '张雪', health: 'green',
    stages: ['问卷设计', '数据收集', '分析诊断', '报告输出', '改进落地'],
    currentStageIndex: 1, progress: 55, dueDate: '2026-04-30',
    description: '通过问卷与焦点小组了解当前文化现状与改进方向',
  },
  {
    id: 'p4', name: '销售序列任职资格体系', owner: '王芳', health: 'red',
    stages: ['现状诊断', '标准设计', '评审定稿', '试点验证', '推广落地'],
    currentStageIndex: 2, progress: 20, dueDate: '2026-04-10',
    description: '构建销售岗位族的任职资格标准及评定机制',
  },
  {
    id: 'p5', name: '高潜人才加速发展计划', owner: '李明', health: 'green',
    stages: ['遴选评估', '发展规划', '项目实施', '复盘总结'],
    currentStageIndex: 3, progress: 90, dueDate: '2026-04-20',
    description: '遴选20名高潜员工完成为期一年的加速发展项目',
  },
  {
    id: 'p6', name: 'HRBP 能力建设项目', owner: '王芳', health: 'yellow',
    stages: ['调研诊断', '方案设计', '落地执行', '复盘总结'],
    currentStageIndex: 0, progress: 15, dueDate: '2026-07-31',
    description: '全面提升 HRBP 团队的业务伙伴能力与咨询服务水平',
  },
  {
    id: 'p7', name: '绩效管理体系优化', owner: '张雪', health: 'green',
    stages: ['问题诊断', 'OKR 方案设计', '试点部门运行', '全面推广'],
    currentStageIndex: 1, progress: 48, dueDate: '2026-05-15',
    description: '对现有 KPI 体系进行 OKR 化改造试点',
  },
];

export const MOCK_MILESTONES: Milestone[] = [
  { id: 'm1',  projectId: 'p1', title: '完成业务单元负责人访谈',   isCompleted: true  },
  { id: 'm2',  projectId: 'p1', title: '召开人才校准会（BU 级）', isCompleted: true  },
  { id: 'm3',  projectId: 'p1', title: '输出人才盘点报告初稿',    isCompleted: false, dueDate: '2026-04-15' },
  { id: 'm4',  projectId: 'p1', title: '完成后备人才发展计划',    isCompleted: false, dueDate: '2026-05-20' },
  { id: 'm5',  projectId: 'p2', title: '完成需求调研与访谈',      isCompleted: true  },
  { id: 'm6',  projectId: 'p2', title: '课程体系方案评审',        isCompleted: false, dueDate: '2026-04-12' },
  { id: 'm7',  projectId: 'p2', title: '外部讲师资源确认',        isCompleted: false, dueDate: '2026-04-30' },
  { id: 'm8',  projectId: 'p3', title: '问卷设计与发布',          isCompleted: true  },
  { id: 'm9',  projectId: 'p3', title: '焦点小组访谈（3场）',     isCompleted: false, dueDate: '2026-04-08' },
  { id: 'm10', projectId: 'p3', title: '调研数据分析报告',        isCompleted: false, dueDate: '2026-04-25' },
  { id: 'm11', projectId: 'p4', title: '岗位族划分与标准框架',    isCompleted: true  },
  { id: 'm12', projectId: 'p4', title: '各级行为标准初稿',        isCompleted: false, dueDate: '2026-04-05' },
  { id: 'm13', projectId: 'p4', title: '销售团队评审与定稿',      isCompleted: false, dueDate: '2026-04-10' },
  { id: 'm14', projectId: 'p5', title: '高潜人才结项答辩',        isCompleted: true  },
  { id: 'm15', projectId: 'p5', title: '项目复盘报告初稿',        isCompleted: false, dueDate: '2026-04-10' },
  { id: 'm16', projectId: 'p5', title: '下一期项目方案启动',      isCompleted: false, dueDate: '2026-04-20' },
  { id: 'm17', projectId: 'p6', title: 'HRBP 现状能力评估',       isCompleted: false, dueDate: '2026-04-18' },
  { id: 'm18', projectId: 'p6', title: '能力模型设计与对标',      isCompleted: false, dueDate: '2026-05-30' },
  { id: 'm19', projectId: 'p7', title: '现有绩效体系问题诊断',    isCompleted: true  },
  { id: 'm20', projectId: 'p7', title: 'OKR 试点部门确认',        isCompleted: false, dueDate: '2026-04-14' },
  { id: 'm21', projectId: 'p7', title: 'OKR 培训与辅导方案',      isCompleted: false, dueDate: '2026-05-05' },
];
