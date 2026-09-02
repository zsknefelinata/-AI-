<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AreaChart,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  PanelLeft,
  Ruler,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
  Waypoints
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

interface NavItem {
  label: string
  path: string
  icon: typeof LayoutDashboard
  disabled?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const collapsed = ref(false)
const drawerOpen = ref(false)
const keyword = ref('')

const navGroups: NavGroup[] = [
  {
    label: '工作台',
    items: [
      { label: '工作台', path: '/', icon: LayoutDashboard }
    ]
  },
  {
    label: '巡检业务',
    items: [
      { label: '任务管理', path: '/tasks', icon: ClipboardList },
      { label: '智能识别', path: '/recognition', icon: ScanSearch },
      { label: '量化评估', path: '/measure/RD-20260902-003', icon: Ruler }
    ]
  },
  {
    label: '低碳养护',
    items: [
      { label: '低碳决策', path: '/decision/RD-20260902-003', icon: Leaf }
    ]
  },
  {
    label: '数据分析与报告',
    items: [
      { label: '统计看板', path: '/stats', icon: AreaChart },
      { label: '报告中心', path: '/reports', icon: FileText }
    ]
  },
  {
    label: '系统',
    items: [{ label: '系统设置', path: '/settings', icon: Settings }]
  }
]

const flatNav = navGroups.flatMap((group) => group.items)

const activePath = computed(() => {
  if (route.path.startsWith('/measure/')) return '/measure/RD-20260902-003'
  if (route.path.startsWith('/decision/')) return '/decision/RD-20260902-003'
  return route.path
})

const crumbParts = computed(() => {
  const match = flatNav.find((item) => item.path === activePath.value)
  if (match) {
    const group = navGroups.find((group) => group.items.includes(match))
    return [group?.label || '', match.label].filter(Boolean)
  }
  return ['系统']
})

const taskContext = computed(() => {
  if (route.path.startsWith('/measure/') || route.path.startsWith('/decision/')) {
    const id = route.params.taskId || appStore.currentTaskId
    const label = route.path.includes('/measure/') ? '量化评估' : '低碳决策'
    return { label: `${id} / ${label}`, emphasized: true }
  }
  return { label: appStore.currentTaskLabel, emphasized: false }
})

const go = (path: string) => {
  router.push(path)
  drawerOpen.value = false
}

const submitSearch = () => {
  const value = keyword.value.trim()
  if (!value) return
  router.push({ path: '/tasks', query: { q: value } })
  keyword.value = ''
}
</script>

<template>
  <div class="app-layout">
    <header class="top-bar">
      <div class="top-left">
        <el-button
          v-if="!collapsed"
          circle
          class="menu-btn"
          aria-label="收起导航"
          @click="collapsed = true"
        >
          <PanelLeft :size="17" />
        </el-button>
        <el-button
          v-else
          circle
          class="menu-btn"
          aria-label="展开导航"
          @click="collapsed = false"
        >
          <Menu :size="17" />
        </el-button>
        <button class="mobile-menu" aria-label="打开导航" @click="drawerOpen = true">
          <Menu :size="18" />
        </button>
        <div class="brand">
          <span class="brand-mark"><Waypoints :size="17" /></span>
          <div class="brand-text">
            <span class="brand-name">路智巡养</span>
            <span class="brand-sub">AI 路面病害检测与低碳养护系统</span>
          </div>
        </div>
      </div>
      <div class="top-search">
        <Search :size="15" />
        <el-input v-model="keyword" placeholder="搜索任务号 / 路段 / 报告" clearable @keyup.enter="submitSearch" />
      </div>
      <div class="top-right">
        <div v-if="taskContext.emphasized" class="task-context">
          <MapPin :size="14" />
          <span>{{ taskContext.label }}</span>
        </div>
        <el-tooltip content="通知与待办" placement="bottom">
          <el-button circle class="top-icon-btn" @click="router.push('/')">
            <Bell :size="16" />
            <span class="notice-dot" />
          </el-button>
        </el-tooltip>
        <el-dropdown trigger="click">
          <button class="user-chip">
            <span class="user-avatar">{{ appStore.user.name.slice(0, 1) }}</span>
            <span class="user-name">{{ appStore.user.name }}</span>
            <ChevronDown :size="14" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                {{ appStore.user.role === 'admin' ? '管理员' : '工程师' }} · {{ appStore.user.org }}
              </el-dropdown-item>
              <el-dropdown-item @click="router.push('/settings')">
                <Settings :size="14" /> 参数库与审计
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="body-area">
      <aside v-show="!collapsed" class="side-bar">
        <nav class="nav-list">
          <template v-for="group in navGroups" :key="group.label">
            <div class="nav-group">{{ group.label }}</div>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              :class="{ active: activePath === item.path }"
              :title="item.label"
            >
              <component :is="item.icon" :size="16" class="nav-icon" />
              <span>{{ item.label }}</span>
              <ChevronRight v-if="activePath === item.path" :size="14" class="nav-arrow" />
            </router-link>
          </template>
        </nav>
        <div class="side-foot">
          <Gauge :size="15" />
          <span>业务闭环：上传 → 识别 → 量化 → 决策</span>
        </div>
      </aside>

      <el-drawer v-model="drawerOpen" direction="ltr" size="248px" :with-header="false" class="nav-drawer">
        <nav class="nav-list mobile-nav">
          <template v-for="group in navGroups" :key="group.label">
            <div class="nav-group">{{ group.label }}</div>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              :class="{ active: activePath === item.path }"
              @click="drawerOpen = false"
            >
              <component :is="item.icon" :size="16" class="nav-icon" />
              <span>{{ item.label }}</span>
            </router-link>
          </template>
        </nav>
      </el-drawer>

      <main class="content-area">
        <div class="crumb-bar">
          <span class="crumb-text">{{ crumbParts.join(' / ') }}</span>
          <span v-if="appStore.user.role === 'admin'" class="role-chip">
            <ShieldCheck :size="13" /> 管理员
          </span>
        </div>
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-bar {
  height: 56px;
  flex: 0 0 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: #111827;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 20;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-mark {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #D97706, #16A34A);
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.brand-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 230px;
}

.top-search {
  flex: 1;
  max-width: 420px;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9CA3AF;
}

.top-search :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: none;
  border-radius: 6px;
}

.top-search :deep(.el-input__inner) {
  color: #fff;
  height: 30px;
}

.top-search :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.45);
}

.top-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.task-context {
  display: none;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 14px;
  background: rgba(217, 119, 6, 0.16);
  color: #FDBA74;
  font-size: 12px;
  white-space: nowrap;
}

.menu-btn,
.top-icon-btn {
  background: transparent;
  border: none;
  color: #D1D5DB;
  width: 32px;
  height: 32px;
  padding: 0;
}

.menu-btn:hover,
.top-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.mobile-menu {
  display: none;
  background: transparent;
  border: 0;
  color: #fff;
  cursor: pointer;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.notice-dot {
  position: absolute;
  right: 7px;
  top: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #DC2626;
  border: 1px solid #111827;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: inherit;
}

.user-chip:hover {
  background: rgba(255, 255, 255, 0.08);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #D97706;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.user-name {
  font-size: 13px;
  white-space: nowrap;
}

.body-area {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 56px);
}

.side-bar {
  width: 224px;
  flex: 0 0 224px;
  background: #1F2937;
  color: #D1D5DB;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  overflow-y: auto;
}

.nav-list {
  padding: 10px 10px 20px;
  flex: 1;
}

.nav-group {
  margin: 12px 8px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #8B93A0;
  letter-spacing: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  padding: 0 10px;
  border-radius: 6px;
  color: #C6CCD4;
  text-decoration: none;
  font-size: 13px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.nav-item.active {
  background: rgba(217, 119, 6, 0.18);
  color: #FCD9A5;
  font-weight: 600;
}

.nav-icon {
  flex: 0 0 auto;
}

.nav-arrow {
  margin-left: auto;
}

.side-foot {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 11px;
  color: #8B93A0;
}

.content-area {
  flex: 1;
  min-width: 0;
  padding: 0 16px 24px;
  max-width: 1440px;
  margin: 0 auto;
}

.crumb-bar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.crumb-text {
  font-size: 12px;
  color: #6B7280;
}

.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #0E7490;
}

.nav-drawer :deep(.el-drawer__body) {
  padding: 0;
  background: #1F2937;
}

.mobile-nav {
  padding-top: 18px;
  min-height: 100%;
}

.mobile-nav .nav-item {
  color: #E5E7EB;
}

@media (max-width: 900px) {
  .side-bar {
    display: none;
  }

  .menu-btn {
    display: none;
  }

  .mobile-menu {
    display: flex;
  }

  .brand-sub,
  .user-name {
    display: none;
  }

  .task-context {
    display: inline-flex;
  }

  .top-search {
    display: none;
  }
}
</style>
