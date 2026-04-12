import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/memories',
          name: 'memories',
          component: () => import('@/views/MemoryList.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/memories/:id',
          name: 'memory-detail',
          component: () => import('@/views/MemoryDetail.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/search',
          name: 'search',
          component: () => import('@/views/SearchView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/spaces',
          name: 'spaces',
          component: () => import('@/views/SpacesView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/spaces/:id',
          name: 'space-detail',
          component: () => import('@/views/SpaceDetailView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/statistics',
          name: 'statistics',
          component: () => import('@/views/StatisticsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/graph',
          name: 'graph',
          component: () => import('@/views/GraphView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/decay',
          name: 'decay',
          component: () => import('@/views/DecayCurveView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/import',
          name: 'import',
          component: () => import('@/views/ImportView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/import/history',
          name: 'import-history',
          component: () => import('@/views/ImportHistoryView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
