<script setup lang="ts">
import { computed, ref } from 'vue'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-vue-next'
import type { DetectionItem } from '@/types'
import { DISEASE_COLORS, DISEASE_LABELS } from '@/constants/business'

const props = withDefaults(defineProps<{
  imageUrl: string
  mode: 'original' | 'enhanced' | 'overlay'
  overlayItems?: DetectionItem[]
  enhance?: boolean
}>(), {
  overlayItems: () => [],
  enhance: false
})

const stage = ref<HTMLElement>()
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const dragging = ref(false)
let startX = 0
let startY = 0
let originX = 0
let originY = 0

const transformStyle = computed(() => `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`)
const showOverlay = computed(() => (props.mode === 'overlay' || props.enhance) && props.overlayItems.length > 0)
const visibleOverlay = computed(() => props.overlayItems.filter((item) => item.status !== 'false_positive'))

const toPoints = (item: DetectionItem) => item.polygon.map((point) => `${point.x * 800},${point.y * 600}`).join(' ')

const zoom = (factor: number) => {
  scale.value = Math.min(3, Math.max(0.6, scale.value * factor))
}

const reset = () => {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

const onWheel = (event: WheelEvent) => {
  zoom(event.deltaY < 0 ? 1.12 : 0.9)
}

const onPointerDown = (event: PointerEvent) => {
  dragging.value = true
  startX = event.clientX
  startY = event.clientY
  originX = tx.value
  originY = ty.value
  stage.value?.setPointerCapture(event.pointerId)
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value) return
  tx.value = originX + (event.clientX - startX)
  ty.value = originY + (event.clientY - startY)
}

const onPointerUp = () => {
  dragging.value = false
}
</script>

<template>
  <div class='image-workbench'>
    <div
      ref='stage'
      class='stage'
      @wheel.prevent='onWheel'
      @pointerdown='onPointerDown'
      @pointermove='onPointerMove'
      @pointerup='onPointerUp'
      @pointerleave='onPointerUp'
    >
      <div class='stage-canvas' :style='{ transform: transformStyle }'>
        <img :src='imageUrl' draggable='false' alt='路面病害样本' />
        <svg v-if='showOverlay' class='overlay-layer' viewBox='0 0 800 600'>
          <polygon
            v-for='item in visibleOverlay'
            :key='item.id'
            :points='toPoints(item)'
            :fill='DISEASE_COLORS[item.type]'
            fill-opacity='0.24'
            :stroke='DISEASE_COLORS[item.type]'
            stroke-width='2'
          />
          <text
            v-for='item in visibleOverlay'
            :key='item.id + "-label"'
            :x='item.polygon[0].x * 800'
            :y='item.polygon[0].y * 600 - 8'
            :fill='DISEASE_COLORS[item.type]'
            font-size='14'
            font-weight='600'
          >
            {{ DISEASE_LABELS[item.type] }}
          </text>
        </svg>
      </div>
      <div class='mode-badge' :class='mode'>{{ mode === 'overlay' ? '掩码叠加' : mode === 'enhanced' ? '增强图' : '原图' }}</div>
      <div class='canvas-hint'>拖拽平移 · 滚轮缩放</div>
    </div>
    <div class='toolbar'>
      <el-tooltip content='放大' placement='top'>
        <el-button circle @click='zoom(1.12)'><ZoomIn :size='16' /></el-button>
      </el-tooltip>
      <el-tooltip content='缩小' placement='top'>
        <el-button circle @click='zoom(0.9)'><ZoomOut :size='16' /></el-button>
      </el-tooltip>
      <el-tooltip content='复位' placement='top'>
        <el-button circle @click='reset'><RotateCcw :size='16' /></el-button>
      </el-tooltip>
      <span class='zoom-level'>{{ Math.round(scale * 100) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.image-workbench {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #17191D;
  overflow: hidden;
}
.stage {
  position: relative;
  height: 480px;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
}
.stage:active {
  cursor: grabbing;
}
.stage-canvas {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 800px;
  height: 600px;
  transform-origin: center center;
  will-change: transform;
  user-select: none;
}
.stage-canvas img {
  width: 800px;
  height: 600px;
  object-fit: cover;
  display: block;
  user-select: none;
}
.overlay-layer {
  position: absolute;
  inset: 0;
  width: 800px;
  height: 600px;
  overflow: visible;
}
.mode-badge {
  position: absolute;
  left: 12px;
  top: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #FFFFFF;
  background: rgba(31, 41, 55, 0.72);
}
.mode-badge.enhanced {
  background: rgba(22, 163, 74, 0.82);
}
.mode-badge.overlay {
  background: rgba(37, 99, 235, 0.82);
}
.canvas-hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #FFFFFF;
  border-top: 1px solid var(--border);
}
.zoom-level {
  margin-left: auto;
  font-size: 13px;
  color: #6B7280;
  min-width: 44px;
  text-align: right;
}
</style>
