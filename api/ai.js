/**
 * AI 能力配置与调用
 * 支持 DeepSeek 和 MiniMax 大模型
 */

const BASE_URL = 'https://shufa.hegueducation.com/app-api'

const AI_CONFIG_KEY = 'aiConfig'
const AI_USAGE_KEY = 'aiUsage'

export const AI_PROVIDERS = {
  DEEPSEEK: 'deepseek',
  MINIMAX: 'minimax'
}

export const AI_MODELS = {
  DEEPSEEK: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '通用对话模型' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', description: '代码生成模型' }
  ],
  MINIMAX: [
    { id: 'abab6-chat', name: 'ABAB6 Chat', description: '通用对话模型' },
    { id: 'abab6.5s-chat', name: 'ABAB6.5S Chat', description: '高速对话模型' }
  ]
}

export function getAIConfig() {
  const config = uni.getStorageSync(AI_CONFIG_KEY)
  if (config) {
    return JSON.parse(config)
  }
  return {
    enabled: false,
    provider: AI_PROVIDERS.DEEPSEEK,
    model: 'deepseek-chat',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com'
  }
}

export function saveAIConfig(config) {
  uni.setStorageSync(AI_CONFIG_KEY, JSON.stringify(config))
  updateAIUsage({
    lastUpdate: Date.now(),
    config: config
  })
}

export function getAIUsage() {
  const usage = uni.getStorageSync(AI_USAGE_KEY)
  return usage ? JSON.parse(usage) : {
    totalCalls: 0,
    todayCalls: 0,
    lastCallDate: null,
    costEstimate: 0
  }
}

export function updateAIUsage(data) {
  const current = getAIUsage()
  const today = new Date().toDateString()
  
  if (current.lastCallDate !== today) {
    current.todayCalls = 0
    current.lastCallDate = today
  }
  
  if (data.totalCalls !== undefined) {
    current.totalCalls = data.totalCalls
  }
  if (data.todayCalls !== undefined) {
    current.todayCalls = data.todayCalls
  }
  if (data.costEstimate !== undefined) {
    current.costEstimate = data.costEstimate
  }
  
  uni.setStorageSync(AI_USAGE_KEY, JSON.stringify(current))
}

export async function callAI(messages, options = {}) {
  const config = getAIConfig()
  
  if (!config.enabled || !config.apiKey) {
    throw new Error('AI功能未启用或未配置API Key')
  }
  
  const defaultOptions = {
    model: config.model,
    temperature: 0.7,
    max_tokens: 2000,
    ...options
  }
  
  let endpoint = ''
  let requestBody = {}
  
  if (config.provider === AI_PROVIDERS.DEEPSEEK) {
    endpoint = `${config.baseUrl}/chat/completions`
    requestBody = {
      model: defaultOptions.model,
      messages: messages,
      temperature: defaultOptions.temperature,
      max_tokens: defaultOptions.max_tokens
    }
  } else if (config.provider === AI_PROVIDERS.MINIMAX) {
    endpoint = `${config.baseUrl}/v1/text/chatcompletion_pro`
    requestBody = {
      model: defaultOptions.model,
      messages: messages,
      temperature: defaultOptions.temperature,
      tokens_to_generate: defaultOptions.max_tokens
    }
  }
  
  try {
    const startTime = Date.now()
    
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: endpoint,
        method: 'POST',
        data: requestBody,
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data)
          } else {
            reject(new Error(res.data?.error?.message || 'API调用失败'))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '网络请求失败'))
        }
      })
    })
    
    const duration = Date.now() - startTime
    const usage = getAIUsage()
    usage.totalCalls++
    usage.todayCalls++
    usage.lastCallDate = new Date().toDateString()
    usage.lastLatency = duration
    updateAIUsage(usage)
    
    return parseAIResponse(response, config.provider)
    
  } catch (error) {
    console.error('AI调用失败:', error)
    throw error
  }
}

function parseAIResponse(response, provider) {
  if (provider === AI_PROVIDERS.DEEPSEEK) {
    return {
      content: response.choices?.[0]?.message?.content || '',
      usage: response.usage || {},
      model: response.model || '',
      id: response.id || ''
    }
  } else if (provider === AI_PROVIDERS.MINIMAX) {
    return {
      content: response.choices?.[0]?.text || response.choices?.[0]?.message?.content || '',
      usage: response.usage || {},
      model: response.model || '',
      id: response.id || ''
    }
  }
  
  return response
}

export async function testAIConnection() {
  const config = getAIConfig()
  
  if (!config.apiKey) {
    return { success: false, message: '请先配置API Key' }
  }
  
  try {
    await callAI([
      { role: 'user', content: '你好，请回复"测试成功"' }
    ], { max_tokens: 50 })
    
    return { success: true, message: '连接成功' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export function resetAIUsage() {
  uni.removeStorageSync(AI_USAGE_KEY)
}

export default {
  AI_PROVIDERS,
  AI_MODELS,
  getAIConfig,
  saveAIConfig,
  getAIUsage,
  updateAIUsage,
  callAI,
  testAIConnection,
  resetAIUsage
}
