<script setup>
import { RouterLink} from "vue-router";
import {onMounted, ref} from "vue";
import { chatAPI } from '../services/api.js'
import { useChatStore } from '../stores/counter'
import {useDark} from  "@vueuse/core"
const isDark = useDark()
const chatStore = useChatStore()
const isCollapsed = ref(false)
//删除历史会话
const deletemessage = async (chatId)=>{
  await chatAPI.deleteMessage('chat',chatId)
}
// 从本地存储读取折叠状态
const loadCollapseState = () => {
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState !== null) {
    isCollapsed.value = JSON.parse(savedState)
  }
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
const chatHistory = ref([])

// 开始新对话
const startNewChat = () => {
  const newChatId = Date.now().toString()
  chatStore.setCurrentChatId(newChatId)
  chatStore.setMessages([])

  const newChat = {
    id: newChatId,
    title: `新对话`
  }
  chatHistory.value = [newChat, ...chatHistory.value]
}

// 加载聊天历史
const loadChatHistory = async () => {
  try {
    const history = await chatAPI.getChatHistory('chat')
    // 反转数组，让最新的对话显示在最上面
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
const handleRefreshHistory = () => {
  loadChatHistory()
}

// 加载特定对话
const loadChat = async (chatId) => {
  chatStore.setCurrentChatId(chatId)
  try {
    const messages = await chatAPI.getChatMessages(chatId, 'chat')
    chatStore.setMessages(messages)
  } catch (error) {
    console.error('加载对话消息失败:', error)
    chatStore.setMessages([])
  }
}

onMounted(() => {
  loadCollapseState()
  loadChatHistory()
  // 监听刷新历史事件
  window.addEventListener('refreshChatHistory', handleRefreshHistory)
})
</script>

<template>
  <div class="sidebar-container" :class="{
    'dark': isDark,
    'collapsed': isCollapsed
  }">
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
          <span class="item-title" :class="{ 'hidden': isCollapsed }">{{ chat.title || '新对话' }}</span>
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

    &:hover {
      background: rgba(0, 0, 0, 0.05);
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
      transition: opacity 0.2s ease, width 0.25s ease, margin 0.25s ease;
      opacity: 1;
      width: auto;
      white-space: nowrap;
      display: inline-block;
      animation: typewriter 1s steps(20, end) forwards;

      &.hidden {
        opacity: 0;
        width: 0;
        margin-left: 0;
        animation: none;
      }
    }

    @keyframes typewriter {
      0% {
        width: 0;
      }
      100% {
        width: 100%;
      }
    }
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