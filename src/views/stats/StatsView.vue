<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import { FileSpreadsheet, RefreshCw } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { statsApi } from '@/api'
import { CHART_PALETTE, DISEASE_COLORS, DISEASE_LABELS } from '@/constants/business'
import type { StatsData, StatsFilters } from '@/types'
import { downloadCsv } from '@/utils/format'
import BaseChart from '@/components/charts/BaseChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const loading = ref(true)
const data = ref<StatsData | null>(null)
const filters = reactive<StatsFilters>({
  start: '',
  end: '',
  county: '',
  roadLevel: '',
  diseaseType: ''
})

const baseGrid = { left: 12, right: 16, top: 38, bottom: 8, containLabel: true }

const diseaseOption = computed<EChartsOption>(() => {
  const items = data.value?.diseaseDist || []
  return {
    color: items.map((item) => DISEASE_COLORS[item.type]),
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 处（{d}%）' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
    series: [
      {
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '44%'],
        label: { show: false },
        emphasis: { label: { show: true, formatter: '{b}: {c} 处', fontSize: 12 } },
        data: items.map((item) => ({ name: item.name, value: item.count }))
      }
    ]
  }
})

const routeOption = computed<EChartsOption>(() => {
  const items = data.value?.routeDist || []
  return {
    color: ['#2563EB', '#16A34A'],
    grid: baseGrid,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: items.map((item) => item.road), axisLabel: { fontSize: 10, interval: 0, rotate: 30 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#EEF0EE' } } },
    series: [
      { name: '病害数', type: 'bar', barWidth: 10, itemStyle: { color: '#2563EB' }, data: items.map((item) => item.count) },
      { name: '已完成', type: 'bar', barWidth: 10, itemStyle: { color: '#16A34A' }, data: items.map((item) => item.completed) }
    ]
  }
})

const trendOption = computed<EChartsOption>(() => {
  const items = data.value?.trend || []
  return {
    color: ['#D97706', '#7C3AED'],
    grid: baseGrid,
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', boundaryGap: false, data: items.map((item) => item.date), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#EEF0EE' } } },
    series: [
      { name: '识别病害', type: 'line', smooth: true, symbolSize: 4, data: items.map((item) => item.count) },
      { name: '复核通过', type: 'line', smooth: true, symbolSize: 4, data: items.map((item) => item.reviewed) }
    ]
  }
})

const reviewOption = computed<EChartsOption>(() => {
  const items = data.value?.review || []
  return {
    color: ['#D97706', '#0E7490'],
    grid: baseGrid,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: items.map((item) => `${item.month}月`), axisLabel: { fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '%', max: 100, splitLine: { lineStyle: { color: '#EEF0EE' } } },
      { type: 'value', name: '处', splitLine: { show: false } }
    ],
    series: [
      { name: '复核合格率', type: 'bar', barWidth: 18, itemStyle: { color: '#D97706' }, data: items.map((item) => item.passRate) },
      { name: '复核总数', type: 'line', yAxisIndex: 1, itemStyle: { color: '#0E7490' }, data: items.map((item) => item.total) }
    ]
  }
})

const schemeOption = computed<EChartsOption>(() => {
  const items = data.value?.schemeMetrics || []
  return {
    color: ['#16A34A', '#2563EB', '#D97706'],
    grid: baseGrid,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
    xAxis: { type: 'category', data: items.map((item) => item.name), axisLabel: { fontSize: 11 } },
    yAxis: [
      { type: 'value', name: 'kg', splitLine: { lineStyle: { color: '#EEF0EE' } } },
      { type: 'value', name: '元', splitLine: { show: false } }
    ],
    series: [
      { name: '周期碳排', type: 'bar', barWidth: 12, itemStyle: { color: '#16A34A' }, data: items.map((item) => item.totalCo2e) },
      { name: '成本', type: 'bar', barWidth: 12, itemStyle: { color: '#D97706' }, data: items.map((item) => item.cost) }
    ]
  }
})

const pendingOption = computed<EChartsOption>(() => {
  const items = data.value?.pendingTop || []
  return {
    color: ['#D97706', '#7C3AED', '#2563EB'],
    grid: { left: 8, right: 20, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', formatter: '{b}: {c} 个' },
    series: [
      {
        type: 'bar',
        barWidth: 18,
        data: items.map((item, index) => ({
          name: item.label,
          value: item.count,
          itemStyle: { color: ['#D97706', '#7C3AED', '#2563EB'][index] }
        })),
        label: { show: true, position: 'right', formatter: '{c}', fontSize: 12 }
      }
    ]
  }
})

const countyOptions = ['城关街道', '石桥镇', '杨河乡', '北坡镇', '红岩镇', '柳湾镇', '新店乡', '白水街道']
const roadLevelOptions = ['国道', '省道', '县道', '乡道']

const loadData = async () => {
  loading.value = true
  try {
    data.value = await statsApi.data({ ...filters })
  } finally {
    loading.value = false
  }
}

const exportRows = () => {
  if (!data.value) return
  downloadCsv('路段病害统计明细.csv', data.value.rows.map((row) => ({
    路段: row.road,
    区县: row.county,
    病害数: row.diseaseCount,
    平均等级: row.avgGrade,
    方案数: row.schemeCount,
    预估减排量_tCO2e: row.estimatedReduction,
    报告状态: row.reportStatus
  })))
  ElMessage.success('明细表已导出 CSV')
}

const drillTask = () => {
  router.push({ path: '/tasks', query: filters.county ? { q: filters.county } : {} })
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <PageHeader title="统计看板" subtitle="巡检数据按病害、路段与养护方案汇总，图表与明细口径一致">
      <template #actions>
        <el-button @click="loadData"><RefreshCw :size="15" /> 刷新</el-button>
        <el-button type="primary" :disabled="!data?.rows.length" @click="exportRows">
          <FileSpreadsheet :size="15" /> 导出 CSV
        </el-button>
      </template>
    </PageHeader>

    <section class="panel filter-bar">
      <el-date-picker
        v-model="filters.start"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="开始日期"
        style="width: 150px"
      />
      <span class="range-sep">至</span>
      <el-date-picker
        v-model="filters.end"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="结束日期"
        style="width: 150px"
      />
      <el-select v-model="filters.county" placeholder="全部区县" clearable style="width: 140px">
        <el-option v-for="item in countyOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="filters.roadLevel" placeholder="全部道路等级" clearable style="width: 150px">
        <el-option v-for="item in roadLevelOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="filters.diseaseType" placeholder="全部病害类型" clearable style="width: 150px">
        <el-option v-for="(label, key) in DISEASE_LABELS" :key="key" :label="label" :value="key" />
      </el-select>
      <div class="toolbar-spacer" />
      <el-button type="primary" @click="loadData"><RefreshCw :size="14" /> 应用筛选</el-button>
    </section>

    <el-skeleton v-if="loading" :rows="8" animated />

    <template v-else-if="data">
      <div class="stats-chart-grid">
        <section class="panel chart-panel">
          <div class="panel-header">病害类型占比<span class="panel-extra">本月</span></div>
          <div class="panel-body chart-body"><BaseChart :option="diseaseOption" :height="250" /></div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-header">路段分布<span class="panel-extra">病害 / 已完成</span></div>
          <div class="panel-body chart-body"><BaseChart :option="routeOption" :height="250" @chart-click="drillTask" /></div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-header">月度趋势<span class="panel-extra">最近 30 天</span></div>
          <div class="panel-body chart-body"><BaseChart :option="trendOption" :height="250" /></div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-header">复核合格率<span class="panel-extra">按月度</span></div>
          <div class="panel-body chart-body"><BaseChart :option="reviewOption" :height="250" /></div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-header">工艺方案对比<span class="panel-extra">碳排与成本</span></div>
          <div class="panel-body chart-body"><BaseChart :option="schemeOption" :height="250" /></div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-header">待处理事项<span class="panel-extra">按任务 / 复核 / 决策</span></div>
          <div class="panel-body chart-body"><BaseChart :option="pendingOption" :height="250" /></div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-header">
          路段汇总明细
          <span class="panel-extra">{{ data.rows.length }} 条 · 与图表同源统计</span>
        </div>
        <el-table :data="data.rows" style="width: 100%">
          <el-table-column prop="road" label="路段" min-width="150" />
          <el-table-column prop="county" label="区县" width="110" />
          <el-table-column prop="diseaseCount" label="病害数" width="90" align="right" />
          <el-table-column prop="avgGrade" label="平均等级" width="100" align="center">
            <template #default="{ row }">
              <span class="grade-badge" :class="row.avgGrade">{{ row.avgGrade }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="schemeCount" label="方案数" width="90" align="right" />
          <el-table-column label="预估减排量 (t CO2e)" width="150" align="right">
            <template #default="{ row }">
              <span :class="{ negative: row.estimatedReduction === 0 }">
                {{ row.estimatedReduction > 0 ? row.estimatedReduction.toFixed(2) : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="reportStatus" label="报告状态" width="110" align="center" />
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="drillTask">查看任务</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>

    <EmptyState v-else icon="search" title="暂无统计数据" description="完成至少一个巡检任务后，看板将自动汇总。">
      <el-button type="primary" @click="router.push('/tasks?new=1')">新建任务</el-button>
    </EmptyState>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 16px;
}

.range-sep {
  color: #9CA3AF;
  font-size: 12px;
}

.chart-panel {
  min-width: 0;
}

.chart-body {
  padding: 8px 6px 4px;
}

.grade-badge {
  display: inline-block;
  min-width: 34px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.grade-badge.轻 {
  color: #15803D;
  background: #F0FDF4;
}

.grade-badge.中 {
  color: #B45309;
  background: #FFF7ED;
}

.grade-badge.重 {
  color: #B91C1C;
  background: #FEF2F2;
}

.negative {
  color: #9CA3AF;
}
</style>
