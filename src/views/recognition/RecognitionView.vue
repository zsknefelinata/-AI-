<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Gauge,
  RefreshCcw,
  RotateCw,
  Waypoints
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { recognitionApi, tasksApi } from '@/api'
import { DISEASE_COLORS, DISEASE_LABELS, ROAD_SAMPLE_IMAGES, TASK_STATUS_META } from '@/constants/business'
import type { DetectionItem, DiseaseType, RecognitionResult, TaskItem } from '@/types'
import BaseChart from '@/components/charts/BaseChart.vue'
import ImageWorkbench from '@/components/drawing/ImageWorkbench.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const tasks = ref<TaskItem[]>([])
const currentTaskId = ref('')
const results = ref<RecognitionResult | null>(null)
const imageIndex = ref(0)
const viewMode = ref<'original' | 'overlay'>('overlay')
const enhance = ref(false)
const qualityOk = ref(true)
const rerunning = ref(false)

const flagLabels: Record<DetectionItem['status'], string> = { pending: '待复核', confirmed: '已确认', false_positive: '误检' }

const currentImage = computed(() => ROAD_SAMPLE_IMAGES[imageIndex.value % ROAD_SAMPLE_IMAGES.length])
const currentTask = computed(() => tasks.value.find((item) => item.id === currentTaskId.value))
const displayMode = computed<'original' | 'enhanced' | 'overlay'>(() => (enhance.value ? 'enhanced' : 'overlay'))
const displayOriginal = computed(() => viewMode.value === 'original' && !enhance.value)
const currentDetections = computed(() =>
  (results.value?.detections || []).filter((item) => item.imageIndex === imageIndex.value)
)
const confidenceAvg = computed(() => {
  const list = currentDetections.value
  if (!list.length) return 0
  return Math.round((list.reduce((sum, item) => sum + item.confidence, 0) / list.length) * 100) / 100
})
const needReview = computed(() => currentDetections.value.filter((item) => item.status === 'pending').length)
const recognizedCount = computed(() => {
  if (!results.value) return 0
  return results.value.detections.filter((item) => item.imageIndex <= imageIndex.value).length
})
const progress = computed(() => {
  if (!results.value) return 0
  return Math.round((results.value.completedCount / results.value.totalImages) * 100)
})

const diseaseCounts = computed(() => {
  const list = results.value?.detections || []
  const map: Record<DiseaseType, number> = { transverse: 0, longitudinal: 0, alligator: 0, pothole: 0 }
  list.forEach((item) => {
    map[item.type] += 1
  })
  return map
})

const summaryOption = computed<EChartsOption>(() => {
  const data = (Object.keys(diseaseCounts.value) as DiseaseType[]).map((key) => ({
    name: DISEASE_LABELS[key],
    value: diseaseCounts.value[key],
    itemStyle: { color: DISEASE_COLORS[key] }
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 处（{d}%）' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
    series: [{ type: 'pie', radius: ['44%', '68%'], center: ['50%', '44%'], label: { show: false }, data }]
  }
})

const loadTasks = async () => {
  tasks.value = await tasksApi.list()
}

const loadResult = async () => {
  loading.value = true
  try {
    results.value = await recognitionApi.results(currentTaskId.value)
  } finally {
    loading.value = false
  }
}

const pickTask = async (id: string) => {
  currentTaskId.value = id
  router.replace({ query: { ...route.query, taskId: id } })
  imageIndex.value = 0
  await loadResult()
}

const changeTask = (id: string | number | boolean | Record<string, unknown> | Record<string, unknown>[]) => {
  if (typeof id === 'string') pickTask(id)
}

const prevImage = () => {
  if (imageIndex.value > 0) imageIndex.value -= 1
}

const nextImage = () => {
  if (results.value && imageIndex.value < results.value.totalImages - 1) imageIndex.value += 1
}

const flagItem = async (item: DetectionItem, flag: 'confirmed' | 'false_positive') => {
  await recognitionApi.flag(item.id, flag)
  item.status = flag
  ElMessage.success(flag === 'confirmed' ? `已确认 ${item.label}` : `${item.label} 已标记为误检`)
}

const rerunCurrent = async () => {
  if (!results.value) return
  rerunning.value = true
  try {
    await recognitionApi.rerun(currentTaskId.value, imageIndex.value + 1)
    await loadResult()
    ElMessage.success(`第 ${imageIndex.value + 1} 张已重跑完成`)
  } finally {
    rerunning.value = false
  }
}

const enterMeasure = () => {
  router.push(`/measure/${currentTaskId.value}`)
}

onMounted(async () => {
  await loadTasks()
  const queryId = typeof route.query.taskId === 'string' ? route.query.taskId : tasks.value[0]?.id
  if (queryId) {
    currentTaskId.value = queryId
    await loadResult()
  }
  loading.value = false
})
</script>

<template>
  <div class="page recognition-page">
    <PageHeader title="智能识别" subtitle="图像工作区与结果面板并排比对，识别结果可逐条复核">
      <template #actions>
        <el-select v-model="currentTaskId" style="width: 240px" @change="changeTask">
          <el-option v-for="task in tasks" :key="task.id" :label="`${task.id} · ${task.name}`" :value="task.id" />
        </el-select>
      </template>
    </PageHeader>

    <el-skeleton v-if="loading" :rows="6" animated />

    <template v-else-if="results">
      <div class="work-status-row">
        <StatusTag
          v-if="currentTaskId"
          :status="currentTask?.status || 'recognizing'"
          :label="TASK_STATUS_META[currentTask?.status || 'recognizing'].label"
          :color="TASK_STATUS_META[currentTask?.status || 'recognizing'].color"
        />
        <span class="status-note">当前图片 {{ imageIndex + 1 }} / {{ results.totalImages }}，已识别 {{ recognizedCount }} 处目标</span>
        <div class="status-spacer" />
        <el-button :disabled="imageIndex === 0" @click="prevImage"><ChevronLeft :size="15" /> 上一张</el-button>
        <el-button :disabled="imageIndex >= results.totalImages - 1" @click="nextImage">下一张 <ChevronRight :size="15" /></el-button>
        <el-button @click="router.push(`/tasks?taskId=${currentTaskId}`)"><RefreshCcw :size="15" /> 查看任务</el-button>
      </div>

      <div class="split-layout wide-aside">
        <section class="work-panel">
          <div class="view-toolbar">
            <el-radio-group v-model="viewMode" size="default">
              <el-radio-button value="original">原图</el-radio-button>
              <el-radio-button value="overlay">掩码叠加</el-radio-button>
            </el-radio-group>
            <el-switch v-model="enhance" active-text="光照增强" inline-prompt />
            <div class="spacer" />
            <span class="quality-chip" :class="{ bad: !qualityOk }">
              {{ qualityOk ? '画质合格' : '画质异常' }}
            </span>
            <el-button :disabled="!qualityOk" @click="qualityOk = false">质量检查</el-button>
          </div>
          <ImageWorkbench
            :image-url="currentImage"
            :mode="displayOriginal ? 'original' : displayMode"
            :overlay-items="currentDetections"
            :enhance="enhance"
          />
          <div class="progress-strip">
            <div class="progress-label">识别队列</div>
            <el-progress :percentage="progress" :stroke-width="8" class="queue-progress" />
            <span class="queue-meta">{{ results.completedCount }} / {{ results.totalImages }} 张完成</span>
          </div>
        </section>

        <aside class="result-column">
          <section class="panel result-summary">
            <div class="panel-header">
              检测结果
              <span class="panel-extra">图 {{ imageIndex + 1 }}</span>
            </div>
            <div class="summary-metrics">
              <div class="metric-item">
                <div class="metric-value">{{ currentDetections.length }}</div>
                <div class="metric-label">目标病害</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ confidenceAvg ? `${Math.round(confidenceAvg * 100)}%` : '-' }}</div>
                <div class="metric-label">平均置信度</div>
              </div>
              <div class="metric-item">
                <div class="metric-value" :class="{ warn: needReview > 0 }">{{ needReview }}</div>
                <div class="metric-label">待复核</div>
              </div>
            </div>
            <div class="flag-legend">
              <span v-for="(label, key) in DISEASE_LABELS" :key="key" class="legend-pill">
                <i :style="{ background: DISEASE_COLORS[key] }" />{{ label }}
              </span>
            </div>
          </section>

          <section class="panel detect-list">
            <div class="panel-header">病害列表<span class="panel-extra">置信度由高到低</span></div>
            <EmptyState
              v-if="!currentDetections.length"
              icon="scan"
              title="未检测到目标病害"
              description="本图片未发现路面病害，可切换上一张或查看任务其他影像。"
            />
            <div v-else class="detect-items">
              <div v-for="item in [...currentDetections].sort((a, b) => b.confidence - a.confidence)" :key="item.id" class="detect-item">
                <div class="detect-top">
                  <span class="detect-type" :style="{ color: DISEASE_COLORS[item.type], background: DISEASE_COLORS[item.type] + '14' }">
                    {{ item.label }}
                  </span>
                  <span class="detect-conf" :class="item.confidence >= 0.9 ? 'high' : item.confidence >= 0.8 ? 'mid' : 'low'">
                    {{ Math.round(item.confidence * 100) }}%
                  </span>
                  <span class="detect-status" :class="item.status">{{ flagLabels[item.status] }}</span>
                </div>
                <div class="detect-meta">
                  <span>像素面积 {{ item.pixelArea.toLocaleString() }} px²</span>
                  <span>掩码 {{ item.polygon.length }} 点</span>
                </div>
                <div class="detect-actions">
                  <el-tooltip content="确认检出" placement="top">
                    <el-button size="small" :type="item.status === 'confirmed' ? 'success' : 'default'" circle @click="flagItem(item, 'confirmed')">
                      <Check :size="14" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="标记误检" placement="top">
                    <el-button size="small" :type="item.status === 'false_positive' ? 'danger' : 'default'" circle @click="flagItem(item, 'false_positive')">
                      <CircleSlash :size="14" />
                    </el-button>
                  </el-tooltip>
                  <el-button size="small" @click="rerunCurrent">重跑单图</el-button>
                </div>
              </div>
            </div>
          </section>

          <section class="panel mini-chart-panel">
            <div class="panel-header">全任务病害构成</div>
            <div class="panel-body">
              <BaseChart :option="summaryOption" :height="176" />
            </div>
          </section>
        </aside>
      </div>

      <div class="action-dock">
        <div class="dock-note">
          <Waypoints :size="15" color="#0E7490" />
          复核状态将同步到量化评估与报告
        </div>
        <el-button :loading="rerunning" @click="rerunCurrent"><RotateCw :size="15" /> 重跑当前图</el-button>
        <el-button type="primary" @click="enterMeasure"><Gauge :size="15" /> 复核完成，进入量化</el-button>
      </div>
    </template>

    <EmptyState v-else icon="scan" title="暂无识别结果" description="请先在任务管理中上传影像并开始识别。">
      <el-button type="primary" @click="router.push('/tasks')">前往任务管理</el-button>
    </EmptyState>
  </div>
</template>

<style scoped>
.work-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 40px;
}

.status-spacer {
  flex: 1;
}

.status-note {
  color: #6B7280;
  font-size: 13px;
}

.work-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  min-height: 40px;
}

.view-toolbar .spacer {
  flex: 1;
}

.quality-chip {
  font-size: 12px;
  color: #16A34A;
  background: #F0FDF4;
  border-radius: 12px;
  padding: 3px 10px;
}

.quality-chip.bad {
  color: #DC2626;
  background: #FEF2F2;
}

.progress-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.progress-label {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.queue-progress {
  flex: 1;
  max-width: 360px;
}

.queue-meta {
  color: #6B7280;
  font-size: 12px;
  white-space: nowrap;
}

.result-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 12px 4px 2px;
}

.metric-item {
  text-align: center;
  border-right: 1px solid var(--border);
}

.metric-item:last-child {
  border-right: 0;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
}

.metric-value.warn {
  color: #D97706;
}

.metric-label {
  color: #6B7280;
  font-size: 12px;
  margin-top: 3px;
}

.flag-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px 12px;
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #4B5563;
}

.legend-pill i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.detect-items {
  max-height: 360px;
  overflow-y: auto;
}

.detect-item {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.detect-item:last-child {
  border-bottom: 0;
}

.detect-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detect-type {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.detect-conf {
  font-weight: 700;
}

.detect-conf.high {
  color: #16A34A;
}

.detect-conf.mid {
  color: #D97706;
}

.detect-conf.low {
  color: #DC2626;
}

.detect-status {
  margin-left: auto;
  font-size: 12px;
  color: #6B7280;
}

.detect-status.pending {
  color: #7C3AED;
}

.detect-status.confirmed {
  color: #16A34A;
}

.detect-status.false_positive {
  color: #DC2626;
}

.detect-meta {
  display: flex;
  gap: 14px;
  margin: 6px 0;
  color: #6B7280;
  font-size: 12px;
}

.detect-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.detect-actions .el-button + .el-button {
  margin-left: 0;
}

.detect-actions .el-button:last-child {
  margin-left: 8px;
}

.mini-chart-panel .panel-body {
  padding: 8px 4px 4px;
}

.action-dock {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.dock-note {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4B5563;
  font-size: 13px;
  flex: 1;
}

.dock-note .el-button {
  margin-right: 8px;
}

@media (max-width: 1100px) {
  .view-toolbar .quality-chip {
    order: 3;
  }
}
</style>
