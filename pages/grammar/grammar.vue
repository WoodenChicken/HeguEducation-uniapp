<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">语法分析</text>
      <text class="subtitle">提升英文书写能力，从易到难逐步进阶</text>
    </view>
    
    <!-- 书写类型选择 -->
    <view class="writing-type-selection">
      <text class="section-title">选择书写类型</text>
      <view class="type-buttons">
        <button 
          v-for="type in writingTypes" 
          :key="type.value"
          :class="{ 'active': selectedType === type.value }"
          @click="selectWritingType(type.value)"
          class="type-button"
        >
          {{ type.label }}
        </button>
      </view>
    </view>
    
    <!-- 难度级别选择 -->
    <view class="difficulty-selection">
      <text class="section-title">选择难度级别</text>
      <view class="difficulty-buttons">
        <button 
          v-for="level in difficultyLevels" 
          :key="level.value"
          :class="{ 'active': selectedDifficulty === level.value }"
          @click="selectDifficulty(level.value)"
          class="difficulty-button"
        >
          {{ level.label }}
        </button>
      </view>
    </view>
    
    <!-- 英文书写区域 -->
    <view class="writing-section">
      <text class="section-title">英文书写</text>
      <view class="prompt-container">
        <text class="prompt-label">写作提示：</text>
        <text class="prompt-text">{{ currentPrompt }}</text>
      </view>
      <textarea 
        v-model="writingContent" 
        placeholder="请在此输入您的英文写作内容..." 
        class="writing-textarea"
        maxlength="1000"
      ></textarea>
      <text class="word-count">{{ writingContent.length }}/1000</text>
    </view>
    
    <!-- 操作按钮区域 -->
    <view class="action-buttons">
      <button @click="checkGrammar" class="primary-button">
        检查语法
      </button>
      <button @click="clearContent" class="secondary-button">
        清空内容
      </button>
    </view>
    
    <!-- 语法分析结果区域 -->
    <view v-if="analysisResult" class="analysis-section">
      <text class="section-title">语法分析结果</text>
      <view class="result-card">
        <view class="result-item">
          <text class="result-label">整体评分：</text>
          <text class="result-value">{{ analysisResult.score }}/100</text>
        </view>
        <view class="result-item">
          <text class="result-label">语法错误：</text>
          <text class="result-value">{{ analysisResult.errorCount }}个</text>
        </view>
        <view class="result-item">
          <text class="result-label">词汇丰富度：</text>
          <text class="result-value">{{ analysisResult.vocabularyRichness }}</text>
        </view>
      </view>
      
      <!-- 错误提示列表 -->
      <view v-if="analysisResult.errors.length > 0" class="errors-list">
        <text class="section-subtitle">错误提示：</text>
        <view v-for="(error, index) in analysisResult.errors" :key="index" class="error-item">
          <text class="error-type">{{ error.type }}：</text>
          <text class="error-message">{{ error.message }}</text>
          <text class="error-suggestion">建议：{{ error.suggestion }}</text>
        </view>
      </view>
      
      <!-- 改进建议 -->
      <view class="suggestions-section">
        <text class="section-subtitle">改进建议：</text>
        <text class="suggestion-text">{{ analysisResult.suggestions }}</text>
      </view>
    </view>
    
    <!-- 每日打卡区域 -->
    <view class="checkin-section">
      <view class="checkin-header">
        <text class="section-title">每日打卡</text>
        <text class="checkin-streak">连续打卡：{{ checkinStreak }}天</text>
      </view>
      <button 
        :class="{ 'checked-in': hasCheckedInToday }"
        @click="checkInToday"
        class="checkin-button"
      >
        {{ hasCheckedInToday ? '今日已打卡' : '立即打卡' }}
      </button>
    </view>
    
    <!-- 水平提升记录区域 -->
    <view class="progress-section">
      <text class="section-title">水平提升记录</text>
      <view class="progress-chart">
        <view v-for="(record, index) in progressRecords" :key="index" class="progress-item">
          <text class="progress-date">{{ record.date }}</text>
          <text class="progress-score">{{ record.score }}分</text>
          <view class="progress-bar">
            <view 
              class="progress-fill"
              :style="{ width: (record.score / 100) * 100 + '%' }"
            ></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 书写类型
const writingTypes = [
  { label: '日记', value: 'diary' },
  { label: '阅读笔记', value: 'reading_note' },
  { label: '议论文', value: 'argumentative' },
  { label: '描述文', value: 'descriptive' }
]

// 难度级别
const difficultyLevels = [
  { label: '初级', value: 'beginner' },
  { label: '中级', value: 'intermediate' },
  { label: '高级', value: 'advanced' }
]

// 写作提示（根据类型和难度）
const prompts = {
  diary: {
    beginner: 'Write about your day today. What did you do? How did you feel?',
    intermediate: 'Write about a memorable experience you had recently. Why was it memorable?',
    advanced: 'Write about a goal you have for the future. How do you plan to achieve it?'
  },
  reading_note: {
    beginner: 'Write about a book or article you recently read. What was it about?',
    intermediate: 'Write about your favorite character from a book. Why do you like them?',
    advanced: 'Write about the theme of a book you read. How does the author develop this theme?'
  },
  argumentative: {
    beginner: 'Write about whether students should have homework. Give your opinion.',
    intermediate: 'Write about the benefits and drawbacks of social media.',
    advanced: 'Write about whether technology is making our lives better or worse.'
  },
  descriptive: {
    beginner: 'Write about your favorite place. What does it look like? How does it make you feel?',
    intermediate: 'Write about a person who has influenced you. What are they like?',
    advanced: 'Write about a season of the year. Describe its sights, sounds, and smells.'
  }
}

// 响应式数据
const selectedType = ref('diary')
const selectedDifficulty = ref('beginner')
const writingContent = ref('')
const analysisResult = ref(null)
const checkinStreak = ref(0)
const hasCheckedInToday = ref(false)
const progressRecords = ref([])

// 当前写作提示
const currentPrompt = computed(() => {
  return prompts[selectedType.value][selectedDifficulty.value]
})

// 选择书写类型
const selectWritingType = (type) => {
  selectedType.value = type
  // 重置内容和分析结果
  writingContent.value = ''
  analysisResult.value = null
}

// 选择难度级别
const selectDifficulty = (level) => {
  selectedDifficulty.value = level
  // 重置内容和分析结果
  writingContent.value = ''
  analysisResult.value = null
}

// 检查语法
const checkGrammar = () => {
  if (!writingContent.value.trim()) {
    uni.showToast({ title: '请输入英文内容', icon: 'none' })
    return
  }
  
  uni.showLoading({ title: '分析中...' })
  
  // 模拟语法分析
  setTimeout(() => {
    // 生成模拟分析结果
    const result = generateMockAnalysis()
    analysisResult.value = result
    
    // 保存进度记录
    saveProgressRecord(result.score)
    
    uni.hideLoading()
    uni.showToast({ title: '分析完成', icon: 'success' })
  }, 2000)
}

// 生成模拟分析结果
const generateMockAnalysis = () => {
  const score = Math.floor(Math.random() * 30) + 70 // 70-100分
  const errorCount = Math.floor(Math.random() * 5) // 0-4个错误
  
  // 模拟错误类型
  const errorTypes = [
    { type: '语法错误', message: 'Subject-verb agreement', suggestion: 'Ensure the verb agrees with the subject.' },
    { type: '拼写错误', message: 'Spelling mistake', suggestion: 'Check the spelling of the word.' },
    { type: '标点错误', message: 'Punctuation error', suggestion: 'Use proper punctuation.' },
    { type: '用词错误', message: 'Word choice', suggestion: 'Choose a more appropriate word.' },
    { type: '句子结构', message: 'Sentence structure', suggestion: 'Improve sentence structure.' }
  ]
  
  // 随机选择错误
  const errors = []
  for (let i = 0; i < errorCount; i++) {
    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]
    errors.push(randomError)
  }
  
  // 词汇丰富度
  const vocabularyRichness = score > 90 ? '优秀' : score > 80 ? '良好' : '一般'
  
  // 改进建议
  const suggestions = score > 90 
    ? 'Excellent writing! Your grammar is very good. Keep practicing to maintain your level.'
    : score > 80
    ? 'Good writing! There are a few errors, but overall your grammar is strong. Focus on the specific errors mentioned above.'
    : 'Keep practicing! Pay attention to the grammar rules and try to use more varied vocabulary.'
  
  return {
    score,
    errorCount,
    vocabularyRichness,
    errors,
    suggestions
  }
}

// 清空内容
const clearContent = () => {
  writingContent.value = ''
  analysisResult.value = null
}

// 每日打卡
const checkInToday = () => {
  if (hasCheckedInToday.value) {
    uni.showToast({ title: '今日已打卡', icon: 'none' })
    return
  }
  
  // 更新打卡状态
  hasCheckedInToday.value = true
  checkinStreak.value++
  
  // 保存打卡记录
  saveCheckinRecord()
  
  uni.showToast({ title: '打卡成功', icon: 'success' })
}

// 保存打卡记录
const saveCheckinRecord = () => {
  try {
    const today = new Date().toDateString()
    const checkinData = {
      lastCheckinDate: today,
      streak: checkinStreak.value
    }
    uni.setStorageSync('grammarCheckin', checkinData)
  } catch (e) {
    console.error('保存打卡记录失败:', e)
  }
}

// 加载打卡记录
const loadCheckinRecord = () => {
  try {
    const checkinData = uni.getStorageSync('grammarCheckin')
    if (checkinData) {
      const today = new Date().toDateString()
      const lastCheckinDate = new Date(checkinData.lastCheckinDate).toDateString()
      
      // 检查是否是今天打卡
      if (lastCheckinDate === today) {
        hasCheckedInToday.value = true
      } else {
        // 检查是否是昨天打卡
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayDate = yesterday.toDateString()
        
        if (lastCheckinDate !== yesterdayDate) {
          // 中断连续打卡
          checkinStreak.value = 0
        } else {
          // 保持连续打卡
          checkinStreak.value = checkinData.streak
        }
      }
    }
  } catch (e) {
    console.error('加载打卡记录失败:', e)
  }
}

// 保存进度记录
const saveProgressRecord = (score) => {
  const today = new Date().toLocaleDateString()
  
  // 检查今天是否已有记录
  const todayRecord = progressRecords.value.find(record => record.date === today)
  if (!todayRecord) {
    // 添加新记录
    const newRecord = {
      date: today,
      score
    }
    progressRecords.value.push(newRecord)
    
    // 只保留最近7天的记录
    if (progressRecords.value.length > 7) {
      progressRecords.value = progressRecords.value.slice(-7)
    }
    
    // 保存到本地存储
    try {
      uni.setStorageSync('grammarProgress', progressRecords.value)
    } catch (e) {
      console.error('保存进度记录失败:', e)
    }
  }
}

// 加载进度记录
const loadProgressRecord = () => {
  try {
    const records = uni.getStorageSync('grammarProgress')
    if (records) {
      progressRecords.value = records
    }
  } catch (e) {
    console.error('加载进度记录失败:', e)
  }
}

onMounted(() => {
  // 加载打卡记录
  loadCheckinRecord()
  
  // 加载进度记录
  loadProgressRecord()
  
  console.log('语法分析页面初始化')
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

.writing-type-selection,
.difficulty-selection,
.writing-section,
.analysis-section,
.checkin-section,
.progress-section {
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
  margin-bottom: 20rpx;
  display: block;
}

.type-buttons,
.difficulty-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.type-button,
.difficulty-button {
  padding: 24rpx;
  border-radius: 10rpx;
  border: 1rpx solid #DDDDDD;
  background-color: #F5F5F5;
  font-size: 28rpx;
  color: #333333;
  transition: all 0.3s ease;
}

.type-button.active,
.difficulty-button.active {
  background-color: #2196F3;
  color: white;
  border-color: #2196F3;
}

.prompt-container {
  background-color: #F9F9F9;
  padding: 24rpx;
  border-radius: 10rpx;
  margin-bottom: 24rpx;
}

.prompt-label {
  font-size: 24rpx;
  font-weight: bold;
  color: #333333;
}

.prompt-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
}

.writing-textarea {
  width: 100%;
  min-height: 300rpx;
  padding: 24rpx;
  border: 1rpx solid #DDDDDD;
  border-radius: 10rpx;
  font-size: 28rpx;
  line-height: 1.5;
  background-color: #F9F9F9;
}

.word-count {
  font-size: 20rpx;
  color: #999999;
  text-align: right;
  margin-top: 12rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin: 40rpx 0;
}

.primary-button {
  flex: 2;
  background-color: #2196F3;
  color: white;
  font-size: 32rpx;
  padding: 30rpx;
  border-radius: 10rpx;
  border: none;
}

.secondary-button {
  flex: 1;
  background-color: #F5F5F5;
  color: #333333;
  font-size: 28rpx;
  padding: 30rpx;
  border-radius: 10rpx;
  border: 1rpx solid #DDDDDD;
}

.result-card {
  background-color: #F9F9F9;
  padding: 24rpx;
  border-radius: 10rpx;
  margin-bottom: 30rpx;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.result-label {
  font-size: 28rpx;
  color: #333333;
}

.result-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #2196F3;
}

.section-subtitle {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.errors-list {
  margin-bottom: 30rpx;
}

.error-item {
  background-color: #FFF3E0;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 16rpx;
  border-left: 4rpx solid #FF9800;
}

.error-type {
  font-size: 24rpx;
  font-weight: bold;
  color: #E65100;
}

.error-message {
  font-size: 24rpx;
  color: #666666;
  margin-left: 8rpx;
}

.error-suggestion {
  font-size: 22rpx;
  color: #888888;
  display: block;
  margin-top: 8rpx;
}

.suggestions-section {
  background-color: #E3F2FD;
  padding: 24rpx;
  border-radius: 10rpx;
}

.suggestion-text {
  font-size: 24rpx;
  color: #1976D2;
  line-height: 1.5;
}

.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.checkin-streak {
  font-size: 24rpx;
  color: #4CAF50;
  font-weight: bold;
}

.checkin-button {
  width: 100%;
  padding: 30rpx;
  border-radius: 10rpx;
  border: none;
  font-size: 32rpx;
  font-weight: bold;
  transition: all 0.3s ease;
}

.checkin-button:not(.checked-in) {
  background-color: #4CAF50;
  color: white;
}

.checkin-button.checked-in {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.progress-chart {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.progress-date {
  font-size: 22rpx;
  color: #666666;
}

.progress-score {
  font-size: 24rpx;
  font-weight: bold;
  color: #333333;
}

.progress-bar {
  height: 12rpx;
  background-color: #F5F5F5;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

@media (max-width: 375px) {
  .container {
    padding: 24rpx;
  }
  
  .type-buttons,
  .difficulty-buttons {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>