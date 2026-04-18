import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Key, Trash2, Check, Eye, EyeOff } from "lucide-react"
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
import { maskApiKey } from "@/lib/utils"

export function LoginPage() {
  const navigate = useNavigate()
  const { users, currentUserId, addUser, setCurrentUser, removeUser } = useAuthStore()

  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const baseUrl = window.location.origin
      const client = axios.create({
        baseURL: baseUrl,
        headers: { "X-API-Key": apiKey },
        timeout: 10000,
      })

      const healthRes = await client.get("/health")
      if (healthRes.status !== 200) {
        throw new Error("health check failed")
      }

      let spaceName = "默认空间"
      const spacesRes = await client.get("/v1/spaces")
      const spaces = spacesRes.data?.spaces || []
      if (spaces.length > 0 && spaces[0].name) {
        spaceName = spaces[0].name
      }

      const newUser = {
        id: crypto.randomUUID(),
        name: spaceName,
        apiKey,
        apiUrl: baseUrl,
        lastUsed: new Date().toISOString(),
        spaceName,
      }
      addUser(newUser)
      navigate("/dashboard")
    } catch (err) {
      setError("验证失败，请检查 API Key 是否正确")
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
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="apiKey"
                      type={showPassword ? "text" : "password"}
                      placeholder="输入您的 omem API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pl-9 pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
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
                  disabled={isLoading || !apiKey}
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
                  <div
                    key={user.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectUser(user)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleSelectUser(user)
                      }
                    }}
                    className="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 transition-all hover:border-ring hover:bg-muted/50 cursor-pointer"
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
                        <p className="text-sm font-medium">{user.spaceName || user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {maskApiKey(user.apiKey)}
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
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
