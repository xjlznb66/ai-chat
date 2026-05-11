<template>
  <div class="message" :class="{ 'message-user': isUser }">
    <div class="content">
      <div class="text-container">
        <button v-if="isUser" class="user-copy-button" @click="copyContent" :title="copyButtonTitle">
          <DocumentDuplicateIcon v-if="!copied" class="copy-icon" />
          <CheckIcon v-else class="copy-icon copied" />
        </button>
        <div class="text" ref="contentRef" v-if="isUser">
          {{ message.content }}
        </div>
        <div v-else class="text markdown-content" ref="contentRef">
          <div v-if="isStream" class="streaming-content">
            <div v-html="processedStreamingContent"></div>
            <span v-if="showCursor" class="typing-cursor">|</span>
          </div>
          <div v-else v-html="processedContent"></div>
        </div>
      </div>
      <div class="message-footer" v-if="!isUser">
        <button class="copy-button" @click="copyContent" :title="copyButtonTitle">
          <DocumentDuplicateIcon v-if="!copied" class="copy-icon" />
          <CheckIcon v-else class="copy-icon copied" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, nextTick, ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/vue/24/outline'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const contentRef = ref(null)
const copied = ref(false)
const copyButtonTitle = computed(() => copied.value ? '已复制' : '复制内容')

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false
})

// 处理内容
const processContent = (content) => {
  if (!content) return ''

  // 分析内容中的 think 标签
  let result = ''
  let isInThinkBlock = false
  let currentBlock = ''

  // 逐字符分析，处理 think 标签
  for (let i = 0; i < content.length; i++) {
    if (content.slice(i, i + 7) === '<think>') {
      isInThinkBlock = true
      if (currentBlock) {
        // 将之前的普通内容转换为 HTML
        result += renderMath(marked.parse(currentBlock))
      }
      currentBlock = ''
      i += 6 // 跳过 <think>
      continue
    }

    if (content.slice(i, i + 8) === '</think>') {
      isInThinkBlock = false
      // 将 think 块包装在特殊 div 中
      result += `<div class="think-block">${renderMath(marked.parse(currentBlock))}</div>`
      currentBlock = ''
      i += 7 // 跳过 </think>
      continue
    }

    currentBlock += content[i]
  }

  // 处理剩余内容
  if (currentBlock) {
    if (isInThinkBlock) {
      result += `<div class="think-block">${renderMath(marked.parse(currentBlock))}</div>`
    } else {
      result += renderMath(marked.parse(currentBlock))
    }
  }

  // 净化处理后的 HTML
  const cleanHtml = DOMPurify.sanitize(result, {
    ADD_TAGS: ['think', 'code', 'pre', 'span', 'math'],
    ADD_ATTR: ['class', 'language', 'style', 'aria-hidden']
  })
  
  // 在净化后的 HTML 中查找代码块并添加复制按钮
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = cleanHtml
  
  // 查找所有代码块
  const preElements = tempDiv.querySelectorAll('pre')
  preElements.forEach(pre => {
    const code = pre.querySelector('code')
    if (code) {
      // 创建包装器
      const wrapper = document.createElement('div')
      wrapper.className = 'code-block-wrapper'
      
      // 添加复制按钮
      const copyBtn = document.createElement('button')
      copyBtn.className = 'code-copy-button'
      copyBtn.title = '复制代码'
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="code-copy-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      `
      
      // 添加成功消息
      const successMsg = document.createElement('div')
      successMsg.className = 'copy-success-message'
      successMsg.textContent = '已复制!'
      
      // 组装结构
      wrapper.appendChild(copyBtn)
      wrapper.appendChild(pre.cloneNode(true))
      wrapper.appendChild(successMsg)
      
      // 替换原始的 pre 元素
      pre.parentNode.replaceChild(wrapper, pre)
    }
  })
  
  return tempDiv.innerHTML
}

// 修改计算属性
const processedContent = computed(() => {
  if (!props.message.content) return ''
  return processContent(props.message.content)
})

// 流式内容处理
const processedStreamingContent = computed(() => {
  if (!props.message.content) return ''
  return processContent(props.message.content)
})

// 为代码块添加复制功能
const setupCodeBlockCopyButtons = () => {
  if (!contentRef.value) return;
  
  const codeBlocks = contentRef.value.querySelectorAll('.code-block-wrapper');
  codeBlocks.forEach(block => {
    const copyButton = block.querySelector('.code-copy-button');
    const codeElement = block.querySelector('code');
    const successMessage = block.querySelector('.copy-success-message');
    
    if (copyButton && codeElement) {
      // 移除旧的事件监听器
      const newCopyButton = copyButton.cloneNode(true);
      copyButton.parentNode.replaceChild(newCopyButton, copyButton);
      
      // 添加新的事件监听器
      newCopyButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const code = codeElement.textContent || '';
          await navigator.clipboard.writeText(code);
          
          // 显示成功消息
          if (successMessage) {
            successMessage.classList.add('visible');
            setTimeout(() => {
              successMessage.classList.remove('visible');
            }, 2000);
          }
        } catch (err) {
          console.error('复制代码失败:', err);
        }
      });
    }
  });
}

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isStream: {
    type: Boolean,
    default: false
  }
})
const isUser = computed(() => props.message.role === 'user')
const showCursor = ref(false)
const cursorInterval = ref(null)

// 在内容更新后手动应用高亮和设置复制按钮
const highlightCode = async () => {
  await nextTick()
  if (contentRef.value) {
    contentRef.value.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block)
    })

    // 设置代码块复制按钮
    setupCodeBlockCopyButtons()
  }
}

// 监听流式状态和内容变化
watch(() => props.isStream, (newVal) => {
  if (newVal) {
    startCursorBlink()
  } else {
    stopCursorBlink()
  }
})

watch(() => props.message.content, () => {
  if (props.isStream) {
    highlightCode()
  }
})

// 数学公式渲染函数
const renderMath = (text) => {
  // 处理行内数学公式 $...$
  text = text.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false, displayMode: false })
    } catch (e) {
      return match
    }
  })
  
  // 处理块级数学公式 $$...$$
  text = text.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false, displayMode: true })
    } catch (e) {
      return match
    }
  })
  
  return text
}

// 闪烁光标效果
const startCursorBlink = () => {
  if (cursorInterval.value) clearInterval(cursorInterval.value)
  showCursor.value = true
  cursorInterval.value = setInterval(() => {
    showCursor.value = !showCursor.value
  }, 500)
}

const stopCursorBlink = () => {
  if (cursorInterval.value) {
    clearInterval(cursorInterval.value)
    cursorInterval.value = null
  }
  showCursor.value = false
}

// 复制内容到剪贴板
const copyContent = async () => {
  try {
    // 获取纯文本内容
    let textToCopy = props.message.content;
    
    // 如果是AI回复，需要去除HTML标签
    if (!isUser.value && contentRef.value) {
      // 创建临时元素来获取纯文本
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent.value;
      textToCopy = tempDiv.textContent || tempDiv.innerText || '';
    }
    
    await navigator.clipboard.writeText(textToCopy);
    copied.value = true;
    
    // 3秒后重置复制状态
    setTimeout(() => {
      copied.value = false;
    }, 3000);
  } catch (err) {
    console.error('复制失败:', err);
  }
}

// 监听内容变化
watch(() => props.message.content, () => {
  if (!isUser.value) {
    highlightCode()
  }
})

// 监听流式状态变化
watch(() => props.isStream, (newVal) => {
  if (!newVal && !isUser.value) {
    // 流式输出结束时重新高亮代码
    highlightCode()
  }
})

// 初始化时也执行一次
onMounted(() => {
  if (!isUser.value) {
    highlightCode()
  }
})
</script>

<style scoped lang="scss">
// DeepSeek风格设计系统（纯色版）
:root {
  --color-primary: #2563eb;        // DeepSeek蓝色
  --color-primary-light: #3b82f6;
  --color-primary-dark: #1d4ed8;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-light: #9ca3af;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-border: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06);
  --shadow-lg: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

.message {
  display: flex;
  margin-bottom: 12px;
  gap: 8px;
  animation: messageSlideIn 0.3s ease-out;

  &.message-user {
    flex-direction: row-reverse;

    .content {
      align-items: flex-end;
      
      .text-container {
        position: relative;
        
        .text {
          background: #f8fafc;
          color: #1f2937;
          border-radius: 18px 18px 18px 4px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          font-weight: 400;
        }
        
        .user-copy-button {
          position: absolute;
          left: -36px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.1);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 6px;
          opacity: 0;
          transition: all 0.2s ease;
          
          .copy-icon {
            width: 14px;
            height: 14px;
            color: #6b7280;
            transition: color 0.2s ease;
            
            &.copied {
              color: #10b981;
            }
          }
          
          &:hover {
            background: white;
            transform: translateY(-50%) scale(1.05);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        }
        
        &:hover .user-copy-button {
          opacity: 1;
        }
      }
      
      .message-footer {
        flex-direction: row-reverse;
      }
    }
  }

  .avatar {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon {
      width: 100%;
      height: 100%;
      color: #6b7280;
      padding: 4px;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: #f3f4f6;

      &.assistant {
        color: white;
        background: #2563eb;

        &:hover {
          background: #1d4ed8;
        }
      }
      
      &:hover:not(.assistant) {
        background: #e5e7eb;
      }
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 80%;
    
    .text-container {
      position: relative;
    }
    
    .message-footer {
      display: flex;
      align-items: center;
      margin-top: 4px;
      
      .time {
        font-size: 0.75rem;
        color: #9ca3af;
        font-weight: 400;
      }
      
      .copy-button {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.1);
        font-size: 0.75rem;
        color: #6b7280;
        padding: 6px 12px;
        border-radius: 16px;
        cursor: pointer;
        margin-right: auto;
        transition: all 0.2s ease;
        font-weight: 500;
        
        &:hover {
          background: white;
          color: #374151;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .copy-icon {
          width: 14px;
          height: 14px;
          transition: color 0.2s ease;
          
          &.copied {
            color: #10b981;
          }
        }
        
        .copy-text {
          font-size: 0.75rem;
          font-weight: 500;
        }
      }
    }

    .text {
      padding: 16px 20px;
      border-radius: 18px 18px 18px 4px;
      line-height: 1.1;
      white-space: pre-wrap;
      color: #1f2937;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      font-weight: 400;

      .cursor {
        animation: blink 1s infinite;
      }

      :deep(.think-block) {
        position: relative;
        padding: 0.75rem 1rem 0.75rem 1.5rem;
        margin: 0.5rem 0;
        color: #666;
        font-style: italic;
        border-left: 4px solid #ddd;
        background-color: rgba(0, 0, 0, 0.03);
        border-radius: 0 0.5rem 0.5rem 0;

        // 添加平滑过渡效果
        opacity: 1;
        transform: translateX(0);
        transition: opacity 0.3s ease, transform 0.3s ease;

        &::before {
          content: '思考';
          position: absolute;
          top: -0.75rem;
          left: 1rem;
          padding: 0 0.5rem;
          font-size: 0.75rem;
          background: #f5f5f5;
          border-radius: 0.25rem;
          color: #999;
          font-style: normal;
        }

        // 添加进入动画
        &:not(:first-child) {
          animation: slideIn 0.3s ease forwards;
        }
      }

      :deep(pre) {
        background: #f6f8fa;
        padding: 0.5rem;
        border-radius: 0.3rem;
        overflow-x: auto;
        margin: 0;
        border: 1px solid #e1e4e8;

        code {
          background: transparent;
          padding: 0;
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          tab-size: 2;
        }
      }

      :deep(.hljs) {
        color: #24292e;
        background: transparent;
      }

      :deep(.hljs-keyword) {
        color: #d73a49;
      }

      :deep(.hljs-built_in) {
        color: #005cc5;
      }

      :deep(.hljs-type) {
        color: #6f42c1;
      }

      :deep(.hljs-literal) {
        color: #005cc5;
      }

      :deep(.hljs-number) {
        color: #005cc5;
      }

      :deep(.hljs-regexp) {
        color: #032f62;
      }

      :deep(.hljs-string) {
        color: #032f62;
      }

      :deep(.hljs-subst) {
        color: #24292e;
      }

      :deep(.hljs-symbol) {
        color: #e36209;
      }

      :deep(.hljs-class) {
        color: #6f42c1;
      }

      :deep(.hljs-function) {
        color: #6f42c1;
      }

      :deep(.hljs-title) {
        color: #6f42c1;
      }

      :deep(.hljs-params) {
        color: #24292e;
      }

      :deep(.hljs-comment) {
        color: #6a737d;
      }

      :deep(.hljs-doctag) {
        color: #d73a49;
      }

      :deep(.hljs-meta) {
        color: #6a737d;
      }

      :deep(.hljs-section) {
        color: #005cc5;
      }

      :deep(.hljs-name) {
        color: #22863a;
      }

      :deep(.hljs-attribute) {
        color: #005cc5;
      }

      :deep(.hljs-variable) {
        color: #e36209;
      }
      
      // 数学公式样式
      :deep(math) {
        font-size: 1.1em;
      }
      
      :deep(.katex-display) {
        overflow-x: auto;
        overflow-y: hidden;
        margin: 0.5rem 0;
      }
    }
    
    // 流式输出样式
    .streaming-content {
      position: relative;
      display: inline-block;
      
      .typing-cursor {
        color: #666;
        font-weight: bold;
        animation: blink 1s infinite;
        margin-left: 2px;
      }
    }
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dark {
  .message {
    .avatar .icon {
      &.assistant {
        color: #fff;
        background: #4a5568;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

        &:hover {
          background: #5a6578;
          transform: scale(1.05);
        }
      }
    }

    &.message-user {
      .content .text-container {
        .text {
          background: #2d3748;
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3);
        }
        
        .user-copy-button {
          background: rgba(45, 55, 72, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          
          .copy-icon {
            color: #a0aec0;
            
            &.copied {
              color: #48bb78;
            }
          }
          
          &:hover {
            background: #2d3748;
            .copy-icon {
              color: #fff;
            }
          }
        }
      }
    }

    .content {
      .message-footer {
        .time {
          color: #a0aec0;
        }

        .copy-button {
          background: rgba(45, 55, 72, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a0aec0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

          &:hover {
            background: #2d3748;
            color: #fff;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          }
        }
      }

      .text {
        background: #2d3748;
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3);
        line-height: 1.1;
        
        :deep(.think-block) {
          background-color: rgba(255, 255, 255, 0.05);
          border-left-color: #4a5568;
          color: #a0aec0;

          &::before {
            background: #4a5568;
            color: #cbd5e0;
          }
        }

        :deep(pre) {
          background: #1a202c;
          border-color: #2d3748;

          code {
            color: #e2e8f0;
          }
        }

        :deep(.hljs) {
          color: #c9d1d9;
          background: transparent;
        }

        :deep(.hljs-keyword) {
          color: #ff7b72;
        }

        :deep(.hljs-built_in) {
          color: #79c0ff;
        }

        :deep(.hljs-type) {
          color: #ff7b72;
        }

        :deep(.hljs-literal) {
          color: #79c0ff;
        }

        :deep(.hljs-number) {
          color: #79c0ff;
        }

        :deep(.hljs-regexp) {
          color: #a5d6ff;
        }

        :deep(.hljs-string) {
          color: #a5d6ff;
        }

        :deep(.hljs-subst) {
          color: #c9d1d9;
        }

        :deep(.hljs-symbol) {
          color: #ffa657;
        }

        :deep(.hljs-class) {
          color: #f2cc60;
        }

        :deep(.hljs-function) {
          color: #d2a8ff;
        }

        :deep(.hljs-title) {
          color: #d2a8ff;
        }

        :deep(.hljs-params) {
          color: #c9d1d9;
        }

        :deep(.hljs-comment) {
          color: #8b949e;
        }

        :deep(.hljs-doctag) {
          color: #ff7b72;
        }

        :deep(.hljs-meta) {
          color: #8b949e;
        }

        :deep(.hljs-section) {
          color: #79c0ff;
        }

        :deep(.hljs-name) {
          color: #7ee787;
        }

        :deep(.hljs-attribute) {
          color: #79c0ff;
        }

        :deep(.hljs-variable) {
          color: #ffa657;
        }
      }

      &.message-user .content .text {
        background: #2d3748;
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3);
        
        // 用户消息不需要代码高亮样式，移除所有:deep选择器
        :deep(.think-block),
        :deep(pre),
        :deep(.hljs) {
          all: unset;
        }
      }
    }
  }
}

.markdown-content {
  :deep(p) {
    margin: 0;
    padding: 0;

    & + :deep(p),
    & + :deep(ul),
    & + :deep(ol) {
      margin-top: 1px;
    }

    &:first-child {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: 0;

    & + :deep(p),
    & + :deep(ul),
    & + :deep(ol) {
      margin-top: 1px;
    }
  }

  :deep(li) {
    margin: 0;
    padding: 0;

    & + :deep(li) {
      margin-top: 0;
    }
  }

  :deep(code) {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.15em 0.3em;
    border-radius: 2px;
    font-size: 0.85em;
    font-family: ui-monospace, monospace;
  }

  :deep(pre code) {
    background: transparent;
    padding: 0;
  }

  :deep(table) {
    border-collapse: collapse;
    margin: 4px 0;
    width: 100%;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid #ddd;
    padding: 4px 8px;
    text-align: left;
  }

  :deep(th) {
    background: rgba(0, 0, 0, 0.05);
  }

  :deep(blockquote) {
    margin: 4px 0;
    padding-left: 1rem;
    border-left: 4px solid #ddd;
    color: #666;
  }

  :deep(.code-block-wrapper) {
    position: relative;
    margin: 2px 0;
    border-radius: 6px;
    overflow: hidden;
    
    .code-copy-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #e6e6e6;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s, background-color 0.2s;
      z-index: 10;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .code-copy-icon {
        width: 16px;
        height: 16px;
      }
    }
    
    &:hover .code-copy-button {
      opacity: 0.8;
    }
    
    pre {
      margin: 0;
      padding: 1rem;
      background: #1e1e1e;
      overflow-x: auto;
      
      code {
        background: transparent;
        padding: 0;
        font-family: ui-monospace, monospace;
      }
    }
    
    .copy-success-message {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(74, 222, 128, 0.9);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
      z-index: 20;
      
      &.visible {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
}

.dark {
  .markdown-content {
    :deep(.code-block-wrapper) {
      .code-copy-button {
        background: rgba(255, 255, 255, 0.05);

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      }

      pre {
        background: #0d0d0d;
      }
    }

    :deep(code) {
      background: rgba(255, 255, 255, 0.1);
    }

    :deep(th),
    :deep(td) {
      border-color: #444;
    }

    :deep(th) {
      background: rgba(255, 255, 255, 0.1);
    }

    :deep(blockquote) {
      border-left-color: #444;
      color: #999;
    }
  }
}
</style>