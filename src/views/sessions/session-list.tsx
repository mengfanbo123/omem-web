import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/api/client"
import { Search, Clock, Inbox, ChevronRight, Zap, MousePointerClick } from "lucide-react"

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

interface SessionGroup {
  session_id: string
  count: number
  last_injected_at: string
  auto_count: number
  manual_count: number
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function shortSessionId(sessionId: string) {
  if (!sessionId) return "—"
  if (sessionId.length <= 12) return sessionId
  return sessionId.slice(0, 6) + "..." + sessionId.slice(-6)
}

export function SessionListPage() {
  const navigate = useNavigate()
  const [recalls, setRecalls] = useState<SessionRecall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadRecalls() {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<SessionRecall[]>("/v1/session-recalls")
        setRecalls(response || [])
      } catch (err) {
        console.error("Failed to fetch session recalls:", err)
        setError("加载 Session 记忆注入记录失败")
        toast.error("加载 Session 记忆注入记录失败")
      } finally {
        setLoading(false)
      }
    }

    loadRecalls()
  }, [])

  const sessions = useMemo<SessionGroup[]>(() => {
    const groups = new Map<string, SessionGroup>()
    for (const recall of recalls) {
      const existing = groups.get(recall.session_id)
      if (existing) {
        existing.count += 1
        if (new Date(recall.created_at) > new Date(existing.last_injected_at)) {
          existing.last_injected_at = recall.created_at
        }
        if (recall.recall_type === "auto") {
          existing.auto_count += 1
        } else {
          existing.manual_count += 1
        }
      } else {
        groups.set(recall.session_id, {
          session_id: recall.session_id,
          count: 1,
          last_injected_at: recall.created_at,
          auto_count: recall.recall_type === "auto" ? 1 : 0,
          manual_count: recall.recall_type === "manual" ? 1 : 0,
        })
      }
    }
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.last_injected_at).getTime() - new Date(a.last_injected_at).getTime()
    )
  }, [recalls])

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.trim().toLowerCase()
    return sessions.filter((s) => s.session_id.toLowerCase().includes(q))
  }, [sessions, searchQuery])

  const handleRowClick = (sessionId: string) => {
    navigate(`/sessions/${encodeURIComponent(sessionId)}`)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Session 记忆注入记录</h1>
        <p className="text-sm text-muted-foreground">
          查看各 Session 的记忆注入统计与分布
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索 Session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4, 5].map((n) => (
            <div
              key={`sk-${n}`}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-4 w-[60%]" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center space-y-4">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? "未找到匹配的 Session" : "暂无 Session 记忆注入记录"}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "尝试调整搜索条件" : "注入记忆后此处将显示记录"}
              </p>
            </div>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <button
              type="button"
              key={session.session_id}
              onClick={() => handleRowClick(session.session_id)}
              className="w-full text-left rounded-lg border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-muted/50 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                    {shortSessionId(session.session_id)}
                  </code>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      <Zap className="size-3 mr-1" />
                      自动 {session.auto_count}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">
                      <MousePointerClick className="size-3 mr-1" />
                      手动 {session.manual_count}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatDate(session.last_injected_at)}
                  </span>
                  <ChevronRight className="size-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                共注入{" "}
                <span className="font-medium text-foreground">{session.count}</span>{" "}
                条记忆
              </div>
            </button>
          ))
        )}
      </div>

      {!loading && filteredSessions.length > 0 && (
        <p className="text-sm text-muted-foreground">
          共 {filteredSessions.length} 个 Session
        </p>
      )}
    </div>
  )
}
