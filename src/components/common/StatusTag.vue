<script setup lang="ts">
import { computed } from 'vue'
import type { TaskStatus } from '@/types'
import { TASK_STATUS_META } from '@/constants/business'

const props = withDefaults(defineProps<{ status: TaskStatus; label?: string; color?: string }>(), {
  label: '',
  color: ''
})

const meta = computed(() => {
  if (props.label && props.color) return { label: props.label, color: props.color }
  if (props.label) return { label: props.label, color: '#6B7280' }
  return TASK_STATUS_META[props.status]
})
</script>

<template>
  <span
    class="status-tag"
    :style="{ color: meta.color, borderColor: meta.color + '55', backgroundColor: meta.color + '14' }"
  >
    <span class="status-dot" :style="{ backgroundColor: meta.color }" />
    {{ meta.label }}
  </span>
</template>

<style scoped>
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: 0 0 auto;
}
</style>
