<script setup>
import { RouterLink } from "vue-router";
import { onMounted, ref, nextTick, watch } from "vue";
import { chatAPI } from '../services/api.js'
import { useChatStore } from '../stores/counter'
import { useDark } from "@vueuse/core"

const isDark = useDark()
const chatStore = useChatStore()
const isCollapsed = ref(false)
const chatHistory = ref([])
const animatingId = ref(null)
const newnowChatId = ref(null)
const showToast = ref(false)
let toastTimer = null

// 显示提示消息
const showWarningToast = (message = '当前已是新对话，请先发送消息') => {
  showToast.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// 删除历史会话
const handleDelete = async (chatId) => {
  try {
    await chatAPI.deleteMessage('chat', chatId)

    const index = chatHistory.value.findIndex(c => c.id === chatId)
    if (index !== -1) {
      chatHistory.value.splice(index, 1)
    }

    if (chatStore.currentChatId === chatId) {
      if (chatHistory.value.length > 0) {
        await loadChat(chatHistory.value[0].id)
      } else {
        startNewChat()
      }
    }
  } catch (error) {
    console.error('删除对话失败:', error)
  }
}

// 从本地存储读取折叠状态
const loadCollapseState = () => {
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState !== null) {
    isCollapsed.value = JSON.parse(savedState)
  }
}

// 检查当前对话是否有消息
const isCurrentChatEmpty = () => {
  return chatStore.currentMessages && chatStore.currentMessages.length === 0
}

// 检查对话是否已保存到后端（有消息的对话才算已保存）
const isChatReallySaved = (chatId) => {
  // 如果 chatId 不在历史记录中，说明还没保存
  const existsInHistory = chatHistory.value.some(chat => chat.id === chatId)
  if (!existsInHistory) return false

  // 检查这个对话是否有消息
  return !isCurrentChatEmpty()
}

// 清理未保存的空对话
const cleanupEmptyChat = async () => {
  const currentId = chatStore.currentChatId
  if (!currentId) return false

  // 检查对话是否有消息
  const hasMessages = !isCurrentChatEmpty()

  // 如果对话有消息，说明是已保存的对话，不清理
  if (hasMessages) return false

  // 检查是否在历史记录中
  const indexInHistory = chatHistory.value.findIndex(chat => chat.id === currentId)

  // 如果在历史记录中但没有消息，从历史记录中移除（这是未保存的空对话）
  if (indexInHistory !== -1 && !hasMessages) {
    chatHistory.value.splice(indexInHistory, 1)
  }

  // 从 store 中清除
  chatStore.setCurrentChatId(null)
  chatStore.setMessages([])
  return true
}

// 保存折叠状态到本地存储
const saveCollapseState = (state) => {
  localStorage.setItem('sidebarCollapsed', JSON.stringify(state))
}

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  saveCollapseState(isCollapsed.value)
}

// 展开侧边栏
const expandSidebar = () => {
  isCollapsed.value = false
  saveCollapseState(false)
}

// 暴露方法给父组件
defineExpose({
  expandSidebar,
  isCollapsed
})

// 开始新对话
const startNewChat = async () => {
  // 检查当前对话是否为空（无消息）
  const isEmpty = isCurrentChatEmpty()

  if (isEmpty && chatStore.currentChatId) {
    // 如果当前已经是空对话，显示提示并返回
    console.log('当前已是新对话，无需重复创建')
    showWarningToast('当前已是新对话，请先发送消息')
    return
  }

  // 清理现有的空对话
  await cleanupEmptyChat()

  const newChatId = Date.now().toString()
  newnowChatId.value = newChatId
  chatStore.setCurrentChatId(newChatId)
  chatStore.setMessages([])
}

// 触发打字动画的方法
const triggerTypewriter = (chatId) => {
  animatingId.value = chatId
}

// 动画结束回调
const onTypewriterEnd = (e) => {
  if (e.target.classList.contains('item-title')) {
    animatingId.value = null
  }
}

// 加载聊天历史1
const loadChatHistory1 = async () => {
  try {
    const history = await chatAPI.getChatHistory('chat')
    chatHistory.value = (history || []).reverse()
    if (history && history.length > 0) {
      await loadChat(history[0].id)
    } else {
      startNewChat()
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
    chatHistory.value = []
    startNewChat()
  }
}


// 监听刷新事件
const handleRefreshHistory = async () => {
  try {
    const history = await chatAPI.getChatHistory('chat')
    chatHistory.value = (history || []).reverse()
    // 不再自动 loadChat(history[0].id)
  } catch (error) {
    console.error('刷新历史列表失败:', error)
  }
}
// 新增：更新单个对话标题
const handleUpdateTitle = (event) => {
  const { chatId, title } = event.detail
  const chat = chatHistory.value.find(c => c.id === chatId)
  if (chat) {
    chat.title = title
    // 可选：添加打字动画
    nextTick(() => triggerTypewriter(chatId))
  }
}
// 加载特定对话
const loadChat = async (chatId) => {
  // 在切换对话前，先清理当前的空对话
  await cleanupEmptyChat()

  chatStore.setCurrentChatId(chatId)
  try {
    const messages = await chatAPI.getChatMessages(chatId, 'chat')
    chatStore.setMessages(messages)
  } catch (error) {
    console.error('加载对话消息失败:', error)
    chatStore.setMessages([])
  }
}

// 监听消息变化，当首次有消息时添加到本地历史
watch(() => chatStore.currentMessages, async (newMessages) => {
  if (newMessages && newMessages.length > 0 && chatStore.currentChatId) {
    const existsInHistory = chatHistory.value.some(chat => chat.id === chatStore.currentChatId)
    if (!existsInHistory) {
      const newChat = {
        id: chatStore.currentChatId,
        title: `新对话`
      }
      chatHistory.value = [newChat, ...chatHistory.value]
      nextTick(() => triggerTypewriter(chatStore.currentChatId))
    }
  }
}, { deep: true })

onMounted(() => {
  loadCollapseState()
  loadChatHistory1()
  window.addEventListener('refreshChatHistory', handleRefreshHistory)
  window.addEventListener('updateChatTitle', handleUpdateTitle)
})
</script>

<template>
  <div class="sidebar-container" :class="{
    'dark': isDark,
    'collapsed': isCollapsed
  }">
    <!-- Toast 提示 -->
    <Transition name="toast-fade">
      <div v-if="showToast" class="toast-message">
        <i class="iconfont icon-info"></i>
        <span>当前已是新对话，请先发送消息</span>
      </div>
    </Transition>

    <!-- 头部区域 -->
    <div class="sidebar-header">
      <div class="header-content">
        <RouterLink to="/" class="logo-wrapper">
          <span class="logo-text" :class="{ 'hidden': isCollapsed }">小精灵</span>
        </RouterLink>
        <div class="header-actions">
          <button @click="toggleSidebar" class="icon-btn collapse-btn" :title="isCollapsed ? '展开侧边栏' : '收起侧边栏'">
            <i :class="isCollapsed ? 'iconfont icon-shouqicebianlan' : 'iconfont icon-shouqicebianlan'"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 新对话按钮 -->
    <div class="new-chat-wrapper">
      <button class="new-chat-btn" @click="startNewChat" :title="isCollapsed ? '新对话' : ''">
        <i class="iconfont icon-jiahao"></i>
        <span class="btn-text" :class="{ 'hidden': isCollapsed }">新对话</span>
      </button>
    </div>

    <!-- 聊天历史标题 -->
    <div class="history-title-wrapper" :class="{ 'hidden': isCollapsed }">
      <h3 class="history-title">聊天记录</h3>
    </div>

    <!-- 聊天历史列表 -->
    <div class="history-list-wrapper">
      <div class="history-list">
        <div
            v-for="chat in chatHistory"
            :key="chat.id"
            class="history-item"
            :class="{
            'active': chatStore.currentChatId === chat.id,
            'collapsed': isCollapsed
          }"
            @click="loadChat(chat.id)"
            :title="isCollapsed ? (chat.title || '新对话') : ''"
        >
          <i class="iconfont icon-liaotianjilu1"></i>
          <span
              class="item-title"
              :class="{
              'hidden': isCollapsed,
              'typing': animatingId === chat.id
            }"
              @animationend="onTypewriterEnd"
          >
            {{ chat.title || '新对话' }}
          </span>
          <!-- 删除按钮 - 只在非折叠状态显示 -->
          <button
              v-if="!isCollapsed"
              @click.stop="handleDelete(chat.id)"
              :title="'删除对话'"
              class="delete-btn"
          >
            <i class="iconfont icon-shanchu"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f9fafb;
  width: 260px;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;

  &.collapsed {
    width: 72px;
  }

  &.dark {
    background: #1a1a1a;
    border-right-color: #2a2a2a;
  }
}

// Toast 提示样式
.toast-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .iconfont {
    font-size: 18px;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.dark .toast-message {
  background: rgba(30, 30, 30, 0.95);
  color: #e5e5e5;
}

// 头部区域
.sidebar-header {
  padding: 12px 12px 8px;
  flex-shrink: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
  }

  .logo-wrapper {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    white-space: nowrap;

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-right: 8px;
      transition: opacity 0.2s ease, width 0.25s ease;
      opacity: 1;
      width: auto;
      overflow: hidden;

      &.hidden {
        opacity: 0;
        width: 0;
        margin-right: 0;
      }
    }

    .logo-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #666;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .iconfont {
      font-size: 20px;
    }
  }
}

// 新对话按钮
.new-chat-wrapper {
  padding: 8px 12px;
  flex-shrink: 0;

  .new-chat-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px;
    background: #e5e7eb;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: #333;
    transition: all 0.2s ease;
    overflow: hidden;
    white-space: nowrap;

    &:hover {
      background: #d1d5db;
    }

    .iconfont {
      font-size: 18px;
      flex-shrink: 0;
    }

    .btn-text {
      margin-left: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 0.2s ease, width 0.25s ease, margin 0.25s ease;
      opacity: 1;
      width: auto;
      overflow: hidden;

      &.hidden {
        opacity: 0;
        width: 0;
        margin-left: 0;
      }
    }
  }

  .collapsed & {
    .new-chat-btn {
      padding: 10px 0;
      justify-content: center;
    }
  }
}

// 历史标题
.history-title-wrapper {
  padding: 16px 12px 8px;
  flex-shrink: 0;
  transition: opacity 0.2s ease;

  &.hidden {
    opacity: 0;
  }

  .history-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #9ca3af;
    margin: 0;
  }
}
// Toast 提示样式
.toast-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .iconfont {
    font-size: 18px;
  }
}
// 历史列表
.history-list-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;
  min-height: 0;

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .history-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    color: #4b5563;
    transition: all 0.2s ease;
    overflow: hidden;
    white-space: nowrap;
    min-height: 40px;
    position: relative;

    &:hover {
      background: rgba(0, 0, 0, 0.05);

      .delete-btn {
        opacity: 1;
      }
    }

    &.active {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;

      .iconfont {
        color: #667eea;
      }
    }

    &.collapsed {
      padding: 10px;
      justify-content: center;

    }

    .iconfont {
      font-size: 18px;
      flex-shrink: 0;
      transition: color 0.2s ease;
    }

    .item-title {
      margin-left: 12px;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 1;
      flex: 1;
      white-space: nowrap;
      display: inline-block;
      &.typing {
        animation: typing 1.5s steps(20, end) forwards;
      }

      &.hidden {
        opacity: 0;
        width: 0;
        margin-left: 0;
        animation: none;
      }
    }

    .delete-btn {
      opacity: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: transparent;
      border: none;
      color: #999;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-left: 8px;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #ef4444;
      }

      .iconfont {
        font-size: 14px;
      }
    }
  }
}

// 打字机动画
@keyframes typing {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

// 暗色模式
.dark {
  .sidebar-container {
    background: #1a1a1a;
    border-right-color: #2a2a2a;
  }

  .icon-btn {
    color: #999;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .new-chat-btn {
    background: #2a2a2a;
    color: #e5e7eb;

    &:hover {
      background: #3a3a3a;
    }
  }

  .history-title {
    color: #6b7280;
  }

  .history-item {
    color: #9ca3af;

    &:hover {
      background: rgba(255, 255, 255, 0.05);

      .delete-btn {
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f87171;
        }
      }
    }

    &.active {
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;

      .iconfont {
        color: #a78bfa;
      }
    }
  }

  .logo-text {
    background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

// 滚动条样式
.history-list-wrapper::-webkit-scrollbar {
  width: 4px;
}

.history-list-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.history-list-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
}

.dark .history-list-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>

<style lang="scss">
.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>