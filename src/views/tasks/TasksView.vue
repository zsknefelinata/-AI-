<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Archive,
  CheckCircle2,
  CircleHelp,
  Eye,
  FileArchive,
  FolderPlus,
  ImagePlus,
  ListChecks,
  MapPin,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  UploadCloud
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tasksApi } from '@/api'
import { ROAD_SAMPLE_IMAGES, TASK_STATUS_META } from '@/constants/business'
import type { TaskCreatePayload, TaskDetail, TaskItem, TaskStatus } from '@/types'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusTag from '@/components/common/StatusTag.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const allTasks = ref<TaskItem[]>([])
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref<[string, string] | ''>('')
const selection = ref<TaskItem[]>([])
const createOpen = ref(false)
const detailOpen = ref(false)
const detail = ref<TaskDetail | null>(null)
const detailLoading = ref(false)
const uploadPicking = ref(false)
const uploadFiles = ref<{ name: string; size: string; progress: number; status: 'waiting' | 'done' | 'error' }[]>([])
const uploadProgress = ref(0)
const showUploader = ref(true)

const form = reactive<TaskCreatePayload>({
  name: '',
  road: '',
  roadLevel: '县道',
  county: '',
  equipment: '行车记录仪',
  note: ''
})

const roadLevels = ['国道', '省道', '县道', '乡道']
const counties = ['城关街道', '石桥镇', '杨河乡', '北坡镇', '红岩镇', '柳湾镇', '新店乡', '白水街道']

const filteredTasks = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return allTasks.value.filter((task) => {
    const matchesText = !q || task.id.toLowerCase().includes(q) || task.road.toLowerCase().includes(q) || task.name.toLowerCase().includes(q)
    const matchesStatus = !statusFilter.value || task.status === statusFilter.value
    const day = task.updatedAt.slice(0, 10)
    let matchesDate = true
    if (dateRange.value) {
      matchesDate = day >= dateRange.value[0] && day <= dateRange.value[1]
    }
    return matchesText && matchesStatus && matchesDate
  })
})

const canBatch = computed(() => {
  const statuses = new Set(selection.value.map((item) => item.status))
  return statuses.size === 1 && selection.value.length > 0
})

const statusOptions = Object.entries(TASK_STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))

const statusMeta = (status: TaskStatus) => TASK_STATUS_META[status]
const rowStatus = (value: unknown): TaskStatus => value as TaskStatus

const loadTasks = async () => {
  loading.value = true
  try {
    allTasks.value = await tasksApi.list()
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  createOpen.value = true
}

const resetForm = () => {
  form.name = ''
  form.road = ''
  form.roadLevel = '县道'
  form.county = ''
  form.equipment = '行车记录仪'
  form.note = ''
}

const createTask = async () => {
  if (!form.name.trim() || !form.road.trim() || !form.county.trim()) return
  const created = await tasksApi.create({
    ...form,
    name: form.name.trim(),
    road: form.road.trim(),
    county: form.county.trim()
  })
  allTasks.value.unshift(created)
  resetForm()
  createOpen.value = false
  ElMessage.success(`任务 ${created.id} 创建成功，请上传巡检影像`)
}

const openDetail = async (id: string) => {
  detailOpen.value = true
  detailLoading.value = true
  try {
    detail.value = await tasksApi.detail(id)
  } finally {
    detailLoading.value = false
  }
}

const pickUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = 'image/*,.zip,.rar,.7z'
  input.onchange = () => {
    if (input.files?.length) simulateUpload(Array.from(input.files))
  }
  input.click()
}

const onDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files?.length) simulateUpload(Array.from(files))
}

const simulateUpload = (files: File[]) => {
  uploadPicking.value = true
  const list: { name: string; size: string; progress: number; status: 'waiting' | 'done' | 'error' }[] = files.map((file) => ({
    name: file.name,
    size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    progress: 0,
    status: 'waiting' as const
  }))
  uploadFiles.value = list
  uploadProgress.value = 0
  let doneCount = 0
  list.forEach((item) => {
    const timer = window.setInterval(() => {
      item.progress = Math.min(100, item.progress + 12 + Math.floor(Math.random() * 18))
      uploadProgress.value = Math.round(list.reduce((sum, row) => sum + row.progress, 0) / list.length)
      if (item.progress >= 100) {
        window.clearInterval(timer)
        item.status = 'done'
        doneCount += 1
        if (doneCount === list.length) {
          uploadPicking.value = false
          if (allTasks.value[0]) {
            const target = allTasks.value[0]
            target.imageCount += list.length
            target.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
            ElMessage.success(`已上传 ${list.length} 个文件，可开始识别`)
          }
        }
      }
    }, 160)
  })
}

const batchAction = async (action: 'start' | 'fail' | 'archive') => {
  const ids = selection.value.map((item) => item.id)
  const labels: Record<string, string> = { start: '开始识别', fail: '标记异常', archive: '归档' }
  if (action === 'archive') {
    try {
      await ElMessageBox.confirm(`确认归档选中的 ${ids.length} 个任务？归档后仍保留全部审计记录。`, '归档确认', { type: 'warning' })
    } catch {
      return
    }
  }
  await tasksApi.batch(action, ids)
  const map: Record<string, TaskItem['status']> = { start: 'recognizing', fail: 'failed', archive: 'completed' }
  allTasks.value.forEach((task) => {
    if (ids.includes(task.id)) {
      task.status = map[action]
      task.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
  })
  selection.value = []
  ElMessage.success(`${labels[action]}已完成`)
}

const startUploadedRecognition = async () => {
  if (!allTasks.value[0] || allTasks.value[0].imageCount === 0) return
  const task = allTasks.value[0]
  await tasksApi.upload(task.id, task.imageCount)
  task.status = 'recognizing'
  task.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  ElMessage.success('识别任务已进入队列')
}

const taskRowClass = ({ row }: { row: TaskItem }) => (row.status === 'failed' ? 'failed-row' : '')

watch(
  () => route.query,
  () => {
    if (route.query.new === '1') openCreate()
    if (typeof route.query.q === 'string') keyword.value = route.query.q
    if (typeof route.query.status === 'string') statusFilter.value = route.query.status
    if (typeof route.query.taskId === 'string') openDetail(route.query.taskId)
  },
  { immediate: true }
)

onMounted(loadTasks)
</script>

<template>
  <div class="page">
    <PageHeader title="任务管理" subtitle="建任务、传影像、看识别进度，并管理任务状态流转">
      <template #actions>
        <el-button @click="loadTasks"><RefreshCcw :size="15" /> 刷新</el-button>
        <el-button type="primary" @click="openCreate"><FolderPlus :size="15" /> 新建任务</el-button>
      </template>
    </PageHeader>

    <section v-if="showUploader" class="panel">
      <div class="panel-header">
        批量上传
        <span class="panel-extra">支持 jpg / png 影像与 zip / rar 压缩包</span>
      </div>
      <div class="panel-body upload-area">
        <div v-if="!uploadFiles.length" class="upload-drop" @dragover.prevent @drop.prevent="onDrop" @click="pickUpload">
          <UploadCloud :size="30" color="#D97706" />
          <div class="upload-title">拖拽影像或压缩包到此处，或点击选择文件</div>
          <div class="upload-sub">上传完成后默认挂到最新任务，可一键开始识别</div>
        </div>
        <template v-else>
          <div class="upload-list">
            <div v-for="(file, index) in uploadFiles" :key="index" class="upload-item">
              <ImagePlus v-if="file.status === 'done'" :size="16" color="#16A34A" />
              <FileArchive v-else :size="16" color="#D97706" />
              <span class="upload-name">{{ file.name }}</span>
              <span class="upload-size">{{ file.size }}</span>
              <span v-if="file.status === 'error'" class="upload-fail">格式不支持</span>
              <el-progress v-else :percentage="file.progress" :stroke-width="6" style="width: 180px" />
            </div>
          </div>
          <div class="upload-actions">
            <span class="upload-total">上传进度 {{ uploadProgress }}%</span>
            <el-button @click="uploadFiles = []; uploadProgress = 0"><RotateCcw :size="14" /> 清空列表</el-button>
            <el-button type="primary" :disabled="uploadPicking || uploadProgress < 100" @click="startUploadedRecognition">
              <Play :size="14" /> 开始识别
            </el-button>
          </div>
        </template>
      </div>
    </section>

    <section class="panel">
      <div class="toolbar table-toolbar">
        <el-input v-model="keyword" placeholder="搜索任务号 / 路段 / 任务名" clearable style="width: 240px">
          <template #prefix><Search :size="14" /></template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 140px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 250px" />
        <div class="toolbar-spacer" />
        <template v-if="selection.length">
          <span class="select-count">已选 {{ selection.length }} 项</span>
          <el-button :disabled="!canBatch || selection[0].status !== 'pending'" @click="batchAction('start')"><Play :size="14" /> 开始识别</el-button>
          <el-button :disabled="!canBatch" @click="batchAction('fail')"><CircleHelp :size="14" /> 标记异常</el-button>
          <el-button :disabled="!canBatch" @click="batchAction('archive')"><Archive :size="14" /> 归档</el-button>
        </template>
        <el-button @click="showUploader = !showUploader"><ListChecks :size="14" /> {{ showUploader ? '收起上传区' : '显示上传区' }}</el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="filteredTasks"
        style="width: 100%"
        :row-class-name="taskRowClass"
        @selection-change="selection = $event"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column prop="id" label="任务号" min-width="158" fixed="left" />
        <el-table-column label="路段" min-width="210" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="road-cell">
              <MapPin :size="13" color="#6B7280" />
              <div>
                <div class="road-name">{{ row.road }}</div>
                <div class="road-sub">{{ row.name }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="county" label="区县" width="100" />
        <el-table-column prop="imageCount" label="图片数" width="78" align="right" />
        <el-table-column prop="diseaseCount" label="病害数" width="78" align="right" />
        <el-table-column label="识别状态" width="102">
          <template #default="{ row }">
            <StatusTag :status="rowStatus(row.status)" :label="statusMeta(rowStatus(row.status)).label" :color="statusMeta(rowStatus(row.status)).color" />
          </template>
        </el-table-column>
        <el-table-column prop="equipment" label="设备" width="106" />
        <el-table-column prop="updatedAt" label="更新时间" width="152" />
        <el-table-column label="操作" width="118" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)"><Eye :size="13" /> 详情</el-button>
            <el-button v-if="row.status === 'reviewing'" link type="primary" @click="router.push(`/measure/${row.id}`)">量化</el-button>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState
        v-if="!loading && !filteredTasks.length"
        icon="list"
        title="没有符合条件的任务"
        description="可调整搜索条件，或新建一个巡检任务开始业务闭环。"
      >
        <el-button type="primary" @click="openCreate">新建任务</el-button>
      </EmptyState>
    </section>

    <el-drawer v-model="createOpen" title="新建巡检任务" size="460px">
      <el-form label-position="top" :model="form">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.name" placeholder="例如：S301 城区段专项巡检" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="路段编号" required>
          <el-input v-model="form.road" placeholder="例如：S301 K12+000-K12+800" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="道路等级">
            <el-select v-model="form.roadLevel" style="width: 100%">
              <el-option v-for="level in roadLevels" :key="level" :label="level" :value="level" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属区县" required>
            <el-select v-model="form.county" filterable allow-create style="width: 100%" placeholder="选择或输入">
              <el-option v-for="county in counties" :key="county" :label="county" :value="county" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="拍摄设备">
          <el-select v-model="form.equipment" style="width: 100%">
            <el-option label="行车记录仪" value="行车记录仪" />
            <el-option label="手机" value="手机" />
            <el-option label="车载专业相机" value="车载专业相机" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="3" placeholder="采集条件、补拍说明或重点关注病害" maxlength="120" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :disabled="!form.name.trim() || !form.road.trim() || !form.county.trim()" @click="createTask">
          <CheckCircle2 :size="15" /> 创建并上传影像
        </el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="detailOpen" title="任务详情" size="560px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <div class="detail-head">
            <div>
              <div class="detail-id">{{ detail.id }}</div>
              <div class="detail-name">{{ detail.name }}</div>
            </div>
            <StatusTag :status="detail.status" :label="statusMeta(detail.status).label" :color="statusMeta(detail.status).color" />
          </div>
          <el-descriptions :column="2" border size="small" class="detail-desc">
            <el-descriptions-item label="路段">{{ detail.road }}</el-descriptions-item>
            <el-descriptions-item label="道路等级">{{ detail.roadLevel }}</el-descriptions-item>
            <el-descriptions-item label="区县">{{ detail.county }}</el-descriptions-item>
            <el-descriptions-item label="设备">{{ detail.equipment }}</el-descriptions-item>
            <el-descriptions-item label="影像 / 病害">{{ detail.imageCount }} 张 / {{ detail.diseaseCount }} 处</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detail.createdAt }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="detail.note" class="note-box">{{ detail.note }}</div>
          <div class="detail-section-title">影像缩略图 <span>{{ detail.imageCount }} 张</span></div>
          <div class="thumb-grid">
            <div v-for="(image, index) in ROAD_SAMPLE_IMAGES" :key="image" class="thumb-item">
              <img :src="image" :alt="`影像 ${index + 1}`" />
              <span>IMG_{{ String(index + 1).padStart(3, '0') }}.jpg</span>
            </div>
            <div v-if="detail.imageCount > ROAD_SAMPLE_IMAGES.length" class="thumb-more">+{{ detail.imageCount - ROAD_SAMPLE_IMAGES.length }}</div>
          </div>
          <div class="detail-section-title">状态流转记录</div>
          <el-timeline class="flow-timeline">
            <el-timeline-item
              v-for="flow in detail.flows"
              :key="`${flow.time}-${flow.event}`"
              :timestamp="`${flow.time} · ${flow.operator}`"
              placement="top"
            >
              <div class="flow-event">{{ flow.event }}</div>
              <div class="flow-desc">{{ flow.description }}</div>
            </el-timeline-item>
          </el-timeline>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailOpen = false">关闭</el-button>
        <el-button
          v-if="detail"
          type="primary"
          @click="detail.status === 'reviewing' ? router.push(`/measure/${detail.id}`) : router.push('/recognition')"
        >
          {{ detail.status === 'reviewing' ? '进入量化评估' : '进入智能识别' }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.upload-drop {
  border: 1px dashed #D6B36B;
  border-radius: 8px;
  background: #FFFDF7;
  min-height: 132px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  text-align: center;
  padding: 18px;
}

.upload-drop:hover {
  border-color: #D97706;
  background: #FDF6E8;
}

.upload-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.upload-sub {
  font-size: 12px;
  color: #6B7280;
}

.upload-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 190px;
  overflow-y: auto;
}

.upload-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.upload-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.upload-size {
  color: #9CA3AF;
  font-size: 12px;
  width: 70px;
  text-align: right;
}

.upload-fail {
  color: #DC2626;
  font-size: 12px;
}

.upload-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.upload-total {
  margin-right: auto;
  color: #6B7280;
  font-size: 13px;
}

.table-toolbar {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.select-count {
  font-size: 13px;
  color: #2563EB;
  font-weight: 500;
}

.road-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.road-name {
  font-weight: 600;
  color: #1F2937;
  line-height: 1.3;
}

.road-sub {
  color: #9CA3AF;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

:deep(.failed-row) {
  background: #FEF2F2;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-body {
  min-height: 200px;
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.detail-id {
  font-size: 18px;
  font-weight: 700;
}

.detail-name {
  color: #6B7280;
  margin-top: 3px;
}

.detail-desc {
  width: 100%;
}

.note-box {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #FFF7ED;
  color: #9A5B0B;
  font-size: 12px;
}

.detail-section-title {
  margin: 18px 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.detail-section-title span {
  color: #9CA3AF;
  font-size: 12px;
  font-weight: 400;
  margin-left: 6px;
}

.thumb-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.thumb-item {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-item span {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 3px 4px;
  background: rgba(17, 24, 39, 0.72);
  color: #fff;
  font-size: 10px;
  text-align: center;
}

.thumb-more {
  border: 1px dashed #C9CDD2;
  border-radius: 6px;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  font-size: 18px;
  font-weight: 600;
}

.flow-timeline {
  padding-left: 4px;
}

.flow-event {
  font-weight: 600;
  font-size: 13px;
}

.flow-desc {
  color: #6B7280;
  font-size: 12px;
  margin-top: 2px;
}

@media (max-width: 900px) {
  .thumb-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
