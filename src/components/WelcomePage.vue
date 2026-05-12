<!-- src/components/WelcomePage.vue -->
<template>
  <div class="welcome-page" :class="{ 'dark': isDark }">
    <div class="welcome-content">
      <h1 class="welcome-title">
        <span class="gradient-text">你好，我是小精灵</span>
      </h1>
      <p class="welcome-subtitle">有什么我可以帮你的吗？</p>

      <!-- DeepSeek 风格的居中输入框 -->
      <div class="center-input-wrapper">
        <div class="model-selector" aria-label="选择模型">
          <button
            v-for="option in modelOptions"
            :key="option.key"
            type="button"
            class="model-option"
            :class="{ active: selectedModelMode === option.key }"
            :title="`${option.label}: ${option.model}`"
            :disabled="disabled"
            @click="emit('update:model-mode', option.key)"
          >
            <span class="model-label">{{ option.label }}</span>
          </button>
        </div>
        <div class="center-input-container">
          <textarea
              v-model="userInput"
              @keydown.enter.prevent="handleSend"
              placeholder="输入消息开始对话..."
              rows="1"
              ref="textareaRef"
              class="center-textarea"
          ></textarea>
          <button
              class="send-btn"
              @click="handleSend"
              :disabled="!userInput.trim()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDark } from '@vueuse/core'

const isDark = useDark()
const emit = defineEmits(['send', 'update:model-mode'])
defineProps({
  modelOptions: {
    type: Array,
    default: () => []
  },
  selectedModelMode: {
    type: String,
    default: 'general'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
const userInput = ref('')
const textareaRef = ref(null)

const handleSend = () => {
  if (userInput.value.trim()) {
    emit('send', userInput.value.trim())
    userInput.value = ''
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  }
}

onMounted(() => {
  const textarea = textareaRef.value
  if (textarea) {
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
    })
  }
})
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
  margin-top: 300px;
  max-width: 800px;
  width: 100%;
  text-align: center;
}

/* DeepSeek 风格的居中输入框 */
.center-input-wrapper {
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.model-selector {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  margin-bottom: 0.75rem;
  padding: 0.25rem;
  border-radius: 0.875rem;
  background: #f3f6f8;
  border: 1px solid rgba(15, 23, 42, 0.08);
  overflow-x: auto;
}

.model-option {
  min-width: 92px;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 124, 240, 0.08);
    color: #0f172a;
  }

  &.active {
    background: #ffffff;
    color: #007CF0;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.model-label {
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

.center-input-container {
  display: flex;
  align-items: flex-end;
  background: #ffffff;
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s ease;

  &:focus-within {
    box-shadow: 0 4px 25px rgba(0, 124, 240, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 124, 240, 0.3);
  }
}

.center-textarea {
  flex: 1;
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: none;
  outline: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.5;
  background: transparent;
  color: #333;
  font-family: inherit;
  min-height: 48px;
  max-height: 150px;
  overflow-y: auto;

  &::placeholder {
    color: #9ca3af;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
}

.send-btn {
  width: 3rem;
  height: 3rem;
  margin: 0.375rem;
  border: none;
  border-radius: 1rem;
  background: linear-gradient(135deg, #007CF0, #00DFD8);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 124, 240, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

/* 暗色模式下的输入框 */
.dark {
  .model-selector {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .model-option {
    color: #d1d5db;

    &:hover:not(:disabled) {
      background: rgba(0, 124, 240, 0.16);
      color: #ffffff;
    }

    &.active {
      background: #2f3a46;
      color: #67e8f9;
      box-shadow: none;
    }
  }

  .center-input-container {
    background: #1e1e1e;
    border-color: rgba(255, 255, 255, 0.1);

    &:focus-within {
      border-color: rgba(0, 124, 240, 0.5);
    }
  }

  .center-textarea {
    color: #e5e5e5;

    &::placeholder {
      color: #6b7280;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }
  }
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

@media (max-width: 640px) {
  .welcome-content {
    margin-top: 120px;
  }

  .model-selector {
    display: flex;
    width: 100%;
  }

  .model-option {
    flex: 1 0 auto;
  }
}
</style>
