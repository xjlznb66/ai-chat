<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useRouter, } from 'vue-router'
import { ref } from 'vue'
const router = useRouter()

// 添加全局状态来跟踪当前路由
const currentRoute = ref(router.currentRoute.value.path)

// 添加全局路由守卫
router.beforeEach((to, from, next) => {
  currentRoute.value = to.path
  next()
})
</script>
<template>
    <div :class="{ 'auth-page-active': currentRoute === '/login' }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
</template>

<style lang="scss">
:root {
  --bg-color: #f5f5f5;
  --text-color: #333;
}

.dark {
  --bg-color: #1a1a1a;
  --text-color: #fff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-y: auto;
  // 全局滚动条样式
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  .dark ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-color);
  background: var(--bg-color);
  min-height: 100vh;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 登录页面全屏显示 */
.auth-page-active {
  body {
    background: transparent !important;
  }
  
  min-height: 100vh;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }
}
</style>