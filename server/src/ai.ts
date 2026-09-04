import type { DetectionItem, RecognitionResult } from './types'

const labels: Record<string, string> = {
  transverse: '横向裂缝',
  longitudinal: '纵向裂缝',
  alligator: '龟裂',
  pothole: '坑槽'
}

function randomPolygon(): { x: number; y: number }[] {
  const cx = 0.2 + Math.random() * 0.6
  const cy = 0.2 + Math.random() * 0.6
  return [
    { x: cx, y: cy },
    { x: cx + 0.18, y: cy - 0.08 },
    { x: cx + 0.22, y: cy + 0.14 },
    { x: cx + 0.05, y: cy + 0.16 }
  ]
}

function makeDetection(index: number): DetectionItem {
  const keys = ['transverse', 'longitudinal', 'alligator', 'pothole']
  const type = keys[index % keys.length] as DetectionItem['type']
  return {
    id: `DET-${Date.now()}-${index}`,
    imageIndex: index,
    type,
    label: labels[type],
    confidence: Number((0.78 + Math.random() * 0.2).toFixed(2)),
    pixelArea: 6000 + Math.floor(Math.random() * 26000),
    status: 'pending',
    polygon: randomPolygon()
  }
}

/**
 * 模型训练中：默认返回本地识别桩结果。
 * 模型服务就绪后，设置 AI_RECOGNITION_ENABLED=true 和
 * AI_RECOGNITION_ENDPOINT，这里会转发到真实服务。
 */
export async function runRecognition(taskId: string, imageCount: number): Promise<RecognitionResult> {
  const enabled = process.env.AI_RECOGNITION_ENABLED === 'true'
  const endpoint = process.env.AI_RECOGNITION_ENDPOINT

  if (enabled && endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, imageCount })
    })
    if (!response.ok) {
      throw new Error(`AI recognition service returned ${response.status}`)
    }
    return (await response.json()) as RecognitionResult
  }

  await new Promise((resolve) => setTimeout(resolve, 1200))
  return {
    taskId,
    totalImages: imageCount,
    completedCount: imageCount,
    detections: Array.from({ length: Math.min(6, imageCount) }, (_, index) => makeDetection(index))
  }
}
