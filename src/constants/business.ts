import type { DiseaseType, TaskStatus } from '@/types'
import road1 from '@/assets/samples/road-1.svg'
import road2 from '@/assets/samples/road-2.svg'
import road3 from '@/assets/samples/road-3.svg'
import road4 from '@/assets/samples/road-4.svg'

export const ROAD_SAMPLE_IMAGES = [road1, road2, road3, road4]

export const DISEASE_LABELS: Record<DiseaseType, string> = {
  transverse: '横向裂缝',
  longitudinal: '纵向裂缝',
  alligator: '龟裂',
  pothole: '坑槽'
}

export const DISEASE_COLORS: Record<DiseaseType, string> = {
  transverse: '#D97706',
  longitudinal: '#2563EB',
  alligator: '#7C3AED',
  pothole: '#DC2626'
}

export const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待识别', color: '#D97706' },
  recognizing: { label: '识别中', color: '#2563EB' },
  reviewing: { label: '待复核', color: '#7C3AED' },
  deciding: { label: '待决策', color: '#0E7490' },
  completed: { label: '已完成', color: '#16A34A' },
  failed: { label: '异常', color: '#DC2626' }
}

export const CHART_PALETTE = ['#D97706', '#2563EB', '#16A34A', '#DC2626', '#7C3AED']
