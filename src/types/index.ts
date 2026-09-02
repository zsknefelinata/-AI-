export type DiseaseType = 'transverse' | 'longitudinal' | 'alligator' | 'pothole'
export type TaskStatus = 'pending' | 'recognizing' | 'reviewing' | 'deciding' | 'completed' | 'failed'
export type FlagStatus = 'pending' | 'confirmed' | 'false_positive'
export type MeasureMode = 'camera' | 'ruler' | 'none'
export type Grade = '轻' | '中' | '重'
export type ReportTemplateType = 'inspection' | 'maintenance' | 'summary'
export type ReportStatus = 'waiting' | 'generating' | 'done' | 'failed'
export type UserRole = 'admin' | 'engineer'

export interface KpiCard {
  key: string
  label: string
  value: number
  unit: string
  trend: number
  icon: string
  color: string
}

export interface DiseaseDist {
  type: DiseaseType
  name: string
  count: number
}

export interface RouteDist {
  road: string
  county: string
  count: number
  completed: number
}

export interface TrendPoint {
  date: string
  count: number
  reviewed: number
}

export interface DashboardCharts {
  days: number
  diseaseDist: DiseaseDist[]
  routeDist: RouteDist[]
  trend: TrendPoint[]
}

export interface TaskItem {
  id: string
  name: string
  road: string
  roadLevel: string
  county: string
  imageCount: number
  diseaseCount: number
  status: TaskStatus
  createdAt: string
  updatedAt: string
  equipment: string
  note?: string
}

export interface TaskFlow {
  time: string
  event: string
  operator: string
  description: string
}

export interface TaskDetail extends TaskItem {
  flows: TaskFlow[]
}

export interface TaskCreatePayload {
  name: string
  road: string
  roadLevel: string
  county: string
  equipment: string
  note?: string
}

export interface PolygonPoint {
  x: number
  y: number
}

export interface DetectionItem {
  id: string
  imageIndex: number
  type: DiseaseType
  label: string
  confidence: number
  pixelArea: number
  status: FlagStatus
  polygon: PolygonPoint[]
}

export interface RecognitionResult {
  taskId: string
  totalImages: number
  completedCount: number
  detections: DetectionItem[]
}

export interface DimensionItem {
  id: string
  type: DiseaseType
  label: string
  length: number
  width: number
  area: number
  density: number
  grade: Grade
}

export interface Calibration {
  mode: MeasureMode
  rulerLength?: number
  cameraHeight?: number
  pitch?: number
  scalePxPerMeter: number
  calibrated: boolean
}

export interface MeasureData {
  taskId: string
  calibration: Calibration
  dimensions: DimensionItem[]
  auditCount: number
}

export interface CarbonBreakdown {
  material: number
  transport: number
  machinery: number
  other: number
}

export interface SchemeItem {
  id: string
  name: string
  type: 'repair' | 'maintenance' | 'custom'
  cost: number
  carbon: CarbonBreakdown
  totalCo2e: number
  serviceYears: number
  recommended?: boolean
  note: string
}

export interface DecisionData {
  taskId: string
  params: {
    area: number
    serviceYears: number
    transportDistance: number
    materialUsage: number
    machineryHours: number
    fuelConsumption: number
  }
  schemes: SchemeItem[]
}

export interface ReviewMetric {
  month: string
  passRate: number
  total: number
}

export interface SchemeMetric {
  name: string
  totalCo2e: number
  cost: number
}

export interface StatsFilters {
  start?: string
  end?: string
  county?: string
  roadLevel?: string
  diseaseType?: string
}

export interface StatsRow {
  road: string
  county: string
  diseaseCount: number
  avgGrade: string
  schemeCount: number
  estimatedReduction: number
  reportStatus: string
}

export interface StatsData {
  diseaseDist: DiseaseDist[]
  routeDist: RouteDist[]
  trend: TrendPoint[]
  review: ReviewMetric[]
  schemeMetrics: SchemeMetric[]
  pendingTop: { label: string; count: number; type: 'task' | 'review' | 'decision' }[]
  rows: StatsRow[]
}

export interface ReportTemplate {
  id: string
  type: ReportTemplateType
  name: string
  description: string
  formats: string[]
  updatedAt: string
}

export interface ReportJob {
  id: string
  taskId: string
  templateType: ReportTemplateType
  templateName: string
  status: ReportStatus
  progress: number
  startedAt: string
  finishedAt?: string
}

export interface ReportHistory {
  id: string
  name: string
  scope: string
  taskId?: string
  templateType: ReportTemplateType
  creator: string
  version: string
  createdAt: string
  size: string
}

export interface ProcessItem {
  id: string
  name: string
  diseaseTypes: DiseaseType[]
  grades: string[]
  materialCost: number
  machineryHours: number
  costPerSqm: number
  serviceYears: number
  updatedAt: string
}

export interface EmissionFactor {
  id: string
  name: string
  value: number
  unit: string
  source: string
  year: number
  region: string
  version: string
  updatedAt: string
}

export interface ModelVersion {
  id: string
  name: string
  version: string
  mAp50: number
  mIoU: number
  sizeMb: number
  latency: number
  createdAt: string
  status: 'active' | 'archived' | 'training'
}

export interface AuditLog {
  id: string
  time: string
  module: string
  action: string
  target: string
  operator: string
  detail: string
}

export interface UserInfo {
  name: string
  role: UserRole
  org: string
}
