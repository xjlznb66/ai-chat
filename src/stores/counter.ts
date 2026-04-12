import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

export const useChatStore = defineStore('chat', () => {
  const currentChatId = ref<string | null>(null)
  const currentMessages = ref<any[]>([])
  
  function setCurrentChatId(chatId: string | null) {
    currentChatId.value = chatId
  }
  
  function clearCurrentChatId() {
    currentChatId.value = null
  }
  
  function setMessages(messages: any[]) {
    currentMessages.value = messages
  }
  
  function addMessage(message: any) {
    currentMessages.value.push(message)
  }
  
  function updateLastMessage(content: string) {
    if (currentMessages.value.length > 0) {
      const lastIndex = currentMessages.value.length - 1
      currentMessages.value[lastIndex] = {
        ...currentMessages.value[lastIndex],
        content
      }
    }
  }
  
  function removeLastMessages(count: number = 1) {
    for (let i = 0; i < count; i++) {
      currentMessages.value.pop()
    }
  }

  return { 
    currentChatId, 
    currentMessages,
    setCurrentChatId,
    setMessages,
    addMessage,
    updateLastMessage,
    removeLastMessages
  }
})
