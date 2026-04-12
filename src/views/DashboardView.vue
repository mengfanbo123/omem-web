<template>
  <div class="dashboard">
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
        <a-col :xs="24" :sm="12" :md="6" v-for="stat in coreStats" :key="stat.key">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              :title="stat.title"
              :value="stat.value"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <component :is="stat.icon" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :md="6" v-for="tier in tierStats" :key="tier.key">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              :title="tier.title"
              :value="tier.value"
              :value-style="{ color: tier.color }"
            />
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :md="6" v-for="space in spaceStats" :key="space.key">
          <a-card :bordered="false" class="stat-card">
            <a-statistic
              :title="space.title"
              :value="space.value"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <component :is="space.icon" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Memory Growth Trend (Last 30 Days)" :bordered="false">
            <div ref="trendChartRef" style="height: 300px"></div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card title="Memory Distribution by Category" :bordered="false">
            <div ref="categoryChartRef" style="height: 300px"></div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Memory Distribution by Tier" :bordered="false">
            <div ref="tierChartRef" style="height: 300px"></div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card title="Memory State Distribution" :bordered="false">
            <div ref="stateChartRef" style="height: 300px"></div>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="Quick Actions" :bordered="false">
            <a-space :size="16">
              <a-button type="primary" @click="router.push('/memories?action=create')">
                <PlusOutlined /> New Memory
              </a-button>
              <a-button @click="router.push('/search')">
                <SearchOutlined /> Search
              </a-button>
              <a-button @click="router.push('/spaces')">
                <TeamOutlined /> Spaces
              </a-button>
              <a-button @click="router.push('/import')">
                <UploadOutlined /> Import
              </a-button>
            </a-space>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UploadOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  BankOutlined
} from '@ant-design/icons-vue'
import { statisticsApi } from '@/api/statistics'
import type { OverviewStats, TrendData, DistributionStats } from '@/api/statistics'

const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)

const overview = ref<OverviewStats | null>(null)
const trendData = ref<TrendData[]>([])
const distribution = ref<DistributionStats | null>(null)

const trendChartRef = ref<HTMLElement | null>(null)
const categoryChartRef = ref<HTMLElement | null>(null)
const tierChartRef = ref<HTMLElement | null>(null)
const stateChartRef = ref<HTMLElement | null>(null)

let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null
let tierChart: echarts.ECharts | null = null
let stateChart: echarts.ECharts | null = null

const coreStats = computed(() => {
  if (!overview.value) return []
  return [
    { key: 'total', title: 'Total Memories', value: overview.value.total_memories, icon: DatabaseOutlined },
    { key: 'active', title: 'Active', value: overview.value.active_memories, icon: ClockCircleOutlined },
    { key: 'archived', title: 'Archived', value: overview.value.archived_memories, icon: FolderOutlined },
    { key: 'today', title: "Today's New", value: overview.value.today_new, icon: PlusOutlined }
  ]
})

const tierStats = computed(() => {
  if (!overview.value) return []
  return [
    { key: 'l0', title: 'L0 (Core)', value: overview.value.l0_count, color: '#1890ff' },
    { key: 'l1', title: 'L1 (Working)', value: overview.value.l1_count, color: '#52c41a' },
    { key: 'l2', title: 'L2 (Peripheral)', value: overview.value.l2_count, color: '#faad14' },
    { key: 'l3', title: 'L3 (Archive)', value: overview.value.l3_count, color: '#f5222d' }
  ]
})

const spaceStats = computed(() => {
  if (!overview.value) return []
  return [
    { key: 'personal', title: 'Personal Spaces', value: overview.value.personal_spaces, icon: BankOutlined },
    { key: 'team', title: 'Team Spaces', value: overview.value.team_spaces, icon: TeamOutlined },
    { key: 'org', title: 'Organization Spaces', value: overview.value.organization_spaces, icon: FolderOutlined },
    { key: 'shared', title: 'Shared Memories', value: overview.value.shared_memories, icon: DatabaseOutlined }
  ]
})

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const [overviewRes, trendRes, distRes] = await Promise.all([
      statisticsApi.getOverview(),
      statisticsApi.getTrend(30),
      statisticsApi.getDistribution()
    ])
    overview.value = overviewRes
    trendData.value = trendRes
    distribution.value = distRes
    initCharts()
  } catch (e: any) {
    error.value = e?.error?.message || e?.message || '加载数据失败'
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: trendData.value.map(d => d.date),
        boundaryGap: false
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'New Memories',
          type: 'line',
          smooth: true,
          data: trendData.value.map(d => d.count),
          areaStyle: { opacity: 0.3 },
          lineStyle: { width: 2 },
          itemStyle: { color: '#1890ff' }
        }
      ]
    })
  }

  if (categoryChartRef.value && distribution.value) {
    categoryChart = echarts.init(categoryChartRef.value)
    const categoryData = Object.entries(distribution.value.by_category).map(([name, value]) => ({ name, value }))
    categoryChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14 } },
          data: categoryData
        }
      ]
    })
  }

  if (tierChartRef.value && distribution.value) {
    tierChart = echarts.init(tierChartRef.value)
    const tiers = ['L0', 'L1', 'L2', 'L3']
    const data = tiers.map(t => distribution.value?.by_tier[t] || 0)
    tierChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: tiers },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: data,
          itemStyle: {
            color: (params: any) => ['#1890ff', '#52c41a', '#faad14', '#f5222d'][params.dataIndex]
          },
          barWidth: '50%'
        }
      ]
    })
  }

  if (stateChartRef.value && distribution.value) {
    stateChart = echarts.init(stateChartRef.value)
    const stateData = Object.entries(distribution.value.by_state).map(([name, value]) => ({ name, value }))
    stateChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['35%', '70%'],
          center: ['50%', '50%'],
          data: stateData,
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}: {d}%' }
        }
      ]
    })
  }
}

const handleResize = () => {
  trendChart?.resize()
  categoryChart?.resize()
  tierChart?.resize()
  stateChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  categoryChart?.dispose()
  tierChart?.dispose()
  stateChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  min-height: calc(100vh - 100px);
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
