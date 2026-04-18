import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"
import { ThemeToggle } from "./theme-toggle"
import { MobileNav } from "./mobile-nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Shield, ChevronDown } from "lucide-react"

export function AppHeader() {
  const navigate = useNavigate()
  const { users, currentUserId, logout } = useAuthStore()
  const currentUser = users.find((u) => u.id === currentUserId)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <MobileNav />
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[120px] md:max-w-none">
          {currentUser?.spaceName || currentUser?.name || "未登录"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                <User className="h-3.5 w-3.5" />
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{currentUser?.spaceName || "用户"}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {currentUser?.apiKey ? `${currentUser.apiKey.slice(0, 8)}...` : "未登录"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="size-4 mr-2" />
              个人中心
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Shield className="size-4 mr-2" />
              系统设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
