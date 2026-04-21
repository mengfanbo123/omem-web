import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import apiClient from "@/api/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Clock, Inbox, ChevronRight, Zap, MousePointerClick, Trash2, ChevronLeft, Lock } from "lucide-react"

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
  visibility?: string
  tags?: string[]
}

interface SessionGroup {
  session_id: string
  count: number
  last_injected_at: string
  auto_count: number
  manual_count: number
  latest_query: string
  has_private: boolean
}

const PAGE_SIZE = 20

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
  if (sessionId.length <= 16) return sessionId
  return sessionId.slice(0, 8) + "..." + sessionId.slice(-8)
}

export function SessionListPage() {
  const navigate = useNavigate()
  const [recalls, setRecalls] = useState<SessionRecall[]>([])
  const [memories, setMemories] = useState<Map<string, MemoryDetail>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecalls() {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.get<{
          recalls: SessionRecall[]
          limit: number
          offset: number
          memories?: MemoryDetail[]
        }>("/v1/session-recalls?limit=10000&expand=memories")
        setRecalls(data?.recalls || [])

        const map = new Map<string, MemoryDetail>()
        if (data?.memories) {
          for (const mem of data.memories) {
            map.set(mem.id, mem)
          }
        }
        setMemories(map)
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
      const memory = memories.get(recall.memory_id)
        const isPrivate =
          memory?.visibility === "private" ||
          (memory?.tags || []).some((t) => t === "私密" || t.toLowerCase() === "private")
      if (existing) {
        existing.count += 1
        if (new Date(recall.created_at) > new Date(existing.last_injected_at)) {
          existing.last_injected_at = recall.created_at
          existing.latest_query = recall.query_text
        }
        if (recall.recall_type === "auto") {
          existing.auto_count += 1
        } else {
          existing.manual_count += 1
        }
        if (isPrivate) {
          existing.has_private = true
        }
      } else {
        groups.set(recall.session_id, {
          session_id: recall.session_id,
          count: 1,
          last_injected_at: recall.created_at,
          auto_count: recall.recall_type === "auto" ? 1 : 0,
          manual_count: recall.recall_type === "manual" ? 1 : 0,
          latest_query: recall.query_text,
          has_private: isPrivate,
        })
      }
    }
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.last_injected_at).getTime() - new Date(a.last_injected_at).getTime()
    )
  }, [recalls, memories])

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.trim().toLowerCase()
    return sessions.filter((s) => 
      s.session_id.toLowerCase().includes(q) ||
      s.latest_query.toLowerCase().includes(q)
    )
  }, [sessions, searchQuery])

  const totalPages = Math.ceil(filteredSessions.length / PAGE_SIZE)
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredSessions.slice(start, start + PAGE_SIZE)
  }, [filteredSessions, currentPage])

  const handleRowClick = (sessionId: string) => {
    navigate(`/sessions/${encodeURIComponent(sessionId)}`)
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(sessionId)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const sessionRecalls = recalls.filter(r => r.session_id === deleteTarget)
      await Promise.all(sessionRecalls.map(r => 
        apiClient.delete(`/v1/session-recalls/${r.id}`)
      ))
      setRecalls(prev => prev.filter(r => r.session_id !== deleteTarget))
      toast.success("删除成功")
    } catch (err) {
      console.error("Failed to delete session recalls:", err)
      toast.error("删除失败")
    } finally {
      setDeleteTarget(null)
    }
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
            placeholder="搜索 Session ID 或对话内容..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && filteredSessions.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-3" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
            {currentPage}/{totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-3" />
          </Button>
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
        ) : paginatedSessions.length === 0 ? (
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
          paginatedSessions.map((session) => (
            <button
              type="button"
              key={session.session_id}
              onClick={() => handleRowClick(session.session_id)}
              className="w-full text-left rounded-lg border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-muted/50 group relative"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded shrink-0">
                    {shortSessionId(session.session_id)}
                  </code>
                  {session.has_private && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Lock className="size-3 mr-1" />
                      私密
                    </Badge>
                  )}
                  {session.latest_query && (
                    <span className="text-xs text-muted-foreground truncate max-w-[300px] sm:max-w-[400px] lg:max-w-[500px]">
                      {session.latest_query}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                  <span className="text-xs flex items-center gap-1 whitespace-nowrap">
                    <Clock className="size-3.5" />
                    {formatDate(session.last_injected_at)}
                  </span>
                  <ChevronRight className="size-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-normal">
                    <Zap className="size-3 mr-1" />
                    自动 {session.auto_count}
                  </Badge>
                  {session.manual_count > 0 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      <MousePointerClick className="size-3 mr-1" />
                      手动 {session.manual_count}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    共 <span className="font-medium text-foreground">{session.count}</span> 条
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteSession(session.session_id, e)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </button>
          ))
        )}
      </div>

      {!loading && filteredSessions.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {filteredSessions.length} 个 Session
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除 Session</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。将删除 Session {deleteTarget ? shortSessionId(deleteTarget) : ""} 的所有注入记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}