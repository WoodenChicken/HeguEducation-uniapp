<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">篆刻设计</text>
      <text class="subtitle">AI智能生成篆刻印稿，传承千年工艺</text>
    </view>
    
    <!-- 印稿参数选择区域 -->
    <view class="parameter-section">
      <text class="section-title">印稿参数设置</text>
      
      <!-- 字数选择 -->
      <view class="parameter-item">
        <text class="parameter-label">字数：</text>
        <picker @change="onCharacterCountChange" :range="characterCountOptions" :range-key="'label'">
          <view class="picker">
            {{ selectedParameters.characterCount.label }}
          </view>
        </picker>
      </view>
      
      <!-- 排列方式 -->
      <view class="parameter-item">
        <text class="parameter-label">排列方式：</text>
        <picker @change="onLayoutChange" :range="layoutOptions" :range-key="'label'">
          <view class="picker">
            {{ selectedParameters.layout.label }}
          </view>
        </picker>
      </view>
      
      <!-- 内容输入 -->
      <view class="parameter-item">
        <text class="parameter-label">印文内容：</text>
        <input 
          v-model="selectedParameters.content" 
          placeholder="请输入印文内容"
          class="content-input"
          :maxlength="parseInt(selectedParameters.characterCount.value)"
        />
        <text class="content-hint">（最多{{ selectedParameters.characterCount.value }}字）</text>
      </view>
      
      <!-- 风格选择 -->
      <view class="parameter-item">
        <text class="parameter-label">风格：</text>
        <picker @change="onStyleChange" :range="styleOptions" :range-key="'label'">
          <view class="picker">
            {{ selectedParameters.style.label }}
          </view>
        </picker>
      </view>
    </view>
    
    <!-- 生成按钮区域 -->
    <view class="generate-section">
      <button 
        @click="generateSeal"
        :disabled="!canGenerate"
        class="generate-button"
      >
        {{ isGenerating ? '生成中...' : '生成印稿' }}
      </button>
      <text v-if="!canGenerate" class="generate-hint">
        {{ generateHint }}
      </text>
    </view>
    
    <!-- 设计稿展示区域 -->
    <view v-if="sealResult" class="result-section">
      <text class="section-title">设计稿预览</text>
      <view class="result-container">
        <image :src="sealResult.imageUrl" mode="aspectFit" class="seal-image" />
        <view class="result-info">
          <text class="info-item">风格：{{ selectedParameters.style.label }}</text>
          <text class="info-item">字数：{{ selectedParameters.content.length }}字</text>
          <text class="info-item">排列：{{ selectedParameters.layout.label }}</text>
          <text class="info-item">生成时间：{{ sealResult.generatedAt }}</text>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button @click="downloadSeal" class="download-button">
          下载设计稿
        </button>
        <button @click="generateAgain" class="regenerate-button">
          重新生成
        </button>
      </view>
    </view>
    
    <!-- 使用限制提示 -->
    <view class="limit-section">
      <text class="limit-title">使用限制</text>
      <text class="limit-text">• 非注册用户每天最多生成1个印稿</text>
      <text class="limit-text">• 注册用户无限制生成</text>
      <text class="limit-text">• 生成的印稿仅供个人学习使用</text>
      <text class="today-count">今日已生成：{{ todayGenerateCount }}个</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 字数选项
const characterCountOptions = [
  { label: '2字', value: '2' },
  { label: '3字', value: '3' },
  { label: '4字', value: '4' },
  { label: '5字', value: '5' },
  { label: '6字', value: '6' }
]

// 排列方式选项
const layoutOptions = [
  { label: '方形排列', value: 'square' },
  { label: '圆形排列', value: 'circle' },
  { label: '回形排列', value: 'spiral' },
  { label: '对联式', value: 'couplet' }
]

// 风格选项
const styleOptions = [
  { label: '汉印', value: 'han' },
  { label: '将军印', value: 'general' },
  { label: '唐宋官印', value: 'tang_song' },
  { label: '明清文人印', value: 'ming_qing' },
  { label: '鸟虫印', value: 'bird_insect' }
]

// 响应式数据
const selectedParameters = ref({
  characterCount: characterCountOptions[2], // 默认4字
  layout: layoutOptions[0], // 默认方形排列
  content: '',
  style: styleOptions[0] // 默认汉印风格
})
const isGenerating = ref(false)
const sealResult = ref(null)
const todayGenerateCount = ref(0)

// 计算属性：是否可以生成
const canGenerate = computed(() => {
  // 检查内容是否为空
  if (!selectedParameters.value.content.trim()) {
    return false
  }
  
  // 检查内容长度是否符合要求
  const contentLength = selectedParameters.value.content.length
  const maxLength = parseInt(selectedParameters.value.characterCount.value)
  if (contentLength > maxLength) {
    return false
  }
  
  // 检查是否达到今日生成限制
  if (todayGenerateCount.value >= 1) {
    return false
  }
  
  return true
})

// 计算属性：生成提示
const generateHint = computed(() => {
  if (!selectedParameters.value.content.trim()) {
    return '请输入印文内容'
  }
  
  const contentLength = selectedParameters.value.content.length
  const maxLength = parseInt(selectedParameters.value.characterCount.value)
  if (contentLength > maxLength) {
    return `印文内容不能超过${maxLength}字`
  }
  
  if (todayGenerateCount.value >= 1) {
    return '今日已达到生成限制，请明天再试'
  }
  
  return ''
})

// 字数选择
const onCharacterCountChange = (e) => {
  const index = e.detail.value
  selectedParameters.value.characterCount = characterCountOptions[index]
}

// 排列方式选择
const onLayoutChange = (e) => {
  const index = e.detail.value
  selectedParameters.value.layout = layoutOptions[index]
}

// 风格选择
const onStyleChange = (e) => {
  const index = e.detail.value
  selectedParameters.value.style = styleOptions[index]
}

// 生成印稿
const generateSeal = () => {
  if (!canGenerate.value) {
    return
  }
  
  isGenerating.value = true
  uni.showLoading({ title: '生成中...' })
  
  // 模拟API调用
  setTimeout(() => {
    // 生成模拟结果
    const result = generateMockSeal()
    sealResult.value = result
    
    // 更新今日生成计数
    todayGenerateCount.value++
    saveGenerateCount()
    
    isGenerating.value = false
    uni.hideLoading()
    uni.showToast({ title: '生成成功', icon: 'success' })
  }, 3000)
}

// 生成模拟印稿结果
const generateMockSeal = () => {
  // 使用示例图片作为模拟结果
  const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20seal%20carving%20design%20with%20${selectedParameters.value.content}%20characters%20in%20${selectedParameters.value.style.value}%20style%20${selectedParameters.value.layout.value}%20layout%20traditional%20chinese%20art&image_size=square_hd`
  
  return {
    imageUrl,
    generatedAt: new Date().toLocaleString(),
    parameters: { ...selectedParameters.value }
  }
}

// 重新生成
const generateAgain = () => {
  sealResult.value = null
}

// 下载设计稿
const downloadSeal = () => {
  if (!sealResult.value) {
    return
  }
  
  uni.showLoading({ title: '下载中...' })
  
  // 模拟下载过程
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '下载成功', icon: 'success' })
    
    // 实际项目中这里应该调用uni.downloadFile()
    /*
    uni.downloadFile({
      url: sealResult.value.imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.hideLoading()
              uni.showToast({ title: '下载成功', icon: 'success' })
            },
            fail: () => {
              uni.hideLoading()
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        }
      },
      fail: () => {
        uni.hideLoading()
        uni.showToast({ title: '下载失败', icon: 'none' })
      }
    })
    */
  }, 1000)
}

// 保存生成计数
const saveGenerateCount = () => {
  try {
    const today = new Date().toDateString()
    const generateData = {
      date: today,
      count: todayGenerateCount.value
    }
    uni.setStorageSync('sealGenerateCount', generateData)
  } catch (e) {
    console.error('保存生成计数失败:', e)
  }
}

// 加载生成计数
const loadGenerateCount = () => {
  try {
    const generateData = uni.getStorageSync('sealGenerateCount')
    if (generateData) {
      const today = new Date().toDateString()
      if (generateData.date === today) {
        todayGenerateCount.value = generateData.count
      }
    }
  } catch (e) {
    console.error('加载生成计数失败:', e)
  }
}

onMounted(() => {
  // 加载今日生成计数
  loadGenerateCount()
  console.log('篆刻设计页面初始化')
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  color: #333333;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666666;
}

.parameter-section,
.result-section,
.limit-section {
  background-color: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
  display: block;
}

.parameter-item {
  margin-bottom: 30rpx;
}

.parameter-label {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 12rpx;
  display: block;
}

.picker {
  background-color: #F5F5F5;
  padding: 30rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #333333;
}

.content-input {
  background-color: #F5F5F5;
  padding: 30rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #333333;
  border: 1rpx solid #DDDDDD;
}

.content-hint {
  font-size: 20rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.generate-section {
  margin: 40rpx 0;
}

.generate-button {
  width: 100%;
  padding: 30rpx;
  background-color: #007AFF;
  color: white;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 10rpx;
  border: none;
  transition: all 0.3s ease;
}

.generate-button:disabled {
  background-color: #CCCCCC;
  color: #FFFFFF;
}

.generate-hint {
  font-size: 24rpx;
  color: #FF4757;
  text-align: center;
  margin-top: 16rpx;
  display: block;
}

.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.seal-image {
  width: 300rpx;
  height: 300rpx;
  border-radius: 10rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.15);
}

.result-info {
  width: 100%;
  background-color: #F9F9F9;
  padding: 24rpx;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-item {
  font-size: 24rpx;
  color: #666666;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.download-button {
  flex: 1;
  padding: 24rpx;
  background-color: #4CAF50;
  color: white;
  font-size: 28rpx;
  border-radius: 10rpx;
  border: none;
}

.regenerate-button {
  flex: 1;
  padding: 24rpx;
  background-color: #FF9800;
  color: white;
  font-size: 28rpx;
  border-radius: 10rpx;
  border: none;
}

.limit-section {
  background-color: #FFF3E0;
  border-left: 4rpx solid #FF9800;
}

.limit-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #E65100;
  margin-bottom: 16rpx;
  display: block;
}

.limit-text {
  font-size: 24rpx;
  color: #FF6F00;
  margin-bottom: 8rpx;
  display: block;
  line-height: 1.4;
}

.today-count {
  font-size: 24rpx;
  font-weight: bold;
  color: #E65100;
  margin-top: 16rpx;
  display: block;
}

@media (max-width: 375px) {
  .container {
    padding: 24rpx;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .seal-image {
    width: 250rpx;
    height: 250rpx;
  }
}
</style>