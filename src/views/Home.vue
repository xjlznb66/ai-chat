<template>
  <main class="home-shell" :class="{ dark: isDark }">
    <header class="topbar">
      <RouterLink to="/" class="brand" aria-label="返回首页">
        <span class="brand-mark">
          <SparklesIcon aria-hidden="true" />
        </span>
        <span>
          <strong>小精灵 AI</strong>
          <small>应用中心</small>
        </span>
      </RouterLink>

      <nav class="top-actions" aria-label="用户操作">
        <div v-if="isLoggedIn" class="user-chip">
          <UserCircleIcon aria-hidden="true" />
          <span>{{ username }}</span>
          <button type="button" class="ghost-button" @click="handleLogout">
            <ArrowLeftOnRectangleIcon aria-hidden="true" />
            <span>退出</span>
          </button>
        </div>

        <RouterLink v-else to="/login" class="primary-button">
          <UserCircleIcon aria-hidden="true" />
          <span>登录</span>
        </RouterLink>
      </nav>
    </header>

    <section class="hero-section" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow">
          <Squares2X2Icon aria-hidden="true" />
          AI 工作台
        </p>
        <h1 id="home-title">把常用 AI 工具放在一个清晰入口里</h1>
        <p class="hero-text">
          面向对话、练习和后续扩展的应用中心，登录后可保留你的使用状态与历史数据。
        </p>

        <div class="hero-actions">
          <RouterLink to="/ai-chat" class="primary-button large">
            <ChatBubbleLeftRightIcon aria-hidden="true" />
            <span>开始聊天</span>
          </RouterLink>
          <RouterLink to="/game" class="secondary-button large">
            <HeartIcon aria-hidden="true" />
            <span>进入模拟器</span>
          </RouterLink>
        </div>
      </div>

      <div class="status-panel" aria-label="平台状态">
        <div class="status-card accent-blue">
          <BoltIcon aria-hidden="true" />
          <span>快速响应</span>
          <strong>实时对话</strong>
        </div>
        <div class="status-card accent-green">
          <ShieldCheckIcon aria-hidden="true" />
          <span>账号状态</span>
          <strong>{{ isLoggedIn ? '已登录' : '未登录' }}</strong>
        </div>
        <div class="status-card accent-rose">
          <HeartIcon aria-hidden="true" />
          <span>练习模式</span>
          <strong>可用</strong>
        </div>
      </div>
    </section>

    <section class="apps-section" aria-labelledby="apps-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow muted">
            <Squares2X2Icon aria-hidden="true" />
            可用应用
          </p>
          <h2 id="apps-title">选择要打开的工具</h2>
        </div>
        <span class="app-count">{{ aiApps.length }} 个应用</span>
      </div>

      <div class="apps-grid">
        <RouterLink
          v-for="app in aiApps"
          :key="app.id"
          :to="app.route"
          class="app-card"
          :class="app.tone"
        >
          <span class="app-icon">
            <component :is="app.icon" aria-hidden="true" />
          </span>
          <span class="app-content">
            <span class="app-title">{{ app.title }}</span>
            <span class="app-description">{{ app.description }}</span>
          </span>
          <ArrowRightIcon class="app-arrow" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useDark } from '@vueuse/core'
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import { authAPI } from '../services/api.js'

const isDark = useDark()
const isLoggedIn = ref(false)
const username = ref('')

const refreshUserState = () => {
  isLoggedIn.value = authAPI.isLoggedIn()
  username.value = authAPI.getUsername() || '用户'
}

const handleLogout = () => {
  authAPI.logout()
  refreshUserState()
}

onMounted(refreshUserState)

const aiApps = [
  {
    id: 'chat',
    title: 'AI 聊天',
    description: '多模态对话、文件理解与连续问答。',
    route: '/ai-chat',
    icon: ChatBubbleLeftRightIcon,
    tone: 'tone-blue'
  },
  {
    id: 'game',
    title: '哄哄模拟器',
    description: '用对话练习更自然的沟通表达。',
    route: '/game',
    icon: HeartIcon,
    tone: 'tone-rose'
  }
]
</script>

<style scoped lang="scss">
.home-shell {
  min-height: 100vh;
  color: #152033;
  background:
    radial-gradient(circle at 15% 10%, rgba(80, 162, 255, 0.16), transparent 28rem),
    linear-gradient(135deg, #f7fbff 0%, #f3f6f4 48%, #fff7f5 100%);
  padding: 24px clamp(18px, 4vw, 56px) 56px;
}

.topbar,
.hero-section,
.apps-section {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
}

.brand,
.top-actions,
.user-chip,
.hero-actions,
.section-heading,
.app-card {
  display: flex;
  align-items: center;
}

.brand {
  gap: 12px;
  color: inherit;
  text-decoration: none;
  padding: 0;

  &:hover {
    background: transparent;
  }

  strong,
  small {
    display: block;
    line-height: 1.2;
  }

  strong {
    font-size: 18px;
    font-weight: 800;
  }

  small {
    margin-top: 3px;
    color: #6b778c;
    font-size: 12px;
  }
}

.brand-mark,
.app-icon {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #ffffff;
  background: linear-gradient(135deg, #1868db, #10b981);
  box-shadow: 0 12px 30px rgba(24, 104, 219, 0.2);

  svg {
    width: 22px;
    height: 22px;
  }
}

.top-actions {
  justify-content: flex-end;
  gap: 10px;
}

.user-chip {
  min-height: 44px;
  gap: 10px;
  padding: 6px 6px 6px 12px;
  border: 1px solid rgba(21, 32, 51, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 12px 28px rgba(21, 32, 51, 0.08);

  > svg {
    width: 22px;
    height: 22px;
    color: #1868db;
  }

  > span {
    max-width: 150px;
    overflow: hidden;
    color: #334155;
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.primary-button,
.secondary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;

  svg {
    width: 19px;
    height: 19px;
  }

  &:hover {
    transform: translateY(-1px);
  }
}

.primary-button {
  padding: 0 16px;
  color: #ffffff;
  background: #1868db;
  box-shadow: 0 14px 26px rgba(24, 104, 219, 0.22);

  &:hover {
    background: #1558ba;
  }
}

.secondary-button {
  padding: 0 16px;
  color: #123047;
  border-color: rgba(18, 48, 71, 0.14);
  background: rgba(255, 255, 255, 0.76);

  &:hover {
    border-color: rgba(24, 104, 219, 0.28);
    box-shadow: 0 14px 28px rgba(21, 32, 51, 0.1);
  }
}

.ghost-button {
  min-height: 32px;
  padding: 0 12px;
  color: #46556a;
  border: 0;
  background: rgba(21, 32, 51, 0.06);

  &:hover {
    color: #152033;
    background: rgba(21, 32, 51, 0.1);
  }
}

.large {
  min-height: 48px;
  padding: 0 18px;
  border-radius: 12px;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.72fr);
  gap: clamp(24px, 5vw, 60px);
  align-items: center;
  padding: clamp(54px, 9vw, 104px) 0 clamp(38px, 7vw, 76px);
}

.hero-copy {
  max-width: 720px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  color: #1868db;
  font-size: 13px;
  font-weight: 900;

  svg {
    width: 18px;
    height: 18px;
  }

  &.muted {
    margin-bottom: 8px;
    color: #6b778c;
  }
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  max-width: 760px;
  color: #102033;
  font-size: clamp(38px, 7vw, 76px);
  font-weight: 900;
  line-height: 1.03;
}

.hero-text {
  max-width: 590px;
  margin-top: 22px;
  color: #506078;
  font-size: 18px;
  line-height: 1.8;
}

.hero-actions {
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.status-panel {
  display: grid;
  gap: 14px;
}

.status-card {
  display: grid;
  grid-template-columns: 46px 1fr;
  grid-template-areas:
    "icon label"
    "icon value";
  column-gap: 14px;
  align-items: center;
  min-height: 108px;
  padding: 22px;
  border: 1px solid rgba(21, 32, 51, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 24px 48px rgba(21, 32, 51, 0.09);

  svg {
    grid-area: icon;
    width: 46px;
    height: 46px;
    padding: 10px;
    border-radius: 8px;
    color: #ffffff;
  }

  span {
    grid-area: label;
    color: #6b778c;
    font-size: 13px;
    font-weight: 800;
  }

  strong {
    grid-area: value;
    color: #102033;
    font-size: 20px;
    font-weight: 900;
  }
}

.accent-blue svg {
  background: #1868db;
}

.accent-green svg {
  background: #10b981;
}

.accent-rose svg {
  background: #e5487b;
}

.apps-section {
  padding-top: 10px;
}

.section-heading {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    color: #102033;
    font-size: clamp(24px, 4vw, 34px);
    font-weight: 900;
  }
}

.app-count {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-radius: 999px;
  color: #46556a;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(21, 32, 51, 0.08);
  font-size: 13px;
  font-weight: 800;
}

.apps-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.app-card {
  position: relative;
  gap: 16px;
  min-height: 150px;
  padding: 22px;
  border: 1px solid rgba(21, 32, 51, 0.08);
  border-radius: 8px;
  color: inherit;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 18px 40px rgba(21, 32, 51, 0.08);
  text-decoration: none;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(24, 104, 219, 0.24);
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 26px 50px rgba(21, 32, 51, 0.13);

    .app-arrow {
      transform: translateX(3px);
      opacity: 1;
    }
  }
}

.app-icon {
  width: 54px;
  height: 54px;
  border-radius: 8px;

  svg {
    width: 28px;
    height: 28px;
  }
}

.tone-blue .app-icon {
  color: #1868db;
  background: rgba(24, 104, 219, 0.1);
}

.tone-rose .app-icon {
  color: #e5487b;
  background: rgba(229, 72, 123, 0.1);
}

.app-content {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.app-title {
  color: #102033;
  font-size: 20px;
  font-weight: 900;
}

.app-description {
  max-width: 450px;
  color: #5a6880;
  font-size: 14px;
  line-height: 1.7;
}

.app-arrow {
  width: 22px;
  height: 22px;
  margin-left: auto;
  color: #8190a5;
  opacity: 0.72;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.dark {
  color: #e7edf7;
  background:
    radial-gradient(circle at 20% 10%, rgba(56, 189, 248, 0.16), transparent 28rem),
    linear-gradient(135deg, #101820 0%, #151b24 52%, #241720 100%);

  .brand small,
  .hero-text,
  .app-description,
  .status-card span,
  .app-count,
  .eyebrow.muted {
    color: #9aa8bb;
  }

  .brand,
  h1,
  h2,
  .app-title,
  .status-card strong {
    color: #f6f8fb;
  }

  .user-chip,
  .secondary-button,
  .status-card,
  .app-card,
  .app-count {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.07);
    box-shadow: 0 22px 46px rgba(0, 0, 0, 0.22);
  }

  .user-chip > span {
    color: #e7edf7;
  }

  .secondary-button {
    color: #e7edf7;
  }

  .ghost-button {
    color: #d5deeb;
    background: rgba(255, 255, 255, 0.08);
  }

  .app-card:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(96, 165, 250, 0.34);
  }
}

@media (max-width: 860px) {
  .hero-section {
    grid-template-columns: 1fr;
    padding-top: 42px;
  }

  .status-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .status-card {
    grid-template-columns: 1fr;
    grid-template-areas:
      "icon"
      "label"
      "value";
    min-height: 140px;
  }

  .apps-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .home-shell {
    padding: 16px 14px 36px;
  }

  .topbar,
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .top-actions,
  .user-chip,
  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .user-chip {
    justify-content: space-between;
    border-radius: 12px;
  }

  .hero-actions {
    flex-direction: column;
  }

  h1 {
    font-size: 40px;
  }

  .hero-text {
    font-size: 16px;
  }

  .status-panel {
    grid-template-columns: 1fr;
  }

  .status-card {
    min-height: 96px;
    grid-template-columns: 46px 1fr;
    grid-template-areas:
      "icon label"
      "icon value";
  }

  .app-card {
    align-items: flex-start;
    min-height: 164px;
  }

  .app-arrow {
    align-self: center;
  }
}
</style>
