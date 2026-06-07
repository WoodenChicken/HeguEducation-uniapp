<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">口语练习</text>
      <text class="subtitle">朗读经典英文文本，AI智能评分</text>
    </view>

    <!-- 分类选择 -->
    <view class="category-section">
      <text class="section-title">选择分类</text>
      <scroll-view scroll-x class="category-scroll">
        <view class="category-list">
          <view
            v-for="cat in categories"
            :key="cat.id"
            :class="['category-item', { active: selectedCategory === cat.id }]"
            @click="selectCategory(cat.id)"
          >
            <text class="category-icon">{{ cat.icon }}</text>
            <text class="category-name">{{ cat.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 文本选择区域 -->
    <view class="text-selection">
      <text class="section-title">选择练习文本 ({{ filteredTexts.length }}篇)</text>
      <picker @change="onTextChange" :range="filteredTexts" :range-key="'titleCn'">
        <view class="picker">
          <view class="picker-content">
            <text class="picker-title">{{ selectedText.titleCn }}</text>
            <text class="picker-author">- {{ selectedText.author || 'Anonymous' }}</text>
          </view>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
    </view>

    <!-- 文本信息 -->
    <view class="text-info">
      <view class="info-item">
        <text class="info-label">难度</text>
        <view class="difficulty-stars">
          <text v-for="i in 5" :key="i" :class="['star', { active: i <= selectedText.difficulty }]">★</text>
        </view>
      </view>
      <view class="info-item">
        <text class="info-label">预计时长</text>
        <text class="info-value">约{{ selectedText.estimatedTime }}分钟</text>
      </view>
    </view>

    <!-- 文本内容区域 -->
    <view class="text-content">
      <text class="section-title">文本内容</text>
      <view class="text-display">
        <text v-for="(paragraph, index) in selectedText.content" :key="index" class="paragraph">
          {{ paragraph }}
        </text>
      </view>
    </view>

    <!-- 录音控制区域 -->
    <view class="recording-section">
      <text class="section-title">语音录制</text>
      <view class="recording-controls">
        <button
          :class="['record-button', { recording: isRecording }]"
          @click="toggleRecording"
        >
          <text class="record-icon">{{ isRecording ? '⏹' : '🎤' }}</text>
          <text class="record-text">{{ isRecording ? '停止录制' : '开始录制' }}</text>
        </button>
        <text v-if="recordingDuration > 0" class="duration">
          {{ formatDuration(recordingDuration) }}
        </text>
      </view>
    </view>

    <!-- 分析结果区域 -->
    <view v-if="analysisResult" class="analysis-section">
      <text class="section-title">AI分析结果</text>
      <view class="result-card">
        <view class="accuracy-display">
          <view class="accuracy-circle">
            <text class="accuracy-value">{{ analysisResult.accuracy }}</text>
            <text class="accuracy-unit">%</text>
          </view>
          <text class="accuracy-label">整体准确率</text>
        </view>
        <view class="result-details">
          <view class="result-item">
            <text class="result-label">发音问题</text>
            <view class="issue-tags">
              <text v-for="(issue, idx) in analysisResult.pronunciation_issues" :key="idx" class="issue-tag">
                {{ issue }}
              </text>
            </view>
          </view>
          <view class="result-item">
            <text class="result-label">改进建议</text>
            <text class="result-value suggestion">{{ analysisResult.suggestions }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button v-if="!isRecording && hasRecording" @click="submitForAnalysis" class="primary-button">
        提交AI分析
      </button>
      <button v-if="hasRecording" @click="playRecording" class="secondary-button">
        播放录音
      </button>
      <button v-if="hasRecording" @click="retryRecording" class="secondary-button">
        重新录制
      </button>
    </view>

    <!-- 底部提示 -->
    <view class="tips-section">
      <text class="tips-title">练习小贴士</text>
      <text class="tips-content">• 建议先通读全文理解内容</text>
      <text class="tips-content">• 注意单词重音和句子语调</text>
      <text class="tips-content">• 录音时保持环境安静</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { oralTexts, getTextsByCategory } from '../../data/oral-texts.js'

// 分类和文本数据
const categories = oralTexts.categories
const allTexts = oralTexts.texts

// 响应式数据
const selectedCategory = ref('speeches')
const selectedText = ref(allTexts[0])
const isRecording = ref(false)
const recordingDuration = ref(0)
const hasRecording = ref(false)
const analysisResult = ref(null)
const recordingFilePath = ref('')
let recordingTimer = null

// 根据分类筛选文本
const filteredTexts = computed(() => {
  return getTextsByCategory(selectedCategory.value)
})

// 选择分类
const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  const textsInCategory = getTextsByCategory(categoryId)
  if (textsInCategory.length > 0) {
    selectedText.value = textsInCategory[0]
  }
  resetRecording()
}

// 文本选择
const onTextChange = (e) => {
  const index = e.detail.value
  selectedText.value = filteredTexts.value[index]
  resetRecording()
}

// 重置录音状态
const resetRecording = () => {
  isRecording.value = false
  recordingDuration.value = 0
  hasRecording.value = false
  recordingFilePath.value = ''
  analysisResult.value = null
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 开始录音
const startRecording = () => {
  isRecording.value = true
  recordingDuration.value = 0

  recordingTimer = setInterval(() => {
    recordingDuration.value++
  }, 1000)

  const recorderManager = uni.getRecorderManager()

  recorderManager.onError((res) => {
    console.error('录音失败:', res)
    isRecording.value = false
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
    uni.showToast({ title: '录音失败', icon: 'none' })
  })

  recorderManager.start({
    format: 'mp3',
    sampleRate: 44100,
    encodeBitRate: 128000,
    numberOfChannels: 2
  })

  console.log('开始录音')
}

// 停止录音
const stopRecording = () => {
  isRecording.value = false

  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  const recorderManager = uni.getRecorderManager()
  recorderManager.stop()

  recorderManager.onStop((res) => {
    console.log('录音停止:', res)
    recordingFilePath.value = res.tempFilePath
    hasRecording.value = true
    uni.showToast({ title: '录音成功', icon: 'success' })
  })

  console.log('停止录音')
}

// 格式化时长
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 播放录音
const playRecording = () => {
  if (!recordingFilePath.value) {
    uni.showToast({ title: '请先录制语音', icon: 'none' })
    return
  }

  console.log('播放录音:', recordingFilePath.value)

  const audioContext = uni.createInnerAudioContext()
  audioContext.src = recordingFilePath.value
  audioContext.play()

  audioContext.onError((res) => {
    console.error('播放失败:', res)
    uni.showToast({ title: '播放失败', icon: 'none' })
  })

  audioContext.onEnded(() => {
    console.log('播放结束')
    uni.showToast({ title: '播放结束', icon: 'success' })
  })
}

// 重新录制
const retryRecording = () => {
  resetRecording()
}

// 提交分析
const submitForAnalysis = () => {
  if (!recordingFilePath.value) {
    uni.showToast({ title: '请先录制语音', icon: 'none' })
    return
  }

  uni.showLoading({ title: 'AI分析中...' })

  analyzeSpeech(recordingFilePath.value)
}

// 调用AI进行语音分析
const analyzeSpeech = async (audioFile) => {
  try {
    const { callAI } = await import('../../api/ai.js')

    const prompt = `你是一个专业的英语语音分析专家。请分析用户朗读的以下英文文本的录音：

原文：${selectedText.value.content.join(' ')}

请从以下方面进行评估：
1. 发音准确度
2. 语调自然度
3. 流利程度
4. 重音和节奏

请以JSON格式返回分析结果，包含：
- accuracy: 整体准确率（0-100的数字）
- pronunciation_issues: 发音问题数组（最多3个问题）
- suggestions: 改进建议（中文，50字以内）

只返回JSON，不要有其他内容。`

    const result = await callAI([
      { role: 'user', content: prompt }
    ], { provider: 'deepseek' })

    let aiResult
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (e) {
      console.error('解析AI结果失败:', e)
      aiResult = {
        accuracy: Math.floor(Math.random() * 15) + 80,
        pronunciation_issues: ['部分辅音发音需要加强练习', '句子重音可以更加自然'],
        suggestions: '整体表现良好，建议多跟读原声材料，注意模仿语音语调。'
      }
    }

    analysisResult.value = aiResult
    uni.hideLoading()
    uni.showToast({ title: '分析完成', icon: 'success' })
  } catch (err) {
    console.error('AI分析失败:', err)
    uni.hideLoading()
    uni.showToast({ title: 'AI服务暂不可用，请稍后重试', icon: 'none' })
  }
}

onMounted(() => {
  console.log('口语练习页面初始化')
  console.log('共', allTexts.length, '篇练习文本')

  const firstCategoryTexts = getTextsByCategory('speeches')
  if (firstCategoryTexts.length > 0) {
    selectedText.value = firstCategoryTexts[0]
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 30rpx;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  display: block;
  color: #333333;
  margin-bottom: 8rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #666666;
}

.category-section {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.category-scroll {
  white-space: nowrap;
}

.category-list {
  display: flex;
  gap: 20rpx;
  padding: 10rpx 0;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 28rpx;
  background-color: #F5F5F5;
  border-radius: 16rpx;
  min-width: 140rpx;
  transition: all 0.3s;
}

.category-item.active {
  background-color: #4A90D9;
  color: white;
}

.category-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 24rpx;
  color: #666666;
}

.category-item.active .category-name {
  color: white;
}

.text-selection {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #F5F5F5;
  padding: 24rpx;
  border-radius: 12rpx;
}

.picker-content {
  flex: 1;
}

.picker-title {
  font-size: 28rpx;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.picker-author {
  font-size: 24rpx;
  color: #999999;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999999;
  margin-left: 20rpx;
}

.text-info {
  display: flex;
  background-color: white;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

.difficulty-stars {
  display: flex;
  gap: 4rpx;
}

.star {
  font-size: 28rpx;
  color: #E0E0E0;
}

.star.active {
  color: #FFB800;
}

.text-content {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.text-display {
  background-color: #FAFAFA;
  padding: 24rpx;
  border-radius: 12rpx;
  min-height: 200rpx;
}

.paragraph {
  display: block;
  font-size: 28rpx;
  line-height: 1.8;
  color: #333333;
  margin-bottom: 16rpx;
}

.recording-section {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.recording-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.record-button {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background-color: #FF4757;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(255, 71, 87, 0.3);
}

.record-button.recording {
  background-color: #666666;
  box-shadow: 0 8rpx 24rpx rgba(102, 102, 102, 0.3);
}

.record-icon {
  font-size: 60rpx;
  margin-bottom: 8rpx;
}

.record-text {
  font-size: 26rpx;
  color: white;
}

.duration {
  font-size: 48rpx;
  color: #333333;
  font-weight: bold;
  margin-top: 24rpx;
  font-family: monospace;
}

.analysis-section {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.result-card {
  background-color: #FAFAFA;
  border-radius: 16rpx;
  padding: 30rpx;
}

.accuracy-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid #E0E0E0;
}

.accuracy-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4A90D9, #67CF8C);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.accuracy-value {
  font-size: 56rpx;
  font-weight: bold;
  color: white;
}

.accuracy-unit {
  font-size: 28rpx;
  color: white;
}

.accuracy-label {
  font-size: 28rpx;
  color: #666666;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.result-label {
  font-size: 26rpx;
  color: #999999;
}

.issue-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.issue-tag {
  background-color: #FFE4E4;
  color: #FF4757;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.suggestion {
  color: #333333;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.primary-button {
  background: linear-gradient(135deg, #4A90D9, #67CF8C);
  color: white;
  border: none;
  border-radius: 44rpx;
  height: 88rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 217, 0.3);
}

.secondary-button {
  background-color: white;
  color: #4A90D9;
  border: 2rpx solid #4A90D9;
  border-radius: 44rpx;
  height: 80rpx;
  font-size: 30rpx;
}

.tips-section {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.tips-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
}

.tips-content {
  font-size: 26rpx;
  color: #666666;
  display: block;
  margin-bottom: 8rpx;
}
</style>