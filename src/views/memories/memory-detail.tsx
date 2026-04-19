import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import apiClient from "@/api/client"
import { useVaultStore } from "@/stores/vault"
import {
  isPrivateMemory,
  getTagClassName,
  getTierLabel,
  getTierBadgeClass,
  PRIVATE_TAG,
} from "@/lib/tag-utils"
import {
  ArrowLeft,
  Lock,
  Calendar,
  Hash,
  Tag,
  Eye,
  Unlock,
  Pencil,
  Layers,
  Info,
  BarChart3,
  Globe,
} from "lucide-react"

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

function VaultUnlock() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const hasPassword = useVaultStore((s) => s.hasPassword)
  const unlock = useVaultStore((s) => s.unlock)

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError("请输入密码")
      return
    }
    if (!hasPassword) {
      setError("您还没设置密码，请先设置密码")
      return
    }
    const success = await unlock(password)
    if (!success) {
      setError("密码错误")
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
      <Lock className="h-10 w-10 text-amber-500 mx-auto" />
      <h3 className="text-lg font-semibold text-amber-500">
        {hasPassword ? "Vault 已锁定" : "无法解锁"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {hasPassword
          ? "此记忆已加密，请输入 Vault 密码查看"
          : "您尚未设置 Vault 密码，请先前往设置"}
      </p>
      <div className="flex items-center gap-2 max-w-xs mx-auto">
        <Input
          type="password"
          placeholder={hasPassword ? "输入密码..." : "请先设置密码..."}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className={error ? "border-destructive" : ""}
          disabled={!hasPassword}
        />
        <Button size="sm" onClick={handleSubmit} disabled={!hasPassword}>
          解锁
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

function ContentTabs({ memory }: { memory: MemoryDetail }) {
  const levels: { key: keyof MemoryDetail; label: string }[] = [
    { key: "l0_abstract", label: "摘要" },
    { key: "l1_overview", label: "概览" },
    { key: "l2_content", label: "详情" },
    { key: "content", label: "原文" },
  ]

  const available = levels.filter((l) => {
    const v = memory[l.key]
    return v !== undefined && v !== null && String(v).trim().length > 0
  })

  const storageKey = `omem-memory-tab-${memory.id}`
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved && available.some((l) => l.key === saved)) return saved
    } catch {}
    return (
      available.find((l) => l.key === "content")?.key ||
      available.find((l) => l.key === "l2_content")?.key ||
      available[0]?.key
    )
  })

  useEffect(() => {
    if (!activeTab || !available.some((l) => l.key === activeTab)) {
      setActiveTab(available[0]?.key)
    }
  }, [available, activeTab])

  if (available.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        无内容
      </div>
    )
  }

  if (available.length === 1) {
    const content = memory[available[0].key] as string
    const isEmpty = !content || content.trim().length === 0
    return (
      <div className="rounded-lg border border-border bg-card p-4 prose prose-sm dark:prose-invert max-w-none">
        {isEmpty ? (
          <div className="text-sm text-muted-foreground">无内容</div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value)
        try {
          sessionStorage.setItem(storageKey, value)
        } catch {}
      }}
      className="w-full"
    >
      <TabsList className="mb-2">
        {available.map((l) => (
          <TabsTrigger key={l.key} value={l.key}>
            <Layers className="size-3 mr-1" />
            {l.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {available.map((l) => {
        const content = memory[l.key] as string
        const isEmpty = !content || content.trim().length === 0
        return (
          <TabsContent key={l.key} value={l.key}>
            <div className="rounded-lg border border-border bg-card p-4 prose prose-sm dark:prose-invert max-w-none">
              {isEmpty ? (
                <div className="text-sm text-muted-foreground">无内容</div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              )}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{value}</div>
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

  useEffect(() => {
    if (!id) return

    async function fetchMemory() {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<MemoryDetail>(`/v1/memories/${id}`)
        console.log("Memory detail raw response:", response)
        // 兼容后端可能返回的不同字段名
        const mapped: MemoryDetail = {
          ...response,
          l0_abstract: (response as any).l0_abstract ?? (response as any).abstract ?? "",
          l1_overview: (response as any).l1_overview ?? (response as any).overview ?? "",
          l2_content: (response as any).l2_content ?? (response as any).detail ?? "",
        }
        setMemory(mapped)
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

  const isPrivate = isPrivateMemory(memory.tags)
  const showContent = !isPrivate || vaultUnlocked

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
          <Badge
            variant="outline"
            className={getTierBadgeClass(memory.tier)}
          >
            {getTierLabel(memory.tier)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {showContent && (
            <Button variant="ghost" size="sm" onClick={() => navigate(memory.memory_type === 'insight' ? `/memories/${id}/edit-insight` : `/memories/${id}/edit`)}>
              <Pencil className="size-3.5 mr-1.5" />
              编辑
            </Button>
          )}
          {vaultUnlocked && isPrivate && (
            <Button variant="ghost" size="sm" onClick={() => {
              vaultLock()
            }}>
              <Lock className="size-3.5 mr-1.5" />
              锁定
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isPrivate && !showContent ? "🔒 私密记忆" : "记忆详情"}
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

      {showContent ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Layers className="size-4 text-muted-foreground" />
                内容
                {isPrivate && (
                  <span className="flex items-center gap-1 text-xs text-amber-500 ml-auto font-normal">
                    <Unlock className="size-3" />
                    已解锁
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContentTabs memory={memory} />
            </CardContent>
          </Card>

          {memory.tags && memory.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <Tag className="size-4 text-muted-foreground" />
                  标签
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {memory.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={getTagClassName(tag)}
                    >
                      {tag === PRIVATE_TAG && (
                        <Lock className="size-2.5 mr-1" />
                      )}
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <Info className="size-4 text-muted-foreground" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetaItem label="分类" value={memory.category || "—"} />
                <MetaItem label="类型" value={memory.memory_type || "—"} />
                <MetaItem label="状态" value={memory.state || "—"} />
                <MetaItem
                  label="等级"
                  value={
                    <Badge variant="outline" className={getTierBadgeClass(memory.tier)}>
                      {getTierLabel(memory.tier)}
                    </Badge>
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  质量指标
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetaItem
                  label="重要性"
                  value={memory.importance?.toFixed(2) ?? "—"}
                />
                <MetaItem
                  label="置信度"
                  value={memory.confidence?.toFixed(2) ?? "—"}
                />
                <MetaItem
                  label="访问次数"
                  value={memory.access_count ?? "—"}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base">
                  <Globe className="size-4 text-muted-foreground" />
                  来源信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetaItem label="来源" value={memory.source || "—"} />
                <MetaItem label="范围" value={memory.scope || "—"} />
                <MetaItem label="Agent ID" value={memory.agent_id || "—"} />
                <MetaItem label="Session ID" value={memory.session_id || "—"} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <VaultUnlock />
      )}
    </div>
  )
}
