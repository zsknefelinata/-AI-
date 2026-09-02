import { get, post } from './http'
import type {
  DashboardCharts,
  DecisionData,
  DimensionItem,
  KpiCard,
  MeasureData,
  ProcessItem,
  EmissionFactor,
  ModelVersion,
  AuditLog,
  DetectionItem,
  RecognitionResult,
  ReportHistory,
  ReportJob,
  ReportTemplate,
  SchemeItem,
  StatsData,
  StatsFilters,
  TaskCreatePayload,
  TaskDetail,
  TaskItem
} from '@/types'

export const dashboardApi = {
  getKpi: () => get<KpiCard[]>('/dashboard/kpi'),
  getCharts: (days: number) => get<DashboardCharts>('/dashboard/charts', { days }),
  getRecentTasks: () => get<TaskItem[]>('/dashboard/recent-tasks')
}

export const tasksApi = {
  list: (params?: Record<string, unknown>) => get<TaskItem[]>('/tasks', params),
  create: (payload: TaskCreatePayload) => post<TaskItem>('/tasks', payload),
  detail: (id: string) => get<TaskDetail>('/tasks/detail', { id }),
  batch: (action: string, ids: string[]) => post<{ count: number }>('/tasks/batch', { action, ids }),
  upload: (taskId: string, count: number) => post<{ uploaded: number }>('/tasks/upload', { taskId, count })
}

export const recognitionApi = {
  results: (taskId: string) => get<RecognitionResult>('/recognition/results', { taskId }),
  flag: (id: string, flag: 'confirmed' | 'false_positive') =>
    post<DetectionItem>('/recognition/flag', { id, flag }),
  rerun: (taskId: string, imageIndex: number) =>
    post<{ imageIndex: number; status: string }>('/recognition/rerun', { taskId, imageIndex })
}

export const measureApi = {
  data: (taskId: string) => get<MeasureData>('/measure/data', { taskId }),
  save: (taskId: string, items: DimensionItem[]) =>
    post<{ saved: number; updatedAt: string }>('/measure/save', { taskId, items })
}

export const decisionApi = {
  data: (taskId: string) => get<DecisionData>('/decision/data', { taskId }),
  save: (taskId: string, schemes: SchemeItem[]) =>
    post<{ saved: number; message: string }>('/decision/save', { taskId, schemes })
}

export const statsApi = {
  data: (filters: StatsFilters) => get<StatsData>('/stats/data', { ...filters })
}

export const reportsApi = {
  templates: () => get<ReportTemplate[]>('/reports/templates'),
  queue: () => get<ReportJob[]>('/reports/queue'),
  history: () => get<ReportHistory[]>('/reports/history'),
  generate: (payload: { templateId: string; templateType: string; scope: string; taskId?: string }) =>
    post<ReportJob>('/reports/generate', payload)
}

export const settingsApi = {
  processes: () => get<ProcessItem[]>('/settings/processes'),
  saveProcess: (item: ProcessItem) => post<ProcessItem>('/settings/processes/save', item),
  emissions: () => get<EmissionFactor[]>('/settings/emissions'),
  saveEmission: (item: EmissionFactor) => post<EmissionFactor>('/settings/emissions/save', item),
  models: () => get<ModelVersion[]>('/settings/models'),
  auditLogs: () => get<AuditLog[]>('/settings/audit-logs')
}
