import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { runRecognition } from './ai'
import {
  auditLogs,
  dashboardCharts,
  decisionData,
  detections,
  dimensions,
  emissions,
  kpis,
  measureData,
  models,
  processes,
  reportHistory,
  reportQueue,
  reportTemplates,
  statsData,
  taskDetail,
  taskFlows,
  tasks
} from './data'
import type {
  DiseaseType,
  EmissionFactor,
  ProcessItem,
  ReportJob,
  TaskCreatePayload,
  TaskItem,
  TaskStatus
} from './types'

const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

function ok(res: Response, data: unknown) {
  res.json({ code: 0, data, message: 'success' })
}

function fail(res: Response, message: string, code = 400) {
  res.status(code).json({ code, data: null, message })
}

function queryString(req: Request, key: string): string {
  const value = req.query[key]
  return typeof value === 'string' ? value : ''
}

const router = express.Router()

router.get('/health', (_req, res) => {
  ok(res, { status: 'alive', time: now() })
})

// dashboard
router.get('/dashboard/kpi', (_req, res) => {
  ok(res, kpis)
})

router.get('/dashboard/charts', (req, res) => {
  ok(res, dashboardCharts)
})

router.get('/dashboard/recent-tasks', (_req, res) => {
  ok(res, tasks.slice(0, 6))
})

// tasks
router.get('/tasks', (req, res) => {
  const status = queryString(req, 'status')
  const roadLevel = queryString(req, 'roadLevel')
  const county = queryString(req, 'county')
  let list = tasks
  if (status) list = list.filter((task) => task.status === status)
  if (roadLevel) list = list.filter((task) => task.roadLevel === roadLevel)
  if (county) list = list.filter((task) => task.county === county)
  ok(res, list)
})

router.post('/tasks', (req, res) => {
  const payload = req.body as TaskCreatePayload
  if (!payload?.name || !payload?.road) {
    fail(res, '任务名称和路段不能为空')
    return
  }
  const task: TaskItem = {
    id: `RD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    name: payload.name,
    road: payload.road,
    roadLevel: payload.roadLevel || '',
    county: payload.county || '',
    imageCount: 0,
    diseaseCount: 0,
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
    equipment: payload.equipment || '',
    note: payload.note || ''
  }
  tasks.unshift(task)
  ok(res, task)
})

router.get('/tasks/detail', (req, res) => {
  const id = queryString(req, 'id')
  const task = tasks.find((item) => item.id === id)
  if (!task) {
    fail(res, '任务不存在')
    return
  }
  ok(res, { ...task, flows: taskFlows })
})

router.post('/tasks/batch', (req, res) => {
  const body = req.body as { action: string; ids: string[] }
  const statusMap: Record<string, TaskStatus> = {
    start: 'recognizing',
    fail: 'failed',
    archive: 'completed'
  }
  const ids = Array.isArray(body?.ids) ? body.ids : []
  tasks.forEach((task) => {
    if (ids.includes(task.id)) {
      task.status = statusMap[body.action] || task.status
      task.updatedAt = now()
    }
  })
  ok(res, { count: ids.length })
})

router.post('/tasks/upload', (req, res) => {
  const body = req.body as { taskId: string; count: number }
  const count = Number(body?.count || 0)
  const task = tasks.find((item) => item.id === body?.taskId)
  if (task) {
    task.imageCount += count
    task.updatedAt = now()
  }
  ok(res, { uploaded: count })
})

// recognition
router.get('/recognition/results', (req, res) => {
  const taskId = queryString(req, 'taskId')
  ok(res, {
    taskId: taskId || taskDetail.id,
    totalImages: 24,
    completedCount: 24,
    detections
  })
})

router.post('/recognition/flag', (req, res) => {
  const body = req.body as { id: string; flag: 'confirmed' | 'false_positive' }
  const item = detections.find((det) => det.id === body?.id)
  if (!item) {
    fail(res, '检测记录不存在')
    return
  }
  item.status = body.flag
  ok(res, item)
})

router.post('/recognition/rerun', async (req, res, next) => {
  try {
    const body = req.body as { taskId: string; imageIndex: number }
    await runRecognition(body?.taskId || taskDetail.id, Number(body?.imageIndex || 1))
    ok(res, { imageIndex: body?.imageIndex ?? 0, status: 'completed' })
  } catch (error) {
    next(error)
  }
})

// measure
router.get('/measure/data', (req, res) => {
  const taskId = queryString(req, 'taskId')
  ok(res, { ...measureData, taskId: taskId || measureData.taskId })
})

router.post('/measure/save', (req, res) => {
  const body = req.body as { taskId: string; items: typeof dimensions }
  const items = Array.isArray(body?.items) ? body.items : []
  items.forEach((next) => {
    const idx = dimensions.findIndex((item) => item.id === next.id)
    if (idx >= 0) dimensions[idx] = next
  })
  ok(res, { saved: items.length, updatedAt: now() })
})

// decision
router.get('/decision/data', (req, res) => {
  const taskId = queryString(req, 'taskId')
  ok(res, { ...decisionData, taskId: taskId || decisionData.taskId })
})

router.post('/decision/save', (req, res) => {
  const body = req.body as { taskId: string; schemes: unknown[] }
  ok(res, { saved: Array.isArray(body?.schemes) ? body.schemes.length : 0, message: '方案已保存' })
})

// stats
router.get('/stats/data', (_req, res) => {
  ok(res, statsData)
})

// reports
router.get('/reports/templates', (_req, res) => {
  ok(res, reportTemplates)
})

router.get('/reports/queue', (_req, res) => {
  ok(res, reportQueue)
})

router.get('/reports/history', (_req, res) => {
  ok(res, reportHistory)
})

router.post('/reports/generate', (req, res) => {
  const body = req.body as { templateId: string; templateType: string; taskId?: string }
  const template = reportTemplates.find((item) => item.id === body?.templateId) || reportTemplates[0]
  const job: ReportJob = {
    id: `JOB-${Date.now()}`,
    taskId: body?.taskId || 'RD-20260902-003',
    templateType: (body?.templateType || template.type) as ReportJob['templateType'],
    templateName: template.name,
    status: 'generating',
    progress: 0,
    startedAt: now()
  }
  reportQueue.unshift(job)
  ok(res, job)
})

// settings
router.get('/settings/processes', (_req, res) => {
  ok(res, processes)
})

router.post('/settings/processes/save', (req, res) => {
  const item = req.body as ProcessItem
  if (!item?.id || !item?.name) {
    fail(res, '工艺名称不能为空')
    return
  }
  const idx = processes.findIndex((row) => row.id === item.id)
  item.updatedAt = now()
  if (idx >= 0) processes[idx] = item
  else processes.unshift(item)
  ok(res, item)
})

router.get('/settings/emissions', (_req, res) => {
  ok(res, emissions)
})

router.post('/settings/emissions/save', (req, res) => {
  const item = req.body as EmissionFactor
  if (!item?.id || !item?.name) {
    fail(res, '排放因子名称不能为空')
    return
  }
  const idx = emissions.findIndex((row) => row.id === item.id)
  item.updatedAt = now()
  if (idx >= 0) emissions[idx] = item
  else emissions.unshift(item)
  ok(res, item)
})

router.get('/settings/models', (_req, res) => {
  ok(res, models)
})

router.get('/settings/audit-logs', (_req, res) => {
  ok(res, auditLogs)
})

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api', router)
  app.use((_req, res) => {
    fail(res, 'Not Found', 404)
  })
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    fail(res, message, 500)
  })
  return app
}
