import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/api/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,

} from "recharts"
import {
  TrendingUp,
  Tags,
  Layers,
  Brain,
  ArrowLeft,
  BarChart3,
} from "lucide-react"

interface MemoryItem {
  id: string
  category: string
  tags: string[]
  importance: number
  confidence: number
  memory_type: string
  tier: string
  created_at: string
}

interface StatsData {
  total_memories: number
  memories_today: number
  total_spaces: number
}

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#f97316",
]

export function AnalyticsPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [statsRes, memoriesRes] = await Promise.all([
          apiClient.get("/v1/stats"),
          apiClient.get("/v1/memories?limit=1000"),
        ])
        setStats(statsRes as StatsData)
        setMemories((memoriesRes as { memories: MemoryItem[] }).memories || [])
      } catch (err: any) {
        toast.error("加载统计数据失败: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    memories.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [memories])

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {}
    memories.forEach((m) => {
      counts[m.memory_type] = (counts[m.memory_type] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [memories])

  const tagData = useMemo(() => {
    const counts: Record<string, number> = {}
    memories.forEach((m) => {
      m.tags?.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [memories])

  const tierData = useMemo(() => {
    const counts: Record<string, number> = {}
    memories.forEach((m) => {
      counts[m.tier] = (counts[m.tier] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [memories])

  const importanceDistribution = useMemo(() => {
    const bins = [
      { range: "0.0-0.2", count: 0 },
      { range: "0.2-0.4", count: 0 },
      { range: "0.4-0.6", count: 0 },
      { range: "0.6-0.8", count: 0 },
      { range: "0.8-1.0", count: 0 },
    ]
    memories.forEach((m) => {
      const imp = m.importance || 0
      if (imp < 0.2) bins[0].count++
      else if (imp < 0.4) bins[1].count++
      else if (imp < 0.6) bins[2].count++
      else if (imp < 0.8) bins[3].count++
      else bins[4].count++
    })
    return bins
  }, [memories])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-5" />
            统计分析
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            记忆库数据洞察与可视化
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/memories")}>
          <ArrowLeft className="size-4 mr-1.5" />
          返回记忆
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总记忆数
            </CardTitle>
            <Brain className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_memories || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今日新增
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.memories_today || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              空间数
            </CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_spaces || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              标签种类
            </CardTitle>
            <Tags className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tagData.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 分类分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">分类分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {categoryData.map((entry, index) => (
                <Badge
                  key={entry.name}
                  variant="secondary"
                  style={{
                    backgroundColor: `${COLORS[index % COLORS.length]}20`,
                    color: COLORS[index % COLORS.length],
                  }}
                >
                  {entry.name} ({entry.value})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 记忆类型 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">记忆类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 标签 TOP10 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">热门标签 TOP10</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tagData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 层级分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">层级分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`tier-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 重要性分布 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">重要性分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={importanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
