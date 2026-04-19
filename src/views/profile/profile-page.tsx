import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import apiClient from "@/api/client"
import {
  ArrowLeft,
  User,
  Sparkles,
  Lightbulb,
  BookOpen,
  Zap,
  Lock,
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
  tags: string[]
}

interface MemoriesResponse {
  memories: MemoryItem[]
  total_count: number
}

function classifyFact(fact: string): {
  type: "fact" | "preference" | "skill" | "project" | "note"
  icon: typeof Sparkles
  color: string
} {
  const lower = fact.toLowerCase()
  if (lower.includes("喜欢") || lower.includes("偏好") || lower.includes("习惯")) {
    return { type: "preference", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" }
  }
  if (lower.includes("项目") || lower.includes("工程") || lower.includes("开发")) {
    return { type: "project", icon: Zap, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" }
  }
  if (lower.includes("技能") || lower.includes("能力") || lower.includes("精通") || lower.includes("熟练")) {
    return { type: "skill", icon: Sparkles, color: "text-violet-500 bg-violet-500/10 border-violet-500/30" }
  }
  if (lower.includes("笔记") || lower.includes("记录") || lower.includes("文档")) {
    return { type: "note", icon: BookOpen, color: "text-slate-500 bg-slate-500/10 border-slate-500/30" }
  }
  return { type: "fact", icon: User, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" }
}

function formatFact(fact: string): string {
  return fact.replace(/^#+\s*/, "").trim()
}

function isPrivateByTags(tags: string[]): boolean {
  return tags.some((t) => t === "私密" || t.toLowerCase() === "private")
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [contentTagsMap, setContentTagsMap] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true)
        // 同时获取用户画像和记忆列表（带tags）
        const [profileData, memoriesData] = await Promise.all([
          apiClient.get<ProfileData>("/v1/profile"),
          apiClient.get<MemoriesResponse>("/v1/memories", {
            params: { limit: 200, offset: 0 },
          }),
        ])
        setProfile(profileData)
        // 建立 content -> tags 映射
        const map = new Map<string, string[]>()
        for (const mem of memoriesData.memories || []) {
          map.set(mem.content, mem.tags || [])
        }
        setContentTagsMap(map)
      } catch (err) {
        console.error("Failed to fetch profile:", err)
        toast.error("加载用户画像失败")
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const staticFacts = profile?.static_facts || []
  const dynamicContext = profile?.dynamic_context || []
  const hasData = staticFacts.length > 0 || dynamicContext.length > 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4 mr-1.5" />
          返回
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">用户画像</h1>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">AI 构建的用户画像</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                以下内容是从您的记忆库中自动提取的关于您的持久信息。随着您存储更多记忆，画像会越来越丰富和准确。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !hasData ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <User className="size-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">暂无画像数据</p>
            <p className="text-xs mt-1">存储更多记忆后，系统将自动构建您的用户画像</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {staticFacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-muted-foreground" />
                  静态事实
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {staticFacts.length} 条
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {staticFacts.map((fact, index) => {
                  const tags = contentTagsMap.get(fact) || []
                  const isPrivate = isPrivateByTags(tags)
                  const { type, icon: Icon, color } = isPrivate
                    ? { type: "private" as const, icon: Lock, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" }
                    : classifyFact(fact)
                  return (
                    <div key={`sf-${fact.slice(0, 30)}`}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 mt-0.5 p-1 rounded-md ${color.split(" ").slice(1).join(" ")}`}>
                          <Icon className={`size-3.5 ${color.split(" ")[0]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none">
                            {isPrivate ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                🔒 私密记忆 · 已加密
                              </span>
                            ) : (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {formatFact(fact)}
                              </ReactMarkdown>
                            )}
                          </div>
                          <Badge variant="outline" className={`mt-1.5 text-[10px] ${color}`}>
                            {type === "fact" && "事实"}
                            {type === "preference" && "偏好"}
                            {type === "skill" && "技能"}
                            {type === "project" && "项目"}
                            {type === "note" && "笔记"}
                            {type === "private" && "私密"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {dynamicContext.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4 text-muted-foreground" />
                  动态上下文
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {dynamicContext.length} 条
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dynamicContext.map((ctx, index) => (
                  <div key={`dc-${ctx.slice(0, 30)}`}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {ctx}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
