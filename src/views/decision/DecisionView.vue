<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Leaf,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Truck
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { decisionApi } from '@/api'
import type { CarbonBreakdown, DecisionData, SchemeItem } from '@/types'
import { CHART_PALETTE, DISEASE_COLORS } from '@/constants/business'
import { useAppStore } from '@/stores/app'
import BaseChart from '@/components/charts/BaseChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const loading = ref(true)
const saving = ref(false)
const data = ref<DecisionData | null>(null)
const calculatedAt = ref('')
const edited = ref(false)

const taskId = computed(() => String(route.params.taskId || 'RD-20260902-003'))

const factorForm = reactive({
  asphalt: 0.214,
  diesel: 3.186,
  transport: 0.102
})

const schemeParams: Record<SchemeItem['type'], { materialRate: number; transportRate: number; machineryRate: number; fuelRate: number; otherRate: number; costRate: number }> = {
  repair: { materialRate: 1.35, transportRate: 1.5, machineryRate: 2.2, fuelRate: 2.1, otherRate: 1.4, costRate: 1.0 },
  maintenance: { materialRate: 0.72, transportRate: 0.62, machineryRate: 0.62, fuelRate: 0.55, otherRate: 0.5, costRate: 0.58 },
  custom: { materialRate: 1.0, transportRate: 0.9, machineryRate: 0.95, fuelRate: 0.85, otherRate: 0.7, costRate: 0.78 }
}

const materialUsage = computed(() => data.value?.params.materialUsage || 0)
const machineryHours = computed(() => data.value?.params.machineryHours || 0)
const transportDistance = computed(() => data.value?.params.transportDistance || 0)

const formatMoney = (value: number) => `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`

const schemeBreakdown = (scheme: SchemeItem): CarbonBreakdown => {
  const params = schemeParams[scheme.type] || schemeParams.custom
  const materialCo2 = materialUsage.value * factorForm.asphalt * params.materialRate * 1000
  const freightCo2 = materialUsage.value * transportDistance.value * factorForm.transport * params.transportRate
  const machineryCo2 = machineryHours.value * factorForm.diesel * 168 * params.machineryRate
  const fuelCo2 = data.value?.params.fuelConsumption || 0
    ? (data.value?.params.fuelConsumption || 0) * factorForm.diesel * params.fuelRate
    : machineryHours.value * factorForm.diesel * 32 * params.fuelRate
  const otherCo2 = materialCo2 * params.otherRate
  return {
    material: Math.round(materialCo2),
    transport: Math.round(freightCo2),
    machinery: Math.round(machineryCo2 + fuelCo2),
    other: Math.round(otherCo2)
  }
}

const totalCo2 = (scheme: SchemeItem) => {
  const parts = schemeBreakdown(scheme)
  return parts.material + parts.transport + parts.machinery + parts.other
}

const recalcSchemes = () => {
  if (!data.value) return
  data.value.schemes.forEach((scheme) => {
    scheme.carbon = schemeBreakdown(scheme)
    scheme.totalCo2e = totalCo2(scheme)
  })
  calculatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  edited.value = true
}

const recommendedScheme = computed(() => {
  if (!data.value?.schemes.length) return null
  return [...data.value.schemes].sort((a, b) => a.totalCo2e - b.totalCo2e)[0]
})

const recommendationText = computed(() => {
  const recommended = recommendedScheme.value
  const repair = data.value?.schemes.find((item) => item.type === 'repair')
  if (!recommended || !repair) return ''
  const reduction = Math.round((1 - recommended.totalCo2e / repair.totalCo2e) * 100)
  const perYear = recommended.serviceYears > 0 ? Math.round(recommended.totalCo2e / recommended.serviceYears) : 0
  return `推荐 ${recommended.name}：周期累计碳排 ${recommended.totalCo2e.toLocaleString()} kg CO2e，较传统热补低 ${reduction}%；按 ${recommended.serviceYears} 年服务期折算，年均碳排约 ${perYear.toLocaleString()} kg CO2e。`
})

const costCarbonOption = computed<EChartsOption>(() => {
  const list = data.value?.schemes || []
  return {
    color: CHART_PALETTE,
    grid: { left: 12, right: 24, top: 30, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', formatter: (params: unknown) => {
      const item = params as { data: { name: string; value: number[] } }
      return `${item.data.name}<br/>成本：${formatMoney(item.data.value[0])}<br/>碳排：${item.data.value[1].toLocaleString()} kg CO2e`
    } },
    xAxis: { type: 'value', name: '成本 (元)', nameTextStyle: { fontSize: 11 }, splitLine: { lineStyle: { color: '#EEF0EE' } } },
    yAxis: { type: 'value', name: '碳排 (kg CO2e)', nameTextStyle: { fontSize: 11 }, splitLine: { lineStyle: { color: '#EEF0EE' } } },
    series: [{
      name: '方案',
      type: 'scatter',
      symbolSize: 26,
      label: { show: true, position: 'top', formatter: '{b}', fontSize: 11 },
      data: list.map((item) => ({ name: item.name, value: [item.cost, item.totalCo2e] })),
      itemStyle: { color: '#2563EB' }
    }]
  }
})

const stackedOption = computed<EChartsOption>(() => {
  const list = data.value?.schemes || []
  return {
    color: ['#D97706', '#2563EB', '#16A34A', '#7C3AED'],
    grid: { left: 12, right: 14, top: 38, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: list.map((item) => item.name), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', name: 'kg CO2e', nameTextStyle: { fontSize: 11 }, splitLine: { lineStyle: { color: '#EEF0EE' } } },
    series: [
      { name: '材料', type: 'bar', stack: 'carbon', barWidth: 26, data: list.map((item) => item.carbon.material) },
      { name: '运输', type: 'bar', stack: 'carbon', data: list.map((item) => item.carbon.transport) },
      { name: '施工', type: 'bar', stack: 'carbon', data: list.map((item) => item.carbon.machinery) },
      { name: '其他', type: 'bar', stack: 'carbon', data: list.map((item) => item.carbon.other) }
    ]
  }
})

const sourceTags = [
  { name: '沥青混合料', value: factorForm.asphalt, unit: 't CO2e/t', source: 'IPCC 2024' },
  { name: '柴油（机械）', value: factorForm.diesel, unit: 't CO2e/t', source: '生态环境部 2022' },
  { name: '公路货运', value: factorForm.transport, unit: 'kg CO2e/t·km', source: '省级清单指南 2021' }
]

const saveDecision = async () => {
  if (!data.value) return
  saving.value = true
  try {
    const response = await decisionApi.save(taskId.value, data.value.schemes)
    ElMessage.success(response.message || '方案已保存')
    appStore.addAuditLog('低碳决策', '保存方案', taskId.value, `保存 ${data.value.schemes.length} 个方案，含参数版本 ${calculatedAt.value || '初始'}`)
    edited.value = false
  } finally {
    saving.value = false
  }
}

const goReport = () => {
  void saveDecision().then(() => {
    router.push({ path: '/reports', query: { taskId: taskId.value, generate: '1' } })
  })
}

onMounted(async () => {
  try {
    data.value = await decisionApi.data(taskId.value)
    calculatedAt.value = '初始参数（Mock 库）'
    recalcSchemes()
    calculatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <PageHeader title="低碳决策" subtitle="所有减排结论由本页参数实时重算，保存方案时记录参数来源与计算时间">
      <template #actions>
        <span class="calced-at"><Clock3 :size="14" /> 计算时间 {{ calculatedAt }}</span>
        <el-button @click="recalcSchemes"><RefreshCw :size="15" /> 重算方案</el-button>
      </template>
    </PageHeader>

    <el-skeleton v-if="loading" :rows="6" animated />

    <template v-else-if="data">
      <section class="panel">
        <div class="panel-header">
          参数配置
          <span class="panel-extra">材料 / 运输 / 机械参数按任务实际情况修改后点击重算</span>
        </div>
        <div class="panel-body params-grid">
          <div class="param-item">
            <label>病害规模（㎡）</label>
            <el-input-number v-model="data.params.area" :min="1" :step="1" style="width: 150px" @change="recalcSchemes" />
          </div>
          <div class="param-item">
            <label>服务期（年）</label>
            <el-input-number v-model="data.params.serviceYears" :min="1" :max="20" :step="1" style="width: 150px" @change="recalcSchemes" />
          </div>
          <div class="param-item">
            <label>运输距离（km）</label>
            <el-input-number v-model="data.params.transportDistance" :min="0" :step="1" style="width: 150px" @change="recalcSchemes" />
          </div>
          <div class="param-item">
            <label>材料用量（t）</label>
            <el-input-number v-model="data.params.materialUsage" :min="0" :step="0.1" style="width: 150px" @change="recalcSchemes" />
          </div>
          <div class="param-item">
            <label>机械台班（h）</label>
            <el-input-number v-model="data.params.machineryHours" :min="0" :step="0.5" style="width: 150px" @change="recalcSchemes" />
          </div>
          <div class="param-item">
            <label>燃油消耗（kg）</label>
            <el-input-number v-model="data.params.fuelConsumption" :min="0" :step="1" style="width: 150px" @change="recalcSchemes" />
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          方案对比
          <span class="panel-extra">推荐标记随重算结果变化</span>
        </div>
        <el-table :data="data.schemes" style="width: 100%">
          <el-table-column label="方案" min-width="150">
            <template #default="{ row }">
              <div class="scheme-name">
                <FlaskConical v-if="row.type === 'custom'" :size="15" color="#0E7490" />
                <Truck v-else-if="row.type === 'repair'" :size="15" color="#D97706" />
                <Leaf v-else :size="15" color="#16A34A" />
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="成本" width="110" align="right">
            <template #default="{ row }">{{ formatMoney(row.cost) }}</template>
          </el-table-column>
          <el-table-column label="材料碳排 (kg)" width="120" align="right">
            <template #default="{ row }">{{ row.carbon.material.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="运输碳排 (kg)" width="120" align="right">
            <template #default="{ row }">{{ row.carbon.transport.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="施工碳排 (kg)" width="120" align="right">
            <template #default="{ row }">{{ row.carbon.machinery.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="周期累计碳排 (kg)" width="140" align="right">
            <template #default="{ row }">
              <strong class="carbon-total">{{ row.totalCo2e.toLocaleString() }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="服务期" width="90" align="center">
            <template #default="{ row }">{{ row.serviceYears }} 年</template>
          </el-table-column>
          <el-table-column label="推荐" width="80" align="center">
            <template #default="{ row }">
              <CheckCircle2 v-if="recommendedScheme?.id === row.id" :size="17" color="#16A34A" />
              <span v-else class="dash">—</span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <div class="decision-charts">
        <section class="panel">
          <div class="panel-header">分项碳排构成<span class="panel-extra">kg CO2e</span></div>
          <div class="panel-body">
            <BaseChart :option="stackedOption" :height="270" />
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">成本-碳排分布<span class="panel-extra">低成本低碳方案优先</span></div>
          <div class="panel-body">
            <BaseChart :option="costCarbonOption" :height="270" />
          </div>
        </section>
      </div>

      <section class="panel recommendation">
        <div class="recommend-icon"><Sparkles :size="18" /></div>
        <div class="recommend-main">
          <div class="recommend-title">推荐理由</div>
          <div class="recommend-text">{{ recommendationText }}</div>
        </div>
        <div class="recommend-tags">
          <span v-for="tag in sourceTags" :key="tag.name" class="factor-chip">
            <BadgeCheck :size="13" /> {{ tag.name }} {{ tag.value }} {{ tag.unit }} · {{ tag.source }}
          </span>
        </div>
      </section>

      <div class="decision-actions">
        <el-button @click="recalcSchemes"><SlidersHorizontal :size="15" /> 调整后重算</el-button>
        <el-button :loading="saving" @click="saveDecision"><Save :size="15" /> 保存方案</el-button>
        <el-button type="primary" @click="goReport"><Calculator :size="15" /> 生成养护报告</el-button>
      </div>
    </template>

    <EmptyState v-else icon="list" title="暂无决策数据" description="请先完成量化评估后再进入低碳决策。">
      <el-button type="primary" @click="router.push(`/measure/${taskId}`)">前往量化评估</el-button>
    </EmptyState>
  </div>
</template>

<style scoped>
.calced-at {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #6B7280;
  font-size: 12px;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-item label {
  color: #374151;
  font-size: 13px;
  font-weight: 500;
}

.scheme-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.carbon-total {
  color: #0E7490;
}

.dash {
  color: #D1D5DB;
}

.decision-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.decision-charts .panel-body {
  padding: 12px 8px 6px;
}

.recommendation {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid #BBF7D0;
  background: #F7FEF9;
}

.recommend-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #16A34A;
  color: #fff;
}

.recommend-main {
  flex: 1;
  min-width: 0;
}

.recommend-title {
  font-weight: 700;
  margin-bottom: 5px;
}

.recommend-text {
  color: #374151;
  line-height: 1.6;
  font-size: 13px;
}

.recommend-tags {
  max-width: 380px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.factor-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #166534;
  background: #fff;
  border: 1px solid #BBF7D0;
  padding: 3px 8px;
  border-radius: 11px;
}

.decision-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1100px) {
  .params-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .decision-charts {
    grid-template-columns: 1fr;
  }

  .params-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recommendation {
    flex-direction: column;
  }

  .recommend-tags {
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
