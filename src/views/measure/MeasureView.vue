<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  CircleGauge,
  Edit3,
  Gauge,
  History,
  Ruler,
  Save,
  Scale
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { measureApi } from '@/api'
import { DISEASE_COLORS, DISEASE_LABELS, ROAD_SAMPLE_IMAGES } from '@/constants/business'
import type { DimensionItem, DiseaseType, MeasureData, MeasureMode, PolygonPoint } from '@/types'
import { useAppStore } from '@/stores/app'
import CalibrationWorkbench from '@/components/drawing/CalibrationWorkbench.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const loading = ref(true)
const saving = ref(false)
const data = ref<MeasureData | null>(null)
const editedRows = ref<string[]>([])
const auditCount = ref(0)

const taskId = computed(() => String(route.params.taskId || 'RD-20260902-003'))
const imageUrl = computed(() => ROAD_SAMPLE_IMAGES[Number(taskId.value.slice(-1)) % ROAD_SAMPLE_IMAGES.length] || ROAD_SAMPLE_IMAGES[0])

const rulerEndpoints = ref<[PolygonPoint, PolygonPoint]>([
  { x: 0.26, y: 0.72 },
  { x: 0.46, y: 0.72 }
])

const cameraForm = reactive({ height: 2.8, pitch: 32 })
const rulerLength = ref(1)
const rulerDistancePx = ref(18.6)

const totalArea = computed(() => data.value?.dimensions.reduce((sum, item) => sum + item.area, 0) || 0)
const heavyCount = computed(() => data.value?.dimensions.filter((item) => item.grade === '重').length || 0)
const scaleDisplay = computed(() => {
  if (!data.value) return '0'
  const mode = data.value.calibration.mode
  if (mode === 'camera') return ((rulerDistancePx.value || 3200) / 1).toFixed(1)
  if (mode === 'ruler') return (rulerDistancePx.value / rulerLength.value).toFixed(1)
  return '0'
})
const confidenceLabel = computed(() => {
  if (!data.value) return '-'
  const mode = data.value.calibration.mode
  if (mode === 'none') return '低'
  if (mode === 'ruler') return '中'
  return '高'
})
const effectiveMode = computed(() => data.value?.calibration.mode || 'none')

const setMode = async (mode: MeasureMode) => {
  if (!data.value) return
  data.value.calibration.mode = mode
  data.value.calibration.calibrated = mode !== 'none'
  if (mode === 'ruler' && !data.value.calibration.rulerLength) data.value.calibration.rulerLength = rulerLength.value
  if (mode === 'camera') {
    data.value.calibration.cameraHeight = cameraForm.height
    data.value.calibration.pitch = cameraForm.pitch
  }
  appStore.addAuditLog('量化评估', '切换标定模式', taskId.value, `标定模式切换为 ${modeLabel(mode)}`)
}

const modeLabel = (mode: MeasureMode) =>
  ({ camera: '已知相机参数', ruler: '画面标尺', none: '无标定' })[mode]

const diseaseLabel = (type: DiseaseType) => DISEASE_LABELS[type]
const diseaseColor = (type: DiseaseType) => DISEASE_COLORS[type]

const updateRulerLength = (value: number | undefined) => {
  if (!data.value) return
  rulerLength.value = Number(value || 0)
  data.value.calibration.rulerLength = rulerLength.value
  data.value.calibration.scalePxPerMeter = rulerDistancePx.value / Math.max(0.05, rulerLength.value)
}

const updateCamera = () => {
  if (!data.value) return
  data.value.calibration.cameraHeight = cameraForm.height
  data.value.calibration.pitch = cameraForm.pitch
  appStore.addAuditLog('量化评估', '更新相机参数', taskId.value, `相机高度 ${cameraForm.height} m，俯仰角 ${cameraForm.pitch}°`)
}

const onEndpointsChange = (value: [PolygonPoint, PolygonPoint]) => {
  rulerEndpoints.value = value
  const dx = (value[1].x - value[0].x) * 800
  const dy = (value[1].y - value[0].y) * 600
  rulerDistancePx.value = Math.hypot(dx, dy)
  if (data.value && data.value.calibration.mode === 'ruler') {
    data.value.calibration.scalePxPerMeter = rulerDistancePx.value / Math.max(0.05, rulerLength.value)
  }
}

const onDragChange = (distancePx: number) => {
  rulerDistancePx.value = distancePx
  if (data.value && data.value.calibration.mode === 'ruler') {
    data.value.calibration.scalePxPerMeter = distancePx / Math.max(0.05, rulerLength.value)
  }
}

const commitEdit = (item: DimensionItem, field: 'length' | 'width' | 'area' | 'density' | 'grade', value: string | number) => {
  const numeric = Number(value)
  if (field === 'grade') {
    item.grade = value as DimensionItem['grade']
  } else if (!Number.isNaN(numeric)) {
    item[field] = numeric
  }
  if (!editedRows.value.includes(item.id)) editedRows.value.push(item.id)
  auditCount.value += 1
  const labelMap: Record<string, string> = { length: '长度', width: '宽度', area: '面积', density: '密度', grade: '等级' }
  appStore.addAuditLog('量化评估', '人工修正', item.id, `${item.label} 的 ${labelMap[field]} 已更新为 ${value}`)
}

const saveMeasure = async () => {
  if (!data.value) return
  saving.value = true
  try {
    const response = await measureApi.save(taskId.value, data.value.dimensions)
    ElMessage.success(`已保存 ${response.saved} 条量化记录，并写入审计日志`)
    editedRows.value = []
  } finally {
    saving.value = false
  }
}

const goDecision = async () => {
  await saveMeasure()
  router.push(`/decision/${taskId.value}`)
}

onMounted(async () => {
  try {
    data.value = await measureApi.data(taskId.value)
    if (data.value.calibration.mode === 'ruler') {
      rulerLength.value = data.value.calibration.rulerLength || 1
      rulerDistancePx.value = data.value.calibration.scalePxPerMeter * rulerLength.value
    }
    if (data.value.calibration.mode === 'camera') {
      cameraForm.height = data.value.calibration.cameraHeight || 2.8
      cameraForm.pitch = data.value.calibration.pitch || 32
    }
    auditCount.value = data.value.auditCount
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <PageHeader title="量化评估" subtitle="由像素掩码换算为长度、面积与病害等级，全过程可人工修正并留痕">
      <template #actions>
        <span class="header-note">任务 {{ taskId }}</span>
        <el-button @click="router.push(`/recognition?taskId=${taskId}`)">返回识别</el-button>
      </template>
    </PageHeader>

    <el-skeleton v-if="loading" :rows="6" animated />

    <template v-else-if="data">
      <div v-if="!data.calibration.calibrated" class="warn-banner">
        <i class="warn-dot" />
        <span>当前结果仅输出像素量与相对等级，不可用于实物量结算。请切换到相机参数或画面标尺模式。</span>
      </div>
      <div v-else class="status-strip">
        <span class="status-pill green"><CheckCircle2 :size="14" /> 已标定</span>
        <span class="status-pill"><Ruler :size="14" /> {{ modeLabel(data.calibration.mode) }}</span>
        <span class="status-pill"><Scale :size="14" /> 换算比例 {{ data.calibration.scalePxPerMeter.toFixed(1) }} px/m</span>
        <span class="status-pill"><Gauge :size="14" /> 计量置信度 {{ confidenceLabel }}</span>
        <div class="status-spacer" />
        <span class="audit-note"><History :size="14" /> 审计修改 {{ auditCount }} 次</span>
      </div>

      <div class="split-layout wide-aside measure-grid">
        <section class="panel workbench-panel">
          <div class="panel-header">
            图像标定工作区
            <span class="panel-extra">灰色网格为透视投影辅助线</span>
          </div>
          <div class="panel-body workbench-body">
            <CalibrationWorkbench
              :image-url="imageUrl"
              :mode="effectiveMode"
              :endpoints="rulerEndpoints"
              :ruler-length="rulerLength"
              :grid="data.calibration.mode !== 'none'"
              @update:endpoints="onEndpointsChange"
              @drag-change="onDragChange"
            />
          </div>
        </section>

        <aside class="config-column">
          <section class="panel">
            <div class="panel-header">标定设置</div>
            <div class="panel-body">
              <div class="field-label">标定模式</div>
              <el-segmented
                :model-value="data.calibration.mode"
                :options="[
                  { label: '相机参数', value: 'camera' },
                  { label: '画面标尺', value: 'ruler' },
                  { label: '无标定', value: 'none' }
                ]"
                style="width: 100%"
                @change="setMode"
              />
              <template v-if="data.calibration.mode === 'camera'">
                <div class="field-label">相机高度（m）</div>
                <el-input-number v-model="cameraForm.height" :min="0.5" :max="10" :step="0.1" style="width: 100%" />
                <div class="field-label">俯仰角（°）</div>
                <el-input-number v-model="cameraForm.pitch" :min="0" :max="90" :step="1" style="width: 100%" @change="updateCamera" />
                <el-button class="full-btn" @click="updateCamera"><Calculator :size="14" /> 重算透视比例</el-button>
              </template>
              <template v-else-if="data.calibration.mode === 'ruler'">
                <div class="field-label">标尺实际长度（m）</div>
                <el-input-number v-model="rulerLength" :min="0.1" :max="10" :step="0.1" style="width: 100%" @change="updateRulerLength" />
                <div class="field-hint">拖拽图中橙色 / 绿色端点可实时调整标尺。</div>
              </template>
              <template v-else>
                <EmptyState icon="list" title="无标定模式" description="只输出像素量与相对等级，适合快速筛查。">
                  <el-button type="primary" @click="setMode('ruler')">切换画面标尺</el-button>
                </EmptyState>
              </template>
            </div>
          </section>

          <section class="panel metric-panel">
            <div class="panel-header">病害规模汇总</div>
            <div class="metric-grid">
              <div class="metric-cell">
                <div class="metric-num">{{ data.dimensions.length }}</div>
                <div class="metric-name">病害条目</div>
              </div>
              <div class="metric-cell">
                <div class="metric-num">{{ totalArea.toFixed(2) }} <small>㎡</small></div>
                <div class="metric-name">总病害面积</div>
              </div>
              <div class="metric-cell">
                <div class="metric-num">{{ heavyCount }}</div>
                <div class="metric-name">重度病害</div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section class="panel dimension-panel">
        <div class="panel-header">
          病害量化明细
          <span class="panel-extra">长度 / 面积 / 等级均可编辑，保存后写入审计日志</span>
        </div>
        <el-table :data="data.dimensions" style="width: 100%">
          <el-table-column prop="id" label="编号" width="100" />
          <el-table-column label="病害类型" width="130">
            <template #default="{ row }">
              <span class="type-badge" :style="{ color: diseaseColor(row.type), background: diseaseColor(row.type) + '14' }">
                {{ row.label || diseaseLabel(row.type) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="长度 (m)" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.length" :min="0" :step="0.1" size="small" controls-position="right" @change="commitEdit(row, 'length', row.length)" />
            </template>
          </el-table-column>
          <el-table-column label="宽度 (mm)" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.width" :min="0" :step="0.1" size="small" controls-position="right" @change="commitEdit(row, 'width', row.width)" />
            </template>
          </el-table-column>
          <el-table-column label="面积 (㎡)" width="150">
            <template #default="{ row }">
              <div class="edit-value">
                <el-input-number v-model="row.area" :min="0" :step="0.01" size="small" controls-position="right" style="width: 110px" @change="commitEdit(row, 'area', row.area)" />
                <el-tooltip content="已记录人工修正" placement="top">
                  <Edit3 v-if="editedRows.includes(row.id)" :size="13" color="#D97706" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="密度 (%)" width="110" align="right">
            <template #default="{ row }">{{ row.density.toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="等级" width="140">
            <template #default="{ row }">
              <el-select :model-value="row.grade" size="small" @change="commitEdit(row, 'grade', $event)">
                <el-option label="轻" value="轻" />
                <el-option label="中" value="中" />
                <el-option label="重" value="重" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="id" label="修正来源" width="110">
            <template #default="{ row }">
              <span class="source-text">{{ editedRows.includes(row.id) ? '人工修正' : 'AI 自动' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="dimension-foot">
          <span class="foot-note"><AlertTriangle :size="14" color="#D97706" /> 等级判定依据：裂缝宽度 / 面积占比 / 深度信息，建议与现场钻芯抽样比对。</span>
          <div class="foot-actions">
            <el-button @click="router.push(`/recognition?taskId=${taskId}`)">返回复核</el-button>
            <el-button :loading="saving" @click="saveMeasure"><Save :size="15" /> 保存复核记录</el-button>
            <el-button type="primary" @click="goDecision"><CircleGauge :size="15" /> 生成低碳决策</el-button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.header-note {
  color: #6B7280;
  font-size: 13px;
  background: #F3F4F6;
  border-radius: 6px;
  padding: 6px 10px;
}

.warn-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #FCD9A5;
  border-radius: 8px;
  background: #FFFDF7;
  color: #92400E;
  font-size: 13px;
}

.warn-dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #D97706;
}

.status-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  color: #4B5563;
  font-size: 12px;
}

.status-pill.green {
  color: #15803D;
  border-color: #BBF7D0;
  background: #F0FDF4;
}

.status-spacer {
  flex: 1;
}

.audit-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #6B7280;
  font-size: 12px;
}

.workbench-panel {
  min-width: 0;
}

.workbench-body {
  padding: 12px;
  background: #F7F8F6;
}

.config-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 14px 0 6px;
}

.field-label:first-child {
  margin-top: 0;
}

.field-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #6B7280;
  line-height: 1.5;
}

.full-btn {
  width: 100%;
  margin-top: 14px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 14px 4px;
}

.metric-cell {
  text-align: center;
  border-right: 1px solid var(--border);
}

.metric-cell:last-child {
  border-right: 0;
}

.metric-num {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
}

.metric-num small {
  font-size: 12px;
  color: #6B7280;
}

.metric-name {
  color: #6B7280;
  font-size: 12px;
  margin-top: 3px;
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.edit-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

.source-text {
  color: #6B7280;
  font-size: 12px;
}

.dimension-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.foot-note {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #92400E;
  font-size: 12px;
  flex: 1;
  min-width: 220px;
}

.foot-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
