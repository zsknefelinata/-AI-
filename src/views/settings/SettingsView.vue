<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCircle2,
  Cpu,
  Database,
  FileClock,
  History,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Wrench
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { settingsApi } from '@/api'
import { DISEASE_LABELS } from '@/constants/business'
import type { AuditLog, DiseaseType, EmissionFactor, ModelVersion, ProcessItem } from '@/types'
import { useAppStore } from '@/stores/app'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const appStore = useAppStore()
const loading = ref(true)
const activeTab = ref('process')
const processes = ref<ProcessItem[]>([])
const emissions = ref<EmissionFactor[]>([])
const models = ref<ModelVersion[]>([])
const auditLogs = ref<AuditLog[]>([])
const savingId = ref('')
const logModule = ref('')

const auditModules = ['任务管理', '智能识别', '量化评估', '低碳决策', '报告中心', '参数库']

const allAuditLogs = computed(() => {
  const local = appStore.auditLogs
  const merged = [...local, ...auditLogs.value].sort((a, b) => (a.time < b.time ? 1 : -1))
  if (logModule.value) return merged.filter((item) => item.module === logModule.value)
  return merged
})

const loadAll = async () => {
  loading.value = true
  try {
    const [processData, emissionData, modelData, auditData] = await Promise.all([
      settingsApi.processes(),
      settingsApi.emissions(),
      settingsApi.models(),
      settingsApi.auditLogs()
    ])
    processes.value = processData
    emissions.value = emissionData
    models.value = modelData
    auditLogs.value = auditData
  } finally {
    loading.value = false
  }
}

const editProcess = (item: ProcessItem) => {
  savingId.value = item.id
  appStore.addAuditLog('参数库', '编辑工艺', item.name, `进入编辑：${item.name}`)
}

const saveProcess = async (item: ProcessItem) => {
  await settingsApi.saveProcess({ ...item })
  appStore.addAuditLog('参数库', '保存工艺', item.name, `更新 ${item.name} 材料单耗与费用模板`)
  savingId.value = ''
  ElMessage.success(`工艺 ${item.name} 已保存`)
}

const editEmission = (item: EmissionFactor) => {
  savingId.value = item.id
  appStore.addAuditLog('参数库', '编辑因子', item.name, `进入编辑：${item.name}`)
}

const saveEmission = async (item: EmissionFactor) => {
  const confirmed = await ElMessageBox.confirm(
    `保存后 ${item.name} 的排放因子将更新为 ${item.value} ${item.unit}，后续所有报告会按新版本重算。`,
    '覆盖参数确认',
    { type: 'warning', confirmButtonText: '确认覆盖', cancelButtonText: '取消' }
  ).catch(() => null)
  if (!confirmed) return
  await settingsApi.saveEmission({ ...item, version: `2026.${new Date().getMonth() + 1}` })
  appStore.addAuditLog('参数库', '覆盖因子', item.name, `排放因子更新为 ${item.value} ${item.unit}`)
  savingId.value = ''
  ElMessage.success(`排放因子 ${item.name} 已保存并写入修改记录`)
}

const setActiveModel = async (model: ModelVersion) => {
  try {
    await ElMessageBox.confirm(
      `将 ${model.name} ${model.version} 设为生产模型？切换后新任务识别全部使用该版本。`,
      '切换模型版本',
      { type: 'warning' }
    )
  } catch {
    return
  }
  models.value.forEach((item) => {
    if (item.status === 'active') item.status = 'archived'
  })
  model.status = 'active'
  appStore.addAuditLog('参数库', '切换模型', model.name, `生产模型切换至 ${model.name} ${model.version}`)
  ElMessage.success(`已切换至 ${model.name} ${model.version}`)
}

const addEmission = () => {
  emissions.value.unshift({
    id: `EF-${Date.now().toString().slice(-6)}`,
    name: '',
    value: 0,
    unit: 't CO2e/t',
    source: '待录入',
    year: 2026,
    region: '全国',
    version: '2026.1',
    updatedAt: new Date().toISOString().slice(0, 10)
  })
}

const formatGrade = (grades: string[]) => grades.join(' / ') || '-'
const diseaseLabel = (type: DiseaseType) => DISEASE_LABELS[type]

onMounted(loadAll)
</script>

<template>
  <div class="page settings-page">
    <PageHeader title="系统设置" subtitle="参数库、模型版本与审计日志，仅管理员可维护">
      <template #actions>
        <span class="admin-chip"><ShieldCheck :size="14" /> {{ appStore.user.role === 'admin' ? '管理员模式' : '只读模式' }}</span>
        <el-button @click="loadAll"><RefreshCcw :size="15" /> 刷新</el-button>
      </template>
    </PageHeader>

    <el-skeleton v-if="loading" :rows="7" animated />

    <template v-else>
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane name="process">
          <template #label><span class="tab-label"><Wrench :size="15" /> 养护工艺库</span></template>
          <section class="panel">
            <div class="panel-header">
              工艺参数
              <span class="panel-extra">适用病害 / 等级 / 材料单耗 / 费用模板</span>
            </div>
            <el-table :data="processes" style="width: 100%">
              <el-table-column prop="name" label="工艺名称" width="160" fixed="left" />
              <el-table-column label="适用病害" min-width="200">
                <template #default="{ row }">
                  <span class="tag-list">
                    <span v-for="type in row.diseaseTypes" :key="type" class="disease-tag">{{ diseaseLabel(type) }}</span>
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="适用等级" width="130">
                <template #default="{ row }">{{ formatGrade(row.grades) }}</template>
              </el-table-column>
              <el-table-column label="材料单耗 (元/㎡)" width="140" align="right">
                <template #default="{ row }">
                  <el-input-number v-if="savingId === row.id" v-model="row.materialCost" :min="0" :step="1" size="small" style="width: 120px" />
                  <span v-else>{{ row.materialCost }}</span>
                </template>
              </el-table-column>
              <el-table-column label="机械台班 (h)" width="120" align="right">
                <template #default="{ row }">
                  <el-input-number v-if="savingId === row.id" v-model="row.machineryHours" :min="0" :step="0.1" size="small" style="width: 110px" />
                  <span v-else>{{ row.machineryHours }}</span>
                </template>
              </el-table-column>
              <el-table-column label="单价 (元/㎡)" width="120" align="right">
                <template #default="{ row }">
                  <el-input-number v-if="savingId === row.id" v-model="row.costPerSqm" :min="0" :step="1" size="small" style="width: 110px" />
                  <span v-else>{{ row.costPerSqm }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="serviceYears" label="服务期 (年)" width="100" align="center" />
              <el-table-column prop="updatedAt" label="更新时间" width="110" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="savingId === row.id" link type="success" @click="saveProcess(row)"><Save :size="13" /> 保存</el-button>
                  <el-button v-else link type="primary" @click="editProcess(row)"><SlidersHorizontal :size="13" /> 编辑</el-button>
                  <el-button v-if="savingId === row.id" link @click="savingId = ''">取消</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </el-tab-pane>

        <el-tab-pane name="emission">
          <template #label><span class="tab-label"><Database :size="15" /> 排放因子库</span></template>
          <section class="panel">
            <div class="panel-header">
              排放因子
              <span class="panel-extra">覆盖参数需二次确认，并写入修改记录</span>
              <el-button type="primary" plain size="small" @click="addEmission"><Plus :size="14" /> 新增因子</el-button>
            </div>
            <el-table :data="emissions" style="width: 100%">
              <el-table-column prop="name" label="因子名称" width="190" fixed="left">
                <template #default="{ row }">
                  <el-input v-if="!row.name" v-model="row.name" placeholder="因子名称" size="small" />
                  <span v-else>{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数值" width="140">
                <template #default="{ row }">
                  <el-input-number v-if="savingId === row.id || !row.name" v-model="row.value" :min="0" :step="0.001" size="small" style="width: 130px" />
                  <span v-else>{{ row.value }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="130" />
              <el-table-column prop="source" label="来源" min-width="180" show-overflow-tooltip />
              <el-table-column prop="year" label="年份" width="80" align="center" />
              <el-table-column prop="region" label="地区" width="90" />
              <el-table-column prop="version" label="版本" width="90" align="center" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="savingId === row.id" link type="success" @click="saveEmission(row)"><CheckCircle2 :size="13" /> 确认覆盖</el-button>
                  <el-button v-else link type="primary" @click="editEmission(row)"><SlidersHorizontal :size="13" /> 编辑</el-button>
                  <el-button v-if="savingId === row.id" link @click="savingId = ''">取消</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </el-tab-pane>

        <el-tab-pane name="model">
          <template #label><span class="tab-label"><Cpu :size="15" /> 模型版本</span></template>
          <section class="panel">
            <div class="panel-header">分割模型管理<span class="panel-extra">新任务自动使用 active 版本</span></div>
            <el-table :data="models" style="width: 100%">
              <el-table-column prop="name" label="模型名称" min-width="180" />
              <el-table-column prop="version" label="版本" width="90" align="center" />
              <el-table-column label="mAP@50" width="100" align="right">
                <template #default="{ row }">{{ row.mAp50.toFixed(3) }}</template>
              </el-table-column>
              <el-table-column label="mIoU" width="100" align="right">
                <template #default="{ row }">{{ row.mIoU.toFixed(3) }}</template>
              </el-table-column>
              <el-table-column prop="sizeMb" label="大小 (MB)" width="100" align="right" />
              <el-table-column prop="latency" label="推理 (ms)" width="100" align="right" />
              <el-table-column prop="createdAt" label="创建时间" width="120" />
              <el-table-column label="状态" width="110" align="center">
                <template #default="{ row }">
                  <span class="model-status" :class="row.status">
                    {{ row.status === 'active' ? '生产中' : row.status === 'training' ? '训练中' : '已归档' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="row.status === 'active'" link disabled><CheckCircle2 :size="13" /> 使用中</el-button>
                  <el-button v-else link type="primary" @click="setActiveModel(row)">设为生产</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </el-tab-pane>

        <el-tab-pane name="audit">
          <template #label><span class="tab-label"><History :size="15" /> 审计日志</span></template>
          <section class="panel">
            <div class="panel-header">
              操作流水
              <el-select v-model="logModule" placeholder="全部模块" clearable style="width: 160px" size="small">
                <el-option v-for="module in auditModules" :key="module" :label="module" :value="module" />
              </el-select>
            </div>
            <el-table v-if="allAuditLogs.length" :data="allAuditLogs" style="width: 100%">
              <el-table-column prop="time" label="时间" width="170" />
              <el-table-column prop="module" label="模块" width="120">
                <template #default="{ row }">
                  <span class="module-chip"><FileClock :size="12" /> {{ row.module }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="action" label="动作" width="120" />
              <el-table-column prop="target" label="对象" width="180" show-overflow-tooltip />
              <el-table-column prop="operator" label="操作人" width="100" />
              <el-table-column prop="detail" label="详情" min-width="260" show-overflow-tooltip />
            </el-table>
            <EmptyState v-else icon="list" title="暂无审计日志" description="任务、识别、复核、参数修改与报告生成都会写入流水。">
              <el-button @click="logModule = ''">查看全部</el-button>
            </EmptyState>
          </section>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<style scoped>
.admin-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #0E7490;
  background: #ECFEFF;
  padding: 4px 10px;
  border-radius: 12px;
}

.settings-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.settings-tabs :deep(.el-tabs__item) {
  font-size: 14px;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tag-list {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.disease-tag {
  font-size: 12px;
  color: #4B5563;
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: 9px;
}

.model-status {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 11px;
  font-size: 12px;
}

.model-status.active {
  color: #15803D;
  background: #F0FDF4;
}

.model-status.training {
  color: #2563EB;
  background: #EFF6FF;
}

.model-status.archived {
  color: #6B7280;
  background: #F3F4F6;
}

.module-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #0E7490;
}
</style>
