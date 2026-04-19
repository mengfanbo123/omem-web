import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import apiClient from "@/api/client"
import {
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  MousePointerClick,
  Search,
  BrainCircuit,
  BarChart3,
} from "lucide-react"

interface SessionRecall {
  id: string
  session_id: string
  memory_id: string
  recall_type: "auto" | "manual"
  query_text: string
  similarity_score: number
  llm_confidence: number
  created_at: string
}

interface MemoryDetail {
  id: string
  content: string
  l0_abstract: string
  category: string
  memory_type: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function shortSessionId(sessionId: string) {
  if (!sessionId) return "—"
  if (sessionId.length <= 16) return sessionId
  return sessionId.slice(0, 8) + "..." + sessionId.slice(-8)
}

function RecallTypeBadge({ type }: { type: "auto" | "manual" }) {
  if (type === "auto") {
    return (
      <Badge variant="secondary" className="text-xs">
        <Zap className="size-3 mr-1" />
        自动注入
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-xs">
      <MousePointerClick className="size-3 mr-1" />
      手动注入
    </Badge>
  )
}

function ScoreBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function TimelineItem({
  recall,
  memory,
  isLast,
}: {
  recall: SessionRecall
  memory: MemoryDetail | null
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      <div className="flex-1 pb-6">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left rounded-lg border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <RecallTypeBadge type={recall.recall_type} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {formatDate(recall.created_at)}
              </span>
            </div>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>

          <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
            <Search className="size-3.5" />
            <span className="line-clamp-1">{recall.query_text || "—"}</span>
          </div>

          {expanded && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BrainCircuit className="size-3" />
                  关联记忆
                </h4>
                {memory ? (
                  <div className="rounded-md bg-muted p-3 space-y-2">
                    <p className="text-sm text-foreground line-clamp-4">
                      {memory.content || memory.l0_abstract || "—"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        {memory.category || "未分类"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {memory.id?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">记忆内容加载中...</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="size-3" />
                  匹配指标
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ScoreBar label="相似度" value={recall.similarity_score} />
                  <ScoreBar label="LLM 置信度" value={recall.llm_confidence} />
                </div>
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                Memory ID: {recall.memory_id}
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sessionId = id ? decodeURIComponent(id) : ""

  const [recalls, setRecalls] = useState<SessionRecall[]>([])
  const [memories, setMemories] = useState<Map<string, MemoryDetail>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const data = await apiClient.get<{recalls: SessionRecall[]; limit: number; offset: number}>("/v1/session-recalls", {
          params: { session_id: sessionId },
        })
        const list = (data?.recalls || []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        setRecalls(list)

        const uniqueMemoryIds = Array.from(new Set(list.map((r) => r.memory_id)))
        if (uniqueMemoryIds.length > 0) {
          const memoryResults = await Promise.allSettled(
            uniqueMemoryIds.map(async (mid) => {
              try {
                const mem = await apiClient.get<MemoryDetail>(`/v1/memories/${mid}`)
                return { id: mid, mem }
              } catch {
                return null
              }
            })
          )
          const map = new Map<string, MemoryDetail>()
          for (const result of memoryResults) {
            if (result.status === "fulfilled" && result.value) {
              map.set(result.value.id, result.value.mem)
            }
          }
          setMemories(map)
        }
      } catch (err) {
        console.error("Failed to fetch session detail:", err)
        setError("加载 Session 详情失败")
        toast.error("加载 Session 详情失败")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId])

  const stats = {
    total: recalls.length,
    auto: recalls.filter((r) => r.recall_type === "auto").length,
    manual: recalls.filter((r) => r.recall_type === "manual").length,
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-4">
              <Skeleton className="h-3 w-3 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4 mr-1.5" />
          返回
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4 mr-1.5" />
            返回
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Session 详情 - {shortSessionId(sessionId)}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
            {sessionId}
          </code>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-semibold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">总注入数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-semibold">{stats.auto}</div>
            <div className="text-xs text-muted-foreground">自动注入</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-semibold">{stats.manual}</div>
            <div className="text-xs text-muted-foreground">手动注入</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">注入时间线</h2>
        {recalls.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            暂无注入记录
          </div>
        ) : (
          recalls.map((recall, index) => (
            <TimelineItem
              key={recall.id}
              recall={recall}
              memory={memories.get(recall.memory_id) || null}
              isLast={index === recalls.length - 1}
            />
          ))
        )}
      </div>
    </div>
  )
}
