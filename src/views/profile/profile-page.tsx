import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import apiClient from "@/api/client"
import { useVaultStore } from "@/stores/vault"
import {
  ArrowLeft,
  User,
  Sparkles,
  Lightbulb,
  BookOpen,
  Zap,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

interface ProfileData {
  dynamic_context: string[]
  search_results: string[] | null
  static_facts: string[]
}

interface MemoryItem {
  id: string
  content: string
  l2_content: string
  tags: string[]
}

interface MemoriesResponse {
  memories: MemoryItem[]
  total_count: number
}

type FactType = "fact" | "preference" | "skill" | "project" | "note" | "private"

function classifyFact(fact: string): {
  type: FactType
  icon: typeof Sparkles
  color: string
  label: string
} {
  const lower = fact.toLowerCase()
  if (lower.includes("喜欢") || lower.includes("偏好") || lower.includes("习惯")) {
    return {
      type: "preference",
      icon: Lightbulb,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      label: "偏好",
    }
  }
  if (lower.includes("项目") || lower.includes("工程") || lower.includes("开发")) {
    return {
      type: "project",
      icon: Zap,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
      label: "项目",
    }
  }
  if (
    lower.includes("技能") ||
    lower.includes("能力") ||
    lower.includes("精通") ||
    lower.includes("熟练")
  ) {
    return {
      type: "skill",
      icon: Sparkles,
      color: "text-violet-500 bg-violet-500/10 border-violet-500/30",
      label: "技能",
    }
  }
  if (lower.includes("笔记") || lower.includes("记录") || lower.includes("文档")) {
    return {
      type: "note",
      icon: BookOpen,
      color: "text-slate-500 bg-slate-500/10 border-slate-500/30",
      label: "笔记",
    }
  }
  return {
    type: "fact",
    icon: User,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    label: "事实",
  }
}

function getPrivateMeta() {
  return {
    type: "private" as FactType,
    icon: Lock,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    label: "私密",
  }
}

function formatFact(fact: string): string {
  return fact.replace(/^#+\s*/, "").trim()
}

function isPrivateByTags(tags: string[]): boolean {
  return tags.some((t) => t === "私密" || t.toLowerCase() === "private")
}

function ExpandableMarkdown({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setIsOverflowing(el.scrollHeight > el.clientHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <div className={`relative ${!expanded ? "max-h-60 overflow-hidden" : ""}`}>
        <div ref={ref} className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {!expanded && isOverflowing && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>
      {isOverflowing && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-auto py-1 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3 mr-1" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="size-3 mr-1" />
              展开
            </>
          )}
        </Button>
      )}
    </>
  )
}

const CATEGORIES = [
  { key: "全部", label: "全部", icon: BookOpen },
  { key: "fact", label: "事实", icon: User },
  { key: "preference", label: "偏好", icon: Lightbulb },
  { key: "skill", label: "技能", icon: Sparkles },
  { key: "project", label: "项目", icon: Zap },
  { key: "private", label: "私密", icon: Lock },
] as const

export function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [contentMemoryMap, setContentMemoryMap] = useState<Map<string, MemoryItem>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)
  const vaultUnlock = useVaultStore((s) => s.unlock)
  const vaultHasPassword = useVaultStore((s) => s.hasPassword)
  const [unlockingFact, setUnlockingFact] = useState<string | null>(null)
  const [unlockPassword, setUnlockPassword] = useState("")
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlockedFacts, setUnlockedFacts] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string>("全部")

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true)
        const [profileData, memoriesData] = await Promise.all([
          apiClient.get<ProfileData>("/v1/profile"),
          apiClient.get<MemoriesResponse>("/v1/memories", {
            params: { limit: 200, offset: 0 },
          }),
        ])
        setProfile(profileData)
        const map = new Map<string, MemoryItem>()
        for (const mem of memoriesData.memories || []) {
          map.set(mem.content, mem)
        }
        setContentMemoryMap(map)
      } catch (err) {
        console.error("Failed to fetch profile:", err)
        toast.error("加载用户画像失败")
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const handleFactClick = (fact: string) => {
    if (unlockedFacts.has(fact)) return
    if (!vaultHasPassword) {
      toast.error("您还没设置密码，请先设置密码")
      return
    }
    setUnlockingFact(fact)
    setUnlockPassword("")
    setUnlockError(null)
  }

  const handleUnlockSubmit = async () => {
    if (!unlockPassword.trim()) {
      setUnlockError("请输入密码")
      return
    }
    const success = await vaultUnlock(unlockPassword)
    if (!success) {
      setUnlockError("密码错误")
      return
    }
    if (unlockingFact) {
      setUnlockedFacts((prev) => new Set(prev).add(unlockingFact))
    }
    setUnlockingFact(null)
    setUnlockPassword("")
    setUnlockError(null)
  }

  const staticFacts = profile?.static_facts || []
  const dynamicContext = profile?.dynamic_context || []

  const factsWithMeta = useMemo(() => {
    return staticFacts.map((fact) => {
      const memory = contentMemoryMap.get(fact)
      const tags = memory?.tags || []
      const isPrivate = isPrivateByTags(tags)
      const meta = isPrivate ? getPrivateMeta() : classifyFact(fact)
      return { fact, memory, isPrivate, meta }
    })
  }, [staticFacts, contentMemoryMap])

  const stats = useMemo(() => {
    const s = { fact: 0, preference: 0, skill: 0, project: 0, private: 0 }
    for (const { isPrivate, meta } of factsWithMeta) {
      if (isPrivate) {
        s.private++
      } else if (meta.type === "note") {
        s.fact++
      } else if (meta.type === "fact") {
        s.fact++
      } else {
        s[meta.type]++
      }
    }
    return s
  }, [factsWithMeta])

  const filteredFacts = useMemo(() => {
    if (activeCategory === "全部") return factsWithMeta
    return factsWithMeta.filter(({ meta, isPrivate }) => {
      if (activeCategory === "private") return isPrivate
      if (activeCategory === "fact") return meta.type === "fact" || meta.type === "note"
      return meta.type === activeCategory
    })
  }, [factsWithMeta, activeCategory])

  const hasData = staticFacts.length > 0 || dynamicContext.length > 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4 mr-1.5" />
          返回
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 text-white p-6 md:p-8">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              用户画像
            </h1>
            <p className="text-slate-300 text-sm md:text-base mb-2">
              🧠 AI 构建的用户画像
            </p>
            <p className="text-slate-400 text-xs md:text-sm mb-6 max-w-xl">
              ✨ 以下内容是从您的记忆库中自动提取的关于您的持久信息。随着您存储更多记忆，画像会越来越丰富和准确。
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  label: "事实",
                  count: stats.fact,
                  icon: User,
                  color: "bg-emerald-500/20 text-emerald-300",
                },
                {
                  label: "偏好",
                  count: stats.preference,
                  icon: Lightbulb,
                  color: "bg-amber-500/20 text-amber-300",
                },
                {
                  label: "技能",
                  count: stats.skill,
                  icon: Sparkles,
                  color: "bg-violet-500/20 text-violet-300",
                },
                {
                  label: "项目",
                  count: stats.project,
                  icon: Zap,
                  color: "bg-blue-500/20 text-blue-300",
                },
                {
                  label: "私密",
                  count: stats.private,
                  icon: Lock,
                  color: "bg-amber-500/20 text-amber-300",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${s.color}`}
                >
                  <s.icon className="size-4" />
                  <span className="text-sm font-medium">
                    {s.count} {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-slate-500/20 rounded-full blur-3xl" />
        </div>
      )}

      {loading ? (
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <Skeleton key={c.key} className="h-9 w-16 rounded-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key
            return (
              <Button
                key={cat.key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`rounded-full ${
                  isActive
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : ""
                }`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <cat.icon className="size-3.5 mr-1.5" />
                {cat.label}
              </Button>
            )
          })}
          {unlockedFacts.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setUnlockedFacts(new Set())}
            >
              <Lock className="size-3.5 mr-1.5" />
              重新锁定
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : !hasData ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <User className="size-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">暂无画像数据</p>
            <p className="text-xs mt-1">
              存储更多记忆后，系统将自动构建您的用户画像
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {filteredFacts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFacts.map(({ fact, memory, isPrivate, meta }) => {
                const Icon = meta.icon
                const displayContent =
                  isPrivate && unlockedFacts.has(fact)
                    ? memory?.l2_content || formatFact(fact)
                    : formatFact(fact)

                return (
                  <Card
                    key={`sf-${fact.slice(0, 40)}`}
                    className="relative overflow-hidden transition-all hover:shadow-md"
                  >
                    {isPrivate && !unlockedFacts.has(fact) && unlockingFact !== fact && (
                      <button
                        type="button"
                        className="absolute inset-0 backdrop-blur-md bg-white/40 dark:bg-black/40 rounded-lg flex flex-col items-center justify-center gap-2 z-10 cursor-pointer hover:bg-white/50 dark:hover:bg-black/50 transition-colors border-none"
                        onClick={() => handleFactClick(fact)}
                      >
                        <Lock className="size-8 text-amber-500" />
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          私密记忆 · 已加密
                        </p>
                        <p className="text-xs text-muted-foreground">
                          点击解锁
                        </p>
                      </button>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            meta.color.split(" ").slice(1, 3).join(" ")
                          }`}
                        >
                          <Icon
                            className={`size-5 ${meta.color.split(" ")[0]}`}
                          />
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${meta.color}`}
                        >
                          {meta.label}
                        </Badge>
                      </div>
                      <ExpandableMarkdown content={displayContent} />
                      {isPrivate && !unlockedFacts.has(fact) && unlockingFact === fact && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="password"
                              placeholder="输入 Vault 密码..."
                              value={unlockPassword}
                              onChange={(e) => {
                                setUnlockPassword(e.target.value)
                                setUnlockError(null)
                              }}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleUnlockSubmit()
                              }
                              className={
                                unlockError ? "border-destructive" : ""
                              }
                            />
                            <Button size="sm" onClick={handleUnlockSubmit}>
                              <Unlock className="size-4 mr-1" />
                              解锁
                            </Button>
                          </div>
                          {unlockError && (
                            <p className="text-xs text-destructive">
                              {unlockError}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {filteredFacts.length === 0 && activeCategory !== "全部" && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p className="text-sm">该分类下暂无内容</p>
              </CardContent>
            </Card>
          )}

          {dynamicContext.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <Clock className="size-5 text-indigo-500" />
                  动态上下文
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {dynamicContext.length} 条记录
                </Badge>
              </div>
              <div className="relative pl-8 space-y-5">
                <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-indigo-500 via-violet-400 to-transparent rounded-full" />
                {dynamicContext.map((ctx, index) => {
                  const ctxMeta = classifyFact(ctx)
                  const CtxIcon = ctxMeta.icon
                  return (
                    <div
                      key={`dc-${ctx.slice(0, 50)}`}
                      className="relative group"
                    >
                      <div className="absolute -left-8 top-2 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 ring-4 ring-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-[10px] font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <Card className="overflow-hidden border-l-4 border-l-indigo-400 hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/50">
                            <div className={`p-1 rounded-md ${ctxMeta.color.split(" ").slice(1, 3).join(" ")}`}>
                              <CtxIcon className={`size-3.5 ${ctxMeta.color.split(" ")[0]}`} />
                            </div>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ctxMeta.color}`}>
                              {ctxMeta.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              上下文 #{index + 1}
                            </span>
                          </div>
                          <div className="px-4 py-3">
                            <ExpandableMarkdown content={formatFact(ctx)} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
