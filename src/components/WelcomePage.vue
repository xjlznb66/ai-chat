<!-- src/components/WelcomePage.vue -->
<template>
  <div class="welcome-page" :class="{ 'dark': isDark }">
    <div class="welcome-content">
      <h1 class="welcome-title">
        <span class="gradient-text">你好，我是小精灵</span>
      </h1>
      <p class="welcome-subtitle">有什么我可以帮你的吗？</p>

      <div class="example-questions">
        <div
            v-for="(item, idx) in examples"
            :key="idx"
            class="example-card"
            @click="emit('send', item.question)"
        >
          <div class="example-icon">{{ item.icon }}</div>
          <div class="example-text">{{ item.question }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDark } from '@vueuse/core'

const isDark = useDark()
const emit = defineEmits(['send'])

const examples = [
  { icon: '📘', question: '介绍一下 Vue 3 的组合式 API' },
  { icon: '💻', question: '用 Python 写一个快速排序' },
  { icon: '📚', question: '推荐几本前端进阶书籍' },
  { icon: '🎨', question: '如何设计响应式布局？' },
  { icon: '⚡', question: '解释一下事件循环机制' },
  { icon: '🔧', question: 'Vue 和 React 的主要区别' }
]
</script>

<style scoped lang="scss">
.welcome-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #ffffff;
  transition: background 0.2s;

  &.dark {
    background: #2a2a2a;
  }
}

.welcome-content {
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;

  .gradient-text {
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 3rem;
}

.dark .welcome-subtitle {
  color: #9ca3af;
}

.example-questions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.example-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  border: 1px solid #e5e7eb;

  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .example-icon {
    font-size: 1.5rem;
  }

  .example-text {
    font-size: 0.9rem;
    color: #374151;
    line-height: 1.4;
  }
}

.dark .example-card {
  background: #2d2d2d;
  border-color: #3a3a3a;

  &:hover {
    background: #3a3a3a;
  }

  .example-text {
    color: #e5e5e5;
  }
}
</style>