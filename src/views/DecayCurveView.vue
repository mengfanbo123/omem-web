<template>
  <div class="decay-curve-view">
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
        <a-col :span="24">
          <a-card :bordered="false">
            <a-form layout="inline">
              <a-form-item label="Select Memory">
                <a-select
                  v-model:value="selectedMemoryId"
                  show-search
                  placeholder="Search and select a memory"
                  style="width: 400px"
                  :filter-option="filterOption"
                  @change="loadDecayData"
                >
                  <a-select-option v-for="mem in memories" :key="mem.id" :value="mem.id">
                    {{ mem.content.substring(0, 50) }}{{ mem.content.length > 50 ? '...' : '' }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="16">
          <a-card title="Memory Decay Curve" :bordered="false">
            <div ref="decayChartRef" style="height: 500px"></div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="8">
          <a-card title="Review Suggestion" :bordered="false">
            <a-statistic
              title="Current Strength"
              :value="decayData?.current_strength ?? 0"
              suffix="%"
              :value-style="{ color: getStrengthColor(decayData?.current_strength ?? 0) }"
            />
            <a-statistic
              title="Next Review"
              :value="decayData?.next_review ?? '-'"
              style="margin-top: 16px"
            />
            <a-statistic
              title="Review Count"
              :value="decayData?.review_count ?? 0"
              style="margin-top: 16px"
            />

            <a-divider />

            <h4>Review History</h4>
            <a-timeline v-if="decayData?.review_history?.length">
              <a-timeline-item
                v-for="review in decayData.review_history"
                :key="review.date"
                :color="getReviewColor(review.strength_after - review.strength_before)"
              >
                {{ review.date }}: {{ review.strength_before }}% → {{ review.strength_after }}%
              </a-timeline-item>
            </a-timeline>
            <a-empty v-else description="No review history yet" :image="Empty.PRESENTED_IMAGE_SIMPLE" />

            <a-button
              type="primary"
              block
              @click="handleMarkReview"
              style="margin-top: 16px"
              :disabled="!selectedMemoryId"
            >
              Mark as Reviewed
            </a-button>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="Parameters" :bordered="false">
            <a-form layout="vertical">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="Initial Strength (%)">
                    <a-slider v-model:value="params.initialStrength" :min="0" :max="100" :step="5" />
                    <div style="text-align: center">{{ params.initialStrength }}%</div>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="Decay Rate">
                    <a-slider
                      v-model:value="params.decayRate"
                      :min="0.5"
                      :max="2"
                      :step="0.1"
                    />
                    <div style="text-align: center">{{ params.decayRate.toFixed(1) }}</div>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="Review Boost">
                    <a-slider v-model:value="params.reviewBoost" :min="1" :max="2" :step="0.1" />
                    <div style="text-align: center">{{ params.reviewBoost.toFixed(1) }}x</div>
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item>
                <a-button type="primary" @click="recalculateCurve">Recalculate Curve</a-button>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Empty, message } from 'ant-design-vue'
import * as echarts from 'echarts'
import { decayApi } from '@/api/decay'
import type { DecayData, MemoryOption } from '@/api/decay'
import type { ECharts } from 'echarts'

const loading = ref(false)
const error = ref<string | null>(null)

const selectedMemoryId = ref<string | null>(null)
const memories = ref<MemoryOption[]>([])
const decayData = ref<DecayData | null>(null)

const decayChartRef = ref<HTMLElement | null>(null)
let decayChart: ECharts | null = null

const params = ref({
  initialStrength: 100,
  decayRate: 1.0,
  reviewBoost: 1.5,
})

const days = [0, 1, 2, 3, 5, 7, 10, 15, 20, 30]

function calculateDecay(s: number, rate: number = 1.0): number[] {
  return days.map(day => Math.round(100 * Math.exp(-day * rate / s)))
}

const standardDecayData = computed(() => ({
  l0: calculateDecay(1, params.value.decayRate),
  l1: calculateDecay(3, params.value.decayRate),
  l2: calculateDecay(7, params.value.decayRate),
  l3: calculateDecay(15, params.value.decayRate),
}))

function getStrengthColor(strength: number): string {
  if (strength >= 80) return '#52c41a'
  if (strength >= 60) return '#1890ff'
  if (strength >= 40) return '#faad14'
  if (strength >= 20) return '#f5222d'
  return '#722ed1'
}

function getReviewColor(delta: number): string {
  if (delta >= 30) return 'green'
  if (delta >= 15) return 'blue'
  if (delta >= 5) return 'gray'
  return 'red'
}

function filterOption(input: string, option: any): boolean {
  return option.children[0].children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

async function loadMemories() {
  try {
    const data = await decayApi.listMemories()
    memories.value = data.map(m => ({
      id: m.id,
      content: m.content,
    }))
  } catch (e: any) {
    error.value = e?.error?.message || e?.message || '加载记忆列表失败'
  }
}

async function loadDecayData() {
  if (!selectedMemoryId.value) return

  loading.value = true
  error.value = null

  try {
    decayData.value = await decayApi.getDecayData(selectedMemoryId.value)
    params.value.initialStrength = decayData.value.current_strength
    initChart()
  } catch (e: any) {
    error.value = e?.error?.message || e?.message || '加载衰减数据失败'
  } finally {
    loading.value = false
  }
}

async function handleMarkReview() {
  if (!selectedMemoryId.value) return

  try {
    await decayApi.markReview(selectedMemoryId.value, {
      review_time: new Date().toISOString(),
      quality: 4,
    })
    message.success('Review marked successfully')
    await loadDecayData()
  } catch (e: any) {
    message.error(e?.error?.message || e?.message || '标记复习失败')
  }
}

function recalculateCurve() {
  initChart()
}

function initChart() {
  if (!decayChartRef.value) return

  if (!decayChart) {
    decayChart = echarts.init(decayChartRef.value)
  }

  const reviewMarkers = decayData.value?.review_history.map(r => ({
    coord: [days.indexOf(Math.min(days.length - 1, Math.floor((new Date(r.date).getTime() - Date.now()) / 86400000 + (decayData.value?.review_count ?? 0) * 7))), r.strength_after],
    symbol: 'circle',
    symbolSize: 10,
    itemStyle: { color: '#722ed1' },
  })) || []

  const currentCurve = decayData.value?.decay_curve.map(p => ({
    day: p.day,
    strength: p.strength,
  })) || []

  const option = {
    title: {
      text: 'Memory Decay Curve',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `Day ${params[0].axisValue}<br/>`
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`
        })
        return result
      },
    },
    legend: {
      data: ['L0', 'L1', 'L2', 'L3', 'Current Memory'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      name: 'Days',
      data: days,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: 'Strength (%)',
      min: 0,
      max: 100,
    },
    series: [
      {
        name: 'L0',
        type: 'line',
        data: standardDecayData.value.l0,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#f5222d' },
      },
      {
        name: 'L1',
        type: 'line',
        data: standardDecayData.value.l1,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#fa8c16' },
      },
      {
        name: 'L2',
        type: 'line',
        data: standardDecayData.value.l2,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#1890ff' },
      },
      {
        name: 'L3',
        type: 'line',
        data: standardDecayData.value.l3,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#52c41a' },
      },
      {
        name: 'Current Memory',
        type: 'line',
        data: currentCurve.length ? days.map((d, i) => currentCurve[i]?.strength ?? null) : [],
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: '#722ed1' },
        markPoint: {
          data: reviewMarkers,
        },
      },
      {
        name: 'Threshold',
        type: 'line',
        data: days.map(() => 20),
        smooth: true,
        lineStyle: { width: 1, type: 'dashed' },
        itemStyle: { color: '#f5222d', opacity: 0.5 },
        symbol: 'none',
      },
    ],
  }

  decayChart.setOption(option)
}

function handleResize() {
  decayChart?.resize()
}

onMounted(() => {
  loadMemories()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  decayChart?.dispose()
})
</script>

<style scoped>
.decay-curve-view {
  padding: 24px;
  min-height: calc(100vh - 100px);
}
</style>
