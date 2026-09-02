import type {
  AuditLog,
  DashboardCharts,
  DecisionData,
  DetectionItem,
  DimensionItem,
  DiseaseDist,
  EmissionFactor,
  KpiCard,
  MeasureData,
  ModelVersion,
  ProcessItem,
  ReportHistory,
  ReportJob,
  ReportTemplate,
  RouteDist,
  StatsData,
  TaskDetail,
  TaskFlow,
  TaskItem,
  TrendPoint
} from '../src/types'

export const kpis: KpiCard[] = [
  { key: 'today', label: '今日任务', value: 12, unit: '个', trend: 20, icon: 'FolderKanban', color: '#D97706' },
  { key: 'review', label: '待复核', value: 7, unit: '个', trend: -12, icon: 'ClipboardCheck', color: '#7C3AED' },
  { key: 'disease', label: '本月病害点数', value: 86, unit: '处', trend: 8.5, icon: 'ScanSearch', color: '#2563EB' },
  { key: 'carbon', label: '累计预估减排量', value: 3.42, unit: 't CO2e', trend: 15.4, icon: 'Leaf', color: '#16A34A' }
]

export const diseaseDist: DiseaseDist[] = [
  { type: 'transverse', name: '横向裂缝', count: 28 },
  { type: 'longitudinal', name: '纵向裂缝', count: 24 },
  { type: 'alligator', name: '龟裂', count: 19 },
  { type: 'pothole', name: '坑槽', count: 15 }
]

export const routeDist: RouteDist[] = [
  { road: 'S301 K12+000', county: '城关街道', count: 18, completed: 15 },
  { road: 'X023 K5+200', county: '石桥镇', count: 14, completed: 9 },
  { road: 'Y118 K8+300', county: '杨河乡', count: 12, completed: 8 },
  { road: 'G205 K352+600', county: '北坡镇', count: 11, completed: 11 },
  { road: 'S219 K77+100', county: '红岩镇', count: 9, completed: 6 },
  { road: 'X045 K2+900', county: '柳湾镇', count: 7, completed: 5 },
  { road: 'Y209 K15+600', county: '新店乡', count: 6, completed: 6 },
  { road: 'G319 K108+200', county: '白水街道', count: 5, completed: 3 }
]

export const trend: TrendPoint[] = [
  { date: '08-03', count: 18, reviewed: 12 },
  { date: '08-05', count: 22, reviewed: 16 },
  { date: '08-07', count: 19, reviewed: 14 },
  { date: '08-09', count: 25, reviewed: 19 },
  { date: '08-11', count: 21, reviewed: 15 },
  { date: '08-13', count: 27, reviewed: 21 },
  { date: '08-15', count: 24, reviewed: 20 },
  { date: '08-17', count: 30, reviewed: 24 },
  { date: '08-19', count: 28, reviewed: 22 },
  { date: '08-21', count: 33, reviewed: 25 },
  { date: '08-23', count: 31, reviewed: 27 },
  { date: '08-25', count: 29, reviewed: 24 },
  { date: '08-27', count: 34, reviewed: 28 },
  { date: '08-29', count: 36, reviewed: 30 },
  { date: '08-31', count: 32, reviewed: 27 }
]

export const dashboardChartsData: DashboardCharts = {
  days: 30,
  diseaseDist,
  routeDist,
  trend
}

export const tasks: TaskItem[] = [
  { id: 'RD-20260902-003', name: 'S301 城区段专项巡检', road: 'S301 K12+000-K12+800', roadLevel: '省道', county: '城关街道', imageCount: 24, diseaseCount: 14, status: 'reviewing', createdAt: '2026-09-02 09:20', updatedAt: '2026-09-02 10:58', equipment: '行车记录仪', note: '雨后补拍' },
  { id: 'RD-20260902-002', name: 'X023 石桥段日常巡检', road: 'X023 K5+200-K6+000', roadLevel: '县道', county: '石桥镇', imageCount: 18, diseaseCount: 9, status: 'deciding', createdAt: '2026-09-02 08:45', updatedAt: '2026-09-02 11:02', equipment: '手机', note: '' },
  { id: 'RD-20260902-001', name: 'Y118 杨河乡重点路段', road: 'Y118 K8+300-K9+100', roadLevel: '乡道', county: '杨河乡', imageCount: 15, diseaseCount: 11, status: 'recognizing', createdAt: '2026-09-02 07:30', updatedAt: '2026-09-02 11:10', equipment: '行车记录仪' },
  { id: 'RD-20260901-005', name: 'G205 北坡镇夜间巡检', road: 'G205 K352+600-K353+200', roadLevel: '国道', county: '北坡镇', imageCount: 30, diseaseCount: 12, status: 'completed', createdAt: '2026-09-01 21:10', updatedAt: '2026-09-02 08:30', equipment: '手机' },
  { id: 'RD-20260901-004', name: 'S219 红岩镇裂缝核查', road: 'S219 K77+100-K78+000', roadLevel: '省道', county: '红岩镇', imageCount: 22, diseaseCount: 8, status: 'completed', createdAt: '2026-09-01 16:40', updatedAt: '2026-09-01 20:15', equipment: '行车记录仪' },
  { id: 'RD-20260901-003', name: 'X045 柳湾镇雨后巡检', road: 'X045 K2+900-K3+500', roadLevel: '县道', county: '柳湾镇', imageCount: 20, diseaseCount: 7, status: 'failed', createdAt: '2026-09-01 14:20', updatedAt: '2026-09-01 15:05', equipment: '手机', note: '3 张图片格式异常' },
  { id: 'RD-20260901-002', name: 'Y209 新店乡日常巡检', road: 'Y209 K15+600-K16+200', roadLevel: '乡道', county: '新店乡', imageCount: 16, diseaseCount: 5, status: 'completed', createdAt: '2026-09-01 10:05', updatedAt: '2026-09-01 12:00', equipment: '行车记录仪' },
  { id: 'RD-20260901-001', name: 'G319 白水街道病害复核', road: 'G319 K108+200-K108+800', roadLevel: '国道', county: '白水街道', imageCount: 12, diseaseCount: 6, status: 'completed', createdAt: '2026-09-01 08:50', updatedAt: '2026-09-01 11:32', equipment: '手机' }
]

export const recentTasks: TaskItem[] = tasks.slice(0, 6)

export const taskFlows: TaskFlow[] = [
  { time: '2026-09-02 09:20', event: '创建任务', operator: '李工', description: '新建巡检任务 S301 城区段专项巡检' },
  { time: '2026-09-02 09:24', event: '批量上传', operator: '李工', description: '上传 24 张影像，全部通过格式检查' },
  { time: '2026-09-02 09:30', event: '启动识别', operator: '系统', description: '进入 YOLOv8-seg 实例分割流水线' },
  { time: '2026-09-02 09:42', event: '识别完成', operator: '系统', description: '识别 14 处病害，平均置信度 0.91' },
  { time: '2026-09-02 09:45', event: '进入复核', operator: '王工', description: '开始人工复核掩码与类别' },
  { time: '2026-09-02 10:58', event: '保存复核', operator: '王工', description: '已确认 11 处，标记 2 处误检，待补充 1 处' }
]

export const taskDetail: TaskDetail = {
  ...tasks[0],
  flows: taskFlows
}

export const detections: DetectionItem[] = [
  {
    id: 'DET-001', imageIndex: 0, type: 'transverse', label: '横向裂缝', confidence: 0.94, pixelArea: 18240, status: 'confirmed',
    polygon: [{ x: 0.34, y: 0.4 }, { x: 0.76, y: 0.32 }, { x: 0.74, y: 0.28 }, { x: 0.32, y: 0.36 }]
  },
  {
    id: 'DET-002', imageIndex: 0, type: 'pothole', label: '坑槽', confidence: 0.86, pixelArea: 9840, status: 'pending',
    polygon: [{ x: 0.68, y: 0.58 }, { x: 0.79, y: 0.54 }, { x: 0.84, y: 0.65 }, { x: 0.73, y: 0.7 }, { x: 0.65, y: 0.64 }]
  },
  {
    id: 'DET-003', imageIndex: 1, type: 'longitudinal', label: '纵向裂缝', confidence: 0.91, pixelArea: 22460, status: 'pending',
    polygon: [{ x: 0.43, y: 0.1 }, { x: 0.5, y: 0.14 }, { x: 0.58, y: 0.88 }, { x: 0.51, y: 0.9 }]
  },
  {
    id: 'DET-004', imageIndex: 1, type: 'transverse', label: '横向裂缝', confidence: 0.79, pixelArea: 11440, status: 'confirmed',
    polygon: [{ x: 0.58, y: 0.34 }, { x: 0.75, y: 0.28 }, { x: 0.77, y: 0.25 }, { x: 0.56, y: 0.3 }]
  },
  {
    id: 'DET-005', imageIndex: 2, type: 'pothole', label: '坑槽', confidence: 0.95, pixelArea: 14620, status: 'confirmed',
    polygon: [{ x: 0.32, y: 0.48 }, { x: 0.5, y: 0.42 }, { x: 0.53, y: 0.56 }, { x: 0.37, y: 0.6 }]
  },
  {
    id: 'DET-006', imageIndex: 2, type: 'alligator', label: '龟裂', confidence: 0.82, pixelArea: 27350, status: 'pending',
    polygon: [{ x: 0.6, y: 0.28 }, { x: 0.72, y: 0.34 }, { x: 0.66, y: 0.52 }, { x: 0.54, y: 0.42 }]
  },
  {
    id: 'DET-007', imageIndex: 3, type: 'alligator', label: '龟裂', confidence: 0.88, pixelArea: 30210, status: 'pending',
    polygon: [{ x: 0.34, y: 0.34 }, { x: 0.56, y: 0.3 }, { x: 0.63, y: 0.64 }, { x: 0.42, y: 0.68 }]
  },
  {
    id: 'DET-008', imageIndex: 3, type: 'pothole', label: '坑槽', confidence: 0.73, pixelArea: 7610, status: 'false_positive',
    polygon: [{ x: 0.68, y: 0.7 }, { x: 0.76, y: 0.66 }, { x: 0.79, y: 0.74 }, { x: 0.7, y: 0.77 }]
  }
]

export const dimensions: DimensionItem[] = [
  { id: 'DIM-001', type: 'transverse', label: '横向裂缝-1', length: 3.8, width: 4.2, area: 0.96, density: 8.2, grade: '轻' },
  { id: 'DIM-002', type: 'pothole', label: '坑槽-1', length: 0.62, width: 0.48, area: 0.26, density: 11.4, grade: '中' },
  { id: 'DIM-003', type: 'longitudinal', label: '纵向裂缝-1', length: 8.6, width: 5.1, area: 0.54, density: 6.7, grade: '轻' },
  { id: 'DIM-004', type: 'alligator', label: '龟裂-1', length: 1.9, width: 1.4, area: 2.1, density: 34.6, grade: '重' },
  { id: 'DIM-005', type: 'transverse', label: '横向裂缝-2', length: 2.4, width: 3.6, area: 0.71, density: 9.8, grade: '中' }
]

export const measureData: MeasureData = {
  taskId: 'RD-20260902-003',
  calibration: { mode: 'ruler', rulerLength: 1, scalePxPerMeter: 18.6, calibrated: true },
  dimensions,
  auditCount: 2
}

export const decisionData: DecisionData = {
  taskId: 'RD-20260902-003',
  params: { area: 128.6, serviceYears: 5, transportDistance: 18, materialUsage: 14.2, machineryHours: 8, fuelConsumption: 120 },
  schemes: [
    {
      id: 'S1', name: '传统热补', type: 'repair', cost: 8600, serviceYears: 3, recommended: false,
      carbon: { material: 420, transport: 95, machinery: 260, other: 40 }, totalCo2e: 815,
      note: '工艺成熟，但开凿作业能耗高，复修周期短。'
    },
    {
      id: 'S2', name: '预防性养护（预养护）', type: 'maintenance', cost: 5200, serviceYears: 5, recommended: true,
      carbon: { material: 260, transport: 55, machinery: 150, other: 25 }, totalCo2e: 490,
      note: '材料用量低，服务期长，周期累计碳排最低。'
    },
    {
      id: 'S3', name: '自定义方案', type: 'custom', cost: 6100, serviceYears: 4, recommended: false,
      carbon: { material: 320, transport: 70, machinery: 180, other: 30 }, totalCo2e: 600,
      note: '按当前参数手动组合，未固化工艺模板。'
    }
  ]
}

export const statsData: StatsData = {
  diseaseDist,
  routeDist,
  trend,
  review: [
    { month: '06', passRate: 88.2, total: 51 },
    { month: '07', passRate: 90.1, total: 67 },
    { month: '08', passRate: 92.4, total: 86 }
  ],
  schemeMetrics: [
    { name: '传统热补', totalCo2e: 815, cost: 8600 },
    { name: '预防性养护', totalCo2e: 490, cost: 5200 },
    { name: '自定义方案', totalCo2e: 600, cost: 6100 }
  ],
  pendingTop: [
    { label: '待复核任务', count: 7, type: 'review' },
    { label: '待决策任务', count: 5, type: 'decision' },
    { label: '识别中任务', count: 3, type: 'task' }
  ],
  rows: [
    { road: 'S301 K12+000', county: '城关街道', diseaseCount: 18, avgGrade: '轻', schemeCount: 2, estimatedReduction: 0.86, reportStatus: '待生成' },
    { road: 'X023 K5+200', county: '石桥镇', diseaseCount: 14, avgGrade: '中', schemeCount: 1, estimatedReduction: 0.72, reportStatus: '已生成' },
    { road: 'Y118 K8+300', county: '杨河乡', diseaseCount: 12, avgGrade: '中', schemeCount: 1, estimatedReduction: 0.55, reportStatus: '待复核' },
    { road: 'G205 K352+600', county: '北坡镇', diseaseCount: 11, avgGrade: '轻', schemeCount: 2, estimatedReduction: 0.93, reportStatus: '已生成' },
    { road: 'S219 K77+100', county: '红岩镇', diseaseCount: 9, avgGrade: '轻', schemeCount: 1, estimatedReduction: 0.47, reportStatus: '已生成' },
    { road: 'X045 K2+900', county: '柳湾镇', diseaseCount: 7, avgGrade: '重', schemeCount: 1, estimatedReduction: 0.0, reportStatus: '异常' },
    { road: 'Y209 K15+600', county: '新店乡', diseaseCount: 6, avgGrade: '轻', schemeCount: 1, estimatedReduction: 0.31, reportStatus: '已生成' }
  ]
}

export const reportTemplates: ReportTemplate[] = [
  { id: 'TPL-INSPECT', type: 'inspection', name: '路面巡检报告', description: '按任务聚合病害图像、识别结果、人工复核记录与量化明细。', formats: ['PDF', 'Word'], updatedAt: '2026-08-20' },
  { id: 'TPL-LOWCARBON', type: 'maintenance', name: '低碳养护报告', description: '输出候选工艺、分项碳排、成本与推荐依据，附排放因子来源表。', formats: ['PDF', 'Word'], updatedAt: '2026-08-24' },
  { id: 'TPL-SUMMARY', type: 'summary', name: '项目总结报告', description: '跨任务汇总病害分布、养护方案效益、复核指标与审计信息。', formats: ['PDF', 'Word'], updatedAt: '2026-08-28' }
]

export const reportQueue: ReportJob[] = [
  { id: 'JOB-260902-01', taskId: 'RD-20260902-002', templateType: 'maintenance', templateName: '低碳养护报告', status: 'generating', progress: 68, startedAt: '2026-09-02 11:05' },
  { id: 'JOB-260902-02', taskId: 'RD-20260902-001', templateType: 'inspection', templateName: '路面巡检报告', status: 'waiting', progress: 0, startedAt: '2026-09-02 11:08' },
  { id: 'JOB-260901-04', taskId: 'RD-20260901-005', templateType: 'maintenance', templateName: '低碳养护报告', status: 'done', progress: 100, startedAt: '2026-09-01 20:00', finishedAt: '2026-09-01 20:08' },
  { id: 'JOB-260901-03', taskId: 'RD-20260901-003', templateType: 'inspection', templateName: '路面巡检报告', status: 'failed', progress: 100, startedAt: '2026-09-01 15:10', finishedAt: '2026-09-01 15:12' }
]

export const reportHistory: ReportHistory[] = [
  { id: 'RPT-260901-004', name: 'G205 北坡镇低碳养护报告', scope: '单任务', taskId: 'RD-20260901-005', templateType: 'maintenance', creator: '李工', version: 'V1.2', createdAt: '2026-09-01 20:08', size: '2.4 MB' },
  { id: 'RPT-260901-003', name: 'S219 红岩镇巡检报告', scope: '单任务', taskId: 'RD-20260901-004', templateType: 'inspection', creator: '王工', version: 'V1.1', createdAt: '2026-09-01 19:10', size: '3.1 MB' },
  { id: 'RPT-260831-002', name: '项目月度总结（8月）', scope: '全项目', templateType: 'summary', creator: '李工', version: 'V1.0', createdAt: '2026-08-31 18:30', size: '1.8 MB' },
  { id: 'RPT-260828-001', name: 'X045 异常任务核查说明', scope: '单任务', taskId: 'RD-20260901-003', templateType: 'inspection', creator: '张工', version: 'V1.0', createdAt: '2026-08-28 11:12', size: '0.7 MB' }
]

export const processes: ProcessItem[] = [
  { id: 'PROC-001', name: '传统热补', diseaseTypes: ['pothole', 'alligator'], grades: ['中', '重'], materialCost: 42, machineryHours: 3.2, costPerSqm: 86, serviceYears: 3, updatedAt: '2026-08-18' },
  { id: 'PROC-002', name: '预防性灌缝', diseaseTypes: ['transverse', 'longitudinal'], grades: ['轻', '中'], materialCost: 18, machineryHours: 1.2, costPerSqm: 32, serviceYears: 5, updatedAt: '2026-08-18' },
  { id: 'PROC-003', name: '微表处', diseaseTypes: ['alligator'], grades: ['轻', '中'], materialCost: 24, machineryHours: 1.8, costPerSqm: 48, serviceYears: 4, updatedAt: '2026-08-20' },
  { id: 'PROC-004', name: '坑槽热料修补', diseaseTypes: ['pothole'], grades: ['轻', '中'], materialCost: 31, machineryHours: 2.1, costPerSqm: 62, serviceYears: 4, updatedAt: '2026-08-20' },
  { id: 'PROC-005', name: '封涂层养护', diseaseTypes: ['transverse', 'longitudinal', 'alligator'], grades: ['轻'], materialCost: 12, machineryHours: 1.0, costPerSqm: 26, serviceYears: 3, updatedAt: '2026-08-22' }
]

export const emissions: EmissionFactor[] = [
  { id: 'EF-001', name: '沥青混合料', value: 0.214, unit: 't CO2e/t', source: 'IPCC 2024 默认值', year: 2024, region: '全国', version: '2024.2', updatedAt: '2026-08-15' },
  { id: 'EF-002', name: '普通硅酸盐水泥', value: 0.831, unit: 't CO2e/t', source: '中国建筑材料碳排放因子库', year: 2023, region: '全国', version: '2023.1', updatedAt: '2026-08-15' },
  { id: 'EF-003', name: '柴油（施工机械）', value: 3.186, unit: 't CO2e/t', source: '生态环境部核算指南 2022', year: 2022, region: '全国', version: '2022.3', updatedAt: '2026-08-15' },
  { id: 'EF-004', name: '公路货运（吨公里）', value: 0.102, unit: 'kg CO2e/t·km', source: '省级温室气体清单编制指南', year: 2021, region: '华东', version: '2021.1', updatedAt: '2026-08-18' },
  { id: 'EF-005', name: '电网电力（施工）', value: 0.5568, unit: 't CO2e/MWh', source: '全国电网排放因子 2022', year: 2022, region: '全国', version: '2022.1', updatedAt: '2026-08-18' }
]

export const models: ModelVersion[] = [
  { id: 'MDL-001', name: 'YOLOv8s-baseline', version: 'B0', mAp50: 0.872, mIoU: 0.781, sizeMb: 21.6, latency: 1.86, createdAt: '2026-08-05', status: 'archived' },
  { id: 'MDL-002', name: 'YOLOv8s-LightV1', version: 'B1', mAp50: 0.884, mIoU: 0.792, sizeMb: 16.8, latency: 1.52, createdAt: '2026-08-12', status: 'training' },
  { id: 'MDL-003', name: 'YOLOv8s-LightV2', version: 'B2', mAp50: 0.891, mIoU: 0.804, sizeMb: 14.9, latency: 1.31, createdAt: '2026-08-26', status: 'active' }
]

export const auditLogs: AuditLog[] = [
  { id: 'AUD-001', time: '2026-09-02 10:58:12', module: '量化评估', action: '人工修正', target: 'DIM-002', operator: '王工', detail: '将坑槽面积由 0.24 平方米修正为 0.26 平方米' },
  { id: 'AUD-002', time: '2026-09-02 10:52:08', module: '智能识别', action: '标记误检', target: 'DET-008', operator: '王工', detail: '低置信度坑槽候选标记为误检' },
  { id: 'AUD-003', time: '2026-09-02 09:30:11', module: '任务管理', action: '启动识别', target: 'RD-20260902-003', operator: '李工', detail: '24 张影像进入识别流水线' },
  { id: 'AUD-004', time: '2026-09-01 20:08:45', module: '报告中心', action: '生成报告', target: 'RPT-260901-004', operator: '李工', detail: '生成 G205 北坡镇低碳养护报告' },
  { id: 'AUD-005', time: '2026-09-01 15:05:20', module: '任务管理', action: '标记异常', target: 'RD-20260901-003', operator: '张工', detail: '3 张图片格式异常，任务标记失败' },
  { id: 'AUD-006', time: '2026-08-31 18:30:03', module: '报告中心', action: '生成报告', target: 'RPT-260831-002', operator: '李工', detail: '生成项目月度总结报告' }
]
