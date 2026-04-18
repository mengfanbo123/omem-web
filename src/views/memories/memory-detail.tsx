import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import apiClient from "@/api/client"
import { useVaultStore } from "@/stores/vault"
import { ArrowLeft, Lock, Calendar, Hash, Tag, Eye, Unlock, Pencil } from "lucide-react"

interface MemoryDetail {
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
  source: string
  agent_id: string
  session_id: string
  created_at: string
  updated_at: string
}

const PRIVATE_TAG = "私密"

function isPrivateMemory(memory: MemoryDetail): boolean {
  return memory.tags?.includes(PRIVATE_TAG) || false
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

function VaultUnlock({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const isFirstTime = !useVaultStore.getState().passwordHash
  const setVaultPassword = useVaultStore((s) => s.setPassword)
  const verifyPassword = useVaultStore((s) => s.verifyPassword)

  const handleSubmit = () => {
    if (!password.trim()) return
    if (isFirstTime) {
      setVaultPassword(password)
      onUnlock()
    } else if (verifyPassword(password)) {
      setError(false)
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
      <Lock className="h-10 w-10 text-amber-500 mx-auto" />
      <h3 className="text-lg font-semibold text-amber-500">
        {isFirstTime ? "设置 Vault 密码" : "Vault 已锁定"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {isFirstTime
          ? "首次查看私密记忆，请设置 Vault 密码"
          : "此记忆已加密，请输入 Vault 密码查看"}
      </p>
      <div className="flex items-center gap-2 max-w-xs mx-auto">
        <Input
          type="password"
          placeholder={isFirstTime ? "设置密码..." : "输入密码..."}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className={error ? "border-destructive" : ""}
        />
        <Button size="sm" onClick={handleSubmit}>
          {isFirstTime ? "设置" : "解锁"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive">密码错误</p>
      )}
    </div>
  )
}

export function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [memory, setMemory] = useState<MemoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const vaultUnlocked = useVaultStore((s) => s.isUnlocked)
  const vaultLock = useVaultStore((s) => s.lock)
  const [localUnlocked, setLocalUnlocked] = useState(false)

  useEffect(() => {
    if (!id) return

    async function fetchMemory() {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<MemoryDetail>(`/v1/memories/${id}`)
        setMemory(response)
      } catch (err) {
        console.error("Failed to fetch memory:", err)
        setError("加载记忆详情失败")
      } finally {
        setLoading(false)
      }
    }

    fetchMemory()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    )
  }

  if (error || !memory) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4 mr-1.5" />
          返回
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          {error || "记忆不存在"}
        </div>
      </div>
    )
  }

  const isPrivate = isPrivateMemory(memory)
  const showContent = !isPrivate || vaultUnlocked || localUnlocked

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4 mr-1.5" />
            返回
          </Button>
          {isPrivate && (
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-500 bg-amber-500/10"
            >
              <Lock className="size-3 mr-1" />
              私密记忆
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/memories/${id}/edit`)}>
            <Pencil className="size-3.5 mr-1.5" />
            编辑
          </Button>
          {(vaultUnlocked || localUnlocked) && isPrivate && (
            <Button variant="ghost" size="sm" onClick={() => {
              vaultLock()
              setLocalUnlocked(false)
            }}>
              <Lock className="size-3.5 mr-1.5" />
              锁定
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isPrivate ? "🔒 私密记忆" : "记忆详情"}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {formatDate(memory.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            访问 {memory.access_count || 0} 次
          </span>
          <span className="flex items-center gap-1">
            <Hash className="size-3.5" />
            {memory.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">内容</h2>
            {showContent && isPrivate && (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Unlock className="size-3" />
                已解锁
              </span>
            )}
          </div>

          {showContent ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {memory.content}
              </p>
            </div>
          ) : (
            <VaultUnlock onUnlock={() => setLocalUnlocked(true)} />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Tag className="size-3.5" />
            标签
          </h2>
          <div className="flex flex-wrap gap-2">
            {memory.tags?.map((tag) => (
              <Badge
                key={tag}
                variant={tag === PRIVATE_TAG ? "default" : "outline"}
                className={
                  tag === PRIVATE_TAG
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30"
                    : ""
                }
              >
                {tag}
              </Badge>
            )) || <span className="text-sm text-muted-foreground">无标签</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">分类</span>
            <p className="text-sm font-medium">{memory.category || "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">类型</span>
            <p className="text-sm font-medium">{memory.memory_type || "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">等级</span>
            <p className="text-sm font-medium">{memory.tier || "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">重要性</span>
            <p className="text-sm font-medium">{memory.importance?.toFixed(2) || "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">置信度</span>
            <p className="text-sm font-medium">{memory.confidence?.toFixed(2) || "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">状态</span>
            <p className="text-sm font-medium">{memory.state || "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">范围</span>
            <p className="text-sm font-medium">{memory.scope || "—"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">来源</span>
            <p className="text-sm font-medium">{memory.source || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
