<template>
  <view class="container">
    <view class="login-form">
      <text class="title">用户登录</text>
      <text class="subtitle">使用微信快速登录</text>
      
      <view class="wechat-login">
        <button 
          class="wechat-btn" 
          open-type="getPhoneNumber" 
          @getphonenumber="onGetPhoneNumber"
          :disabled="isLoggingIn"
        >
          <text class="wechat-icon">📱</text>
          <text class="wechat-text">{{ isLoggingIn ? '登录中...' : '微信手机号一键登录' }}</text>
        </button>
        <text class="login-tip">登录后将自动创建账号</text>
      </view>
      
      <view class="agreement">
        <text class="agreement-text">登录即表示同意</text>
        <text class="agreement-link" @tap="showUserAgreement">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link" @tap="showPrivacyPolicy">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script>
import { weixinMiniAppLogin, weixinLogin, setUserInfo } from '@/api/auth.js'

export default {
  data() {
    return {
      isLoggingIn: false
    };
  },
  methods: {
    async onGetPhoneNumber(e) {
      console.log('=== getPhoneNumber 事件触发 ===')
      console.log('完整事件对象:', JSON.stringify(e))
      console.log('e.detail.errMsg:', e.detail.errMsg)
      console.log('e.detail.code:', e.detail.code)
      console.log('e.detail.encryptedData:', e.detail.encryptedData ? '存在' : '不存在')
      
      if (!e.detail) {
        console.error('e.detail 为空')
        uni.showToast({ 
          title: '授权数据异常', 
          icon: 'none',
          duration: 3000
        })
        return
      }
      
      if (e.detail.errMsg === 'getPhoneNumber:ok') {
        const loginData = {}
        
        if (e.detail.code) {
          console.log('使用 code 方式登录')
          loginData.phoneCode = e.detail.code
        } else if (e.detail.encryptedData && e.detail.iv) {
          console.log('使用 encryptedData 方式登录')
          console.warn('警告：后端不支持 encryptedData 方式，请使用真机测试')
          uni.hideLoading()
          uni.showModal({
            title: '提示',
            content: '开发者工具不支持手机号登录，请使用真机扫码测试',
            showCancel: false,
            confirmText: '我知道了'
          })
          this.isLoggingIn = false
          return
        } else {
          console.error('未获取到有效的授权数据')
          uni.showToast({ 
            title: '未获取到授权码，请重试', 
            icon: 'none',
            duration: 3000
          })
          return
        }
        
        await this.doLogin(loginData)
      } else if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
        console.log('用户拒绝授权')
        uni.showToast({ 
          title: '您已取消授权', 
          icon: 'none',
          duration: 2000
        })
      } else {
        console.error('获取手机号失败:', e.detail.errMsg)
        let errorMsg = '获取手机号失败'
        
        if (e.detail.errMsg) {
          if (e.detail.errMsg.includes('not support')) {
            errorMsg = '当前环境不支持，请使用真机测试'
          } else if (e.detail.errMsg.includes('no permission')) {
            errorMsg = '小程序未配置手机号权限'
          } else {
            errorMsg = `失败原因: ${e.detail.errMsg}`
          }
        }
        
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 3000
        })
      }
    },
    
    async doLogin(loginData) {
      if (this.isLoggingIn) {
        console.log('正在登录中，忽略重复请求')
        return
      }
      
      this.isLoggingIn = true
      console.log('=== 开始登录流程 ===')
      console.log('登录数据:', JSON.stringify(loginData))
      
      try {
        uni.showLoading({ title: '登录中...', mask: true })
        
        console.log('步骤1: 获取微信登录 code')
        const loginCode = await weixinLogin()
        console.log('微信登录 code:', loginCode)
        
        if (!loginCode) {
          console.error('微信登录 code 为空')
          throw new Error('获取微信登录凭证失败')
        }
        
        console.log('步骤2: 调用后端一键登录接口')
        
        const requestData = {
          loginCode: loginCode
        }
        
        if (loginData.phoneCode) {
          console.log('使用 code 方式登录')
          requestData.phoneCode = loginData.phoneCode
        }
        
        console.log('请求参数:', JSON.stringify(requestData))
        
        const result = await weixinMiniAppLogin(requestData)
        
        console.log('登录成功，返回结果:', JSON.stringify(result))
        
        if (result && result.data) {
          console.log('保存用户信息:', JSON.stringify(result.data))
          if (result.data.userId || result.data.id) {
            setUserInfo(result.data)
          }
          
          uni.hideLoading()
          uni.showToast({ 
            title: '登录成功', 
            icon: 'success',
            duration: 1500
          })
          
          setTimeout(() => {
            console.log('跳转到首页')
            uni.switchTab({ 
              url: '/pages/index/index' 
            })
          }, 1500)
        } else {
          console.error('返回数据格式异常:', result)
          throw new Error('返回数据格式异常')
        }
      } catch (error) {
        console.error('=== 登录失败 ===')
        console.error('错误对象:', error)
        console.error('错误信息:', error.msg || error.errMsg || error.message)
        
        uni.hideLoading()
        
        let errorMsg = '登录失败，请重试'
        
        if (error) {
          if (error.msg) {
            errorMsg = error.msg
          } else if (error.message) {
            errorMsg = error.message
          } else if (error.errMsg) {
            if (error.errMsg.includes('cancel')) {
              errorMsg = '您已取消授权'
            } else if (error.errMsg.includes('network')) {
              errorMsg = '网络连接失败'
            } else if (error.errMsg.includes('timeout')) {
              errorMsg = '请求超时，请重试'
            } else {
              errorMsg = error.errMsg
            }
          } else if (error.code) {
            switch (error.code) {
              case 400:
                errorMsg = '请求参数错误'
                break
              case 401:
                errorMsg = '授权失败，请重试'
                break
              case 403:
                errorMsg = '没有权限访问'
                break
              case 404:
                errorMsg = '接口不存在'
                break
              case 500:
                errorMsg = '服务器错误，请稍后重试'
                break
              case -1:
                errorMsg = '网络连接失败'
                break
            }
          }
        }
        
        console.error('最终错误提示:', errorMsg)
        
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.isLoggingIn = false
        console.log('=== 登录流程结束 ===')
      }
    },
    
    showUserAgreement() {
      uni.showModal({
        title: '用户协议',
        content: `更新时间：2026年5月29日\n\n欢迎您使用"何故AI学习"小程序。在您使用本小程序之前，请仔细阅读本协议的全部内容。\n\n一、服务内容\n本小程序是一款书法、绘画、篆刻AI辅助学习工具。\n\n二、账号注册\n您在使用本小程序前，需要通过微信授权登录。我们将获取您的微信昵称、头像等基本信息及手机号码。\n\n三、用户行为规范\n您不得从事违反法律法规、公序良俗的行为，不得侵害他人合法权益。\n\n四、知识产权\n本小程序的所有权及所有知识产权归运营方所有。您创作的内容，其知识产权归您所有。\n\n五、服务变更\n本小程序保留随时变更、中断或终止部分或全部服务的权利。\n\n六、免责声明\n本小程序的服务按"现状"提供，不对服务的适用性、完整性、可靠性做任何保证。\n\n七、协议修改\n我们有权随时修改本协议，修改后的协议一经公布即生效。\n\n八、联系方式\n如有任何疑问，请通过小程序内提供的客服渠道联系我们。`,
        showCancel: false,
        confirmText: '我已知晓'
      })
    },
    
    showPrivacyPolicy() {
      uni.showModal({
        title: '隐私政策',
        content: `更新时间：2026年5月29日\n\n我们非常重视您的个人信息和隐私保护。\n\n一、信息收集\n我们收集您主动提供的信息（账号信息、手机号码、用户内容）及使用服务时自动获取的信息（设备信息、日志信息）。\n\n二、信息使用\n我们使用您的信息用于：提供和改进服务、账号管理、用户反馈、数据分析、个性化推荐。\n\n三、信息共享\n除法律法规要求或获得您的明确同意外，我们不会与任何第三方共享您的个人信息。\n\n四、信息存储\n您的信息将存储在中华人民共和国境内的服务器上。\n\n五、信息安全\n我们采取了数据加密、访问控制、安全审计等措施保护您的信息安全。\n\n六、您的权利\n您享有访问、更正、删除您的个人信息的权利，以及注销账号的权利。\n\n七、未成年人保护\n本小程序主要面向成年人。如您是未满18周岁的未成年人，请在监护人陪同下使用。\n\n八、联系我们\n如有任何疑问，请通过小程序内提供的客服渠道联系我们。`,
        showCancel: false,
        confirmText: '我已知晓'
      })
    }
  }
};
</script>

<style scoped>
.container {
  flex: 1;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 16rpx;
  display: block;
}

.subtitle {
  font-size: 28rpx;
  color: #999999;
  text-align: center;
  margin-bottom: 80rpx;
  display: block;
}

.wechat-login {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wechat-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #07C160 0%, #05A850 100%);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.4);
}

.wechat-btn::after {
  border: none;
}

.wechat-btn[disabled] {
  opacity: 0.6;
  background: linear-gradient(135deg, #07C160 0%, #05A850 100%);
}

.wechat-icon {
  font-size: 40rpx;
}

.wechat-text {
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 500;
}

.login-tip {
  font-size: 24rpx;
  color: #999999;
  margin-top: 24rpx;
  text-align: center;
}

.agreement {
  margin-top: 60rpx;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.agreement-text {
  font-size: 24rpx;
  color: #999999;
}

.agreement-link {
  font-size: 24rpx;
  color: #007AFF;
}
</style>
