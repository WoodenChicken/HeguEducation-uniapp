<template>
  <view class="container">
    <!-- 临时 canvas 用于图像分析 -->
    <canvas 
      canvas-id="tempAnalysisCanvas" 
      style="position: absolute; top: -9999px; left: -9999px; width: 1px; height: 1px;"
    ></canvas>
    
    <!-- 图片上传区域 -->
    <view class="image-upload">
      <view class="upload-area" @click="uploadOriginal">
        <text v-if="!originalImage">上传原作</text>
        <image v-else :src="originalImage" mode="aspectFit" class="uploaded-image" />
      </view>
      
      <view class="upload-area" @click="uploadCopy">
        <text v-if="!copyImage">上传临摹</text>
        <image v-else :src="copyImage" mode="aspectFit" class="uploaded-image" />
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-button-container">
      <button @click="analyze" :disabled="!originalImage || !copyImage || isLoading" class="action-button primary">
        {{ isLoading ? '分析中...' : '开始对比分析' }}
      </button>
    </view>
    
    <!-- 分析结果 -->
    <view v-if="analysisResult" class="result-container">
      <text class="result-title">分析报告</text>
      
      <!-- 总体相似度评分 -->
      <view class="score-display">
        <text class="score-label">相似度评分：{{ analysisResult.similarity }}%</text>
        <progress :percent="analysisResult.similarity" show-info class="score-progress" />
      </view>
      
      <!-- 详细相似度数据 -->
      <view class="details">
        <view class="detail-item">
          <text class="detail-label">线条粗细相似度：{{ analysisResult.lineThicknessSimilarity }}%</text>
          <progress :percent="analysisResult.lineThicknessSimilarity" show-info class="detail-progress" />
        </view>
        <view class="detail-item">
          <text class="detail-label">线条长度相似度：{{ analysisResult.lineLengthSimilarity }}%</text>
          <progress :percent="analysisResult.lineLengthSimilarity" show-info class="detail-progress" />
        </view>
        <view class="detail-item">
          <text class="detail-label">空间位置相似度：{{ analysisResult.spatialPositionSimilarity }}%</text>
          <progress :percent="analysisResult.spatialPositionSimilarity" show-info class="detail-progress" />
        </view>
        <view class="detail-item">
          <text class="detail-label">整体结构相似度：{{ analysisResult.overallStructureSimilarity }}%</text>
          <progress :percent="analysisResult.overallStructureSimilarity" show-info class="detail-progress" />
        </view>
      </view>
      
      <!-- 改进建议 -->
      <view class="suggestions">
        <text class="section-title">改进建议</text>
        <view v-for="(suggestion, index) in analysisResult.suggestions" :key="index" class="suggestion-item">
          <text class="suggestion-text">{{ index + 1 }}. {{ suggestion }}</text>
        </view>
      </view>
      
      <!-- 对比图 -->
      <view class="comparison-view">
        <text class="section-title">对比分析图</text>
        <canvas 
          canvas-id="comparisonCanvas" 
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
          class="comparison-canvas"
        ></canvas>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import i18n from '../../locale'
import { analyzeImages as analyzeImagesUtil } from '../../utils/image-analysis'

const originalImage = ref(null)
const copyImage = ref(null)
const analysisResult = ref(null)
const canvasWidth = ref(300)
const canvasHeight = ref(400)
const isLoading = ref(false)

// 图片信息
const originalImageInfo = ref({ width: 0, height: 0 })
const copyImageInfo = ref({ width: 0, height: 0 })

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  canvasWidth.value = systemInfo.windowWidth - 40
  canvasHeight.value = systemInfo.windowHeight * 0.4
})

const uploadOriginal = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      originalImage.value = res.tempFilePaths[0]
      // 获取图片信息
      uni.getImageInfo({
        src: originalImage.value,
        success: (info) => {
          originalImageInfo.value = info
        }
      })
    }
  })
}

const uploadCopy = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      copyImage.value = res.tempFilePaths[0]
      // 获取图片信息
      uni.getImageInfo({
        src: copyImage.value,
        success: (info) => {
          copyImageInfo.value = info
        }
      })
    }
  })
}

const analyze = async () => {
  if (!originalImage.value || !copyImage.value) {
    uni.showToast({
      title: '请先上传两张图片',
      icon: 'none'
    })
    return
  }
  
  isLoading.value = true
  
  try {
    // 使用真实的图形滤波算法分析
    const result = await analyzeImagesUtil(originalImage.value, copyImage.value)
    analysisResult.value = result
    
    // 绘制对比图
    drawComparison()
    
    uni.showToast({
      title: '分析完成',
      icon: 'success'
    })
  } catch (error) {
    console.error('分析失败:', error)
    uni.showToast({
      title: '分析失败，请重试',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const drawComparison = () => {
  const ctx = uni.createCanvasContext('comparisonCanvas')
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // 绘制对比图
  if (originalImage.value && copyImage.value) {
    // 绘制原作
    ctx.drawImage(originalImage.value, 0, 0, canvasWidth.value / 2 - 10, canvasHeight.value)
    
    // 绘制分隔线
    ctx.setStrokeStyle('#CCCCCC')
    ctx.setLineWidth(2)
    ctx.moveTo(canvasWidth.value / 2, 0)
    ctx.lineTo(canvasWidth.value / 2, canvasHeight.value)
    ctx.stroke()
    
    // 绘制临摹
    ctx.drawImage(copyImage.value, canvasWidth.value / 2 + 10, 0, canvasWidth.value / 2 - 10, canvasHeight.value)
    
    // 绘制标签
    ctx.setFillStyle('#333333')
    ctx.setFontSize(16)
    ctx.fillText('原作', 50, 30)
    ctx.fillText('临摹', canvasWidth.value / 2 + 60, 30)
  }
  
  ctx.draw()
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}

/* 图片上传区域 */
.image-upload {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.upload-area {
  flex: 1;
  background-color: white;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 2rpx dashed #DDDDDD;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #007AFF;
  box-shadow: 0 4rpx 20rpx rgba(0, 122, 255, 0.1);
}

.upload-area text {
  font-size: 32rpx;
  color: #666666;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  border-radius: 10rpx;
}

/* 操作按钮 */
.action-button-container {
  margin-bottom: 30rpx;
}

.action-button {
  flex: 1;
  padding: 30rpx;
  font-size: 32rpx;
  border-radius: 15rpx;
  border: 1rpx solid #DDDDDD;
  background-color: white;
  color: #333333;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
  font-weight: 500;
  width: 100%;
}

.action-button.primary {
  background-color: #007AFF;
  color: white;
  border-color: #007AFF;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 结果容器 */
.result-container {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  margin-top: 20rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
  display: block;
  text-align: center;
}

/* 评分显示 */
.score-display {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
}

.score-label {
  font-size: 28rpx;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
}

.score-progress {
  width: 100%;
  height: 20rpx;
}

/* 详细信息 */
.details {
  margin-bottom: 30rpx;
}

.detail-item {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
}

.detail-label {
  font-size: 24rpx;
  color: #333333;
  display: block;
  margin-bottom: 12rpx;
}

.detail-progress {
  width: 100%;
  height: 16rpx;
}

/* 建议部分 */
.suggestions {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.suggestion-item {
  margin-bottom: 16rpx;
  padding: 16rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
}

.suggestion-text {
  font-size: 24rpx;
  color: #333333;
  line-height: 1.5;
}

/* 对比图 */
.comparison-view {
  margin-top: 30rpx;
}

.comparison-canvas {
  background-color: #F9F9F9;
  border-radius: 10rpx;
  margin-top: 16rpx;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .image-upload {
    flex-direction: column;
  }
  
  .upload-area {
    aspect-ratio: 2;
  }
  
  .action-button {
    padding: 24rpx;
    font-size: 28rpx;
  }
  
  .result-container {
    padding: 20rpx;
  }
  
  .result-title {
    font-size: 32rpx;
  }
  
  .section-title {
    font-size: 28rpx;
  }
}
</style>
