<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MeasureMode, PolygonPoint } from '@/types'

const props = withDefaults(defineProps<{
  imageUrl: string
  mode: MeasureMode
  endpoints: [PolygonPoint, PolygonPoint]
  rulerLength: number
  grid?: boolean
}>(), {
  grid: true
})

const emit = defineEmits<{
  (e: 'update:endpoints', value: [PolygonPoint, PolygonPoint]): void
  (e: 'drag-change', distancePx: number): void
}>()

const stage = ref<HTMLElement>()
const dragIndex = ref<0 | 1 | null>(null)
const points = computed(() => [...props.endpoints] as [PolygonPoint, PolygonPoint])

const verticalLines = computed(() =>
  Array.from({ length: 16 }, (_, index) => ({ key: `v-${index}`, pos: (index + 1) / 17 }))
)
const horizontalLines = computed(() =>
  Array.from({ length: 16 }, (_, index) => ({ key: `h-${index}`, pos: (index + 1) / 17 }))
)

const distancePx = computed(() => {
  const dx = (points.value[1].x - points.value[0].x) * 800
  const dy = (points.value[1].y - points.value[0].y) * 600
  return Math.hypot(dx, dy)
})

const label = computed(() => props.mode === 'ruler' ? `${props.rulerLength.toFixed(2)} m` : `${distancePx.value.toFixed(0)} px`)

const onPointerDown = (event: PointerEvent, index: 0 | 1) => {
  if (props.mode !== 'ruler') return
  dragIndex.value = index
  event.preventDefault()
}

const onPointerMove = (event: PointerEvent) => {
  if (dragIndex.value === null || !stage.value) return
  const rect = stage.value.getBoundingClientRect()
  const next = [...props.endpoints] as [PolygonPoint, PolygonPoint]
  next[dragIndex.value] = {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
  }
  emit('update:endpoints', next)
  const dx = (next[1].x - next[0].x) * 800
  const dy = (next[1].y - next[0].y) * 600
  emit('drag-change', Math.hypot(dx, dy))
}

const stopDrag = () => {
  dragIndex.value = null
}
</script>

<template>
  <div class='calibration-workbench'>
    <div
      ref='stage'
      class='stage'
      @pointermove='onPointerMove'
      @pointerup='stopDrag'
      @pointerleave='stopDrag'
    >
      <img :src='imageUrl' draggable='false' alt='标定样本' />
      <svg class='overlay' viewBox='0 0 800 600' preserveAspectRatio='none'>
        <g v-if='grid'>
          <line
            v-for='line in verticalLines'
            :key='line.key'
            :x1='line.pos * 800'
            :x2='line.pos * 800'
            y1='0'
            y2='600'
            stroke='#2563EB'
            stroke-width='1'
            stroke-dasharray='4 4'
            opacity='0.3'
          />
          <line
            v-for='line in horizontalLines'
            :key='line.key'
            :y1='line.pos * 600'
            :y2='line.pos * 600'
            x1='0'
            x2='800'
            stroke='#2563EB'
            stroke-width='1'
            stroke-dasharray='4 4'
            opacity='0.3'
          />
        </g>
        <line
          v-if='mode !== "none"'
          :x1='points[0].x * 800'
          :y1='points[0].y * 600'
          :x2='points[1].x * 800'
          :y2='points[1].y * 600'
          stroke='#D97706'
          stroke-width='2'
          stroke-dasharray='8 5'
        />
        <circle
          v-if='mode === "ruler"'
          :cx='points[0].x * 800'
          :cy='points[0].y * 600'
          r='10'
          fill='#D97706'
          stroke='#fff'
          stroke-width='2'
          class='handle'
          @pointerdown.stop.prevent='onPointerDown($event, 0)'
        />
        <circle
          v-if='mode === "ruler"'
          :cx='points[1].x * 800'
          :cy='points[1].y * 600'
          r='10'
          fill='#16A34A'
          stroke='#fff'
          stroke-width='2'
          class='handle'
          @pointerdown.stop.prevent='onPointerDown($event, 1)'
        />
      </svg>
      <div class='calibration-label'>{{ label }}</div>
      <div v-if='mode === "ruler"' class='drag-hint'>拖动两端点实时换算</div>
    </div>
  </div>
</template>

<style scoped>
.calibration-workbench {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #17191D;
  overflow: hidden;
}
.stage {
  position: relative;
  aspect-ratio: 4 / 3;
  max-height: 520px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}
.stage img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.handle {
  pointer-events: all;
  cursor: move;
}
.calibration-label {
  position: absolute;
  left: 12px;
  top: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #FFFFFF;
  background: rgba(31, 41, 55, 0.76);
}
.drag-hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}
</style>
