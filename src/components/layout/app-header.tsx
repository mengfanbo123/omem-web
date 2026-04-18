import { useAuthStore } from "@/stores/auth"
import { ThemeToggle } from "./theme-toggle"
import { MobileNav } from "./mobile-nav"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"

export function AppHeader() {
  const { users, currentUserId, logout } = useAuthStore()
  const currentUser = users.find((u) => u.id === currentUserId)

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <MobileNav />
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[120px] md:max-w-none">
          {currentUser?.name || "未登录"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">
            <User className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
