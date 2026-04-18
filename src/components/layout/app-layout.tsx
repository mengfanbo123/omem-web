import { Outlet } from "react-router-dom"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { AppFooter } from "./app-footer"

export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <div className="hidden md:flex">
        <AppSidebar />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  )
}
