import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import apiClient from "@/api/client"

interface StatsResponse {
  total: number
  by_type: Record<string, number>
  by_category: Record<string, number>
  by_tier: Record<string, number>
  by_state: Record<string, number>
  by_space: Record<string, number>
  timeline: Array<{
    date: string
    count: number
    by_type: Record<string, number>
  }>
  avg_importance: number
  avg_confidence: number
  total_access_count: number
}

interface StatCardProps {
  label: string
  value: string | number
  loading?: boolean
}

function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 text-3xl font-semibold tracking-tight">
          {loading ? <Skeleton className="h-9 w-20" /> : value}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<StatsResponse>("/v1/stats")
        setStats(response)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setError("加载统计数据失败")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getTodayCount = () => {
    if (!stats?.timeline?.length) return 0
    const today = new Date().toISOString().split("T")[0]
    const todayEntry = stats.timeline.find((t) => t.date === today)
    return todayEntry?.count ?? 0
  }

  const getSpaceCount = () => {
    if (!stats?.by_space) return 0
    return Object.keys(stats.by_space).length
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">
          概览您的记忆库状态
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className={cn(
        "grid gap-6",
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-4"
      )}>
        <StatCard
          label="总记忆数"
          value={stats?.total ?? 0}
          loading={loading}
        />
        <StatCard
          label="今日新增"
          value={getTodayCount()}
          loading={loading}
        />
        <StatCard
          label="空间数"
          value={getSpaceCount()}
          loading={loading}
        />
        <StatCard
          label="平均重要度"
          value={stats?.avg_importance ? `${(stats.avg_importance * 100).toFixed(0)}%` : "—"}
          loading={loading}
        />
      </div>
    </div>
  )
}
