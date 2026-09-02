<script setup lang="ts">
import { FileText, List, ScanLine, Search } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; description?: string; icon?: 'scan' | 'file' | 'list' | 'search' }>(), {
  description: '',
  icon: 'scan'
})
</script>

<template>
  <div class="empty-state">
    <el-icon :size="30" color="#9CA3AF">
      <ScanLine v-if="icon === 'scan'" />
      <FileText v-else-if="icon === 'file'" />
      <List v-else-if="icon === 'list'" />
      <Search v-else />
    </el-icon>
    <div class="empty-title">{{ title }}</div>
    <div v-if="description" class="empty-desc">{{ description }}</div>
    <div class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 24px;
  text-align: center;
}
.empty-title {
  margin-top: 10px;
  font-weight: 600;
}
.empty-desc {
  margin-top: 6px;
  color: #6B7280;
  font-size: 13px;
}
.empty-action {
  margin-top: 14px;
}
</style>
