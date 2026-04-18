import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Key, Globe, Plus, Trash2, Check } from "lucide-react"
import { useAuthStore } from "@/stores/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppFooter } from "@/components/layout/app-footer"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

interface FormData {
  name: string
  apiKey: string
  apiUrl: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { users, currentUserId, addUser, setCurrentUser, removeUser } = useAuthStore()

  const [formData, setFormData] = useState<FormData>({
    name: "",
    apiKey: "",
    apiUrl: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // 验证 API Key 和连接
      const baseUrl = formData.apiUrl.trim() || window.location.origin
      const response = await axios.get(`${baseUrl}/health`, {
        headers: {
          "X-API-Key": formData.apiKey,
        },
      })

      if (response.status === 200) {
        // 保存用户
        const newUser = {
          id: crypto.randomUUID(),
          name: formData.name || "未命名账号",
          apiKey: formData.apiKey,
          apiUrl: baseUrl,
          lastUsed: new Date().toISOString(),
        }
        addUser(newUser)
        navigate("/dashboard")
      }
    } catch (err) {
      setError("验证失败，请检查 API Key 和 URL 是否正确")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectUser = (user: typeof users[0]) => {
    setCurrentUser(user.id)
    navigate("/dashboard")
  }

  const handleRemoveUser = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeUser(id)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold">登录 omem</CardTitle>
            <CardDescription>
              输入 API Key 以访问您的记忆库
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">账号名称</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="例如：个人账号、工作账号"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="输入您的 omem API Key"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    className="pl-9"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL（可选）</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="apiUrl"
                    type="text"
                    placeholder="留空使用默认 /"
                    value={formData.apiUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, apiUrl: e.target.value })
                    }
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.apiKey}
              >
                {isLoading ? "验证中..." : "验证并登录"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {users.length > 0 && (
          <Card>
            <CardHeader className="space-y-2 pb-3">
              <CardTitle className="text-base font-medium">
                已保存的账号
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelectUser(user)
                    }
                  }}
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-ring hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        currentUserId === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentUserId === user.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.apiUrl || "/"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveUser(e, user.id)
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {users.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Plus className="h-4 w-4" />
            <span>上方表单可添加新账号</span>
          </div>
        )}
      </div>
      </div>
      <AppFooter />
    </div>
  )
}
