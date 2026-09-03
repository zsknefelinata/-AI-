<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Download,
  FileDown,
  FileText,
  FolderKanban,
  Layers,
  Leaf,
  Play,
  RefreshCcw,
  ScrollText,
  Sparkles
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reportsApi, tasksApi } from '@/api'
import type { ReportHistory, ReportJob, ReportTemplate, ReportTemplateType, TaskItem } from '@/types'
import { downloadMockFile } from '@/utils/format'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()
const loading = ref(true)
const templates = ref<ReportTemplate[]>([])
const queue = ref<ReportJob[]>([])
const history = ref<ReportHistory[]>([])
const tasks = ref<TaskItem[]>([])
const generateOpen = ref(false)
const selectedTemplate = ref<ReportTemplate | null>(null)
const scope = ref<'single' | 'multi' | 'project'>('single')
const scopeTaskId = ref('')
const generating = ref(false)

const templateMeta: Record<ReportTemplateType, { icon: typeof FileText; color: string }> = {
  inspection: { icon: FileText, color: '#2563EB' },
  maintenance: { icon: Leaf, color: '#16A34A' },
  summary: { icon: Layers, color: '#D97706' }
}

const templateLabel: Record<ReportTemplateType, string> = {
  inspection: '巡检',
  maintenance: '低碳养护',
  summary: '总结'
}

const loadAll = async () => {
  loading.value = true
  try {
    const [templateData, queueData, historyData, taskData] = await Promise.all([
      reportsApi.templates(),
      reportsApi.queue(),
      reportsApi.history(),
      tasksApi.list()
    ])
    templates.value = templateData
    queue.value = queueData
    history.value = historyData
    tasks.value = taskData
  } finally {
    loading.value = false
  }
}

const openGenerate = (template: ReportTemplate) => {
  selectedTemplate.value = template
  scope.value = 'single'
  scopeTaskId.value = typeof route.query.taskId === 'string' ? route.query.taskId : tasks.value[0]?.id || ''
  generateOpen.value = true
}

const generate = async () => {
  if (!selectedTemplate.value || !scopeTaskId.value) {
    ElMessage.warning('请先选择报告生成范围对应的任务')
    return
  }
  generating.value = true
  try {
    const job = await reportsApi.generate({
      templateId: selectedTemplate.value.id,
      templateType: selectedTemplate.value.type,
      scope: scope.value,
      taskId: scope.value === 'project' ? undefined : scopeTaskId.value
    })
    queue.value.unshift(job)
    generateOpen.value = false
    ElMessage.success('报告已进入生成队列')
    advanceJob(job.id)
  } finally {
    generating.value = false
  }
}

const advanceJob = (jobId: string) => {
  const timer = window.setInterval(() => {
    const job = queue.value.find((item) => item.id === jobId)
    if (!job) {
      window.clearInterval(timer)
      return
    }
    if (job.status === 'done' || job.status === 'failed') {
      window.clearInterval(timer)
      return
    }
    job.progress = Math.min(100, job.progress + 8)
    if (job.progress >= 100) {
      window.clearInterval(timer)
      job.status = 'done'
      job.finishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
      history.value.unshift({
        id: `RPT-${Date.now()}`,
        name: `${job.templateName}（${job.taskId}）`,
        scope: scope.value === 'project' ? '全项目' : '单任务',
        taskId: job.taskId,
        templateType: job.templateType,
        creator: '李工',
        version: 'V1.0',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`
      })
      ElMessage.success(`${job.templateName} 生成完成`)
    }
  }, 700)
}

const downloadReport = async (item: ReportHistory, format: 'pdf' | 'word') => {
  try {
    await ElMessageBox.confirm(
      `下载 ${item.name}（${format === 'pdf' ? 'PDF' : 'Word'}）？Word 文件包含参数明细与排放因子来源表。`,
      '确认下载',
      { type: 'info' }
    )
  } catch {
    return
  }
  const extension = format === 'pdf' ? 'pdf' : 'docx'
  downloadMockFile(
    `${item.name}.${extension}`,
    `【模拟文件】${item.name}\n版本：${item.version}\n来源任务：${item.taskId || '全项目'}\n生成人：${item.creator}\n生成时间：${item.createdAt}\n包含参数明细与排放因子来源表（Word 保留）`,
    format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
  ElMessage.success(`已开始下载 ${item.name}.${extension}`)
}

const queueStatus = (job: ReportJob) => {
  if (job.status === 'done') return { label: '已完成', color: '#16A34A' }
  if (job.status === 'failed') return { label: '失败', color: '#DC2626' }
  if (job.status === 'generating') return { label: '生成中', color: '#2563EB' }
  return { label: '等待中', color: '#6B7280' }
}

const taskLabel = (taskId?: string) => {
  if (!taskId) return '全项目'
  const task = tasks.value.find((item) => item.id === taskId)
  return task ? `${task.id} · ${task.road}` : taskId
}

onMounted(async () => {
  await loadAll()
  if (route.query.generate === '1') {
    const maintenance = templates.value.find((item) => item.type === 'maintenance')
    if (maintenance) openGenerate(maintenance)
  }
})
</script>

<template>
  <div class="page">
    <PageHeader title="报告中心" subtitle="选择模板与报告范围，跟踪生成队列，按审计要求追溯参数版本">
      <template #actions>
        <el-button @click="loadAll"><RefreshCcw :size="15" /> 刷新队列</el-button>
      </template>
    </PageHeader>

    <el-skeleton v-if="loading" :rows="7" animated />

    <template v-else>
      <section class="panel">
        <div class="panel-header">报告模板<span class="panel-extra">Word 版本保留参数明细与排放因子来源表</span></div>
        <div class="panel-body template-grid">
          <article v-for="template in templates" :key="template.id" class="template-card" @click="openGenerate(template)">
            <div class="template-icon" :style="{ color: templateMeta[template.type].color, background: templateMeta[template.type].color + '12' }">
              <component :is="templateMeta[template.type].icon" :size="21" />
            </div>
            <div class="template-main">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
              <div class="template-meta">
                <span class="format-chip">PDF</span>
                <span class="format-chip">Word</span>
                <span class="update-at">更新于 {{ template.updatedAt }}</span>
              </div>
            </div>
            <el-button class="template-action" type="primary" plain @click.stop="openGenerate(template)">
              <FileDown :size="14" /> 生成报告
            </el-button>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          生成队列
          <span class="panel-extra">共 {{ queue.length }} 个任务</span>
        </div>
        <el-table v-if="queue.length" :data="queue" style="width: 100%">
          <el-table-column prop="id" label="队列编号" width="150" />
          <el-table-column prop="templateName" label="模板" min-width="160" />
          <el-table-column prop="taskId" label="来源任务" min-width="170" />
          <el-table-column label="生成状态" width="120">
            <template #default="{ row }">
              <span class="queue-status" :style="{ color: queueStatus(row).color, background: queueStatus(row).color + '14' }">
                {{ queueStatus(row).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="进度" min-width="150">
            <template #default="{ row }">
              <el-progress
                v-if="row.status === 'generating'"
                :percentage="row.progress"
                :stroke-width="6"
                :indeterminate="true"
              />
              <span v-else class="progress-text">{{ row.status === 'done' ? '100%' : row.status === 'failed' ? '失败' : '排队中' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="startedAt" label="开始时间" width="150" />
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'done'" link type="primary" @click="downloadReport({ ...row, name: row.templateName, scope: '单任务', templateType: row.templateType, creator: '李工', version: 'V1.0', createdAt: row.finishedAt || row.startedAt, size: '1.2 MB' }, 'pdf')">
                <Download :size="13" /> 下载
              </el-button>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
        </el-table>
        <EmptyState v-else icon="file" title="暂无生成任务" description="选择一个模板开始生成，结果会出现在这里。">
          <el-button type="primary" @click="templates[0] && openGenerate(templates[0])">开始生成</el-button>
        </EmptyState>
      </section>

      <section class="panel">
        <div class="panel-header">历史记录<span class="panel-extra">报告下载、参数版本与生成人均可追溯</span></div>
        <el-table :data="history" style="width: 100%">
          <el-table-column prop="name" label="报告名称" min-width="230" />
          <el-table-column label="来源任务" min-width="210">
            <template #default="{ row }">{{ taskLabel(row.taskId) }}</template>
          </el-table-column>
          <el-table-column label="范围" width="90" align="center">
            <template #default="{ row }">
              <span v-if="row.scope === '全项目'" class="scope-chip project"><FolderKanban :size="12" /> 全项目</span>
              <span v-else class="scope-chip">{{ row.scope }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="version" label="参数版本" width="90" align="center" />
          <el-table-column prop="creator" label="生成人" width="90" />
          <el-table-column prop="createdAt" label="生成时间" width="150" />
          <el-table-column prop="size" label="大小" width="90" align="right" />
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-tooltip content="下载 PDF" placement="top">
                <el-button circle size="small" @click="downloadReport(row, 'pdf')"><FileText :size="14" /></el-button>
              </el-tooltip>
              <el-tooltip content="下载 Word（含来源表）" placement="top">
                <el-button circle size="small" @click="downloadReport(row, 'word')"><ScrollText :size="14" /></el-button>
              </el-tooltip>
              <el-button link type="primary" @click="downloadReport(row, 'pdf')">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>

    <el-dialog v-model="generateOpen" title="生成报告" width="520px">
      <template v-if="selectedTemplate">
        <div class="dialog-template">
          <span class="dialog-type" :style="{ color: templateMeta[selectedTemplate.type].color }">
            {{ templateLabel[selectedTemplate.type] }}模板
          </span>
          <strong>{{ selectedTemplate.name }}</strong>
          <p>{{ selectedTemplate.description }}</p>
        </div>
        <el-form label-position="top">
          <el-form-item label="报告范围" required>
            <el-segmented
              v-model="scope"
              :options="[
                { label: '单任务', value: 'single' },
                { label: '多任务合并', value: 'multi' },
                { label: '全项目', value: 'project' }
              ]"
            />
          </el-form-item>
          <el-form-item v-if="scope !== 'project'" label="选择任务" required>
            <el-select v-model="scopeTaskId" filterable style="width: 100%">
              <el-option v-for="task in tasks" :key="task.id" :label="`${task.id} · ${task.road}`" :value="task.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-else label="汇总范围">
            <div class="project-summary"><FolderKanban :size="15" color="#D97706" /> 汇总当前全部任务，自动包含参数版本审计块</div>
          </el-form-item>
          <div class="audit-block">
            <Sparkles :size="14" />
            Word 输出将保留：材料参数、机械台班、排放因子来源与人工修正记录。
          </div>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="generateOpen = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="generate"><Play :size="14" /> 加入生成队列</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.template-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.template-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.template-card:hover {
  border-color: #B9BDC2;
  box-shadow: 0 3px 10px rgba(31, 41, 55, 0.05);
}

.template-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-main {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-weight: 600;
}

.template-desc {
  color: #6B7280;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 5px;
  min-height: 36px;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.format-chip {
  font-size: 11px;
  color: #0E7490;
  background: #ECFEFF;
  border-radius: 9px;
  padding: 2px 7px;
}

.update-at {
  color: #9CA3AF;
  font-size: 11px;
  margin-left: auto;
}

.template-action {
  align-self: flex-end;
}

.queue-status {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 11px;
  font-size: 12px;
}

.progress-text,
.muted {
  color: #9CA3AF;
  font-size: 12px;
}

.scope-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #0E7490;
  background: #ECFEFF;
  border-radius: 10px;
  padding: 2px 8px;
}

.scope-chip.project {
  color: #D97706;
  background: #FFF7ED;
}

.dialog-template {
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
}

.dialog-type {
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
}

.dialog-template p {
  color: #6B7280;
  font-size: 12px;
  margin: 6px 0 0;
}

.project-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #FFF7ED;
  color: #92400E;
  border-radius: 6px;
  font-size: 13px;
}

.audit-block {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #6B7280;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 6px;
  font-size: 12px;
  padding: 8px 10px;
  line-height: 1.5;
}

.audit-block svg {
  flex: 0 0 auto;
  color: #16A34A;
  margin-top: 1px;
}

@media (max-width: 1100px) {
  .template-grid {
    grid-template-columns: 1fr;
  }
}
</style>
