<template>
  <view class="container">
    <!-- 图片显示区域 -->
    <view class="canvas-container">
      <canvas 
        canvas-id="gridCanvas" 
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      ></canvas>
    </view>
    
    <!-- 控制区域 -->
    <view class="controls">
      <!-- 分割线设置 -->
      <view class="split-controls">
        <view class="split-item">
          <text>{{ i18n.t('gridTool.horizontalSplit') }}</text>
          <picker mode="number" :range="lineRange" @change="onHorizontalChange">
            <view class="picker">
              {{ horizontalLines }}
            </view>
          </picker>
        </view>
        <view class="split-item">
          <text>{{ i18n.t('gridTool.verticalSplit') }}</text>
          <picker mode="number" :range="lineRange" @change="onVerticalChange">
            <view class="picker">
              {{ verticalLines }}
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 线条颜色设置 -->
      <view class="color-controls">
        <text>{{ i18n.t('gridTool.lineColor') }}</text>
        <view class="color-buttons">
          <button 
            v-for="color in colorOptions" 
            :key="color.value"
            :class="{ 'active': lineColor === color.value }"
            :style="{ backgroundColor: color.value }"
            @click="selectColor(color.value)"
            class="color-button"
          ></button>
          <button @click="showColorPicker = true" class="color-button other-color">
            {{ i18n.t('gridTool.otherColor') }}
          </button>
        </view>
      </view>
      
      <!-- 线条粗细设置 -->
      <view class="width-control">
        <text>{{ i18n.t('gridTool.lineWidth') }} {{ lineWidth }}px</text>
        <slider 
          min="1" 
          max="10" 
          :value="lineWidth" 
          @change="onLineWidthChange"
        />
      </view>
      
      <!-- 特殊效果和预设 -->
      <view class="special-controls">
        <label class="diagonal-label">
          <checkbox :checked="showDiagonal" @change="toggleDiagonal" />
          <text>{{ i18n.t('gridTool.showDiagonal') }}</text>
        </label>
        <view class="preset-buttons">
          <button v-for="preset in presets" :key="preset.name" @click="applyPreset(preset)" class="preset-button">
            {{ preset.name }}
          </button>
        </view>
      </view>
    </view>
    
    <!-- 底部操作按钮 -->
    <view class="bottom-buttons">
      <button @click="selectImage" class="action-button">{{ i18n.t('gridTool.selectImage') }}</button>
      <button @click="saveImage" class="action-button primary">{{ i18n.t('gridTool.saveImage') }}</button>
    </view>
    
    <!-- 颜色选择器 -->
    <view v-if="showColorPicker" class="color-picker-overlay">
      <view class="color-picker">
        <text class="picker-title">{{ i18n.t('gridTool.colorPicker') }}</text>
        <input type="color" v-model="tempColor" />
        <view class="picker-buttons">
          <button @click="confirmColor" class="picker-button">{{ i18n.t('common.confirm') }}</button>
          <button @click="showColorPicker = false" class="picker-button">{{ i18n.t('common.cancel') }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import i18n from '../../locale'

const canvasWidth = ref(300)
const canvasHeight = ref(400)
const horizontalLines = ref(4)
const verticalLines = ref(4)
const lineColor = ref('#000000')
const lineWidth = ref(2)
const showDiagonal = ref(false)
const originalImage = ref(null)
const showColorPicker = ref(false)
const tempColor = ref('#000000')

// 分割线范围
const lineRange = ref([])
for (let i = 1; i <= 20; i++) {
  lineRange.value.push(i)
}

// 颜色选项
const colorOptions = [
  { label: i18n.t('gridTool.presets.nineGrid'), value: '#000000' },
  { label: i18n.t('gridTool.presets.riceGrid'), value: '#FF0000' },
  { label: i18n.t('gridTool.presets.fieldGrid'), value: '#00FF00' },
  { label: 'Blue', value: '#0000FF' }
]

const presets = [
  { name: i18n.t('gridTool.presets.nineGrid'), h: 3, v: 3 },
  { name: i18n.t('gridTool.presets.riceGrid'), h: 3, v: 3, diagonal: true },
  { name: i18n.t('gridTool.presets.fieldGrid'), h: 2, v: 2 }
]

const originalImageWidth = ref(0)
const originalImageHeight = ref(0)
const displayImageWidth = ref(0)
const displayImageHeight = ref(0)
const imageX = ref(0)
const imageY = ref(0)

const selectImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      originalImage.value = res.tempFilePaths[0]
      // 获取图片信息
      uni.getImageInfo({
        src: originalImage.value,
        success: (imageInfo) => {
          originalImageWidth.value = imageInfo.width
          originalImageHeight.value = imageInfo.height
          calculateDisplaySize()
          loadImageAndDraw()
        }
      })
    }
  })
}

const calculateDisplaySize = () => {
  const systemInfo = uni.getSystemInfoSync()
  const maxWidth = systemInfo.windowWidth - 40
  const maxHeight = systemInfo.windowHeight * 0.6
  
  const imageRatio = originalImageWidth.value / originalImageHeight.value
  const maxRatio = maxWidth / maxHeight
  
  if (imageRatio > maxRatio) {
    // 图片比显示区域更宽
    displayImageWidth.value = maxWidth
    displayImageHeight.value = maxWidth / imageRatio
  } else {
    // 图片比显示区域更高
    displayImageHeight.value = maxHeight
    displayImageWidth.value = maxHeight * imageRatio
  }
  
  // 计算图片居中位置
  imageX.value = (maxWidth - displayImageWidth.value) / 2
  imageY.value = (maxHeight - displayImageHeight.value) / 2
  
  // 设置canvas尺寸
  canvasWidth.value = maxWidth
  canvasHeight.value = maxHeight
}

const loadImageAndDraw = () => {
  const ctx = uni.createCanvasContext('gridCanvas')
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // 绘制原始图片（保持原始比例）
  ctx.drawImage(originalImage.value, imageX.value, imageY.value, displayImageWidth.value, displayImageHeight.value)
  
  // 绘制网格
  drawGrid(ctx)
  ctx.draw()
}

const drawGrid = (ctx) => {
  ctx.setStrokeStyle(lineColor.value)
  ctx.setLineWidth(lineWidth.value)
  
  // 绘制横线
  const hSpacing = canvasHeight.value / (horizontalLines.value + 1)
  for (let i = 1; i <= horizontalLines.value; i++) {
    const y = i * hSpacing
    ctx.moveTo(0, y)
    ctx.lineTo(canvasWidth.value, y)
  }
  
  // 绘制竖线
  const vSpacing = canvasWidth.value / (verticalLines.value + 1)
  for (let i = 1; i <= verticalLines.value; i++) {
    const x = i * vSpacing
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasHeight.value)
  }
  
  // 绘制对角线
  if (showDiagonal.value) {
    ctx.setLineWidth(lineWidth.value / 2)
    ctx.setStrokeStyle(lineColor.value + '80') // 半透明
    ctx.moveTo(0, 0)
    ctx.lineTo(canvasWidth.value, canvasHeight.value)
    ctx.moveTo(canvasWidth.value, 0)
    ctx.lineTo(0, canvasHeight.value)
  }
  
  ctx.stroke()
}

const redrawGrid = () => {
  const ctx = uni.createCanvasContext('gridCanvas')
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  ctx.drawImage(originalImage.value, imageX.value, imageY.value, displayImageWidth.value, displayImageHeight.value)
  drawGrid(ctx)
  ctx.draw()
}

const saveImage = () => {
  // 直接使用显示canvas进行保存，但设置正确的尺寸参数
  uni.canvasToTempFilePath({
    canvasId: 'gridCanvas',
    width: canvasWidth.value,
    height: canvasHeight.value,
    destWidth: originalImageWidth.value,
    destHeight: originalImageHeight.value,
    success: (res) => {
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => {
          uni.showToast({ title: i18n.t('gridTool.saveSuccess') })
        }
      })
    }
  })
}

const applyPreset = (preset) => {
  horizontalLines.value = preset.h
  verticalLines.value = preset.v
  showDiagonal.value = preset.diagonal || false
  redrawGrid()
}

// 选择颜色
const selectColor = (color) => {
  lineColor.value = color
  redrawGrid()
}

// 确认颜色选择
const confirmColor = () => {
  lineColor.value = tempColor.value
  showColorPicker.value = false
  redrawGrid()
}

// 水平分割线变化
const onHorizontalChange = (e) => {
  horizontalLines.value = e.detail.value + 1 // +1因为索引从0开始
  redrawGrid()
}

// 垂直分割线变化
const onVerticalChange = (e) => {
  verticalLines.value = e.detail.value + 1 // +1因为索引从0开始
  redrawGrid()
}

// 线条粗细变化
const onLineWidthChange = (e) => {
  lineWidth.value = e.detail.value
  redrawGrid()
}

// 切换对角线显示
const toggleDiagonal = (e) => {
  showDiagonal.value = e.detail.value
  redrawGrid()
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  canvasWidth.value = systemInfo.windowWidth - 40
  canvasHeight.value = systemInfo.windowHeight * 0.5 // 图片区域占屏幕一半
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}

/* 图片显示区域 */
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  background-color: white;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  overflow: hidden;
}

/* 控制区域 */
.controls {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 150rpx; /* 为底部按钮留出空间 */
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
}

/* 分割线控制 */
.split-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
}

.split-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.split-item text {
  font-size: 28rpx;
  color: #333333;
  white-space: nowrap;
}

.picker {
  background-color: #FFFFFF;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  border: 1rpx solid #DDDDDD;
  font-size: 28rpx;
  min-width: 80rpx;
  text-align: center;
  flex: 1;
  max-width: 120rpx;
}

/* 颜色控制 */
.color-controls {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
}

.color-controls text {
  font-size: 28rpx;
  color: #333333;
  white-space: nowrap;
}

.color-buttons {
  display: flex;
  gap: 12rpx;
  flex: 1;
}

.color-button {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  border: 2rpx solid #DDDDDD;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.color-button.active {
  border-color: #007AFF;
  box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.2);
}

.color-button.other-color {
  background-color: #FFFFFF;
  color: #666666;
  font-size: 20rpx;
  width: 80rpx;
  border-radius: 25rpx;
  flex-shrink: 0;
}

/* 线条粗细控制 */
.width-control {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 10rpx;
}

.width-control text {
  font-size: 28rpx;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
}

/* 特殊效果和预设 */
.special-controls {
  display: flex;
  align-items: center;
  gap: 15rpx;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 10rpx;
}

.diagonal-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: #333333;
  white-space: nowrap;
}

.preset-buttons {
  display: flex;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.preset-button {
  padding: 10rpx 16rpx;
  font-size: 22rpx;
  border-radius: 8rpx;
  border: 1rpx solid #DDDDDD;
  background-color: #F5F5F5;
  color: #333333;
  flex: 1;
  text-align: center;
  white-space: nowrap;
}

/* 底部操作按钮 */
.bottom-buttons {
  position: fixed;
  bottom: 30rpx;
  left: 20rpx;
  right: 20rpx;
  display: flex;
  gap: 20rpx;
  z-index: 100;
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
}

.action-button.primary {
  background-color: #007AFF;
  color: white;
  border-color: #007AFF;
}

/* 颜色选择器 */
.color-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.color-picker {
  background-color: white;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 80%;
  max-width: 400rpx;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.2);
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
}

.picker-buttons {
  display: flex;
  gap: 20rpx;
}

.picker-button {
  flex: 1;
  padding: 20rpx;
  font-size: 28rpx;
  border-radius: 10rpx;
  border: 1rpx solid #DDDDDD;
  background-color: #F5F5F5;
  color: #333333;
}

.picker-button:first-child {
  background-color: #007AFF;
  color: white;
  border-color: #007AFF;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .split-controls {
    flex-direction: column;
    gap: 20rpx;
  }
  
  .split-item {
    width: 100%;
  }
  
  .special-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 20rpx;
  }
  
  .preset-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .preset-button {
    flex: 1;
    text-align: center;
  }
  
  .canvas-container {
    margin-bottom: 20rpx;
  }
  
  .controls {
    padding: 20rpx;
    margin-bottom: 140rpx;
  }
}
</style>
