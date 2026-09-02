<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import { ArrowRight, FileDown, FolderPlus, ScanSearch, SlidersHorizontal } from 'lucide-vue-next'
import { dashboardApi } from '@/api'
import type { DashboardCharts, KpiCard as KpiCardType, TaskItem, TaskStatus } from '@/types'
import { CHART_PALETTE, TASK_STATUS_META } from '@/constants/business'
import BaseChart from '@/components/charts/BaseChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import KpiCard from '@/components/common/KpiCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import RiskBanner from '@/components/common/RiskBanner.vue'
import StatusTag from '@/components/common/StatusTag.vue'

const router = useRouter()
const loading = ref(true)
const kpis = ref<KpiCardType[]>([])
const charts = ref<DashboardCharts | null>(null)
const tasks = ref<TaskItem[]>([])

const chartCommon = {
  textStyle: { fontFamily: 'inherit', color: '#6B7280' },
  color: CHART_PALETTE
}

const diseaseOption = computed<EChartsOption>(() => {
  const items = charts.value?.diseaseDist || []
  return {
    ...chartCommon,
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 处（{d}%）' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 12 } },
    series: [
      {
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: { label: { show: true, formatter: '{b}\n{c} 处', fontSize: 13 } },
        data: items.map((item) => ({ name: item.name, value: item.count }))
      }
    ]
  }
})

const routeOption = computed<EChartsOption>(() => {
  const items = [...(charts.value?.routeDist || [])].reverse()
  return {
    ...chartCommon,
    grid: { left: 14, right: 24, top: 12, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params: unknown) => {
      const list = params as { name: string; value: number; seriesName: string }[]
      if (!list.length) return ''
      const row = items.find((item) => item.road === list[0].name)
      return `${list[0].name}<br/>病害 ${row?.count ?? 0} 处<br/>已完成 ${row?.completed ?? 0} 处`
    } },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF0EE' } }, axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'category',
      data: items.map((item) => item.road),
      axisLabel: { fontSize: 11, width: 118, overflow: 'truncate' },
      axisTick: { show: false },
      axisLine: { show: false }
    },
    series: [
      {
        name: '病害数',
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [0, 6, 6, 0], color: '#2563EB' },
        data: items.map((item) => item.count)
      }
    ]
  }
})

const trendOption = computed<EChartsOption>(() => {
  const items = charts.value?.trend || []
  return {
    ...chartCommon,
    grid: { left: 12, right: 16, top: 34, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 12 } },
    xAxis: { type: 'category', boundaryGap: false, data: items.map((item) => item.date), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#EEF0EE' } } },
    series: [
      {
        name: '识别病害',
        type: 'line',
        smooth: true,
        symbolSize: 5,
        itemStyle: { color: '#D97706' },
        areaStyle: { color: 'rgba(217, 119, 6, 0.12)' },
        data: items.map((item) => item.count)
      },
      {
        name: '复核通过',
        type: 'line',
        smooth: true,
        symbolSize: 5,
        itemStyle: { color: '#16A34A' },
        data: items.map((item) => item.reviewed)
      }
    ]
  }
})

const risks = computed(() => {
  const result: { level: 'warning' | 'danger' | 'info'; text: string }[] = []
  const reviewing = tasks.value.filter((task) => task.status === 'reviewing').length
  const failed = tasks.value.filter((task) => task.status === 'failed').length
  if (reviewing) result.push({ level: 'warning', text: `${reviewing} 个任务存在 AI 结果待人工复核，建议优先处理 S301 城区段专项巡检。` })
  if (failed) result.push({ level: 'danger', text: `${failed} 个任务识别异常：X045 柳湾镇雨后巡检存在 3 张图片格式错误，请核查后重新上传。` })
  result.push({ level: 'info', text: '部分影像无标定记录，量化结果仅输出像素量与相对等级，不可用于实物量结算。' })
  return result
})

const taskStatusMeta = (status: TaskStatus) => TASK_STATUS_META[status]
const openTask = (task: TaskItem) => {
  if (task.status === 'reviewing' || task.status === 'failed') {
    router.push(`/recognition?taskId=${task.id}`)
  } else {
    router.push(`/tasks?taskId=${task.id}`)
  }
}

onMounted(async () => {
  try {
    const [kpiData, chartData, taskData] = await Promise.all([
      dashboardApi.getKpi(),
      dashboardApi.getCharts(30),
      dashboardApi.getRecentTasks()
    ])
    kpis.value = kpiData
    charts.value = chartData
    tasks.value = taskData
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page dashboard-page">
    <PageHeader title="首页工作台" subtitle="今日待办、待复核结果与低碳效益总览">
      <template #actions>
        <el-button @click="router.push('/tasks?new=1')">
          <FolderPlus :size="15" /> 新建任务
        </el-button>
        <el-button type="primary" @click="router.push('/recognition')">
          <ScanSearch :size="15" /> 批量识别
        </el-button>
        <el-button @click="router.push('/reports')">
          <FileDown :size="15" /> 生成报告
        </el-button>
        <el-button @click="router.push('/settings')">
          <SlidersHorizontal :size="15" /> 参数库
        </el-button>
      </template>
    </PageHeader>

    <el-skeleton v-if="loading" :rows="5" animated class="dashboard-skeleton" />

    <template v-else>
      <div class="kpi-grid">
        <KpiCard
          v-for="kpi in kpis"
          :key="kpi.key"
          :kpi="kpi"
          clickable
          @click="kpi.key === 'review' ? router.push('/tasks?status=reviewing') : router.push('/tasks')"
        />
      </div>

      <div class="quick-row">
        <button class="quick-entry orange" @click="router.push('/tasks?new=1')">
          <FolderPlus :size="18" /><span>新建任务</span>
        </button>
        <button class="quick-entry blue" @click="router.push('/recognition')">
          <ScanSearch :size="18" /><span>批量识别</span>
        </button>
        <button class="quick-entry green" @click="router.push('/reports')">
          <FileDown :size="18" /><span>生成报告</span>
        </button>
        <button class="quick-entry slate" @click="router.push('/settings')">
          <SlidersHorizontal :size="18" /><span>参数库</span>
        </button>
      </div>

      <RiskBanner :risks="risks" />

      <div class="chart-grid dashboard-charts">
        <section class="panel chart-panel">
          <div class="panel-header">病害类型分布<span class="panel-extra">本月</span></div>
          <div class="panel-body chart-body">
            <BaseChart :option="diseaseOption" :height="256" />
          </div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-header">路段分布<span class="panel-extra">病害点数</span></div>
          <div class="panel-body chart-body">
            <BaseChart :option="routeOption" :height="256" />
          </div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-header">月度趋势<span class="panel-extra">最近 30 天</span></div>
          <div class="panel-body chart-body">
            <BaseChart :option="trendOption" :height="256" />
          </div>
        </section>
      </div>

      <section class="panel recent-panel">
        <div class="panel-header">
          最近任务
          <el-button text type="primary" class="link-more" @click="router.push('/tasks')">
            查看全部 <ArrowRight :size="14" />
          </el-button>
        </div>
        <el-table v-if="tasks.length" :data="tasks" style="width: 100%">
          <el-table-column prop="id" label="任务号" min-width="150" fixed="left" />
          <el-table-column prop="road" label="路段" min-width="180" show-overflow-tooltip />
          <el-table-column prop="diseaseCount" label="病害数" width="84" align="right">
            <template #default="{ row }">{{ row.diseaseCount }} 处</template>
          </el-table-column>
          <el-table-column label="识别状态" width="104">
            <template #default="{ row }">
              <StatusTag :status="row.status" :label="taskStatusMeta(row.status).label" :color="taskStatusMeta(row.status).color" />
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="150" />
          <el-table-column label="操作" width="92" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openTask(row)">打开</el-button>
            </template>
          </el-table-column>
        </el-table>
        <EmptyState v-else icon="list" title="暂无任务数据" description="新建巡检任务后，识别与养护闭环将在这里汇总。">
          <el-button type="primary" @click="router.push('/tasks?new=1')">新建任务</el-button>
        </EmptyState>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard-skeleton {
  padding: 4px;
}

.quick-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.quick-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  color: #1F2937;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.quick-entry:hover {
  border-color: #B9BDC2;
  box-shadow: 0 2px 8px rgba(31, 41, 55, 0.05);
}

.quick-entry.orange svg { color: #D97706; }
.quick-entry.blue svg { color: #2563EB; }
.quick-entry.green svg { color: #16A34A; }
.quick-entry.slate svg { color: #0E7490; }

.chart-panel {
  min-width: 0;
}

.chart-body {
  padding: 12px 8px 8px;
}

.recent-panel .link-more {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 900px) {
  .quick-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
