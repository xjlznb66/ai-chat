import { createRouter, createWebHistory } from 'vue-router'
import GameChat from '../views/GameChat.vue'

const routes = [
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
    name: 'game',
    component: () => import('../views/GameChat.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router