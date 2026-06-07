/**
 * 认证相关 API
 * 基于 SpringBoot 芋道 web 框架
 * 基础地址：https://shufa.hegueducation.com/app-api
 */

const BASE_URL = 'https://shufa.hegueducation.com/app-api'

const TENANT_ID = '121'

const TOKEN_KEY = 'token'

function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_INFO_KEY = 'userInfo'

let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

function onRefreshFailed() {
  refreshSubscribers.forEach(cb => cb(null))
  refreshSubscribers = []
  logout()
}

export function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync(TOKEN_KEY)
    
    const header = {
      'Content-Type': 'application/json',
      'tenant-id': TENANT_ID,
      ...options.header
    }
    
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    
    uni.request({
      url: options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: header,
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data)
          } else if (res.data.code === 401) {
            handleTokenExpired(options, resolve, reject)
          } else {
            reject({
              code: res.data.code,
              msg: res.data.msg || '请求失败'
            })
          }
        } else {
          reject({
            code: res.statusCode,
            msg: '网络请求失败'
          })
        }
      },
      fail: (err) => {
        reject({
          code: -1,
          msg: err.errMsg || '网络连接失败'
        })
      }
    })
  })
}

async function handleTokenExpired(options, resolve, reject) {
  if (isRefreshing) {
    subscribeTokenRefresh((token) => {
      if (token) {
        request(options).then(resolve).catch(reject)
      } else {
        reject({ code: 401, msg: '登录已过期，请重新登录' })
        uni.navigateTo({ url: '/pages/user/register' })
      }
    })
  } else {
    isRefreshing = true
    try {
      const newToken = await refreshToken()
      if (newToken) {
        onRefreshed(newToken)
        request(options).then(resolve).catch(reject)
      } else {
        onRefreshFailed()
        reject({ code: 401, msg: '登录已过期，请重新登录' })
        uni.navigateTo({ url: '/pages/user/register' })
      }
    } catch (error) {
      onRefreshFailed()
      reject({ code: 401, msg: '登录已过期，请重新登录' })
      uni.navigateTo({ url: '/pages/user/register' })
    } finally {
      isRefreshing = false
    }
  }
}

async function refreshToken() {
  const refreshToken = uni.getStorageSync(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    return null
  }
  
  try {
    const res = await new Promise((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}/member/auth/refresh-token`,
        method: 'POST',
        data: { refreshToken },
        header: { 
          'Content-Type': 'application/json',
          'tenant-id': TENANT_ID
        },
        success: resolve,
        fail: reject
      })
    })
    
    if (res.statusCode === 200 && res.data.code === 0) {
      const newToken = res.data.data?.accessToken || res.data.data?.token
      if (newToken) {
        uni.setStorageSync(TOKEN_KEY, newToken)
        if (res.data.data?.refreshToken) {
          uni.setStorageSync(REFRESH_TOKEN_KEY, res.data.data.refreshToken)
        }
        return newToken
      }
    }
    return null
  } catch (error) {
    return null
  }
}

export const weixinMiniAppLogin = (data) => {
  return new Promise((resolve, reject) => {
    const requestData = {
      loginCode: data.loginCode,
      state: generateState()
    }
    
    if (data.phoneCode) {
      requestData.phoneCode = data.phoneCode
    } else if (data.encryptedData && data.iv) {
      requestData.encryptedData = data.encryptedData
      requestData.iv = data.iv
    }
    
    console.log('发送登录请求:', {
      url: `${BASE_URL}/member/auth/weixin-mini-app-login`,
      data: requestData,
      header: {
        'Content-Type': 'application/json',
        'tenant-id': TENANT_ID
      }
    })
    
    uni.request({
      url: `${BASE_URL}/member/auth/weixin-mini-app-login`,
      method: 'POST',
      data: requestData,
      header: {
        'Content-Type': 'application/json',
        'tenant-id': TENANT_ID
      },
      success: (res) => {
        console.log('登录接口响应:', {
          statusCode: res.statusCode,
          data: res.data
        })
        
        if (res.statusCode === 200 && res.data) {
          if (res.data.code === 0) {
            const token = res.data.data?.accessToken || res.data.data?.token
            if (token) {
              uni.setStorageSync(TOKEN_KEY, token)
            }
            if (res.data.data?.refreshToken) {
              uni.setStorageSync(REFRESH_TOKEN_KEY, res.data.data.refreshToken)
            }
            resolve(res.data)
          } else {
            reject({
              code: res.data.code,
              msg: res.data.msg || '登录失败'
            })
          }
        } else {
          reject({
            code: res.statusCode,
            msg: '网络请求失败'
          })
        }
      },
      fail: (err) => {
        console.error('登录接口失败:', err)
        reject({
          code: -1,
          msg: err.errMsg || '网络连接失败'
        })
      }
    })
  })
}

export const weixinLogin = () => {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        resolve(res.code)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export const checkLoginStatus = () => {
  const token = uni.getStorageSync(TOKEN_KEY)
  return !!token
}

export const logout = () => {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(REFRESH_TOKEN_KEY)
  uni.removeStorageSync(USER_INFO_KEY)
}

export const getUserInfo = () => {
  return uni.getStorageSync(USER_INFO_KEY)
}

export const setUserInfo = (userInfo) => {
  uni.setStorageSync(USER_INFO_KEY, userInfo)
}

export const getToken = () => {
  return uni.getStorageSync(TOKEN_KEY)
}

export const getRefreshToken = () => {
  return uni.getStorageSync(REFRESH_TOKEN_KEY)
}

export const getAuthHeader = () => {
  const token = uni.getStorageSync(TOKEN_KEY)
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

export const getWeixinPhoneNumber = (cloudID) => {
  return new Promise((resolve, reject) => {
    uni.requestSubscribeMessage({
      tmplIds: [],
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
