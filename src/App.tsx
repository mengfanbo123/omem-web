import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginPage } from '@/views/auth/login'
import { DashboardPage } from '@/views/dashboard/dashboard'
import { MemoryListPage } from '@/views/memories/memory-list'
import { MemoryDetailPage } from '@/views/memories/memory-detail'
import { MemoryFormPage } from '@/views/memories/memory-form'
import { SpacesPage } from '@/views/spaces/spaces'
import { AnalyticsPage } from '@/views/analytics/analytics'
import { ImportPage } from '@/views/import/import-page'
import { SettingsPage } from '@/views/settings/settings-page'
import { NotFoundPage } from '@/views/error/not-found'
import { ErrorBoundary } from '@/components/error-boundary'
import { useAuthStore } from '@/stores/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="memories" element={<MemoryListPage />} />
          <Route path="memories/:id" element={<MemoryDetailPage />} />
          <Route path="memories/new" element={<MemoryFormPage />} />
          <Route path="memories/:id/edit" element={<MemoryFormPage />} />
          <Route path="spaces" element={<SpacesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
