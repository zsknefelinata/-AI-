import { defineStore } from 'pinia'
import type { AuditLog, UserInfo } from '@/types'

interface AppState {
  user: UserInfo
  currentTaskId: string
  currentTaskLabel: string
  auditLogs: AuditLog[]
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    user: { name: '李工', role: 'admin', org: '县公路养护中心' },
    currentTaskId: 'RD-20260902-003',
    currentTaskLabel: 'RD-20260902-003',
    auditLogs: []
  }),
  actions: {
    setTaskContext(taskId: string, label: string) {
      this.currentTaskId = taskId
      this.currentTaskLabel = label
    },
    addAuditLog(module: string, action: string, target = '', detail = '') {
      const log: AuditLog = {
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        module,
        action,
        target,
        operator: this.user.name,
        detail
      }
      this.auditLogs.unshift(log)
    }
  }
})
