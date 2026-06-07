/**
 * 汉字书法图像分析工具 - 优化版
 * 针对汉字书法特点优化的对比算法
 * 包括：图像预处理、骨架提取、特征分析、相似度计算
 */

/**
 * 将图片转换为像素数据
 */
export const loadImageData = (imagePath) => {
  return new Promise((resolve, reject) => {
    const ctx = uni.createCanvasContext('tempAnalysisCanvas')
    
    uni.getImageInfo({
      src: imagePath,
      success: (imageInfo) => {
        const width = Math.min(imageInfo.width, 300) // 限制最大尺寸
        const height = Math.min(imageInfo.height, 300)
        
        ctx.drawImage(imagePath, 0, 0, width, height)
        ctx.draw(false, () => {
          setTimeout(() => {
            uni.canvasGetImageData({
              canvasId: 'tempAnalysisCanvas',
              x: 0,
              y: 0,
              width: width,
              height: height,
              success: (res) => {
                resolve({
                  data: res.data,
                  width: width,
                  height: height
                })
              },
              fail: (err) => {
                reject(err)
              }
            })
          }, 100)
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 灰度化 + 二值化（针对书法优化）
 */
export const grayscaleAndBinarize = (data, threshold = 128) => {
  const binary = new Uint8Array(data.length / 4)
  
  for (let i = 0; i < data.length; i += 4) {
    // 灰度化
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    // 二值化（墨迹为黑，纸张为白）
    binary[i / 4] = gray < threshold ? 255 : 0 // 255 表示墨迹，0 表示背景
  }
  
  return binary
}

/**
 * 中轴变换（提取骨架）
 * 使用形态学细化算法
 */
export const skeletonize = (binary, width, height) => {
  const skeleton = new Uint8Array(binary.length)
  const temp = new Uint8Array(binary.length)
  
  // 复制原始数据
  for (let i = 0; i < binary.length; i++) {
    temp[i] = binary[i] > 0 ? 1 : 0
  }
  
  let done = false
  while (!done) {
    done = true
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        
        if (temp[idx] === 1) {
          // 检查是否可以删除
          if (canRemove(temp, x, y, width, height)) {
            skeleton[idx] = 0
            temp[idx] = 0
            done = false
          } else {
            skeleton[idx] = 1
          }
        }
      }
    }
  }
  
  return skeleton
}

/**
 * 检查像素点是否可以移除（形态学细化）
 */
const canRemove = (image, x, y, width, height) => {
  const idx = y * width + x
  const neighbors = [
    image[(y - 1) * width + x],     // 上
    image[(y - 1) * width + x + 1], // 右上
    image[y * width + x + 1],       // 右
    image[(y + 1) * width + x + 1], // 右下
    image[(y + 1) * width + x],     // 下
    image[(y + 1) * width + x - 1], // 左下
    image[y * width + x - 1],       // 左
    image[(y - 1) * width + x - 1]  // 左上
  ]
  
  // 计算邻居中 1 的数量
  const count = neighbors.reduce((sum, val) => sum + val, 0)
  
  // 如果邻居太少或太多，不能移除
  if (count < 2 || count > 6) return false
  
  // 计算 0-1 转换次数
  let transitions = 0
  for (let i = 0; i < 8; i++) {
    if (neighbors[i] === 0 && neighbors[(i + 1) % 8] === 1) {
      transitions++
    }
  }
  
  return transitions === 1
}

/**
 * 提取笔画特征（针对汉字优化）
 */
export const extractStrokeFeatures = (skeleton, width, height) => {
  const features = {
    // 1. 骨架像素密度
    skeletonDensity: 0,
    
    // 2. 笔画端点数量（起笔和收笔）
    endpoints: 0,
    
    // 3. 笔画交点数量
    junctions: 0,
    
    // 4. 横向笔画特征
    horizontalStrokes: [],
    
    // 5. 纵向笔画特征
    verticalStrokes: [],
    
    // 6. 空间分布（九宫格）
    spatialDistribution: new Array(9).fill(0),
    
    // 7. 重心位置
    centerOfMass: { x: 0, y: 0 },
    
    // 8. 笔画方向直方图（8 个方向）
    directionHistogram: new Array(8).fill(0)
  }
  
  let totalPixels = 0
  
  // 遍历骨架
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      
      if (skeleton[idx] === 1) {
        totalPixels++
        
        // 计算邻居
        const neighbors = getNeighbors(skeleton, x, y, width, height)
        const count = neighbors.reduce((sum, val) => sum + val, 0)
        
        // 端点（只有一个邻居）
        if (count === 1) {
          features.endpoints++
        }
        // 交点（三个或以上邻居）
        else if (count >= 3) {
          features.junctions++
        }
        
        // 计算方向
        const direction = calculateDirection(skeleton, x, y, width, height)
        if (direction !== -1) {
          features.directionHistogram[direction]++
        }
        
        // 九宫格分布
        const gridX = Math.floor(x / (width / 3))
        const gridY = Math.floor(y / (height / 3))
        const gridIdx = gridY * 3 + gridX
        if (gridIdx >= 0 && gridIdx < 9) {
          features.spatialDistribution[gridIdx]++
        }
        
        // 重心
        features.centerOfMass.x += x
        features.centerOfMass.y += y
      }
    }
  }
  
  // 归一化
  if (totalPixels > 0) {
    features.skeletonDensity = totalPixels / (width * height)
    features.centerOfMass.x /= totalPixels
    features.centerOfMass.y /= totalPixels
    
    // 归一化九宫格分布
    for (let i = 0; i < 9; i++) {
      features.spatialDistribution[i] /= totalPixels
    }
    
    // 归一化方向直方图
    const totalDirection = features.directionHistogram.reduce((a, b) => a + b, 0)
    if (totalDirection > 0) {
      for (let i = 0; i < 8; i++) {
        features.directionHistogram[i] /= totalDirection
      }
    }
  }
  
  // 提取横竖笔画
  extractHorizontalVerticalStrokes(skeleton, width, height, features)
  
  return features
}

/**
 * 获取邻居像素
 */
const getNeighbors = (image, x, y, width, height) => {
  const neighbors = []
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      
      const nx = x + dx
      const ny = y + dy
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push(image[ny * width + nx])
      } else {
        neighbors.push(0)
      }
    }
  }
  
  return neighbors
}

/**
 * 计算笔画方向（0-7 表示 8 个方向）
 */
const calculateDirection = (skeleton, x, y, width, height) => {
  // 查找下一个骨架点
  for (let r = 1; r <= 3; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx === 0 && dy === 0) continue
        
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (skeleton[ny * width + nx] === 1) {
            // 计算角度
            const angle = Math.atan2(dy, dx)
            const direction = Math.round((angle + Math.PI) * 4 / Math.PI) % 8
            return direction
          }
        }
      }
    }
  }
  
  return -1
}

/**
 * 提取横竖笔画特征
 */
const extractHorizontalVerticalStrokes = (skeleton, width, height, features) => {
  // 横向扫描
  for (let y = 0; y < height; y += 3) {
    let inStroke = false
    let strokeStart = 0
    let strokeLength = 0
    
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      
      if (skeleton[idx] === 1) {
        if (!inStroke) {
          inStroke = true
          strokeStart = x
          strokeLength = 1
        } else {
          strokeLength++
        }
      } else {
        if (inStroke && strokeLength > 10) { // 最小笔画长度
          features.horizontalStrokes.push({
            y: y,
            x: strokeStart,
            length: strokeLength
          })
        }
        inStroke = false
      }
    }
    
    if (inStroke && strokeLength > 10) {
      features.horizontalStrokes.push({
        y: y,
        x: strokeStart,
        length: strokeLength
      })
    }
  }
  
  // 纵向扫描
  for (let x = 0; x < width; x += 3) {
    let inStroke = false
    let strokeStart = 0
    let strokeLength = 0
    
    for (let y = 0; y < height; y++) {
      const idx = y * width + x
      
      if (skeleton[idx] === 1) {
        if (!inStroke) {
          inStroke = true
          strokeStart = y
          strokeLength = 1
        } else {
          strokeLength++
        }
      } else {
        if (inStroke && strokeLength > 10) {
          features.verticalStrokes.push({
            x: x,
            y: strokeStart,
            length: strokeLength
          })
        }
        inStroke = false
      }
    }
    
    if (inStroke && strokeLength > 10) {
      features.verticalStrokes.push({
        x: x,
        y: strokeStart,
        length: strokeLength
      })
    }
  }
}

/**
 * 计算两个特征集的相似度（严格版）
 */
export const calculateSimilarity = (features1, features2) => {
  const weights = {
    skeletonDensity: 0.10,      // 骨架密度权重
    endpoints: 0.15,            // 端点数量权重
    junctions: 0.10,            // 交点数量权重
    horizontalStrokes: 0.15,    // 横向笔画权重
    verticalStrokes: 0.15,      // 纵向笔画权重
    spatialDistribution: 0.20,  // 空间分布权重（最重要）
    centerOfMass: 0.10,         // 重心位置权重
    directionHistogram: 0.05    // 方向直方图权重
  }
  
  // 1. 骨架密度相似度
  const densityDiff = Math.abs(features1.skeletonDensity - features2.skeletonDensity)
  const densitySimilarity = Math.max(0, 1 - densityDiff * 3) // 放大差异
  
  // 2. 端点数量相似度
  const endpointRatio = Math.min(features1.endpoints, features2.endpoints) / 
                        Math.max(features1.endpoints, features2.endpoints, 1)
  const endpointSimilarity = endpointRatio
  
  // 3. 交点数量相似度
  const junctionRatio = Math.min(features1.junctions, features2.junctions) / 
                        Math.max(features1.junctions, features2.junctions, 1)
  const junctionSimilarity = junctionRatio
  
  // 4. 横向笔画相似度
  const horizontalSimilarity = compareStrokes(
    features1.horizontalStrokes, 
    features2.horizontalStrokes,
    'horizontal'
  )
  
  // 5. 纵向笔画相似度
  const verticalSimilarity = compareStrokes(
    features1.verticalStrokes, 
    features2.verticalStrokes,
    'vertical'
  )
  
  // 6. 空间分布相似度（九宫格匹配）
  const spatialSimilarity = compareSpatialDistribution(
    features1.spatialDistribution,
    features2.spatialDistribution
  )
  
  // 7. 重心位置相似度
  const centerDiff = Math.sqrt(
    Math.pow(features1.centerOfMass.x - features2.centerOfMass.x, 2) +
    Math.pow(features1.centerOfMass.y - features2.centerOfMass.y, 2)
  )
  const centerSimilarity = Math.max(0, 1 - centerDiff / 50) // 50 像素容差
  
  // 8. 方向直方图相似度
  const directionSimilarity = compareHistograms(
    features1.directionHistogram,
    features2.directionHistogram
  )
  
  // 加权平均
  const overallSimilarity = (
    densitySimilarity * weights.skeletonDensity +
    endpointSimilarity * weights.endpoints +
    junctionSimilarity * weights.junctions +
    horizontalSimilarity * weights.horizontalStrokes +
    verticalSimilarity * weights.verticalStrokes +
    spatialSimilarity * weights.spatialDistribution +
    centerSimilarity * weights.centerOfMass +
    directionSimilarity * weights.directionHistogram
  )
  
  // 返回各项分数（0-100）
  return {
    lineThicknessSimilarity: Math.round(densitySimilarity * 100),
    lineLengthSimilarity: Math.round((horizontalSimilarity + verticalSimilarity) / 2 * 100),
    spatialPositionSimilarity: Math.round(spatialSimilarity * 100),
    overallStructureSimilarity: Math.round(overallSimilarity * 100),
    similarity: Math.round(overallSimilarity * 100),
    details: {
      density: Math.round(densitySimilarity * 100),
      endpoints: Math.round(endpointSimilarity * 100),
      junctions: Math.round(junctionSimilarity * 100),
      horizontal: Math.round(horizontalSimilarity * 100),
      vertical: Math.round(verticalSimilarity * 100),
      spatial: Math.round(spatialSimilarity * 100),
      center: Math.round(centerSimilarity * 100),
      direction: Math.round(directionSimilarity * 100)
    }
  }
}

/**
 * 比较笔画特征
 */
const compareStrokes = (strokes1, strokes2, type) => {
  if (strokes1.length === 0 && strokes2.length === 0) return 1
  if (strokes1.length === 0 || strokes2.length === 0) return 0
  
  // 笔画数量相似度
  const countRatio = Math.min(strokes1.length, strokes2.length) / 
                     Math.max(strokes1.length, strokes2.length)
  
  // 笔画长度相似度
  let lengthSimilarity = 0
  let matchCount = 0
  
  for (const stroke1 of strokes1) {
    let bestMatch = 0
    for (const stroke2 of strokes2) {
      // 检查位置是否接近
      const posDiff = type === 'horizontal' ? 
        Math.abs(stroke1.y - stroke2.y) : 
        Math.abs(stroke1.x - stroke2.x)
      
      if (posDiff < 20) { // 位置容差
        const lengthRatio = Math.min(stroke1.length, stroke2.length) / 
                           Math.max(stroke1.length, stroke2.length)
        bestMatch = Math.max(bestMatch, lengthRatio)
      }
    }
    lengthSimilarity += bestMatch
    matchCount++
  }
  
  lengthSimilarity /= matchCount
  
  // 综合评分（数量 40% + 长度 60%）
  return countRatio * 0.4 + lengthSimilarity * 0.6
}

/**
 * 比较空间分布（九宫格）
 */
const compareSpatialDistribution = (dist1, dist2) => {
  let totalDiff = 0
  
  for (let i = 0; i < 9; i++) {
    totalDiff += Math.abs(dist1[i] - dist2[i])
  }
  
  // 平均差异
  const avgDiff = totalDiff / 9
  
  // 转换为相似度（差异越大，相似度越低）
  return Math.max(0, 1 - avgDiff * 2) // 放大差异
}

/**
 * 比较方向直方图
 */
const compareHistograms = (hist1, hist2) => {
  let similarity = 0
  
  for (let i = 0; i < 8; i++) {
    similarity += Math.min(hist1[i], hist2[i])
  }
  
  return similarity
}

/**
 * 生成改进建议（基于详细分析）
 */
export const generateSuggestions = (similarity, features1, features2) => {
  const suggestions = []
  
  // 1. 骨架密度（线条粗细）
  if (similarity.details.density < 70) {
    if (features1.skeletonDensity > features2.skeletonDensity * 1.2) {
      suggestions.push('临摹线条偏细，建议加重笔力，使笔画更加饱满')
    } else {
      suggestions.push('临摹线条偏粗，建议减轻笔力，注意提按变化')
    }
  }
  
  // 2. 端点数量（起收笔）
  if (similarity.details.endpoints < 60) {
    suggestions.push('起笔和收笔不够清晰，注意藏锋和露锋的运用')
  }
  
  // 3. 交点数量（结构）
  if (similarity.details.junctions < 60) {
    suggestions.push('笔画交接处处理不够准确，注意笔画的连接关系')
  }
  
  // 4. 横向笔画
  if (similarity.details.horizontal < 65) {
    suggestions.push('横画的位置或长度有偏差，注意横画的长短和倾斜度')
  }
  
  // 5. 纵向笔画
  if (similarity.details.vertical < 65) {
    suggestions.push('竖画的位置或长度有偏差，注意竖画的垂直和长短')
  }
  
  // 6. 空间分布（最重要）
  if (similarity.details.spatial < 60) {
    suggestions.push('字的间架结构需要调整，注意各部分的空间分布')
    suggestions.push('建议先观察原作的整体布局，再进行临摹')
  }
  
  // 7. 重心位置
  if (similarity.details.center < 70) {
    const dx = features2.centerOfMass.x - features1.centerOfMass.x
    const dy = features2.centerOfMass.y - features1.centerOfMass.y
    
    if (Math.abs(dx) > 10) {
      suggestions.push(dx > 0 ? '整体偏右，注意向左调整' : '整体偏左，注意向右调整')
    }
    if (Math.abs(dy) > 10) {
      suggestions.push(dy > 0 ? '整体偏下，注意向上调整' : '整体偏上，注意向下调整')
    }
  }
  
  // 8. 笔画方向
  if (similarity.details.direction < 60) {
    suggestions.push('笔画的方向和走势不够准确，注意观察原作的笔势')
  }
  
  // 总体评价
  if (suggestions.length === 0) {
    if (similarity.similarity > 80) {
      suggestions.push('非常出色！已经很好地掌握了原作的精髓')
    } else if (similarity.similarity > 60) {
      suggestions.push('整体不错，继续注意细节的打磨')
    } else {
      suggestions.push('建议多加练习，从基本笔画开始')
    }
  }
  
  return suggestions
}

/**
 * 完整的图像分析流程（优化版）
 */
export const analyzeImages = async (image1Path, image2Path) => {
  try {
    // 1. 加载图片数据
    const imageData1 = await loadImageData(image1Path)
    const imageData2 = await loadImageData(image2Path)
    
    // 2. 灰度化 + 二值化
    const binary1 = grayscaleAndBinarize(imageData1.data, 150) // 提高阈值，更严格
    const binary2 = grayscaleAndBinarize(imageData2.data, 150)
    
    // 3. 骨架提取
    const skeleton1 = skeletonize(binary1, imageData1.width, imageData1.height)
    const skeleton2 = skeletonize(binary2, imageData2.width, imageData2.height)
    
    // 4. 特征提取
    const features1 = extractStrokeFeatures(skeleton1, imageData1.width, imageData1.height)
    const features2 = extractStrokeFeatures(skeleton2, imageData2.width, imageData2.height)
    
    // 5. 计算相似度
    const similarity = calculateSimilarity(features1, features2)
    
    // 6. 生成建议
    const suggestions = generateSuggestions(similarity, features1, features2)
    
    return {
      ...similarity,
      suggestions,
      features1,
      features2
    }
  } catch (error) {
    console.error('图像分析失败:', error)
    throw error
  }
}
