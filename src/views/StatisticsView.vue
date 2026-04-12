<template>
  <div class="statistics-view">
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
            <a-radio-group v-model:value="timeRange" @change="loadData">
              <a-radio-button value="7">最近7天</a-radio-button>
              <a-radio-button value="30">最近30天</a-radio-button>
              <a-radio-button value="90">最近90天</a-radio-button>
              <a-radio-button value="all">全部时间</a-radio-button>
            </a-radio-group>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="Memory Growth Over Time" :bordered="false">
            <div ref="growthChartRef" style="height: 400px"></div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Category Distribution Heatmap" :bordered="false">
            <div ref="categoryChartRef" style="height: 400px"></div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Tier Distribution Radar" :bordered="false">
            <div ref="radarChartRef" style="height: 400px"></div>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="Activity Heatmap (Last 365 Days)" :bordered="false">
            <div ref="heatmapChartRef" style="height: 200px"></div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Tag Cloud" :bordered="false">
            <div ref="tagCloudChartRef" style="height: 400px"></div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="Memory Distribution by Space" :bordered="false">
            <div ref="spaceChartRef" style="height: 400px"></div>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import { statisticsApi } from '@/api/statistics'
import type { GrowthData, HeatmapData, TagStats, SpaceStats, DistributionStats } from '@/api/statistics'

const loading = ref(false)
const error = ref<string | null>(null)
const timeRange = ref('30')

const growthChartRef = ref<HTMLElement | null>(null)
const categoryChartRef = ref<HTMLElement | null>(null)
const radarChartRef = ref<HTMLElement | null>(null)
const heatmapChartRef = ref<HTMLElement | null>(null)
const tagCloudChartRef = ref<HTMLElement | null>(null)
const spaceChartRef = ref<HTMLElement | null>(null)

let growthChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null
let radarChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null
let tagCloudChart: echarts.ECharts | null = null
let spaceChart: echarts.ECharts | null = null

const growthData = ref<GrowthData[]>([])
const heatmapData = ref<HeatmapData[]>([])
const tagStats = ref<TagStats[]>([])
const spaceStats = ref<SpaceStats[]>([])
const distribution = ref<DistributionStats | null>(null)

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const days = timeRange.value === 'all' ? 9999 : parseInt(timeRange.value)
    const [growthRes, heatmapRes, tagsRes, spacesRes, distRes] = await Promise.all([
      statisticsApi.getGrowth(days > 365 ? 365 : days),
      statisticsApi.getHeatmap(365),
      statisticsApi.getTags(100),
      statisticsApi.getSpaces(),
      statisticsApi.getDistribution()
    ])
    growthData.value = growthRes
    heatmapData.value = heatmapRes
    tagStats.value = tagsRes
    spaceStats.value = spacesRes
    distribution.value = distRes
    initCharts()
  } catch (e: any) {
    error.value = e?.error?.message || e?.message || '加载数据失败'
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  initGrowthChart()
  initCategoryChart()
  initRadarChart()
  initHeatmapChart()
  initTagCloudChart()
  initSpaceChart()
}

const initGrowthChart = () => {
  if (!growthChartRef.value) return
  growthChart = echarts.init(growthChartRef.value)
  growthChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['新增数量', '累计总量'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: growthData.value.map(d => d.date),
      boundaryGap: false
    },
    yAxis: [
      {
        type: 'value',
        name: '新增数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '累计总量',
        position: 'right'
      }
    ],
    series: [
      {
        name: '新增数量',
        type: 'line',
        smooth: true,
        data: growthData.value.map(d => d.new_count),
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '累计总量',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: growthData.value.map(d => d.total_count),
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 2 },
        itemStyle: { color: '#52c41a' }
      }
    ]
  })
}

const initCategoryChart = () => {
  if (!categoryChartRef.value || !distribution.value) return
  categoryChart = echarts.init(categoryChartRef.value)
  const categoryData = Object.entries(distribution.value.by_category).map(([name, value]) => ({
    name,
    value
  }))
  categoryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'treemap',
        data: categoryData,
        leafDepth: 2,
        label: {
          show: true,
          formatter: '{b}\n{c}'
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
          gapWidth: 1
        }
      }
    ]
  })
}

const initRadarChart = () => {
  if (!radarChartRef.value || !distribution.value) return
  radarChart = echarts.init(radarChartRef.value)
  const tiers = ['L0', 'L1', 'L2', 'L3']
  const tierValues = tiers.map(t => distribution.value?.by_tier[t] || 0)
  const maxValue = Math.max(...tierValues, 1)
  radarChart.setOption({
    tooltip: {},
    radar: {
      indicator: tiers.map(t => ({ name: t, max: maxValue * 1.2 })),
      shape: 'polygon',
      splitNumber: 4
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: tierValues,
            name: '层级分布',
            areaStyle: { opacity: 0.3 },
            lineStyle: { width: 2 },
            itemStyle: { color: '#1890ff' }
          }
        ]
      }
    ]
  })
}

const initHeatmapChart = () => {
  if (!heatmapChartRef.value) return
  heatmapChart = echarts.init(heatmapChartRef.value)
  const calendarStart = new Date()
  calendarStart.setFullYear(calendarStart.getFullYear() - 1)
  const calendarEnd = new Date()
  
  const heatmapValues = heatmapData.value.map(d => [d.date, d.count])
  
  heatmapChart.setOption({
    tooltip: {
      formatter: (params: any) => {
        return `${params.data[0]}: ${params.data[1]} 条记忆`
      }
    },
    visualMap: [{
      min: 0,
      max: Math.max(...heatmapData.value.map(d => d.count), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 20,
      inRange: {
        color: ['#ebedee', '#d6e3ef', '#a9c5e5', '#7ba5cc', '#4c85b2', '#25649c']
      }
    }] as any,
    calendar: {
      top: 30,
      left: 50,
      right: 30,
      cellSize: ['auto', 15],
      range: [calendarStart.toISOString().split('T')[0], calendarEnd.toISOString().split('T')[0]],
      itemStyle: {
        borderWidth: 2,
        borderColor: '#fff'
      },
      yearLabel: { show: false }
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapValues
      }
    ]
  } as any)
}

const initTagCloudChart = () => {
  if (!tagCloudChartRef.value) return
  tagCloudChart = echarts.init(tagCloudChartRef.value)
  const tagData = tagStats.value.map(t => ({
    name: t.tag,
    value: t.count
  }))
  tagCloudChart.setOption({
    tooltip: {
      show: true,
      formatter: (params: any) => `${params.name}: ${params.value}`
    },
    series: [
      {
        type: 'wordCloud',
        shape: 'circle' as any,
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [14, 60],
        rotationRange: [-45, 45],
        rotationStep: 15,
        gridSize: 8,
        drawOutOfBound: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: () => {
            const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
            return colors[Math.floor(Math.random() * colors.length)]
          },
          opacity: 0.7
        },
        emphasis: {
          textStyle: {
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        data: tagData
      }
    ]
  } as any)
}

const initSpaceChart = () => {
  if (!spaceChartRef.value) return
  spaceChart = echarts.init(spaceChartRef.value)
  const xAxisData = spaceStats.value.map(s => s.space_name)
  spaceChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['L0', 'L1', 'L2', 'L3'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        rotate: xAxisData.length > 5 ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      name: '记忆数量'
    },
    series: [
      {
        name: 'L0',
        type: 'bar',
        stack: 'total',
        data: spaceStats.value.map(s => s.l0_count),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: 'L1',
        type: 'bar',
        stack: 'total',
        data: spaceStats.value.map(s => s.l1_count),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: 'L2',
        type: 'bar',
        stack: 'total',
        data: spaceStats.value.map(s => s.l2_count),
        itemStyle: { color: '#faad14' }
      },
      {
        name: 'L3',
        type: 'bar',
        stack: 'total',
        data: spaceStats.value.map(s => s.l3_count),
        itemStyle: { color: '#f5222d' }
      }
    ]
  })
}

const handleResize = () => {
  growthChart?.resize()
  categoryChart?.resize()
  radarChart?.resize()
  heatmapChart?.resize()
  tagCloudChart?.resize()
  spaceChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  growthChart?.dispose()
  categoryChart?.dispose()
  radarChart?.dispose()
  heatmapChart?.dispose()
  tagCloudChart?.dispose()
  spaceChart?.dispose()
})
</script>

<style scoped>
.statistics-view {
  padding: 24px;
  min-height: calc(100vh - 100px);
}
</style>
