import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/AuthPage.vue')
    },
    {
      path: '/ai-chat',
      name: 'AIChat',
      component: () => import('../views/AIChat.vue')
    },
    {
      path: '/comfort-simulator',
      name: 'ComfortSimulator',
      component: () => import('../views/ComfortSimulator.vue')
    },
    {
      path: '/game',
      name: 'Game',
      component: () => import('../views/GameChat.vue')
    }
  ]
})

export default router
