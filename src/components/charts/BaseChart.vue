<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = withDefaults(defineProps<{ option: echarts.EChartsOption; height?: string | number }>(), {
  height: 280
})

const emit = defineEmits<{ (e: 'chart-click', params: unknown): void }>()

const el = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const render = () => {
  if (!el.value) return
  if (!chart) chart = echarts.init(el.value)
  chart.setOption(props.option, true)
}

const resize = () => chart?.resize()

watch(() => props.option, render, { deep: true })

onMounted(() => {
  render()
  chart?.on('click', (params) => emit('chart-click', params))
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="el" class="base-chart" :style="{ height: typeof height === 'number' ? `${height}px` : height }" />
</template>

<style scoped>
.base-chart {
  width: 100%;
}
</style>
