<template>
  <view class="phone-login-container">
    <button 
      class="phone-login-btn" 
      open-type="getPhoneNumber" 
      @getphonenumber="onGetPhoneNumber"
      :disabled="disabled"
    >
      <text class="icon">📞</text>
      <text class="text">{{ text }}</text>
    </button>
  </view>
</template>

<script>
export default {
  name: 'PhoneLogin',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: '手机号快捷登录'
    }
  },
  methods: {
    onGetPhoneNumber(e) {
      if (e.detail.code) {
        // 获取到手机号 code
        this.$emit('success', e.detail.code)
      } else {
        // 用户拒绝授权
        this.$emit('error', new Error('用户拒绝授权'))
      }
    }
  }
}
</script>

<style scoped>
.phone-login-container {
  width: 100%;
}

.phone-login-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #07C160 0%, #05A850 100%);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
  color: #FFFFFF;
  font-size: 30rpx;
}

.phone-login-btn::after {
  border: none;
}

.phone-login-btn[disabled] {
  opacity: 0.6;
  background: #CCCCCC;
}

.icon {
  font-size: 36rpx;
}

.text {
  font-weight: 500;
}
</style>
