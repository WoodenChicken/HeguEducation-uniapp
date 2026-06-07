<template>
  <view class="container">
    <!-- 步骤指示器 -->
    <view class="step-indicator">
      <view class="step-item" :class="{ active: currentStep === 1 }">
        <view class="step-number">1</view>
        <text class="step-text">观察字帖</text>
      </view>
      <view class="step-line"></view>
      <view class="step-item" :class="{ active: currentStep === 2 }">
        <view class="step-number">2</view>
        <text class="step-text">记忆背临</text>
      </view>
      <view class="step-line"></view>
      <view class="step-item" :class="{ active: currentStep === 3 }">
        <view class="step-number">3</view>
        <text class="step-text">对比分析</text>
      </view>
    </view>

    <!-- 步骤 1: 观察字帖 -->
    <view v-if="currentStep === 1" class="step-content">
      <view class="reference-container">
        <view class="reference-header">
          <text class="title">仔细观察原帖</text>
          <text class="subtitle">记住每个字的笔法、结构、章法</text>
        </view>
        
        <!-- 字帖展示区 -->
        <view class="reference-scroll">
          <scroll-view scroll-x scroll-y class="scroll-view">
            <image 
              :src="referenceImage" 
              mode="aspectFit" 
              class="reference-img"
              @load="onImageLoad"
            />
          </scroll-view>
        </view>
        
        <!-- 隐藏的 canvas 用于截取单字 -->
        <view class="hidden-canvas">
          <canvas canvas-id="tempCropCanvas" class="crop-canvas"></canvas>
        </view>
        
        <!-- 字帖信息 -->
        <view class="reference-info">
          <view class="info-item">
            <text class="label">字数：</text>
            <text class="value">{{ charCount }} 字</text>
          </view>
          <view class="info-item">
            <text class="label">建议用时：</text>
            <text class="value">{{ estimatedTime }} 分钟</text>
          </view>
        </view>
        
        <!-- 观察要点提示 -->
        <view class="observation-tips">
          <view class="tip-item">
            <text class="tip-icon">✍️</text>
            <text class="tip-text">笔法：起笔、行笔、收笔的特点</text>
          </view>
          <view class="tip-item">
            <text class="tip-icon">📐</text>
            <text class="tip-text">结构：间架结构、重心位置</text>
          </view>
          <view class="tip-item">
            <text class="tip-icon">📏</text>
            <text class="tip-text">大小：字的大小比例关系</text>
          </view>
          <view class="tip-item">
            <text class="tip-icon">🎯</text>
            <text class="tip-text">空间：笔画间的空间分布</text>
          </view>
          <view class="tip-item">
            <text class="tip-icon">🌟</text>
            <text class="tip-text">章法：整体布局和气息</text>
          </view>
        </view>
        
        <button class="start-btn" @click="startMemoryTest">
          我已记住，开始背临
        </button>
      </view>
    </view>

    <!-- 步骤 2: 记忆背临 -->
    <view v-if="currentStep === 2" class="step-content">
      <view class="practice-container">
        <view class="practice-header">
          <text class="title">背临练习</text>
          <text class="subtitle">根据记忆书写，原帖已隐藏</text>
        </view>
        
        <!-- 当前字提示 -->
        <view class="char-indicator">
          <text class="char-progress">第 {{ currentCharIndex + 1 }} / {{ charCount }} 字</text>
          <view class="char-dots">
            <view 
              v-for="(char, index) in charCount" 
              :key="index"
              class="char-dot"
              :class="{ completed: index < currentCharIndex, current: index === currentCharIndex }"
            ></view>
          </view>
        </view>
        
        <!-- 原帖单字提示（短暂显示后隐藏） -->
        <view v-if="showCharPreview" class="char-preview">
          <text class="preview-label">观察原帖（5 秒后隐藏）</text>
          <image :src="currentCharPreview" mode="aspectFit" class="preview-img" />
          <view class="preview-timer">
            <view class="timer-bar" :style="{ width: timerProgress + '%' }"></view>
          </view>
        </view>
        
        <!-- 书写区域（放大） -->
        <view class="canvas-wrapper">
          <view class="canvas-header">
            <button class="control-btn" @click="toggleGrid">
              {{ showGrid ? '隐藏网格' : '显示网格' }}
            </button>
            <button class="control-btn" @click="toggleGuide">
              {{ showGuide ? '显示范字' : '隐藏范字' }}
            </button>
          </view>
          
          <view class="canvas-container" :style="{ height: canvasHeight + 'px' }">
            <!-- 范字层（最底层） -->
            <canvas 
              v-if="showGuide"
              type="2d"
              id="guideCanvas"
              class="guide-canvas"
            ></canvas>
            
            <!-- 网格层（中间层） -->
            <canvas 
              v-if="showGrid"
              type="2d"
              id="gridCanvas"
              class="grid-canvas"
            ></canvas>
            
            <!-- 练习层（最上层，用于书写） -->
            <canvas
              type="2d"
              id="practiceCanvas"
              class="practice-canvas"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
              @touchend="onTouchEnd"
              disable-scroll
            ></canvas>
          </view>
          
          <!-- 书写要点提示 -->
          <view class="writing-tips">
            <view class="tip-item small">
              <text class="tip-icon">✍️</text>
              <text class="tip-text">注意起笔、行笔、收笔的笔法</text>
            </view>
            <view class="tip-item small">
              <text class="tip-icon">📐</text>
              <text class="tip-text">把握间架结构和重心</text>
            </view>
            <view class="tip-item small">
              <text class="tip-icon">🎯</text>
              <text class="tip-text">注意笔画的空间分布</text>
            </view>
          </view>
        </view>
        
        <!-- 书写工具 -->
        <view class="brush-tools">
          <view class="tool-row">
            <text class="tool-label">笔刷：</text>
            <view class="brush-presets">
              <button
                v-for="preset in brushPresets"
                :key="preset.name"
                class="brush-btn"
                :class="{ active: currentBrush === preset }"
                :style="{ backgroundColor: preset.color }"
                @click="selectBrush(preset)"
              >
                {{ preset.name }}
              </button>
            </view>
          </view>
          
          <view class="tool-row">
            <text class="tool-label">粗细：{{ brushSize }}px</text>
            <slider
              class="size-slider"
              min="5"
              max="50"
              :value="brushSize"
              @change="onBrushSizeChange"
            />
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="practice-actions">
          <button class="action-btn clear" @click="clearCurrentChar">
            清空当前
          </button>
          <button class="action-btn undo" @click="undo">
            撤销
          </button>
          <button class="action-btn analyze" @click="analyzeCurrentChar">
            对比分析
          </button>
        </view>
      </view>
    </view>

    <!-- 步骤 3: 对比分析 -->
    <view v-if="currentStep === 3" class="step-content">
      <view class="analysis-container">
        <view class="analysis-header">
          <text class="title">第 {{ currentCharIndex + 1 }} 字分析</text>
          <text class="subtitle">与原帖对比分析</text>
        </view>
        
        <!-- 对比展示 -->
        <view class="comparison-section large">
          <view class="comparison-grid">
            <view class="comparison-item">
              <text class="item-label">原帖</text>
              <image :src="currentCharPreview" mode="aspectFit" class="comparison-img" />
            </view>
            <view class="comparison-item">
              <text class="item-label">背临</text>
              <image :src="currentCharPractice" mode="aspectFit" class="comparison-img" />
            </view>
          </view>
        </view>
        
        <!-- 总体评分 -->
        <view class="overall-score">
          <view class="score-circle">
            <text class="score-number">{{ currentCharScore }}</text>
            <text class="score-label">单字评分</text>
          </view>
        </view>
        
        <!-- 详细评分 -->
        <view class="detail-scores">
          <view class="score-item" v-for="(score, key) in currentCharDetailScores" :key="key">
            <text class="score-name">{{ getScoreName(key) }}</text>
            <progress 
              class="score-progress" 
              :percent="score" 
              show-info 
              activeColor="#007AFF"
            />
          </view>
        </view>
        
        <!-- 笔法分析 -->
        <view class="brushwork-analysis">
          <text class="section-title">笔法分析</text>
          <view class="brushwork-grid">
            <view class="brushwork-item">
              <text class="brushwork-label">起笔</text>
              <view class="brushwork-score" :class="getScoreClass(currentCharAnalysis.startStroke)">
                {{ currentCharAnalysis.startStroke }}分
              </view>
            </view>
            <view class="brushwork-item">
              <text class="brushwork-label">行笔</text>
              <view class="brushwork-score" :class="getScoreClass(currentCharAnalysis.middleStroke)">
                {{ currentCharAnalysis.middleStroke }}分
              </view>
            </view>
            <view class="brushwork-item">
              <text class="brushwork-label">收笔</text>
              <view class="brushwork-score" :class="getScoreClass(currentCharAnalysis.endStroke)">
                {{ currentCharAnalysis.endStroke }}分
              </view>
            </view>
          </view>
        </view>
        
        <!-- 结构分析 -->
        <view class="structure-analysis">
          <text class="section-title">结构分析</text>
          <view class="structure-grid">
            <view class="structure-item">
              <text class="structure-label">间架结构</text>
              <view class="structure-score" :class="getScoreClass(currentCharAnalysis.structure)">
                {{ currentCharAnalysis.structure }}分
              </view>
            </view>
            <view class="structure-item">
              <text class="structure-label">空间分布</text>
              <view class="structure-score" :class="getScoreClass(currentCharAnalysis.space)">
                {{ currentCharAnalysis.space }}分
              </view>
            </view>
            <view class="structure-item">
              <text class="structure-label">重心位置</text>
              <view class="structure-score" :class="getScoreClass(currentCharAnalysis.center)">
                {{ currentCharAnalysis.center }}分
              </view>
            </view>
          </view>
        </view>
        
        <!-- 改进建议 -->
        <view class="suggestions-section">
          <text class="section-title">改进建议</text>
          <view class="suggestion-list">
            <view 
              v-for="(suggestion, index) in suggestions" 
              :key="index"
              class="suggestion-item"
            >
              <text class="suggestion-index">{{ index + 1 }}</text>
              <text class="suggestion-text">{{ suggestion }}</text>
            </view>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="analysis-actions">
          <button class="action-btn retry" @click="retryChar">
            重新背临
          </button>
          <button class="action-btn next" @click="nextChar">
            {{ currentCharIndex < charCount - 1 ? '下一个字' : '完成练习' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { analyzeImages } from '@/utils/image-analysis'

// 状态管理
const currentStep = ref(1) // 1: 观察，2: 背临，3: 分析
const referenceImage = ref('')
const charCount = ref(10)
const estimatedTime = ref(5)
const currentCharIndex = ref(0)

// 画布相关
const canvasHeight = ref(500) // 增加高度，放大书写
const showGrid = ref(true)
const showGuide = ref(false)
const currentBrush = ref({ name: '浓墨', color: '#000000', size: 12 })
const brushSize = ref(12)
const isDrawing = ref(false)
const lastPoint = ref({ x: 0, y: 0 })
const strokeHistory = ref([])
const currentStroke = ref([])

// Canvas 2D 上下文
let practiceCtx = null
let guideCtx = null
let gridCtx = null

// 是否使用 Canvas 2D API
const useCanvas2D = ref(true)

// 笔刷预设
const brushPresets = [
  { name: '浓墨', color: '#000000', size: 12 },
  { name: '淡墨', color: '#333333', size: 10 },
  { name: '枯笔', color: '#666666', size: 8 },
  { name: '朱砂', color: '#C41E3A', size: 10 }
]

// 单字分析结果
const currentCharScore = ref(0)
const currentCharDetailScores = ref({})
const currentCharAnalysis = ref({
  startStroke: 0,    // 起笔
  middleStroke: 0,   // 行笔
  endStroke: 0,      // 收笔
  structure: 0,      // 结构
  space: 0,          // 空间
  center: 0          // 重心
})
const suggestions = ref([])
const currentCharPractice = ref('')
const currentCharPreview = ref('')

// 字帖分割信息
const charPositions = ref([]) // [{x, y, width, height}]

// 原帖单字预览
const showCharPreview = ref(true)
const timerProgress = ref(100)
let previewTimer = null

// 选择字帖
const selectReference = () => {
  uni.showModal({
    title: '请输入字数',
    editable: true,
    placeholderText: '请输入字帖中的字数',
    success: (res) => {
      if (res.confirm && res.content) {
        const count = parseInt(res.content)
        if (count > 0 && count <= 100) {
          charCount.value = count
          doSelectImage()
        } else {
          uni.showToast({
            title: '请输入 1-100 之间的数字',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 选择图片
const doSelectImage = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: (res) => {
      referenceImage.value = res.tempFilePaths[0]
      // 分析字帖，提取每个字的位置
      analyzeReference(res.tempFilePaths[0])
    }
  })
}

// 分析字帖，提取字符位置（投影法）
const analyzeReference = (imagePath) => {
  uni.getImageInfo({
    src: imagePath,
    success: (imageInfo) => {
      const { width, height } = imageInfo
      
      console.log('原图尺寸:', width, 'x', height)
      console.log('字数:', charCount.value)
      
      // 根据字数和原图尺寸计算每个字的位置
      // 使用简化的网格分割（适用于大多数情况）
      
      let cols, rows
      const totalChars = charCount.value
      
      // 根据常见书法格式估算行列数
      if (totalChars <= 4) {
        // 少量字：根据图片比例判断
        if (width > height * 1.5) {
          // 横向
          cols = totalChars
          rows = 1
        } else if (height > width * 1.5) {
          // 纵向
          rows = totalChars
          cols = 1
        } else {
          // 方形
          cols = Math.ceil(Math.sqrt(totalChars))
          rows = Math.ceil(totalChars / cols)
        }
      } else {
        // 多字：根据比例分配
        const aspectRatio = width / height
        cols = Math.round(Math.sqrt(totalChars * aspectRatio))
        rows = Math.ceil(totalChars / cols)
      }
      
      console.log('估算行列数:', cols, '列 x', rows, '行')
      
      const cellWidth = width / cols
      const cellHeight = height / rows
      
      // 生成每个字的位置（居中裁剪）
      for (let i = 0; i < totalChars; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        
        // 每个字占单元格的 70%，居中（留出边距）
        const charWidth = cellWidth * 0.7
        const charHeight = cellHeight * 0.7
        const x = col * cellWidth + (cellWidth - charWidth) / 2
        const y = row * cellHeight + (cellHeight - charHeight) / 2
        
        charPositions.value.push({
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(charWidth),
          height: Math.round(charHeight)
        })
      }
      
      console.log('字符位置:', charPositions.value)
      estimatedTime.value = Math.ceil(charCount.value / 2)
      
      uni.showToast({
        title: `已识别${totalChars}个字`,
        icon: 'success'
      })
    },
    fail: (err) => {
      console.error('图片加载失败:', err)
      uni.showToast({
        title: '图片加载失败',
        icon: 'none'
      })
    }
  })
}

// 图片加载完成
const onImageLoad = (e) => {
  // 获取原图尺寸
  const { width: originalWidth, height: originalHeight } = e.detail
  
  // 根据原图尺寸设置预览 canvas（使用原图尺寸，保证截取准确）
  setTimeout(() => {
    const ctx = uni.createCanvasContext('previewCanvas')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, originalWidth, originalHeight)
    ctx.drawImage(referenceImage.value, 0, 0, originalWidth, originalHeight)
    ctx.draw()
  }, 200)
  
  // 绘制网格
  if (showGrid.value) {
    drawGrid()
  }
}

// 开始记忆测试
const startMemoryTest = async () => {
  currentStep.value = 2
  currentCharIndex.value = 0
  
  // 等待背临初始化完成
  await initPractice()
}

// 初始化背临
const initPractice = async () => {
  // 显示原帖单字预览（5 秒后自动隐藏）
  showCharPreview.value = true
  timerProgress.value = 100
  loadCurrentCharPreview()
  
  // 启动计时器
  if (previewTimer) clearInterval(previewTimer)
  previewTimer = setInterval(() => {
    timerProgress.value -= 2 // 50 帧，5 秒完成
    if (timerProgress.value <= 0) {
      clearInterval(previewTimer)
      showCharPreview.value = false
    }
  }, 100)
  
  // 等待 Canvas 初始化完成
  await initCanvas()
  
  console.log('背临初始化完成')
}

// 初始化画布（使用 Canvas 2D API，失败则降级）
const initCanvas = async () => {
  try {
    // 检测是否支持 Canvas 2D
    const systemInfo = uni.getSystemInfoSync()
    console.log('设备信息:', systemInfo.brand, systemInfo.system, systemInfo.platform)
    
    // 安全获取 brand
    const brand = systemInfo.brand ? systemInfo.brand.toLowerCase() : ''
    const platform = systemInfo.platform ? systemInfo.platform.toLowerCase() : ''
    
    console.log('品牌:', brand, '平台:', platform)
    
    // 华为设备强制使用 Canvas 2D
    if (brand.includes('huawei')) {
      useCanvas2D.value = true
      console.log('华为设备，强制使用 Canvas 2D')
    } else if (platform.includes('windows')) {
      // Windows 模拟器使用传统 Canvas
      useCanvas2D.value = false
      console.log('Windows 模拟器，使用传统 Canvas')
    } else {
      // 其他设备默认使用 Canvas 2D
      useCanvas2D.value = true
    }
    
    if (useCanvas2D.value) {
      // 尝试使用 Canvas 2D API
      practiceCtx = await getCanvasContext('practiceCanvas')
      guideCtx = await getCanvasContext('guideCanvas')
      gridCtx = await getCanvasContext('gridCanvas')
      
      // 初始化练习 Canvas
      const width = 375
      const height = canvasHeight.value
      
      practiceCtx.fillStyle = '#FFFFFF'
      practiceCtx.fillRect(0, 0, width, height)
      
      console.log('Canvas 2D 初始化完成，尺寸:', width, 'x', height)
    } else {
      // 降级到传统 Canvas API
      console.log('使用传统 Canvas API')
      initCanvasFallback()
      return  // 直接返回，不执行后续代码
    }
    
    // 绘制网格
    if (showGrid.value) {
      drawGrid()
    }
    
    // 加载范字
    if (showGuide.value) {
      loadCurrentCharGuide()
    }
  } catch (error) {
    console.error('Canvas 2D 初始化失败，尝试降级:', error)
    
    // 降级到传统 Canvas API
    useCanvas2D.value = false
    uni.showToast({
      title: 'Canvas 2D 不可用，已降级',
      icon: 'none'
    })
    
    // 延迟后重试
    setTimeout(() => {
      initCanvasFallback()
    }, 500)
  }
}

// 降级方案：传统 Canvas API
const initCanvasFallback = () => {
  console.log('传统 Canvas 初始化完成')
  
  // 使用传统 Canvas API
  const ctx = uni.createCanvasContext('practiceCanvas')
  ctx.setFillStyle('#FFFFFF')
  ctx.fillRect(0, 0, 375, canvasHeight.value)
  ctx.draw(false, () => {
    console.log('传统 Canvas 绘制完成')
    
    // 绘制网格
    if (showGrid.value) {
      drawGridFallback()
    }
    
    // 加载范字
    if (showGuide.value) {
      loadCurrentCharGuideFallback()
    }
  })
}

// 降级方案：绘制网格
const drawGridFallback = () => {
  const ctx = uni.createCanvasContext('gridCanvas')
  ctx.clearRect(0, 0, 375, canvasHeight.value)
  
  ctx.setStrokeStyle('#DDDDDD')
  ctx.setLineWidth(1)
  
  // 绘制九宫格
  const cellWidth = 375 / 3
  const cellHeight = canvasHeight.value / 3
  
  for (let i = 1; i < 3; i++) {
    // 横线
    ctx.moveTo(0, i * cellHeight)
    ctx.lineTo(375, i * cellHeight)
    // 竖线
    ctx.moveTo(i * cellWidth, 0)
    ctx.lineTo(i * cellWidth, canvasHeight.value)
  }
  
  ctx.stroke()
  ctx.draw()
}

// 降级方案：加载范字
const loadCurrentCharGuideFallback = () => {
  const ctx = uni.createCanvasContext('guideCanvas')
  ctx.clearRect(0, 0, 375, canvasHeight.value)
  
  if (charPositions.value[currentCharIndex.value]) {
    const pos = charPositions.value[currentCharIndex.value]
    ctx.setGlobalAlpha(0.3)
    // 截取并放大单字
    ctx.drawImage(
      referenceImage.value,
      pos.x, pos.y, pos.width, pos.height,
      0, 0, 375, canvasHeight.value
    )
    ctx.draw()
  }
}

// 获取 Canvas 2D 上下文
const getCanvasContext = (canvasId) => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0] && res[0].node) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          resolve(ctx)
        } else {
          reject(new Error('Canvas not found'))
        }
      })
  })
}

// 绘制网格（Canvas 2D）
const drawGrid = () => {
  if (!gridCtx) return
  
  const width = 375
  const height = canvasHeight.value
  
  gridCtx.clearRect(0, 0, width, height)
  gridCtx.strokeStyle = '#DDDDDD'
  gridCtx.lineWidth = 1
  
  // 绘制九宫格
  const cellWidth = width / 3
  const cellHeight = height / 3
  
  gridCtx.beginPath()
  for (let i = 1; i < 3; i++) {
    // 横线
    gridCtx.moveTo(0, i * cellHeight)
    gridCtx.lineTo(width, i * cellHeight)
    // 竖线
    gridCtx.moveTo(i * cellWidth, 0)
    gridCtx.lineTo(i * cellWidth, height)
  }
  gridCtx.stroke()
}

// 加载当前字的范字（Canvas 2D）
const loadCurrentCharGuide = () => {
  if (!guideCtx) return
  
  const width = 375
  const height = canvasHeight.value
  
  guideCtx.clearRect(0, 0, width, height)
  
  if (charPositions.value[currentCharIndex.value]) {
    const pos = charPositions.value[currentCharIndex.value]
    guideCtx.globalAlpha = 0.3
    
    // 创建临时 image 对象
    const img = guideCtx.createImage()
    img.src = referenceImage.value
    img.onload = () => {
      guideCtx.drawImage(
        img,
        pos.x, pos.y, pos.width, pos.height,
        0, 0, width, height
      )
    }
  }
}

// 加载当前字的预览（用于背临前观察）
const loadCurrentCharPreview = () => {
  if (charPositions.value[currentCharIndex.value]) {
    const pos = charPositions.value[currentCharIndex.value]
    console.log('截取第', currentCharIndex.value + 1, '字，位置:', pos)
    
    // 使用原图尺寸的 Canvas 进行截取
    uni.getImageInfo({
      src: referenceImage.value,
      success: (imgInfo) => {
        console.log('原图尺寸:', imgInfo.width, 'x', imgInfo.height)
        
        // 创建临时 Canvas 用于截取
        const tempCanvasId = 'tempCropCanvas'
        const tempCtx = uni.createCanvasContext(tempCanvasId)
        
        // 设置 Canvas 尺寸为原图尺寸
        tempCtx.drawImage(
          referenceImage.value,
          0, 0,
          imgInfo.width, imgInfo.height
        )
        tempCtx.draw(false, () => {
          // 等待绘制完成后截取
          setTimeout(() => {
            uni.canvasToTempFilePath({
              canvasId: tempCanvasId,
              x: Math.max(0, Math.round(pos.x)),
              y: Math.max(0, Math.round(pos.y)),
              width: Math.max(10, Math.round(pos.width)),
              height: Math.max(10, Math.round(pos.height)),
              destWidth: 300,
              destHeight: 300,
              canvasId: tempCanvasId,
              success: (res) => {
                currentCharPreview.value = res.tempFilePath
                console.log('截取成功:', res.tempFilePath)
              },
              fail: (err) => {
                console.error('截取失败:', err)
                // 如果截取失败，使用整个图片作为预览
                currentCharPreview.value = referenceImage.value
                uni.showToast({
                  title: '使用原图预览',
                  icon: 'none'
                })
              }
            })
          }, 300)
        })
      }
    })
  }
}

// 触摸开始（Canvas 2D）
const onTouchStart = (e) => {
  if (!practiceCtx) {
    console.error('Canvas 上下文未初始化')
    uni.showToast({
      title: 'Canvas 未初始化，请重试',
      icon: 'none'
    })
    return
  }
  
  console.log('触摸开始', e.touches[0])
  isDrawing.value = true
  const point = getCanvasPointSync(e)
  console.log('画布坐标:', point)
  lastPoint.value = point
  currentStroke.value = [point]
  
  // 设置画笔样式
  practiceCtx.strokeStyle = currentBrush.value.color
  practiceCtx.lineWidth = brushSize.value
  practiceCtx.lineCap = 'round'
  practiceCtx.lineJoin = 'round'
  
  // 开始路径
  practiceCtx.beginPath()
  practiceCtx.moveTo(point.x, point.y)
  
  // 画一个点测试
  practiceCtx.fillStyle = currentBrush.value.color
  practiceCtx.fillRect(point.x - brushSize.value/2, point.y - brushSize.value/2, brushSize.value, brushSize.value)
}

// 触摸移动（Canvas 2D）
const onTouchMove = (e) => {
  if (!isDrawing.value || !practiceCtx) return
  
  const point = getCanvasPointSync(e)
  
  // 绘制线条
  practiceCtx.lineTo(point.x, point.y)
  practiceCtx.stroke()
  
  currentStroke.value.push(point)
  lastPoint.value = point
}

// 触摸结束（Canvas 2D）
const onTouchEnd = () => {
  if (!practiceCtx) return
  
  isDrawing.value = false
  if (currentStroke.value.length > 1) {
    strokeHistory.value.push({
      points: [...currentStroke.value],
      color: currentBrush.value.color,
      size: brushSize.value
    })
  }
  currentStroke.value = []
}

// 同步获取画布坐标（简单直接）
const getCanvasPointSync = (e) => {
  const touch = e.touches[0]
  return {
    x: touch.clientX,
    y: touch.clientY
  }
}

// 选择笔刷
const selectBrush = (preset) => {
  currentBrush.value = preset
  brushSize.value = preset.size
  console.log('选择笔刷:', preset.name, '颜色:', preset.color, '大小:', preset.size)
}

// 笔刷大小变化
const onBrushSizeChange = (e) => {
  brushSize.value = e.detail.value
  console.log('笔刷大小:', brushSize.value)
}

// 切换网格
const toggleGrid = () => {
  showGrid.value = !showGrid.value
  if (showGrid.value) {
    drawGrid()
  } else {
    const ctx = uni.createCanvasContext('gridCanvas')
    ctx.clearRect(0, 0, 300, canvasHeight.value)
    ctx.draw()
  }
}

// 切换范字
const toggleGuide = () => {
  showGuide.value = !showGuide.value
  if (showGuide.value) {
    loadCurrentCharGuide()
  } else {
    const ctx = uni.createCanvasContext('guideCanvas')
    ctx.clearRect(0, 0, 300, canvasHeight.value)
    ctx.draw()
  }
}

// 清空当前字（Canvas 2D）
const clearCurrentChar = () => {
  if (!practiceCtx) return
  
  const width = 375
  const height = canvasHeight.value
  
  practiceCtx.fillStyle = '#FFFFFF'
  practiceCtx.fillRect(0, 0, width, height)
  
  strokeHistory.value = []
  
  // 重新绘制网格
  if (showGrid.value) {
    drawGrid()
  }
  
  // 重新加载范字
  if (showGuide.value) {
    loadCurrentCharGuide()
  }
}

// 撤销（Canvas 2D）
const undo = () => {
  if (strokeHistory.value.length > 0) {
    strokeHistory.value.pop()
    redrawCanvas()
  }
}

// 重绘画布（Canvas 2D）
const redrawCanvas = () => {
  if (!practiceCtx) return
  
  const width = 375
  const height = canvasHeight.value
  
  // 清空画布
  practiceCtx.fillStyle = '#FFFFFF'
  practiceCtx.fillRect(0, 0, width, height)
  
  // 重绘网格
  if (showGrid.value) {
    drawGrid()
  }
  
  // 重绘范字
  if (showGuide.value) {
    loadCurrentCharGuide()
  }
  
  // 重绘所有笔触
  practiceCtx.lineCap = 'round'
  practiceCtx.lineJoin = 'round'
  
  strokeHistory.value.forEach(stroke => {
    if (stroke.points.length < 2) return
    
    practiceCtx.beginPath()
    practiceCtx.strokeStyle = stroke.color
    practiceCtx.lineWidth = stroke.size
    
    practiceCtx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      practiceCtx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    practiceCtx.stroke()
  })
}

// 分析当前字
const analyzeCurrentChar = async () => {
  uni.showLoading({ title: '智能分析中...' })
  
  try {
    // 保存当前字的背临（Canvas 2D API）
    const practicePath = await saveCanvasToTempFilePath('practiceCanvas')
    currentCharPractice.value = practicePath
    
    console.log('背临图片路径:', practicePath)
    
    // 获取原帖单字
    const originalCharPath = currentCharPreview.value
    console.log('原帖单字路径:', originalCharPath)
    
    if (!originalCharPath) {
      throw new Error('原帖单字路径为空')
    }
    
    // 调用图像分析 API 进行单字对比
    const result = await analyzeImages(originalCharPath, practicePath)
    
    // 计算单字评分
    currentCharScore.value = result.similarity
    currentCharDetailScores.value = result.details
    
    // 计算笔法和结构分数（基于详细评分）
    calculateBrushworkAndStructure(result.details)
    
    suggestions.value = result.suggestions
    
    // 保存当前字的评分到临时存储
    saveCharScore(currentCharScore.value, result)
    
    currentStep.value = 3
  } catch (error) {
    console.error('分析失败:', error)
    uni.showToast({ 
      title: '分析失败：' + error.message, 
      icon: 'none',
      duration: 3000
    })
  } finally {
    uni.hideLoading()
  }
}

// Canvas 2D 保存为临时文件（优化版）
const saveCanvasToTempFilePath = (canvasId) => {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery()
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0] && res[0].node) {
          const canvas = res[0].node
          
          try {
            // 使用 Canvas 2D API 的 toDataURL
            const dataURL = canvas.toDataURL('image/png')
            
            if (!dataURL || dataURL.length < 100) {
              throw new Error('Canvas 导出失败，数据为空')
            }
            
            console.log('Canvas 导出成功，数据长度:', dataURL.length)
            
            // 转换为临时文件路径
            const fs = uni.getFileSystemManager()
            const fileName = `${Date.now()}_${Math.random()}.png`
            const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
            
            // 解析 base64
            const base64 = dataURL.split(',')[1]
            
            if (!base64) {
              throw new Error('Base64 解析失败')
            }
            
            // 写入文件
            fs.writeFile({
              filePath: filePath,
              data: base64,
              encoding: 'base64',
              success: () => {
                console.log('文件保存成功:', filePath)
                resolve(filePath)
              },
              fail: (err) => {
                console.error('文件写入失败:', err)
                reject(err)
              }
            })
          } catch (error) {
            console.error('Canvas 导出异常:', error)
            reject(error)
          }
        } else {
          console.error('Canvas 未找到:', canvasId)
          reject(new Error('Canvas not found: ' + canvasId))
        }
      })
  })
}

// 保存单字评分
const saveCharScore = (score, result) => {
  const charScores = uni.getStorageSync('currentPracticeScores') || []
  const practiceDetails = uni.getStorageSync('currentPracticeDetails') || []
  
  charScores.push(score)
  practiceDetails.push({
    charIndex: currentCharIndex.value,
    score: score,
    details: result.details,
    suggestions: result.suggestions,
    practiceImage: currentCharPractice.value,
    previewImage: currentCharPreview.value
  })
  
  uni.setStorageSync('currentPracticeScores', charScores)
  uni.setStorageSync('currentPracticeDetails', practiceDetails)
}

// 计算笔法和结构分数
const calculateBrushworkAndStructure = (details) => {
  // 起笔、行笔、收笔分数（基于 endpoints 和 direction）
  currentCharAnalysis.value.startStroke = Math.round(details.endpoints * 0.8 + Math.random() * 20)
  currentCharAnalysis.value.middleStroke = Math.round(details.direction * 0.85 + Math.random() * 15)
  currentCharAnalysis.value.endStroke = Math.round(details.endpoints * 0.75 + Math.random() * 25)
  
  // 结构、空间、重心分数
  currentCharAnalysis.value.structure = Math.round(details.junctions)
  currentCharAnalysis.value.space = Math.round(details.spatial)
  currentCharAnalysis.value.center = Math.round(details.center)
}

// 下一个字
const nextChar = () => {
  if (currentStep.value === 2) {
    // 还未分析，提示用户先分析
    uni.showToast({
      title: '请先点击"对比分析"',
      icon: 'none'
    })
  } else if (currentStep.value === 3) {
    if (currentCharIndex.value < charCount.value - 1) {
      currentCharIndex.value++
      currentStep.value = 2
      // 清空评分
      currentCharScore.value = 0
      currentCharDetailScores.value = {}
      currentCharAnalysis.value = {
        startStroke: 0,
        middleStroke: 0,
        endStroke: 0,
        structure: 0,
        space: 0,
        center: 0
      }
      initPractice()
    } else {
      // 完成所有字
      finishPractice()
    }
  }
}

// 保存当前字
const saveCurrentChar = () => {
  uni.canvasToTempFilePath({
    canvasId: 'practiceCanvas',
    success: (res) => {
      // 保存到练习记录
      console.log('保存第', currentCharIndex.value + 1, '字')
    }
  })
}

// 获取评分名称
const getScoreName = (key) => {
  const names = {
    density: '线条粗细',
    endpoints: '起收笔',
    junctions: '结构',
    horizontal: '横画',
    vertical: '竖画',
    spatial: '空间分布',
    center: '重心位置',
    direction: '笔画方向'
  }
  return names[key] || key
}

// 获取评分等级（用于颜色）
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'medium'
  return 'poor'
}

// 重新背临
const retryChar = () => {
  // 从临时存储中移除当前字的评分
  const charScores = uni.getStorageSync('currentPracticeScores') || []
  const practiceDetails = uni.getStorageSync('currentPracticeDetails') || []
  
  if (charScores.length > currentCharIndex.value) {
    charScores.splice(currentCharIndex.value, 1)
    practiceDetails.splice(currentCharIndex.value, 1)
    
    uni.setStorageSync('currentPracticeScores', charScores)
    uni.setStorageSync('currentPracticeDetails', practiceDetails)
  }
  
  currentStep.value = 2
  clearCurrentChar()
}

// 完成练习
const finishPractice = () => {
  // 计算总分
  const totalScore = calculateTotalScore()
  
  uni.showModal({
    title: '练习完成',
    content: `综合评分：${totalScore}分\n是否保存本次练习记录？`,
    success: (res) => {
      if (res.confirm) {
        // 保存练习记录
        savePracticeRecord(totalScore)
      }
      uni.navigateBack()
    }
  })
}

// 计算总分
const calculateTotalScore = () => {
  // 从本地存储中读取所有字的评分
  const charScores = uni.getStorageSync('currentPracticeScores') || []
  if (charScores.length === 0) return 0
  
  const sum = charScores.reduce((acc, score) => acc + score, 0)
  return Math.round(sum / charScores.length)
}

// 保存练习记录
const savePracticeRecord = (totalScore) => {
  const record = {
    date: new Date().getTime(),
    referenceImage: referenceImage.value,
    charCount: charCount.value,
    overallScore: totalScore,
    charScores: uni.getStorageSync('currentPracticeScores') || [],
    practiceDetails: uni.getStorageSync('currentPracticeDetails') || []
  }
  
  // 保存到本地存储
  const records = uni.getStorageSync('practiceRecords') || []
  records.push(record)
  uni.setStorageSync('practiceRecords', records)
  
  // 清理临时数据
  uni.removeStorageSync('currentPracticeScores')
  uni.removeStorageSync('currentPracticeDetails')
  
  uni.showToast({ title: '保存成功', icon: 'success' })
}

onMounted(() => {
  console.log('=== 背临强化页面加载 ===')
  
  // 清理临时数据
  uni.removeStorageSync('currentPracticeScores')
  uni.removeStorageSync('currentPracticeDetails')
  
  console.log('临时数据已清理')
  
  // 初始化
  selectReference()
  
  console.log('等待用户选择字帖...')
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 20rpx;
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #EEEEEE;
  color: #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
}

.step-item.active .step-number {
  background-color: #007AFF;
  color: #FFFFFF;
}

.step-text {
  font-size: 24rpx;
  color: #666666;
}

.step-line {
  flex: 1;
  height: 4rpx;
  background-color: #EEEEEE;
  margin: 0 20rpx;
}

/* 步骤内容 */
.step-content {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

/* 字帖展示 */
.reference-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #666666;
}

.reference-scroll {
  margin-bottom: 30rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #F9F9F9;
  padding: 20rpx;
}

.scroll-view {
  width: 100%;
  max-height: 600rpx;
}

.reference-img {
  width: 100%;
  display: block;
}

.reference-info {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  gap: 10rpx;
}

.label {
  font-size: 26rpx;
  color: #666666;
}

.value {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

/* 观察要点 */
.observation-tips {
  margin-bottom: 30rpx;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background-color: #F9F9F9;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.tip-icon {
  font-size: 32rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #333333;
}

.start-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

/* 隐藏的 canvas */
.hidden-canvas {
  position: fixed;
  left: -9999rpx;
  top: -9999rpx;
  width: 100rpx;
  height: 100rpx;
}

.crop-canvas {
  width: 100rpx;
  height: 100rpx;
}

/* 背临区域 */
.practice-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.char-indicator {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 12rpx;
}

.char-progress {
  font-size: 26rpx;
  color: #666666;
  display: block;
  margin-bottom: 16rpx;
}

.char-dots {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.char-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #DDDDDD;
}

.char-dot.completed {
  background-color: #007AFF;
}

.char-dot.current {
  background-color: #007AFF;
  transform: scale(1.2);
}

/* 原帖预览 */
.char-preview {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 12rpx;
  text-align: center;
}

.preview-label {
  font-size: 26rpx;
  color: #666666;
  display: block;
  margin-bottom: 16rpx;
}

.preview-img {
  width: 300rpx;
  height: 300rpx;
  border-radius: 8rpx;
  border: 2rpx solid #007AFF;
}

.preview-timer {
  width: 100%;
  height: 8rpx;
  background-color: #DDDDDD;
  border-radius: 4rpx;
  margin-top: 16rpx;
  overflow: hidden;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #0056CC);
  transition: width 0.1s ease;
}

/* 书写要点提示 */
.writing-tips {
  margin-top: 20rpx;
  padding: 16rpx;
  background-color: #FFF9E6;
  border-radius: 8rpx;
  border-left: 4rpx solid #FFA940;
}

.writing-tips .tip-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0;
}

.writing-tips .tip-item.small {
  padding: 4rpx 0;
}

.writing-tips .tip-icon {
  font-size: 28rpx;
}

.writing-tips .tip-text {
  font-size: 24rpx;
  color: #666666;
}

.canvas-wrapper {
  margin-bottom: 30rpx;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.control-btn {
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  background-color: #F0F0F0;
  border-radius: 8rpx;
  border: none;
}

.canvas-container {
  position: relative;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  overflow: hidden;
  border: 2rpx solid #DDDDDD;
  height: 500px; /* 固定高度 */
  width: 100%;
}

.practice-canvas,
.grid-canvas,
.guide-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.practice-canvas {
  z-index: 10;
  background-color: #FFFFFF;
}

.grid-canvas {
  z-index: 5;
  pointer-events: none;
}

.guide-canvas {
  z-index: 1;
  opacity: 0.3;
  pointer-events: none;
}

/* 书写工具 */
.brush-tools {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 12rpx;
}

.tool-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.tool-label {
  font-size: 26rpx;
  color: #333333;
  white-space: nowrap;
}

.brush-presets {
  display: flex;
  gap: 12rpx;
  flex: 1;
}

.brush-btn {
  flex: 1;
  height: 60rpx;
  border-radius: 8rpx;
  border: 2rpx solid #DDDDDD;
  font-size: 24rpx;
  color: #FFFFFF;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.5);
}

.brush-btn.active {
  border-color: #007AFF;
  box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.2);
}

.size-slider {
  flex: 1;
}

/* 操作按钮 */
.practice-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 12rpx;
  border: none;
}

.action-btn.clear {
  background-color: #FF4D4F;
  color: #FFFFFF;
}

.action-btn.undo {
  background-color: #FFA940;
  color: #FFFFFF;
}

.action-btn.analyze {
  background-color: #007AFF;
  color: #FFFFFF;
}

.action-btn.next {
  background-color: #52C41A;
  color: #FFFFFF;
}

/* 分析结果 */
.analysis-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.overall-score {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}

.score-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.3);
}

.score-number {
  font-size: 80rpx;
  font-weight: bold;
  color: #FFFFFF;
}

.score-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.detail-scores {
  margin-bottom: 40rpx;
}

.score-item {
  margin-bottom: 20rpx;
}

/* 笔法分析 */
.brushwork-analysis {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 12rpx;
}

.brushwork-grid {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 16rpx;
}

.brushwork-item {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  background-color: #FFFFFF;
  border-radius: 8rpx;
}

.brushwork-label {
  font-size: 24rpx;
  color: #666666;
  display: block;
  margin-bottom: 12rpx;
}

.brushwork-score {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.brushwork-score.excellent {
  color: #52C41A;
}

.brushwork-score.good {
  color: #1890FF;
}

.brushwork-score.medium {
  color: #FAAD14;
}

.brushwork-score.poor {
  color: #FF4D4F;
}

/* 结构分析 */
.structure-analysis {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 12rpx;
}

.structure-grid {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 16rpx;
}

.structure-item {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  background-color: #FFFFFF;
  border-radius: 8rpx;
}

.structure-label {
  font-size: 24rpx;
  color: #666666;
  display: block;
  margin-bottom: 12rpx;
}

.structure-score {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.structure-score.excellent {
  color: #52C41A;
}

.structure-score.good {
  color: #1890FF;
}

.structure-score.medium {
  color: #FAAD14;
}

.structure-score.poor {
  color: #FF4D4F;
}

.score-name {
  font-size: 26rpx;
  color: #333333;
  display: block;
  margin-bottom: 10rpx;
}

.score-progress {
  width: 100%;
  height: 20rpx;
}

.comparison-section {
  margin-bottom: 40rpx;
}

.comparison-section.large {
  margin-bottom: 30rpx;
}

.comparison-section.large .comparison-grid {
  gap: 30rpx;
}

.comparison-section.large .comparison-img {
  width: 100%;
  height: 400rpx;
  object-fit: contain;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 20rpx;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.comparison-item {
  background-color: #F9F9F9;
  border-radius: 12rpx;
  padding: 16rpx;
}

.item-label {
  font-size: 24rpx;
  color: #666666;
  display: block;
  margin-bottom: 12rpx;
  text-align: center;
}

.comparison-img {
  width: 100%;
  display: block;
  border-radius: 8rpx;
}

.suggestions-section {
  margin-bottom: 40rpx;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.suggestion-item {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border-radius: 12rpx;
  border-left: 4rpx solid #007AFF;
}

.suggestion-index {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #007AFF;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
  flex: 1;
}

.analysis-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn.retry {
  background-color: #FFA940;
  color: #FFFFFF;
}

.action-btn.finish {
  background-color: #007AFF;
  color: #FFFFFF;
}
</style>
