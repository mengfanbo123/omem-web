import { useEffect, useState } from "react"
import { toast } from "sonner"
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
import { useNavigate, useSearchParams } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/api/client"
import { Search, ChevronLeft, ChevronRight, Lock, Unlock, Plus, Trash2, SlidersHorizontal, ArrowUpDown, RotateCcw, X, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVaultStore } from "@/stores/vault"
import {
  isPrivateMemory,
  getTagClassName,
  getTierLabel,
  getTierVariant,
} from "@/lib/tag-utils"

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

interface SearchResultItem {
  memory: MemoryItem
  score: number
}

interface SearchResponse {
  results: SearchResultItem[]
  trace?: unknown
}

const SEARCH_DEBOUNCE_MS = 300

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

function PrivateContent({ memory, unlocked }: { memory: MemoryItem; unlocked: boolean }) {
  if (!isPrivateMemory(memory.tags)) {
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
  const [searchParams, setSearchParams] = useSearchParams()

  const getParam = (key: string, defaultValue: string) => searchParams.get(key) || defaultValue
  const getNumParam = (key: string, defaultValue: number) => {
    const v = searchParams.get(key)
    return v ? parseInt(v, 10) : defaultValue
  }

  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(getNumParam("page", 1))
  const [searchQuery, setSearchQuery] = useState(getParam("q", ""))
  const [totalCount, setTotalCount] = useState(0)
  const vaultUnlocked = useVaultStore((s) => s.isUnlocked)
  const vaultLock = useVaultStore((s) => s.lock)
  const vaultUnlock = useVaultStore((s) => s.unlock)
  const [showVaultInput, setShowVaultInput] = useState(false)
  const [vaultPassword, setVaultPassword] = useState("")
  const [vaultError, setVaultError] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState(getParam("tier", "all"))
  const [sortBy, setSortBy] = useState(getParam("sort", "created_at"))
  const [pageSize, setPageSize] = useState(getNumParam("size", 20))
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'global' | 'private'>(getParam("privacy", "all") as 'all' | 'global' | 'private')
  const [debouncedQuery, setDebouncedQuery] = useState(getParam("q", ""))

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setDebouncedQuery(searchQuery)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function loadMemories() {
      try {
        setLoading(true)
        setError(null)
        const offset = (page - 1) * pageSize
        if (debouncedQuery.trim()) {
          const searchParams: Record<string, string | number | undefined> = {
            q: debouncedQuery.trim(),
            offset,
            limit: pageSize,
            sort: sortBy,
            min_score: 0,
          }
          if (tierFilter !== "all") {
            searchParams.tier = tierFilter
          }
          if (visibilityFilter === "private") {
            searchParams.tags = "私密"
          } else if (visibilityFilter === "global") {
            searchParams.visibility = "global"
          }
          const searchResponse = await apiClient.get<SearchResponse>("/v1/memories/search", {
            params: searchParams,
          })
          setMemories(searchResponse.results?.map((r) => r.memory) || [])
          setTotalCount(searchResponse.results?.length || 0)
        } else {
          const params: Record<string, string | number | undefined> = {
            offset,
            limit: pageSize,
            sort: sortBy,
          }
          if (tierFilter !== "all") {
            params.tier = tierFilter
          }
          if (visibilityFilter === "private") {
            params.tags = "私密"
          } else if (visibilityFilter === "global") {
            params.visibility = "global"
          }
          const response = await apiClient.get<MemoriesResponse>("/v1/memories", {
            params,
          })
          setMemories(response.memories || [])
          setTotalCount(response.total_count || 0)
        }
      } catch (err) {
        console.error("Failed to fetch memories:", err)
        setError("加载记忆列表失败")
      } finally {
        setLoading(false)
      }
    }

    loadMemories()
  }, [page, debouncedQuery, tierFilter, sortBy, pageSize, visibilityFilter])

  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set("page", String(page))
    if (searchQuery) params.set("q", searchQuery)
    if (tierFilter !== "all") params.set("tier", tierFilter)
    if (sortBy !== "created_at") params.set("sort", sortBy)
    if (pageSize !== 20) params.set("size", String(pageSize))
    if (visibilityFilter !== "all") params.set("privacy", visibilityFilter)
    setSearchParams(params, { replace: true })
  }, [page, searchQuery, tierFilter, sortBy, pageSize, visibilityFilter, setSearchParams])

  const handleRowClick = (id: string) => {
    navigate(`/memories/${id}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const activeFilters = [
    searchQuery ? { label: `搜索: "${searchQuery}"`, onClear: () => setSearchQuery("") } : null,
    tierFilter !== "all" ? { label: `分类: ${tierFilter}`, onClear: () => setTierFilter("all") } : null,
    sortBy !== "created_at" ? { label: `排序: ${sortBy}`, onClear: () => setSortBy("created_at") } : null,
    visibilityFilter !== "all" ? { label: visibilityFilter === "private" ? "仅私密" : "仅普通", onClear: () => setVisibilityFilter("all") } : null,
  ].filter(Boolean) as { label: string; onClear: () => void }[]

  const handleResetFilters = () => {
    setSearchQuery("")
    setTierFilter("all")
    setSortBy("created_at")
    setVisibilityFilter("all")
    setPage(1)
  }

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page * pageSize < totalCount) setPage(page + 1)
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

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const targetId = deleteTarget
    const previousMemories = memories

    setMemories((prev) => prev.filter((m) => m.id !== targetId))
    setIsDeleting(true)

    try {
      await apiClient.delete(`/v1/memories/${targetId}`)
      toast.success("记忆已删除")
      setDeleteTarget(null)

      const remainingCount = previousMemories.filter((m) => m.id !== targetId).length
      if (remainingCount === 0 && page > 1) {
        setPage(page - 1)
      }
      // page变化会自动触发useEffect重新加载
    } catch (err) {
      console.error("Failed to delete memory:", err)
      toast.error("删除失败，请重试")
      setMemories(previousMemories)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const hasNext = page * pageSize < totalCount
  const hasPrev = page > 1
  const totalPages = Math.ceil(totalCount / pageSize)

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

          <Lock className="size-3.5 text-muted-foreground" />
          <select
            value={visibilityFilter}
            onChange={(e) => { setVisibilityFilter(e.target.value as 'all' | 'global' | 'private'); setPage(1) }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">全部记忆</option>
            <option value="global">普通记忆</option>
            <option value="private">私密记忆</option>
          </select>

          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-3.5 mr-1" />
              重置筛选
            </Button>
          )}
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

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">活跃筛选:</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={filter.onClear}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {filter.label}
              <X className="size-3" />
            </button>
          ))}
        </div>
      )}

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

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && memories.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            共 {totalCount} 条记忆
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePreviousPage}
              disabled={!hasPrev || loading}
            >
              <ChevronLeft className="size-3" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNextPage}
              disabled={!hasNext || loading}
            >
              <ChevronRight className="size-3" />
            </Button>
          </div>
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
          <div className="rounded-lg border border-border bg-card p-12 text-center space-y-4">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery || visibilityFilter !== 'all' || tierFilter !== 'all'
                  ? "未找到匹配的记忆"
                  : "暂无记忆数据"}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchQuery || visibilityFilter !== 'all' || tierFilter !== 'all'
                  ? "尝试调整筛选条件或清除搜索"
                  : "开始记录您的第一条记忆吧"}
              </p>
            </div>
            {activeFilters.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                <RotateCcw className="size-3.5 mr-1.5" />
                清除筛选
              </Button>
            )}
          </div>
        ) : (
          memories.map((memory) => (
            <button
              type="button"
              key={memory.id}
              onClick={() => handleRowClick(memory.id)}
              className={cn(
                "w-full text-left rounded-lg border p-4 cursor-pointer transition-colors",
                isPrivateMemory(memory.tags)
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
                {isPrivateMemory(memory.tags) && (
                  <Badge
                    variant="outline"
                    className={getTagClassName("私密", "text-xs")}
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
                  onClick={(e) => handleDeleteClick(memory.id, e)}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !isDeleting) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除记忆</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条记忆吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)} disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
