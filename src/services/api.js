const BASE_URL = 'http://localhost:8080'

export const chatAPI = {
  // 发送聊天消息
  async sendMessage(data, chatId) {
    try {
      const url = new URL(`${BASE_URL}/ai/chat`)
      if (chatId) {
        url.searchParams.append('chatId', chatId)
      }
      
      const response = await fetch(url, {
        method: 'POST',
        body: data instanceof FormData ? data : 
          new URLSearchParams({ prompt: data })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },
  //删除历史会话
  async deleteMessage(type = 'char', chatId  ){
    try {
      const url = new URL(`${BASE_URL}/ai/chat/${type}/${chatId}`)
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 获取聊天历史列表
  async getChatHistory(type = 'chat') {
    try {
      // 使用新的 sessions 接口获取带标题的数据
      const response = await fetch(`${BASE_URL}/ai/history/${type}/sessions`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const sessions = await response.json()
      // 直接使用后端返回的标题
      return sessions.map(session => ({
        id: session.chatId,
        title: session.title || `对话 ${session.chatId.slice(-6)}`  // 降级处理
      }))
    } catch (error) {
      console.error('API Error:', error)
      return []
    }
  },


  // 获取特定对话的消息历史
  async getChatMessages(chatId, type = 'chat') {  // 添加类型参数
    try {
      const response = await fetch(`${BASE_URL}/ai/history/${type}/${chatId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const messages = await response.json()
      // 添加时间戳
      return messages.map(msg => ({
        ...msg,
        timestamp: new Date() // 由于后端没有提供时间戳，这里临时使用当前时间
      }))
    } catch (error) {
      console.error('API Error:', error)
      return []
    }
  },

  // 发送游戏消息
  async sendGameMessage(prompt, chatId) {
    try {
      const response = await fetch(`${BASE_URL}/ai/game?prompt=${encodeURIComponent(prompt)}&chatId=${chatId}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 发送客服消息
  async sendServiceMessage(prompt, chatId) {
    try {
      const response = await fetch(`${BASE_URL}/ai/service?prompt=${encodeURIComponent(prompt)}&chatId=${chatId}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 发送 PDF 问答消息
  async sendPdfMessage(prompt, chatId) {
    try {
      const response = await fetch(`${BASE_URL}/ai/pdf/chat?prompt=${encodeURIComponent(prompt)}&chatId=${chatId}`, {
        method: 'GET',
        // 确保使用流式响应
        signal: AbortSignal.timeout(30000) // 30秒超时
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // 返回可读流
      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }
}