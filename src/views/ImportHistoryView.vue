<template>
  <div class="import-history-view">
    <a-spin :spinning="loading">
      <a-alert
        v-if="error"
        message="加载失败"
        :description="error"
        type="error"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :lg="6" v-for="stat in stats" :key="stat.title">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              :title="stat.title"
              :value="stat.value"
              :suffix="stat.suffix || ''"
              :prefix="stat.prefix || null"
            />
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card :bordered="false">
            <a-form layout="inline" @finish="handleSearch">
              <a-form-item label="时间范围" name="dateRange">
                <a-range-picker
                  v-model:value="filters.dateRange"
                  :placeholder="['开始日期', '结束日期']"
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="状态" name="status">
                <a-select v-model:value="filters.status" style="width: 150px">
                  <a-select-option value="all">全部</a-select-option>
                  <a-select-option value="success">成功</a-select-option>
                  <a-select-option value="partial">部分失败</a-select-option>
                  <a-select-option value="failed">全部失败</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" html-type="submit">查询</a-button>
                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="导入历史" :bordered="false">
            <a-table
              :dataSource="history"
              :columns="columns"
              :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
              :row-key="(record: ImportHistory) => record.id"
              row-class-name="import-history-row"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'filename'">
                  <span class="filename-cell">{{ record.filename }}</span>
                </template>
                <template v-else-if="column.key === 'success_rate'">
                  <a-progress
                    :percent="calculateSuccessRate(record)"
                    :stroke-color="getSuccessRateColor(record)"
                    size="small"
                  />
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record)">
                    {{ getStatusText(record) }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'created_at'">
                  {{ formatDate(record.created_at) }}
                </template>
                <template v-else-if="column.key === 'actions'">
                  <a-space>
                    <a @click="showDetail(record)">详情</a>
                    <a-divider type="vertical" />
                    <a @click="handleRetry(record.id)" :disabled="record.failed_count === 0">重新导入</a>
                    <a-divider type="vertical" />
                    <a-popconfirm
                      title="确定删除该记录？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="handleDelete(record.id)"
                    >
                      <a style="color: #ff4d4f">删除</a>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>

    <a-modal
      v-model:open="detailVisible"
      title="导入详情"
      width="800px"
      @cancel="detailVisible = false"
    >
      <template #footer>
        <a-button @click="detailVisible = false">关闭</a-button>
        <a-button
          v-if="currentDetail?.failed_count && currentDetail.failed_count > 0"
          type="primary"
          @click="handleRetryFailed"
        >
          重新导入失败记录
        </a-button>
      </template>

      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="文件名">{{ currentDetail?.filename }}</a-descriptions-item>
        <a-descriptions-item label="记录数">{{ currentDetail?.records }}</a-descriptions-item>
        <a-descriptions-item label="成功数">
          <span style="color: #52c41a">{{ currentDetail?.success_count }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="失败数">
          <span style="color: #ff4d4f">{{ currentDetail?.failed_count }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="导入时间" :span="2">
          {{ currentDetail?.created_at ? formatDate(currentDetail.created_at) : '-' }}
        </a-descriptions-item>
      </a-descriptions>

      <a-divider>失败记录</a-divider>

      <a-table
        v-if="currentDetail?.errors && currentDetail.errors.length > 0"
        :dataSource="currentDetail.errors"
        :columns="errorColumns"
        :pagination="{ pageSize: 5 }"
        :row-key="(record: ImportError, index: number) => index"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'index'">
            {{ record.index + 1 }}
          </template>
          <template v-else-if="column.key === 'content'">
            <span class="content-preview">{{ record.content }}</span>
          </template>
        </template>
      </a-table>

      <a-empty v-else description="没有失败的记录" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { importApi, type ImportHistory, type ImportHistoryDetail, type ImportError } from '@/api/import'

const loading = ref(false)
const error = ref<string | null>(null)
const history = ref<ImportHistory[]>([])
const detailVisible = ref(false)
const currentDetail = ref<ImportHistoryDetail | null>(null)

const filters = reactive({
  dateRange: [] as [Dayjs, Dayjs] | null,
  status: 'all' as 'all' | 'success' | 'partial' | 'failed'
})

const stats = ref([
  { title: '总导入次数', value: 0, suffix: '次' },
  { title: '总记录数', value: 0, suffix: '条' },
  { title: '总成功数', value: 0, suffix: '条' },
  { title: '平均成功率', value: 0, suffix: '%' }
])

const columns = [
  { title: '文件名', dataIndex: 'filename', key: 'filename', ellipsis: true },
  { title: '记录数', dataIndex: 'records', key: 'records', width: 100 },
  { title: '成功数', dataIndex: 'success_count', key: 'success_count', width: 100 },
  { title: '失败数', dataIndex: 'failed_count', key: 'failed_count', width: 100 },
  { title: '成功率', key: 'success_rate', width: 150 },
  { title: '状态', key: 'status', width: 100 },
  { title: '导入时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'actions', width: 200, fixed: 'right' }
]

const errorColumns = [
  { title: '行号', key: 'index', width: 80 },
  { title: '内容预览', key: 'content', ellipsis: true },
  { title: '失败原因', dataIndex: 'error', key: 'error', ellipsis: true }
]

const calculateSuccessRate = (record: ImportHistory): number => {
  if (record.records === 0) return 0
  return Math.round((record.success_count / record.records) * 100)
}

const getSuccessRateColor = (record: ImportHistory): string => {
  const rate = calculateSuccessRate(record)
  if (rate > 90) return '#52c41a'
  if (rate >= 60) return '#faad14'
  return '#ff4d4f'
}

const getStatusColor = (record: ImportHistory): string => {
  if (record.failed_count === 0) return 'success'
  if (record.success_count === 0) return 'error'
  return 'warning'
}

const getStatusText = (record: ImportHistory): string => {
  if (record.failed_count === 0) return '成功'
  if (record.success_count === 0) return '全部失败'
  return '部分失败'
}

const formatDate = (dateStr: string): string => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

const loadStats = async () => {
  try {
    const data = await importApi.getStats()
    stats.value = [
      { title: '总导入次数', value: data.total_imports, suffix: '次' },
      { title: '总记录数', value: data.total_records, suffix: '条' },
      { title: '总成功数', value: data.total_success, suffix: '条' },
      { title: '平均成功率', value: Math.round(data.avg_success_rate * 100) / 100, suffix: '%' }
    ]
  } catch (e: any) {
    console.error('Failed to load stats:', e)
  }
}

const loadHistory = async () => {
  loading.value = true
  error.value = null
  try {
    const params: any = {}
    if (filters.dateRange) {
      params.start_date = filters.dateRange[0].format('YYYY-MM-DD')
      params.end_date = filters.dateRange[1].format('YYYY-MM-DD')
    }
    if (filters.status !== 'all') {
      params.status = filters.status
    }
    history.value = await importApi.getHistory(params)
  } catch (e: any) {
    error.value = e?.error?.message || e?.message || '加载历史记录失败'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadHistory()
}

const handleReset = () => {
  filters.dateRange = null
  filters.status = 'all'
  loadHistory()
}

const showDetail = async (record: ImportHistory) => {
  try {
    currentDetail.value = await importApi.getHistoryDetail(record.id)
    detailVisible.value = true
  } catch (e: any) {
    message.error('加载详情失败')
  }
}

const handleRetry = async (id: string) => {
  try {
    const result = await importApi.retryImport(id)
    if (result.success) {
      message.success(result.message || '重新导入成功')
      loadHistory()
      loadStats()
    } else {
      message.error(result.message || '重新导入失败')
    }
  } catch (e: any) {
    message.error('重新导入失败')
  }
}

const handleRetryFailed = async () => {
  if (!currentDetail.value) return
  try {
    const result = await importApi.retryImport(currentDetail.value.id)
    if (result.success) {
      message.success(result.message || '重新导入成功')
      detailVisible.value = false
      loadHistory()
      loadStats()
    } else {
      message.error(result.message || '重新导入失败')
    }
  } catch (e: any) {
    message.error('重新导入失败')
  }
}

const handleDelete = async (id: string) => {
  try {
    const result = await importApi.deleteHistory(id)
    if (result.success) {
      message.success('删除成功')
      loadHistory()
      loadStats()
    } else {
      message.error(result.message || '删除失败')
    }
  } catch (e: any) {
    message.error('删除失败')
  }
}

onMounted(() => {
  loadStats()
  loadHistory()
})
</script>

<style scoped>
.import-history-view {
  padding: 24px;
  min-height: calc(100vh - 100px);
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.stat-card :deep(.ant-statistic-title) {
  color: rgba(255, 255, 255, 0.85);
}

.stat-card :deep(.ant-statistic-content) {
  color: #fff;
}

.filename-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.content-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.import-history-row:hover {
  background-color: #fafafa;
}
</style>
