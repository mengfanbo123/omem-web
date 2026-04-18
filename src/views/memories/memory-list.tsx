import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/api/client"
import { Search, ChevronLeft, ChevronRight, Lock, Unlock, Plus, Trash2, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MemoryItem {
  id: string
  content: string
  l0_abstract: string
  l1_overview: string
  l2_content: string
  category: string
  memory_type: string
  state: string
  tier: string
  importance: number
  confidence: number
  access_count: number
  tags: string[]
  scope: string
  created_at: string
  updated_at: string
}

interface MemoriesResponse {
  memories: MemoryItem[]
  total_count: number
  limit: number
  offset: number
}

const SEARCH_DEBOUNCE_MS = 300
const PRIVATE_TAG = "私密"

export function isPrivateMemory(memory: MemoryItem): boolean {
  return memory.tags?.includes(PRIVATE_TAG) || false
}

export function formatContent(content: string | undefined, maxLength: number = 120) {
  if (!content) return "—"
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + "..."
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getTierVariant(tier: string): "default" | "secondary" | "outline" {
  switch (tier?.toLowerCase()) {
    case "core":
      return "default"
    case "working":
      return "secondary"
    case "peripheral":
      return "outline"
    default:
      return "outline"
  }
}

function getTierLabel(tier: string): string {
  switch (tier?.toLowerCase()) {
    case "core":
      return "核心"
    case "working":
      return "工作区"
    case "peripheral":
      return "边缘"
    default:
      return tier || "—"
  }
}

function PrivateContent({ memory, unlocked }: { memory: MemoryItem; unlocked: boolean }) {
  if (!isPrivateMemory(memory)) {
    return (
      <p className="text-sm text-foreground line-clamp-3">
        {formatContent(memory.content || memory.l0_abstract)}
      </p>
    )
  }

  if (!unlocked) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5 text-amber-500" />
        <span>🔒 私密记忆 · 已加密</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Unlock className="h-3 w-3 text-amber-500" />
        <span className="text-xs text-amber-500 font-medium">已解锁</span>
      </div>
      <p className="text-sm text-foreground line-clamp-3">
        {formatContent(memory.content || memory.l0_abstract)}
      </p>
    </div>
  )
}

export function MemoryListPage() {
  const navigate = useNavigate()
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [vaultUnlocked, setVaultUnlocked] = useState(false)
  const [showVaultInput, setShowVaultInput] = useState(false)
  const [vaultPassword, setVaultPassword] = useState("")
  const [tierFilter, setTierFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [pageSize, setPageSize] = useState<number>(20)

  const fetchMemories = useCallback(async (pageNum: number, query: string) => {
    try {
      setLoading(true)
      setError(null)
      const offset = (pageNum - 1) * pageSize
      const params: Record<string, string | number | undefined> = {
        offset,
        limit: pageSize,
        search: query || undefined,
        sort: sortBy,
      }
      if (tierFilter !== "all") {
        params.tier = tierFilter
      }
      const response = await apiClient.get<MemoriesResponse>("/v1/memories", {
        params,
      })
      setMemories(response.memories || [])
      setTotalCount(response.total_count || 0)
    } catch (err) {
      console.error("Failed to fetch memories:", err)
      setError("加载记忆列表失败")
    } finally {
      setLoading(false)
    }
  }, [tierFilter, sortBy, pageSize])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchMemories(1, searchQuery)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchMemories])

  useEffect(() => {
    fetchMemories(page, searchQuery)
  }, [page, searchQuery, fetchMemories])

  const handleRowClick = (id: string) => {
    navigate(`/memories/${id}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page * pageSize < totalCount) setPage(page + 1)
  }

  const handleVaultUnlock = () => {
    if (vaultPassword.trim()) {
      setVaultUnlocked(true)
      setShowVaultInput(false)
      setVaultPassword("")
    }
  }

  const handleVaultLock = () => {
    setVaultUnlocked(false)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("确定要删除这条记忆吗？此操作不可撤销。")) return
    try {
      await apiClient.delete(`/v1/memories/${id}`)
      fetchMemories(page, searchQuery)
    } catch (err) {
      console.error("Failed to delete memory:", err)
      setError("删除记忆失败")
    }
  }

  const hasNext = page * pageSize < totalCount
  const hasPrev = page > 1
  const privateCount = memories.filter(isPrivateMemory).length

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">记忆列表</h1>
        <p className="text-sm text-muted-foreground">
          浏览和管理您的所有记忆
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索记忆内容..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">全部分类</option>
            <option value="core">核心</option>
            <option value="working">工作区</option>
            <option value="peripheral">边缘</option>
          </select>

          <ArrowUpDown className="size-3.5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="created_at">按时间</option>
            <option value="importance">按重要性</option>
            <option value="confidence">按置信度</option>
            <option value="access_count">按访问次数</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
        </div>

        <Button size="sm" onClick={() => navigate("/memories/new")}>
          <Plus className="size-3.5 mr-1.5" />
          新建
        </Button>

        {vaultUnlocked ? (
          <Button variant="outline" size="sm" onClick={handleVaultLock}>
            <Lock className="size-3.5 mr-1.5" />
            锁定 Vault
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVaultInput(!showVaultInput)}
          >
            <Unlock className="size-3.5 mr-1.5" />
            解锁 Vault
          </Button>
        )}
      </div>

      {showVaultInput && (
        <div className="flex items-center gap-2 max-w-md">
          <Input
            type="password"
            placeholder="输入 Vault 密码..."
            value={vaultPassword}
            onChange={(e) => setVaultPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVaultUnlock()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleVaultUnlock}>
            解锁
          </Button>
        </div>
      )}

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
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[80%]" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))
        ) : memories.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            {searchQuery ? "未找到匹配的记忆" : "暂无记忆数据"}
          </div>
        ) : (
          memories.map((memory) => (
            <button
              type="button"
              key={memory.id}
              onClick={() => handleRowClick(memory.id)}
              className={cn(
                "w-full text-left rounded-lg border p-4 cursor-pointer transition-colors",
                isPrivateMemory(memory)
                  ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <PrivateContent memory={memory} unlocked={vaultUnlocked} />
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className="font-normal text-xs">
                  {memory.category || "未分类"}
                </Badge>
                <Badge variant={getTierVariant(memory.tier)} className="text-xs">
                  {getTierLabel(memory.tier)}
                </Badge>
                {isPrivateMemory(memory) && (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-500/50 text-amber-500 bg-amber-500/10"
                  >
                    <Lock className="size-2.5 mr-1" />
                    私密
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(memory.created_at)}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(memory.id, e)}
                  className="ml-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="删除"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </button>
          ))
        )}
      </div>

      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {totalCount} 条记忆
            {privateCount > 0 && (
              <span className="ml-2 text-amber-500">
                · {privateCount} 条私密
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!hasPrev || loading}
            >
              <ChevronLeft className="size-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNext || loading}
            >
              下一页
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
