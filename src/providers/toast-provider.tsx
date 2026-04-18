import { createContext, useContext, useCallback } from "react"
import { toast as sonnerToast } from "sonner"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useCallback((message: string, type: ToastType = "info") => {
    switch (type) {
      case "success":
        sonnerToast.success(message)
        break
      case "error":
        sonnerToast.error(message)
        break
      case "warning":
        sonnerToast.warning(message)
        break
      default:
        sonnerToast(message)
    }
  }, [])

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast(msg, "success"),
    error: (msg) => toast(msg, "error"),
    info: (msg) => toast(msg, "info"),
    warning: (msg) => toast(msg, "warning"),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
