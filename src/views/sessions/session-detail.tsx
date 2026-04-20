import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import apiClient from "@/api/client"
import { useVaultStore } from "@/stores/vault"
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
  Trash2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
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
  visibility?: string
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
  const safeValue = Math.max(0, Math.min(value, max))
  const percentage = (safeValue / max) * 100
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percentage.toFixed(1)}%</span>
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
  defaultExpanded,
  onDelete,
  vaultUnlocked,
}: {
  recall: SessionRecall
  memory: MemoryDetail | null
  isLast: boolean
  defaultExpanded?: boolean
  onDelete?: (id: string) => void
  vaultUnlocked?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || false)
  const isPrivate = memory?.visibility === "private"
  const isLocked = isPrivate && !vaultUnlocked

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
              {isPrivate && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="size-3 mr-1" />
                  私密
                </Badge>
              )}
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
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <BrainCircuit className="size-3" />
                    关联记忆
                  </h4>
                  <div className="flex items-center gap-2">
                    {isPrivate && isLocked && (
                      <span className="text-xs text-amber-500 flex items-center gap-1">
                        <Lock className="size-3" />
                        已加密
                      </span>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(recall.id)
                        }}
                        className="text-xs text-destructive hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="size-3" />
                        删除
                      </button>
                    )}
                  </div>
                </div>
                {memory ? (
                  <div className="rounded-md bg-muted p-3 space-y-2">
                    {isLocked ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lock className="size-4" />
                        <span>私密记忆内容已隐藏，点击上方解锁按钮查看</span>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground line-clamp-4">
                        {memory.content || memory.l0_abstract || "—"}
                      </p>
                    )}
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
                  <ScoreBar label="Query 关联度" value={recall.similarity_score} />
                  <ScoreBar label="记忆匹配度" value={recall.llm_confidence} />
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
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showVaultInput, setShowVaultInput] = useState(false)
  const [vaultPassword, setVaultPassword] = useState("")
  const [vaultError, setVaultError] = useState<string | null>(null)

  const vaultUnlocked = useVaultStore((s) => s.isUnlocked)
  const vaultUnlock = useVaultStore((s) => s.unlock)
  const vaultLock = useVaultStore((s) => s.lock)

  const PAGE_SIZE = 10
  const totalPages = Math.ceil(recalls.length / PAGE_SIZE)
  const paginatedRecalls = recalls.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (!sessionId) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const data = await apiClient.get<{
          recalls: SessionRecall[]
          limit: number
          offset: number
          memories?: MemoryDetail[]
        }>("/v1/session-recalls", {
          params: { session_id: sessionId, expand: "memories", limit: 10000 },
        })
        const list = (data?.recalls || []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        setRecalls(list)

        const map = new Map<string, MemoryDetail>()
        if (data?.memories) {
          for (const mem of data.memories) {
            map.set(mem.id, mem)
          }
        }
        setMemories(map)
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

  const handleDeleteRecall = (recallId: string) => {
    setDeleteTarget(recallId)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await apiClient.delete(`/v1/session-recalls/${deleteTarget}`)
      setRecalls((prev) => prev.filter((r) => r.id !== deleteTarget))
      toast.success("删除成功")
    } catch (err) {
      console.error("Failed to delete recall:", err)
      toast.error("删除失败")
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleVaultUnlock = async () => {
    if (!vaultPassword.trim()) {
      setVaultError("请输入密码")
      return
    }
    const isValid = await vaultUnlock(vaultPassword)
    if (!isValid) {
      setVaultError("密码错误")
      return
    }
    setVaultError(null)
    setShowVaultInput(false)
    setVaultPassword("")
  }

  const handleVaultLock = () => {
    vaultLock()
  }

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">注入时间线</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              共 {recalls.length} 条记录
            </span>
            {vaultUnlocked ? (
              <Button variant="outline" size="sm" onClick={handleVaultLock}>
                <Lock className="size-3.5 mr-1" />
                锁定 Vault
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVaultInput(!showVaultInput)}
              >
                <Unlock className="size-3.5 mr-1" />
                解锁 Vault
              </Button>
            )}
          </div>
        </div>

        {showVaultInput && (
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="输入 Vault 密码..."
                value={vaultPassword}
                onChange={(e) => {
                  setVaultPassword(e.target.value)
                  setVaultError(null)
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVaultUnlock()}
                className={vaultError ? "border-destructive flex-1" : "flex-1"}
              />
              <Button size="sm" onClick={handleVaultUnlock}>
                解锁
              </Button>
            </div>
            {vaultError && (
              <p className="text-xs text-destructive">{vaultError}</p>
            )}
          </div>
        )}

        {recalls.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            暂无注入记录
          </div>
        ) : (
          <>
            {paginatedRecalls.map((recall, index) => (
              <TimelineItem
                key={recall.id}
                recall={recall}
                memory={memories.get(recall.memory_id) || null}
                isLast={index === paginatedRecalls.length - 1 && currentPage === totalPages}
                defaultExpanded={index === 0 && currentPage === 1}
                onDelete={handleDeleteRecall}
                vaultUnlocked={vaultUnlocked}
              />
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除注入记录</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。确定要删除这条注入记录吗？
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
