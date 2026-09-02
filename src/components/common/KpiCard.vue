<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { Activity, ArrowDownRight, ArrowUpRight, ClipboardCheck, FolderKanban, Leaf, ScanSearch } from 'lucide-vue-next'
import type { KpiCard } from '@/types'
import { formatNumber } from '@/utils/format'

const props = defineProps<{ kpi: KpiCard; clickable?: boolean }>()

const iconMap: Record<string, Component> = {
  FolderKanban,
  ClipboardCheck,
  ScanSearch,
  Leaf,
  Activity
}

const icon = computed(() => iconMap[props.kpi.icon] || Activity)
const trendUp = computed(() => props.kpi.trend >= 0)
</script>

<template>
  <div class="kpi-card panel" :class="{ clickable }" @click="$emit('click')">
    <div class="kpi-icon" :style="{ color: kpi.color, backgroundColor: kpi.color + '16' }">
      <component :is="icon" :size="18" />
    </div>
    <div class="kpi-main">
      <div class="kpi-label">{{ kpi.label }}</div>
      <div class="kpi-value">
        {{ formatNumber(kpi.value, 2) }}<span class="kpi-unit">{{ kpi.unit }}</span>
      </div>
      <div class="kpi-trend" :style="{ color: trendUp ? '#16A34A' : '#DC2626' }">
        <component :is="trendUp ? ArrowUpRight : ArrowDownRight" :size="14" />
        {{ Math.abs(kpi.trend) }}% 环比
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
}
.kpi-card.clickable {
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}
.kpi-card.clickable:hover {
  border-color: #C9CDD2;
  box-shadow: 0 4px 12px rgba(31, 41, 55, 0.06);
}
.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.kpi-main {
  min-width: 0;
}
.kpi-label {
  color: #6B7280;
  font-size: 13px;
}
.kpi-value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}
.kpi-unit {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
}
.kpi-trend {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 8px;
  font-size: 12px;
}
</style>
