<script setup>
import {ref, computed, onMounted, nextTick, watch} from 'vue'
import { useDark, useToggle, useResizeObserver } from '@vueuse/core'
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  DocumentIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import WelcomePage from "../components/WelcomePage.vue";
import ChatMessage from '../components/ChatMessage.vue'
import Sidebar from "../components/Sidebar.vue";
import {chatAPI} from '../services/api.js'
import {useChatStore} from '../stores/counter'
const chatStore = useChatStore()
const isDark = useDark()
const toggleDark = useToggle(isDark)
const chatMainWrapperRef = ref(null)
const inputRef = ref(null)
const userInput = ref('')
const isStreaming = ref(false)
const fileInput = ref(null)
const selectedFiles = ref([])
// 处理欢迎页发送示例问题
const handleExampleSend = (question) => {
  userInput.value = question
  sendMessage()
}
// 获取输入区域 DOM 元素
const inputAreaRef = ref(null)

// 存储输入区域的实际高度
const inputAreaHeight = ref(0)

// 标记是否是首次发送消息
const isFirstMessage = ref(true)

// 监听输入区域高度变化，动态设置滚动容器的 padding-bottom
useResizeObserver(inputAreaRef, (entries) => {
  const entry = entries[0]
  if (entry) {
    // 获取输入区域高度，并额外增加 16px 间距（可根据需要调整）
    const newHeight = entry.contentRect.height
    inputAreaHeight.value = newHeight + 16

    // 如果当前滚动条已经接近底部，则自动滚动到底部，避免显示异常
    if (chatMainWrapperRef.value) {
      const { scrollTop, scrollHeight, clientHeight } = chatMainWrapperRef.value
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      if (isAtBottom) {
        scrollToBottom()
      }
    }
  }
})
// 使用 store 中的 currentMessages
const currentMessages = computed(() => chatStore.currentMessages)
// 添加防抖函数
const debounce = (fn, delay) => {
  let timer = null
  return function(...args) {  // 改用 function 保留 this 上下文
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)  // ✅ 现在 this 指向正确
      timer = null
    }, delay)
  }
}
// 自动调整输入框高度
const _adjustTextareaHeight = () => {
  const textarea = inputRef.value;
  if (!textarea) return;

  // 如果内容为空，重置为最小高度
  if (!userInput.value.trim()) {
    textarea.style.height = '44px';
    textarea.style.overflowY = 'hidden';
    return;
  }

  // 先重置高度为最小值，以便正确计算 scrollHeight
  textarea.style.height = 'auto';

  // 获取实际内容高度
  const scrollHeight = textarea.scrollHeight;

  // 设置最大高度限制（200px）
  const maxHeight = 200;

  if (scrollHeight > maxHeight) {
    // 超过最大高度，固定高度并显示滚动条
    textarea.style.height = `${maxHeight}px`;
    textarea.style.overflowY = 'auto';
  } else {
    // 未超过最大高度，自动增高
    textarea.style.height = `${scrollHeight}px`;
    textarea.style.overflowY = 'hidden';
  }
}
// 使用防抖包装，延迟 100ms 执行
const adjustTextareaHeight = debounce(_adjustTextareaHeight, 100)

// 滚动到底部也添加防抖（可选）
const debouncedScrollToBottom = debounce(async () => {
  await nextTick()
  if (chatMainWrapperRef.value) {
    chatMainWrapperRef.value.scrollTop = chatMainWrapperRef.value.scrollHeight
  }
}, 50)

// 修改 scrollToBottom 使用防抖版本
const scrollToBottom = async () => {
  await nextTick()
  debouncedScrollToBottom()
}
// 切换深色模式
const handleToggleDark = () => {
  toggleDark()
}

// 文件类型限制
const FILE_LIMITS = {
  image: {
    maxSize: 10 * 1024 * 1024,  // 单个文件 10MB
    maxFiles: 3,                 // 最多 3 个文件
    description: '图片文件'
  },
  audio: {
    maxSize: 10 * 1024 * 1024,  // 单个文件 10MB
    maxDuration: 180,           // 3分钟
    maxFiles: 3,                // 最多 3 个文件
    description: '音频文件'
  },
  video: {
    maxSize: 150 * 1024 * 1024, // 单个文件 150MB
    maxDuration: 40,            // 40秒
    maxFiles: 3,                // 最多 3 个文件
    description: '视频文件'
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 检查文件是否符合要求
const validateFile = async (file) => {
  const type = file.type.split('/')[0]
  const limit = FILE_LIMITS[type]

  if (!limit) {
    return {valid: false, error: '不支持的文件类型'}
  }

  if (file.size > limit.maxSize) {
    return {valid: false, error: `文件大小不能超过${limit.maxSize / 1024 / 1024}MB`}
  }

  if ((type === 'audio' || type === 'video') && limit.maxDuration) {
    try {
      const duration = await getMediaDuration(file)
      if (duration > limit.maxDuration) {
        return {
          valid: false,
          error: `${type === 'audio' ? '音频' : '视频'}时长不能超过${limit.maxDuration}秒`
        }
      }
    } catch (error) {
      return {valid: false, error: '无法读取媒体文件时长'}
    }
  }

  return {valid: true}
}

// 获取媒体文件时长
const getMediaDuration = (file) => {
  return new Promise((resolve, reject) => {
    const element = file.type.startsWith('audio/') ? new Audio() : document.createElement('video')
    element.preload = 'metadata'

    element.onloadedmetadata = () => {
      resolve(element.duration)
      URL.revokeObjectURL(element.src)
    }

    element.onerror = () => {
      reject(new Error('无法读取媒体文件'))
      URL.revokeObjectURL(element.src)
    }

    element.src = URL.createObjectURL(file)
  })
}

// 修改文件上传处理函数
const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  // 检查所有文件类型是否一致
  const firstFileType = files[0].type.split('/')[0]
  const hasInconsistentType = files.some(file => file.type.split('/')[0] !== firstFileType)

  if (hasInconsistentType) {
    alert('请选择相同类型的文件（图片、音频或视频）')
    event.target.value = ''
    return
  }

  // 验证所有文件
  for (const file of files) {
    const {valid, error} = await validateFile(file)
    if (!valid) {
      alert(error)
      event.target.value = ''
      selectedFiles.value = []
      return
    }
  }

  // 检查文件总大小
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const limit = FILE_LIMITS[firstFileType]
  if (totalSize > limit.maxSize * 3) { // 允许最多3个文件的总大小
    alert(`${firstFileType === 'image' ? '图片' : firstFileType === 'audio' ? '音频' : '视频'}文件总大小不能超过${(limit.maxSize * 3) / 1024 / 1024}MB`)
    event.target.value = ''
    selectedFiles.value = []
    return
  }

  selectedFiles.value = files
}

// 修改文件输入提示
const getPlaceholder = () => {
  if (selectedFiles.value.length > 0) {
    const type = selectedFiles.value[0].type.split('/')[0]
    const desc = FILE_LIMITS[type].description
    return `已选择 ${selectedFiles.value.length} 个${desc}，可继续输入消息...`
  }
  return '输入消息，可上传图片、音频或视频...'
}

// 修改发送消息函数
const sendMessage = async () => {
  if (isStreaming.value) return
  if (!userInput.value.trim() && !selectedFiles.value.length) return

  const messageContent = userInput.value.trim()

  // 添加用户消息到 store
  chatStore.addMessage({
    role: 'user',
    content: messageContent,
    timestamp: new Date()
  })

  // 清空输入并重置高度
  userInput.value = ''
  const textarea = inputRef.value;
  if (textarea) {
    textarea.style.height = '44px';  // 重置为最小高度
    textarea.style.overflowY = 'hidden';
  }

  await scrollToBottom()

  // 准备发送数据
  const formData = new FormData()
  formData.append('prompt', messageContent || '')

  if (selectedFiles.value.length > 0) {
    selectedFiles.value.forEach(file => {
      formData.append('files', file)
    })
  }

  // 添加助手消息占位
  chatStore.addMessage({
    role: 'assistant',
    content: '',
    timestamp: new Date()
  })
  isStreaming.value = true

  try {
    const reader = await chatAPI.sendMessage(formData, chatStore.currentChatId)
    const decoder = new TextDecoder('utf-8')
    let accumulatedContent = ''

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      accumulatedContent += chunk;
      const latestMessages = chatStore.currentMessages;
      const lastMessage = latestMessages[latestMessages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = accumulatedContent;
      }
      await nextTick();
      debouncedScrollToBottom();
    }

    // 如果是首次发送消息，刷新聊天历史以获取生成的标题
    if (chatStore.currentChatId) {
      // 延迟 1.5 秒，确保后端标题已生成
      setTimeout(async () => {
        try {
          const history = await chatAPI.getChatHistory('chat')
          const currentChat = history.find(item => item.id === chatStore.currentChatId)
          if (currentChat && currentChat.title && currentChat.title !== '新对话') {
            window.dispatchEvent(new CustomEvent('updateChatTitle', {
              detail: { chatId: chatStore.currentChatId, title: currentChat.title }
            }))
          }
        } catch (e) {
          console.warn('获取标题失败', e)
        }
        isFirstMessage.value = false
      }, 1500)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    chatStore.removeLastMessages(2)
  } finally {
    isStreaming.value = false
    selectedFiles.value = []
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    await scrollToBottom()
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 移除文件
const removeFile = (index) => {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index)
  if (selectedFiles.value.length === 0) {
    fileInput.value.value = ''  // 清空文件输入
  }
}

// 监听输入事件
const onInput = () => {
  adjustTextareaHeight();
}

// 监听消息变化，自动滚动到底部
watch(() => chatStore.currentMessages, (newMessages) => {
  if (newMessages.length > 0) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}, { deep: true })

// 监听 currentChatId 变化，重置首次消息标记
watch(() => chatStore.currentChatId, () => {
  isFirstMessage.value = true
})

onMounted(() => {
  adjustTextareaHeight()
})
</script>

<template>
  <div class="ai-chat" :class="{ 'dark': isDark }">
    <sidebar/>
    <div class="chat-container">
      <div class="chat-main-wrapper" ref="chatMainWrapperRef" :style="{ paddingBottom: inputAreaHeight + 'px' }">
        <div class="chat-main">
          <WelcomePage v-if="currentMessages.length === 0" @send="handleExampleSend" />
          <div v-else class="messages">
            <ChatMessage
                v-for="(message, index) in currentMessages"
                :key="index"
                :message="message"
                :is-stream="isStreaming && index === currentMessages.length - 1"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 固定在底部的输入区域 -->
    <div class="input-area" ref="inputAreaRef">
      <div class="input-wrapper">
        <div v-if="selectedFiles.length > 0" class="selected-files">
          <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <div class="file-info">
              <DocumentIcon class="icon"/>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">({{ formatFileSize(file.size) }})</span>
            </div>
            <button class="remove-btn" @click="removeFile(index)">
              <XMarkIcon class="icon"/>
            </button>
          </div>
        </div>

        <div class="input-row">
          <div class="top-box">
            <textarea
                v-model="userInput"
                @keydown.enter.prevent="sendMessage"
                @input="onInput"
                :placeholder="getPlaceholder()"
                rows="1"
                ref="inputRef"
            ></textarea>
          </div>
          <div class="bottom-box">
            <button @click="handleToggleDark" class="icon-btn" title="切换主题">
              <i v-if="isDark" class="iconfont icon-taiyang"></i>
              <i v-else class="iconfont icon-yueliang"></i>
            </button>
            <div class="file-upload">
              <input
                  type="file"
                  ref="fileInput"
                  @change="handleFileUpload"
                  accept="image/*,audio/*,video/*"
                  multiple
                  class="hidden"
              >
              <button
                  class="upload-btn"
                  @click="triggerFileInput"
                  :disabled="isStreaming"
              >
                <PaperClipIcon class="icon"/>
              </button>
            </div>
            <button
                class="send-button"
                @click="sendMessage"
                :disabled="isStreaming || (!userInput.trim() && !selectedFiles.length)"
            >
              <PaperAirplaneIcon class="icon"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss">
.ai-chat {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: #f5f5f5;
  overflow: hidden;

}
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-main-wrapper {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.chat-main {
  padding-left: 190px;
  padding-right: 190px;
}

.messages {
  padding: 2rem;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 280px;
  right: 0;
  padding: 1rem 2rem;
  z-index: 100;
  display: flex;
  justify-content: center;
  background: transparent;

  .input-wrapper {
    width: 100%;
    max-width: calc(100% - 380px);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .selected-files {
    max-height: 150px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 3px;
    }
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #fff;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.05);

    &:last-child {
      margin-bottom: 0;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .icon {
        width: 1.5rem;
        height: 1.5rem;
        color: #007CF0;
      }

      .file-name {
        font-size: 0.875rem;
        color: #333;
        font-weight: 500;
      }

      .file-size {
        font-size: 0.75rem;
        color: #666;
        background: rgba(0, 0, 0, 0.05);
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
      }
    }

    .remove-btn {
      padding: 0.375rem;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      color: #666;
      cursor: pointer;
      border-radius: 0.375rem;

      &:hover {
        background: #ff4d4f;
        color: #fff;
      }

      .icon {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
  }

  .input-row {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    padding: 0.75rem;
    border-radius: 2rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    background: #dddddd;
    transition: height 0.1s ease;
    flex-direction: column;

    .top-box {
      textarea {
        width: 829px;
        resize: none;
        border: none;
        background: transparent;
        padding: 0.75rem;
        color: inherit;
        font-family: inherit;
        font-size: 1rem;
        line-height: 1.5;
        max-height: 200px;
        min-height: 44px;
        overflow-y: auto;

        &:focus {
          outline: none;
        }

        &::placeholder {
          color: #999;
        }
      }
    }

    .bottom-box {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
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
      .send-button {
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 0.75rem;
        background: transparent;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: #0066cc;
          transform: translateY(-1px);
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .icon {
          width: 1.25rem;
          height: 1.25rem;
        }
      }

      .file-upload {
        .hidden {
          display: none;
        }

        .upload-btn {
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 0.75rem;
          background: rgba(0, 124, 240, 0.1);
          color: #007CF0;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover:not(:disabled) {
            background: rgba(0, 124, 240, 0.2);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
      }
    }
  }
}

// 暗色模式
.dark {
  .chat-main-wrapper {
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    background: #2a2a2a;
  }

  .input-area {
    background: transparent;
    border-top-color: rgba(255, 255, 255, 0.05);
  }

  .input-row {
    background: #1e1e1e;
  }
}

// 响应式
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .input-area {
    left: 0;
  }

  .chat-main {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .input-area .input-wrapper {
    max-width: 100%;
  }
}
</style>