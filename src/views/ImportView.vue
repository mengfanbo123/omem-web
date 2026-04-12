<template>
  <div class="import-view">
    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <a-card title="上传文件">
          <a-upload-dragger
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            :custom-request="handleUpload"
            accept=".txt,.md,.json,.csv"
            multiple
            :max-count="10"
            class="upload-dragger"
          >
            <p class="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p class="ant-upload-text">点击或拖拽文件上传</p>
            <p class="ant-upload-hint">
              支持：.txt, .md, .json, .csv（单个文件最大 10MB）
            </p>
          </a-upload-dragger>
        </a-card>
      </a-col>

      <a-col :span="24" v-if="uploadedFiles.length > 0">
        <a-card title="导入配置">
          <a-form :model="importConfig" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="6">
                <a-form-item label="目标空间" required>
                  <a-select
                    v-model:value="importConfig.space_id"
                    placeholder="请选择目标空间"
                    :loading="spacesLoading"
                    @change="handleSpaceChange"
                  >
                    <a-select-option v-for="space in spaces" :key="space.id" :value="space.id">
                      {{ space.name }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="默认分类" required>
                  <a-select
                    v-model:value="importConfig.category"
                    placeholder="请选择分类"
                    :options="CATEGORY_OPTIONS"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="默认层级" required>
                  <a-select
                    v-model:value="importConfig.tier"
                    placeholder="请选择层级"
                    :options="TIER_OPTIONS"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="默认类型" required>
                  <a-select
                    v-model:value="importConfig.memory_type"
                    placeholder="请选择类型"
                    :options="MEMORY_TYPE_OPTIONS"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="标签">
                  <a-select
                    v-model:value="importConfig.tags"
                    mode="tags"
                    placeholder="输入标签后按回车"
                    :token-separators="[',']"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="自动生成摘要">
                  <a-switch v-model:checked="importConfig.auto_summarize" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item>
              <a-button type="primary" @click="handleImport" :loading="importing" :disabled="!canImport">
                开始导入
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <a-col :span="24" v-if="uploadedFiles.length > 0">
        <a-card title="文件预览">
          <template #extra>
            <a-button type="text" danger @click="clearAllFiles">清空全部</a-button>
          </template>
          <a-table
            :data-source="uploadedFiles"
            :columns="previewColumns"
            :pagination="false"
            row-key="file_id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'content'">
                <span class="content-preview">{{ record.content }}</span>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" danger size="small" @click="removeFile(record.file_id)">
                  删除
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <a-col :span="24" v-if="importing">
        <a-card title="导入进度">
          <a-progress :percent="importProgress" status="active" />
          <p class="import-status">{{ importStatus }}</p>
        </a-card>
      </a-col>

      <a-col :span="24" v-if="importResult">
        <a-card title="导入结果">
          <a-statistic-group>
            <a-statistic title="成功" :value="importResult.success_count" :value-style="{ color: '#52c41a' }" />
            <a-statistic title="失败" :value="importResult.failed_count" :value-style="{ color: '#ff4d4f' }" />
          </a-statistic-group>
          <a-alert
            v-if="importResult.errors.length > 0"
            type="error"
            message="失败记录"
            style="margin-top: 16px"
          >
            <template #description>
              <ul class="error-list">
                <li v-for="err in importResult.errors" :key="err.index">
                  第 {{ err.index + 1 }} 条：{{ err.error }}
                </li>
              </ul>
            </template>
          </a-alert>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { importApi, type UploadResponse, type ImportResult } from '@/api/import'
import { spacesApi } from '@/api/spaces'
import { CATEGORY_OPTIONS, TIER_OPTIONS, MEMORY_TYPE_OPTIONS } from '@/utils/enums'
import type { Space } from '@/types/space'

interface UploadedFile extends UploadResponse {
  content: string
  status: 'pending' | 'uploading' | 'ready' | 'error'
  error?: string
}

const fileList = ref<any[]>([])
const uploadedFiles = ref<UploadedFile[]>([])
const spaces = ref<Space[]>([])
const spacesLoading = ref(false)
const importing = ref(false)
const importProgress = ref(0)
const importStatus = ref('')
const importResult = ref<ImportResult | null>(null)

const importConfig = reactive({
  space_id: undefined as string | undefined,
  category: undefined as string | undefined,
  tier: undefined as string | undefined,
  memory_type: undefined as string | undefined,
  auto_summarize: false,
  tags: [] as string[]
})

const previewColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '内容预览', dataIndex: 'content', key: 'content' },
  { title: '来源文件', dataIndex: 'filename', key: 'filename', width: 150 },
  { title: '记录数', dataIndex: 'records', key: 'records', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 80 }
]

const canImport = computed(() => {
  return (
    uploadedFiles.value.length > 0 &&
    importConfig.space_id &&
    importConfig.category &&
    importConfig.tier &&
    importConfig.memory_type
  )
})

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['.txt', '.md', '.json', '.csv']

function beforeUpload(file: File) {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    message.error(`不支持的文件类型：${ext}，仅支持 .txt, .md, .json, .csv`)
    return false
  }
  if (file.size > MAX_FILE_SIZE) {
    message.error(`文件 ${file.name} 超过 10MB 限制`)
    return false
  }
  return true
}

async function handleUpload({ file, onSuccess, onError }: any) {
  const uploadFile = file as File
  const tempId = Date.now().toString()

  uploadedFiles.value.push({
    file_id: tempId,
    filename: uploadFile.name,
    size: uploadFile.size,
    records: 0,
    content: '解析中...',
    status: 'uploading'
  })

  try {
    const response = await importApi.upload(uploadFile)
    const index = uploadedFiles.value.findIndex(f => f.file_id === tempId)
    if (index !== -1) {
      uploadedFiles.value[index] = {
        ...response,
        content: '等待导入',
        status: 'ready'
      }
    }
    onSuccess(response)
    message.success(`文件 ${uploadFile.name} 上传成功`)
  } catch (error: any) {
    const index = uploadedFiles.value.findIndex(f => f.file_id === tempId)
    if (index !== -1) {
      uploadedFiles.value[index].status = 'error'
      uploadedFiles.value[index].error = error?.error?.message || '上传失败'
    }
    onError(error)
    message.error(error?.error?.message || `文件 ${uploadFile.name} 上传失败`)
  }
}

function removeFile(fileId: string) {
  uploadedFiles.value = uploadedFiles.value.filter(f => f.file_id !== fileId)
}

function clearAllFiles() {
  uploadedFiles.value = []
  fileList.value = []
  importResult.value = null
}

async function handleSpaceChange() {}

async function handleImport() {
  if (!canImport.value) {
    message.warning('请填写完整的导入配置')
    return
  }

  importing.value = true
  importProgress.value = 0
  importStatus.value = '准备导入...'
  importResult.value = null

  let totalSuccess = 0
  let totalFailed = 0
  const allErrors: ImportResult['errors'] = []

  for (let i = 0; i < uploadedFiles.value.length; i++) {
    const file = uploadedFiles.value[i]
    if (file.status !== 'ready') continue

    importStatus.value = `正在导入 ${file.filename}（${i + 1}/${uploadedFiles.value.length}）`

    try {
      const result = await importApi.execute({
        file_id: file.file_id,
        space_id: importConfig.space_id!,
        category: importConfig.category!,
        tier: importConfig.tier!,
        memory_type: importConfig.memory_type!,
        auto_summarize: importConfig.auto_summarize,
        tags: importConfig.tags
      })

      totalSuccess += result.success_count
      totalFailed += result.failed_count
      allErrors.push(...result.errors)

      importProgress.value = Math.round(((i + 1) / uploadedFiles.value.length) * 100)
    } catch (error: any) {
      totalFailed += file.records
      allErrors.push({
        index: i,
        content: file.content,
        error: error?.error?.message || '导入失败'
      })
      message.error(`文件 ${file.filename} 导入失败`)
    }
  }

  importing.value = false
  importProgress.value = 100
  importStatus.value = '导入完成'

  importResult.value = {
    success_count: totalSuccess,
    failed_count: totalFailed,
    errors: allErrors
  }

  if (totalFailed === 0) {
    message.success(`导入完成！成功 ${totalSuccess} 条`)
  } else {
    message.warning(`导入完成！成功 ${totalSuccess} 条，失败 ${totalFailed} 条`)
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'default',
    uploading: 'processing',
    ready: 'success',
    error: 'error'
  }
  return colors[status] || 'default'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    pending: '等待中',
    uploading: '上传中',
    ready: '就绪',
    error: '失败'
  }
  return texts[status] || status
}

async function fetchSpaces() {
  spacesLoading.value = true
  try {
    const response = await spacesApi.list()
    spaces.value = response.spaces
  } catch (error: any) {
    message.error(error?.error?.message || '获取空间列表失败')
  } finally {
    spacesLoading.value = false
  }
}

onMounted(() => {
  fetchSpaces()
})
</script>

<style scoped>
.import-view {
  padding: 24px;
  min-height: calc(100vh - 100px);
}

.upload-dragger {
  padding: 24px;
}

.content-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 400px;
}

.import-status {
  margin-top: 12px;
  color: rgba(0, 0, 0, 0.65);
}

.error-list {
  margin: 0;
  padding-left: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.error-list li {
  margin-bottom: 4px;
}
</style>
