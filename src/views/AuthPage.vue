<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDark } from '@vueuse/core'
import { authAPI } from '../services/api.js'

const router = useRouter()
const isDark = useDark()

// 切换登录/注册模式
const isLoginMode = ref(true)

// 表单数据
const form = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

// 加载状态
const isLoading = ref(false)

// 错误信息
const errors = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

// Toast 提示
const toast = ref({
  show: false,
  message: '',
  type: 'error'
})

// 表单验证
const validateForm = () => {
  let isValid = true
  errors.value = { username: '', password: '', confirmPassword: '' }

  if (!form.value.username.trim()) {
    errors.value.username = '请输入用户名'
    isValid = false
  } else if (form.value.username.length < 3 || form.value.username.length > 20) {
    errors.value.username = '用户名长度必须在3-20个字符之间'
    isValid = false
  }

  if (!form.value.password) {
    errors.value.password = '请输入密码'
    isValid = false
  } else if (form.value.password.length < 6) {
    errors.value.password = '密码长度至少6个字符'
    isValid = false
  }

  if (!isLoginMode.value && form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

// 显示提示消息
const showToastMessage = (message, type = 'error') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// 处理注册
const handleRegister = async () => {
  if (!validateForm()) return

  isLoading.value = true
  
  try {
    const result = await authAPI.register(form.value.username, form.value.password)
    
    if (result.ok === 1) {
      showToastMessage('注册成功，正在跳转到登录页面...', 'success')
      setTimeout(() => {
        isLoginMode.value = true
        form.value = { username: '', password: '', confirmPassword: '' }
      }, 1500)
    } else {
      showToastMessage(result.msg || '注册失败')
    }
  } catch (error) {
    showToastMessage('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) return

  isLoading.value = true
  
  try {
    const result = await authAPI.login(form.value.username, form.value.password)
    
    if (result.ok === 1) {
      showToastMessage('登录成功，正在跳转...', 'success')
      setTimeout(() => {
        router.push('/ai-chat')
      }, 1500)
    } else {
      showToastMessage(result.msg || '登录失败')
    }
  } catch (error) {
    showToastMessage('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 切换模式
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  form.value = { username: '', password: '', confirmPassword: '' }
  errors.value = { username: '', password: '', confirmPassword: '' }
}

// 提交按钮禁用状态
const isSubmitDisabled = computed(() => {
  if (isLoading.value) return true
  if (!form.value.username.trim() || !form.value.password) return true
  if (!isLoginMode.value && !form.value.confirmPassword) return true
  return false
})
</script>

<template>
  <div class="auth-page" :class="{ 'dark': isDark }">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="floating-circle circle-1"></div>
      <div class="floating-circle circle-2"></div>
      <div class="floating-circle circle-3"></div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-container" :class="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- 主内容区域 -->
    <div class="auth-container">
      <!-- 左侧品牌展示 -->
      <div class="brand-section">
        <div class="brand-logo">
          <span class="logo-icon">🤖</span>
          <span class="logo-text">小精灵 AI</span>
        </div>
        <h1 class="brand-title">智能助手，为你服务</h1>
        <p class="brand-description">
          强大的AI对话能力，支持多模态交互，让你的工作效率提升百倍
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-icon">💬</span>
            <span>智能对话</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🖼️</span>
            <span>图片理解</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📄</span>
            <span>文档问答</span>
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="form-section">
        <div class="form-card">
          <!-- 标签切换 -->
          <div class="tab-switch">
            <button
              class="tab-btn"
              :class="{ active: isLoginMode }"
              @click="toggleMode"
            >
              登录
            </button>
            <button
              class="tab-btn"
              :class="{ active: !isLoginMode }"
              @click="toggleMode"
            >
              注册
            </button>
          </div>

          <!-- 表单内容 -->
          <form class="auth-form" @submit.prevent="isLoginMode ? handleLogin() : handleRegister()">
            <!-- 用户名输入 -->
            <div class="form-group">
              <label class="form-label">用户名</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  v-model="form.username"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.username }"
                  placeholder="请输入用户名"
                />
              </div>
              <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
            </div>

            <!-- 密码输入 -->
            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input
                  v-model="form.password"
                  type="password"
                  class="form-input"
                  :class="{ error: errors.password }"
                  placeholder="请输入密码"
                />
              </div>
              <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
            </div>

            <!-- 确认密码输入（注册模式） -->
            <div v-if="!isLoginMode" class="form-group">
              <label class="form-label">确认密码</label>
              <div class="input-wrapper">
                <span class="input-icon">🔑</span>
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  class="form-input"
                  :class="{ error: errors.confirmPassword }"
                  placeholder="请再次输入密码"
                />
              </div>
              <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
            </div>

            <!-- 登录/注册按钮 -->
            <button
              type="submit"
              class="submit-btn"
              :disabled="isSubmitDisabled"
            >
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else>{{ isLoginMode ? '登录' : '注册' }}</span>
            </button>
          </form>

          <!-- 分隔线 -->
          <div class="divider">
            <span class="divider-line"></span>
            <span class="divider-text">或</span>
            <span class="divider-line"></span>
          </div>

          <!-- 社交登录 -->
          <div class="social-login">
            <button class="social-btn google">
              <span class="social-icon">G</span>
              <span>使用 Google 登录</span>
            </button>
            <button class="social-btn github">
              <span class="social-icon">Github</span>
              <span>使用 GitHub 登录</span>
            </button>
          </div>

          <!-- 底部链接 -->
          <div class="bottom-links">
            <a v-if="isLoginMode" href="#" class="link">忘记密码？</a>
            <span v-else class="text">已有账号？</span>
            <button v-else class="link-btn" @click="toggleMode">立即登录</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  padding: 0;
  margin: 0;
  z-index: 999;

  &.dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;

  .floating-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.3;
    animation: float 6s ease-in-out infinite;

    &.circle-1 {
      width: 400px;
      height: 400px;
      background: rgba(255, 255, 255, 0.2);
      top: -100px;
      left: -100px;
      animation-delay: 0s;
    }

    &.circle-2 {
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.15);
      bottom: -50px;
      right: -50px;
      animation-delay: 2s;
    }

    &.circle-3 {
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      top: 50%;
      right: 20%;
      animation-delay: 4s;
    }
  }

  .dark & .floating-circle {
    background: rgba(100, 100, 255, 0.2);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* Toast 提示 */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  &.error {
    background: #fee2e2;
    color: #dc2626;
  }

  &.success {
    background: #dcfce7;
    color: #16a34a;
  }

  .toast-icon {
    font-size: 18px;
    font-weight: bold;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

/* 主内容容器 */
.auth-container {
  display: flex;
  max-width: 900px;
  width: 100%;
  gap: 40px;
  z-index: 10;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
}

/* 品牌展示区域 */
.brand-section {
  flex: 1;
  color: white;
  padding: 40px;

  @media (max-width: 768px) {
    padding: 20px;
    text-align: center;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 30px;

    .logo-icon {
      font-size: 40px;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 700;
    }
  }

  .brand-title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 16px;
    line-height: 1.3;
  }

  .brand-description {
    font-size: 16px;
    line-height: 1.6;
    opacity: 0.9;
    margin-bottom: 30px;
  }

  .feature-list {
    display: flex;
    gap: 20px;

    @media (max-width: 768px) {
      justify-content: center;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);

      .feature-icon {
        font-size: 18px;
      }

      span:last-child {
        font-size: 14px;
      }
    }
  }
}

/* 表单区域 */
.form-section {
  flex: 1;

  .form-card {
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(20px);

    .dark & {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
}

/* 标签切换 */
.tab-switch {
  display: flex;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 30px;

  .dark & {
    background: rgba(255, 255, 255, 0.1);
  }

  .tab-btn {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    background: transparent;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }

    &.active {
      background: white;
      color: #667eea;
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.2);

      .dark & {
        background: rgba(255, 255, 255, 0.15);
        color: #a5b4fc;
      }
    }
  }
}

/* 表单样式 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;

    .dark & {
      color: #e5e7eb;
    }
  }

  .input-wrapper {
    position: relative;

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      z-index: 1;
    }

    .form-input {
      width: 100%;
      padding: 14px 14px 14px 44px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.3s ease;
      background: #f9fafb;

      .dark & {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: #e5e7eb;

        &::placeholder {
          color: #6b7280;
        }
      }

      &:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);

        .dark & {
          background: rgba(255, 255, 255, 0.08);
        }
      }

      &.error {
        border-color: #ef4444;

        &:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }
    }
  }

  .error-message {
    font-size: 13px;
    color: #ef4444;
  }
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;

  .divider-line {
    flex: 1;
    height: 1px;
    background: #e5e7eb;

    .dark & {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .divider-text {
    font-size: 14px;
    color: #9ca3af;
  }
}

/* 社交登录 */
.social-login {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: #e5e7eb;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .social-icon {
      font-size: 18px;
      font-weight: bold;
    }

    &.google .social-icon {
      color: #4285f4;
    }

    &.github .social-icon {
      font-size: 16px;
      color: #333;

      .dark & {
        color: #e5e7eb;
      }
    }
  }
}

/* 底部链接 */
.bottom-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;

  .text {
    font-size: 14px;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }

  .link,
  .link-btn {
    font-size: 14px;
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: #764ba2;
      text-decoration: underline;
    }
  }
}
</style>