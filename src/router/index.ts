import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAppStore } from '@/stores/app'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue'), meta: { title: '工作台' } },
        { path: 'tasks', name: 'tasks', component: () => import('@/views/tasks/TasksView.vue'), meta: { title: '任务管理' } },
        { path: 'recognition', name: 'recognition', component: () => import('@/views/recognition/RecognitionView.vue'), meta: { title: '智能识别' } },
        { path: 'measure/:taskId', name: 'measure', component: () => import('@/views/measure/MeasureView.vue'), meta: { title: '量化评估' } },
        { path: 'decision/:taskId', name: 'decision', component: () => import('@/views/decision/DecisionView.vue'), meta: { title: '低碳决策' } },
        { path: 'stats', name: 'stats', component: () => import('@/views/stats/StatsView.vue'), meta: { title: '统计看板' } },
        { path: 'reports', name: 'reports', component: () => import('@/views/reports/ReportsView.vue'), meta: { title: '报告中心' } },
        { path: 'settings', name: 'settings', component: () => import('@/views/settings/SettingsView.vue'), meta: { title: '系统设置', requiresAdmin: true } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const store = useAppStore()
  if (to.meta.requiresAdmin && store.user.role !== 'admin') {
    return { path: '/', query: { denied: '1' } }
  }
  return true
})

export default router
