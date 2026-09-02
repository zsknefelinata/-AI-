import type { MockMethod } from 'vite-plugin-mock'
import type { EmissionFactor, ProcessItem, ReportJob, TaskCreatePayload, TaskItem, TaskStatus } from '../src/types'
import {
  auditLogs,
  dashboardChartsData,
  decisionData,
  detections,
  dimensions,
  emissions,
  kpis,
  measureData,
  models,
  processes,
  recentTasks,
  reportHistory,
  reportQueue,
  reportTemplates,
  statsData,
  taskDetail,
  taskFlows,
  tasks
} from './data'

const ok = (data: unknown) => ({ code: 0, data, message: 'success' })

const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

export default [
  { url: '/api/dashboard/kpi', method: 'get', response: () => ok(kpis) },
  { url: '/api/dashboard/charts', method: 'get', response: () => ok(dashboardChartsData) },
  { url: '/api/dashboard/recent-tasks', method: 'get', response: () => ok(recentTasks) },
  { url: '/api/tasks', method: 'get', response: () => ok(tasks) },
  {
    url: '/api/tasks',
    method: 'post',
    response: ({ body }: any) => {
      const payload = body as TaskCreatePayload
      const task: TaskItem = {
        id: `RD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        name: payload.name,
        road: payload.road,
        roadLevel: payload.roadLevel,
        county: payload.county,
        imageCount: 0,
        diseaseCount: 0,
        status: 'pending',
        createdAt: now(),
        updatedAt: now(),
        equipment: payload.equipment,
        note: payload.note || ''
      }
      tasks.unshift(task)
      return ok(task)
    }
  },
  {
    url: '/api/tasks/batch',
    method: 'post',
    response: ({ body }: any) => {
      const { action, ids } = body as { action: string; ids: string[] }
      const statusMap: Record<string, TaskStatus> = {
        start: 'recognizing',
        fail: 'failed',
        archive: 'completed'
      }
      tasks.forEach((task) => {
        if (ids.includes(task.id)) task.status = statusMap[action] || task.status
      })
      return ok({ count: ids.length })
    }
  },
  { url: '/api/tasks/detail', method: 'get', response: ({ query }: any) => ok({ ...taskDetail, id: query.id, flows: taskFlows }) },
  {
    url: '/api/tasks/upload',
    method: 'post',
    response: ({ body }: any) => ok({ uploaded: body.count || 0 })
  },
  {
    url: '/api/recognition/results',
    method: 'get',
    response: ({ query }: any) =>
      ok({ taskId: query.taskId || taskDetail.id, totalImages: 24, completedCount: 24, detections })
  },
  {
    url: '/api/recognition/flag',
    method: 'post',
    response: ({ body }: any) => {
      const item = detections.find((det) => det.id === body.id)
      if (item) item.status = body.flag
      return ok(item)
    }
  },
  {
    url: '/api/recognition/rerun',
    method: 'post',
    response: ({ body }: any) => ok({ imageIndex: body.imageIndex, status: 'completed' })
  },
  { url: '/api/measure/data', method: 'get', response: ({ query }: any) => ok({ ...measureData, taskId: query.taskId }) },
  {
    url: '/api/measure/save',
    method: 'post',
    response: ({ body }: any) => {
      const items = body.items as typeof dimensions
      items.forEach((next) => {
        const idx = dimensions.findIndex((item) => item.id === next.id)
        if (idx >= 0) dimensions[idx] = next
      })
      return ok({ saved: items.length, updatedAt: now() })
    }
  },
  { url: '/api/decision/data', method: 'get', response: ({ query }: any) => ok({ ...decisionData, taskId: query.taskId }) },
  {
    url: '/api/decision/save',
    method: 'post',
    response: ({ body }: any) => ok({ saved: body.schemes.length, message: '方案已保存' })
  },
  { url: '/api/stats/data', method: 'get', response: () => ok(statsData) },
  { url: '/api/reports/templates', method: 'get', response: () => ok(reportTemplates) },
  { url: '/api/reports/queue', method: 'get', response: () => ok(reportQueue) },
  { url: '/api/reports/history', method: 'get', response: () => ok(reportHistory) },
  {
    url: '/api/reports/generate',
    method: 'post',
    response: ({ body }: any) => {
      const template = reportTemplates.find((item) => item.id === body.templateId) || reportTemplates[0]
      const job: ReportJob = {
        id: `JOB-${Date.now()}`,
        taskId: body.taskId || 'RD-20260902-003',
        templateType: body.templateType,
        templateName: template.name,
        status: 'generating',
        progress: 0,
        startedAt: now()
      }
      reportQueue.unshift(job)
      return ok(job)
    }
  },
  { url: '/api/settings/processes', method: 'get', response: () => ok(processes) },
  {
    url: '/api/settings/processes/save',
    method: 'post',
    response: ({ body }: any) => {
      const item = body as ProcessItem
      const idx = processes.findIndex((row) => row.id === item.id)
      if (idx >= 0) processes[idx] = item
      else processes.unshift(item)
      return ok(item)
    }
  },
  { url: '/api/settings/emissions', method: 'get', response: () => ok(emissions) },
  {
    url: '/api/settings/emissions/save',
    method: 'post',
    response: ({ body }: any) => {
      const item = body as EmissionFactor
      const idx = emissions.findIndex((row) => row.id === item.id)
      if (idx >= 0) emissions[idx] = item
      else emissions.unshift(item)
      return ok(item)
    }
  },
  { url: '/api/settings/models', method: 'get', response: () => ok(models) },
  { url: '/api/settings/audit-logs', method: 'get', response: () => ok(auditLogs) }
] as MockMethod[]
