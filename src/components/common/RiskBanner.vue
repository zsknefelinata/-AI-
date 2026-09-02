<script setup lang="ts">
import { AlertTriangle, CircleAlert, Info } from 'lucide-vue-next'

interface RiskItem {
  level: 'warning' | 'danger' | 'info'
  text: string
}

withDefaults(defineProps<{ risks: RiskItem[]; title?: string }>(), {
  title: '风险提示'
})
</script>

<template>
  <div class="risk-banner panel">
    <div class="risk-head">
      <AlertTriangle :size="16" color="#D97706" />
      <span class="risk-title">{{ title }}</span>
    </div>
    <div class="risk-items">
      <div v-for="risk in risks" :key="risk.text" class="risk-item">
        <CircleAlert v-if="risk.level === 'danger'" :size="15" color="#DC2626" />
        <AlertTriangle v-else-if="risk.level === 'warning'" :size="15" color="#D97706" />
        <Info v-else :size="15" color="#2563EB" />
        <span>{{ risk.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.risk-banner {
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #FFFDF7;
}
.risk-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 92px;
}
.risk-title {
  font-weight: 600;
  font-size: 13px;
  color: #1F2937;
}
.risk-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #374151;
}
.risk-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
