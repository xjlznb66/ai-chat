const BASE_URL = 'http://localhost:8080'

export const authAPI = {
  // 用户注册
  async register(username, password) {
    try {
      const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      
      const response = await fetch(`${BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body,
        mode: 'cors'
      })
      
      const text = await response.text()
      let result
      try {
        result = JSON.parse(text)
      } catch {
        result = { 
          ok: response.ok ? 1 : 0, 
          msg: text || (response.ok ? '注册成功' : '注册失败'), 
          data: null 
        }
      }
      
      return result
    } catch (error) {
      return { ok: 0, msg: '网络错误: ' + error.message, data: null }
    }
  },

  // 用户登录
  async login(username, password) {
    try {
      const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      
      const response = await fetch(`${BASE_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body,
        mode: 'cors'
      })
      
      const text = await response.text()
      let result
      try {
        result = JSON.parse(text)
      } catch {
        result = { ok: response.ok ? 1 : 0, msg: text || (response.ok ? '登录成功' : '登录失败'), data: null }
      }
      
      if (result.ok === 1 && result.data) {
        localStorage.setItem('token', result.data.token)
        localStorage.setItem('userId', result.data.userId)
        localStorage.setItem('username', result.data.username)
      }
      return result
    } catch (error) {
      return { ok: 0, msg: '网络错误: ' + error.message, data: null }
    }
  },

  getUserId() {
    return localStorage.getItem('userId')
  },

  getUsername() {
    return localStorage.getItem('username')
  },

  getToken() {
    return localStorage.getItem('token')
  },

  isLoggedIn() {
    return !!localStorage.getItem('token')
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
  }
}

export const chatAPI = {
  getHeaders() {
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  },
  
  async sendMessage(data, chatId, signal) {
    try {
      const url = new URL(`${BASE_URL}/ai/chat`)
      const headers = this.getHeaders()
      
      let response
      
      if (data instanceof FormData && data.has('files')) {
        data.append('chatId', chatId)
        response = await fetch(url, {
          method: 'POST',
          headers: { ...headers },
          body: data,
          signal: signal,
          mode: 'cors'
        })
      } else {
        const prompt = data instanceof FormData ? data.get('prompt') : ''
        const body = new URLSearchParams()
        body.append('prompt', prompt || '')
        body.append('chatId', chatId)
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body,
          signal: signal,
          mode: 'cors'
        })
      }
      
      if (response.status === 401) {
        const errorText = await response.text()
        throw new Error('未登录，请先登录')
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }
      
      return response.body.getReader()
    } catch (error) {
      throw error
    }
  },

  async sendTextMessage(prompt, chatId) {
    try {
      const headers = this.getHeaders()
      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `prompt=${encodeURIComponent(prompt)}&chatId=${encodeURIComponent(chatId)}`,
        mode: 'cors'
      })

      if (response.status === 401) {
        const errorText = await response.text()
        throw new Error(errorText || '未登录，请先登录')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      throw error
    }
  },

  async deleteMessage(type = 'chat', chatId) {
    const headers = this.getHeaders()
    const url = `${BASE_URL}/ai/history/${type}/${chatId}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: headers,
      mode: 'cors'
    })

    if (response.status === 401) {
      const errorText = await response.text()
      throw new Error(errorText || '未登录，请先登录')
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return true
  },

  async getChatHistory(type = 'chat') {
    try {
      const headers = this.getHeaders()
      
      if (!headers['Authorization']) {
        return []
      }
      
      const response = await fetch(`${BASE_URL}/ai/history/${type}`, {
        headers: headers,
        mode: 'cors'
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        return []
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.ok === 1 && result.data) {
        return result.data.map(chat => ({
          id: chat.chatId,
          title: chat.title || `对话 ${chat.chatId.slice(-6)}`
        }))
      }
      return []
    } catch (error) {
      return []
    }
  },

  async getChatMessages(chatId, type = 'chat') {
    try {
      const headers = this.getHeaders()
      
      if (!headers['Authorization']) {
        return []
      }
      
      const response = await fetch(`${BASE_URL}/ai/history/${type}/${chatId}`, {
        headers: headers,
        mode: 'cors'
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        return []
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('getChatMessages 返回数据:', JSON.stringify(result))
      if (result.ok === 1 && result.data) {
        return result.data.map(msg => ({
          ...msg,
          timestamp: new Date()
        }))
      }
      return []
    } catch (error) {
      return []
    }
  },

  async createSession(type = 'chat', chatId) {
    try {
      const headers = this.getHeaders()
      const response = await fetch(`${BASE_URL}/ai/history/${type}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId }),
        mode: 'cors'
      })
      return await response.json()
    } catch (error) {
      return { ok: 0, msg: '网络错误', data: null }
    }
  },

  async sendGameMessage(prompt, chatId) {
    try {
      const headers = this.getHeaders()
      const response = await fetch(`${BASE_URL}/ai/game`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `prompt=${encodeURIComponent(prompt)}&chatId=${encodeURIComponent(chatId)}`,
        mode: 'cors'
      })

      if (response.status === 401) {
        const errorText = await response.text()
        throw new Error(errorText || '未登录，请先登录')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      throw error
    }
  }
}