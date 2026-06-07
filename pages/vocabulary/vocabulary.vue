<template>
  <view class="vocabulary-container">
    <!-- 顶部数据看板 -->
    <view class="dashboard">
      <view class="dashboard-header">
        <text class="dashboard-title">📚 词汇学习</text>
        <view class="streak-badge" v-if="learnState.stats.currentStreak > 0">
          <text class="streak-icon">🔥</text>
          <text class="streak-count">{{ learnState.stats.currentStreak }}</text>
          <text class="streak-label">天</text>
        </view>
      </view>

      <!-- 今日进度卡片 -->
      <view class="today-card">
        <view class="today-stats">
          <view class="stat-item">
            <text class="stat-value">{{ todayStats.total }}</text>
            <text class="stat-label">今日目标</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ todayStats.learned }}</text>
            <text class="stat-label">已学习</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ todayStats.accuracy }}%</text>
            <text class="stat-label">正确率</text>
          </view>
        </view>

        <view class="progress-bar-container">
          <view class="progress-bar-bg">
            <view class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></view>
          </view>
          <text class="progress-text">{{ progressPercent }}%</text>
        </view>
      </view>

      <!-- 总体统计 -->
      <view class="overall-stats">
        <view class="overall-item">
          <text class="overall-value">{{ learnState.stats.totalLearned }}</text>
          <text class="overall-label">总词汇</text>
        </view>
        <view class="overall-item">
          <text class="overall-value">{{ masteredCount }}</text>
          <text class="overall-label">已掌握</text>
        </view>
        <view class="overall-item">
          <text class="overall-value">{{ learnState.mistakes.length }}</text>
          <text class="overall-label">错题</text>
        </view>
        <view class="overall-item">
          <text class="overall-value">{{ reviewPendingCount }}</text>
          <text class="overall-label">待复习</text>
        </view>
      </view>
    </view>

    <!-- 词书选择 -->
    <view class="book-section">
      <view class="section-header">
        <text class="section-title">🎯 选择词书</text>
        <text class="section-hint">当前：{{ currentBookMeta ? currentBookMeta.name : '未选择' }}</text>
      </view>

      <scroll-view scroll-x class="book-scroll">
        <view class="book-list">
          <view
            v-for="book in books"
            :key="book.id"
            :class="['book-card', { active: learnState.activeBook === book.id }]"
            @click="selectBook(book.id)"
          >
            <text class="book-icon">{{ book.icon }}</text>
            <text class="book-name">{{ book.name }}</text>
            <text class="book-desc">{{ book.description }}</text>
            <view class="book-progress">
              <view class="book-progress-bg">
                <view class="book-progress-fill" :style="{ width: getBookProgress(book.id) + '%' }"></view>
              </view>
              <text class="book-count">{{ getBookProgress(book.id) }}%</text>
            </view>
            <text class="book-difficulty">
              <text v-for="i in book.difficulty" :key="i">⭐</text>
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 学习模式入口 -->
    <view class="mode-section">
      <view class="section-header">
        <text class="section-title">📖 学习模式</text>
      </view>

      <view class="mode-grid">
        <view class="mode-card" @click="startMode('learn')">
          <text class="mode-icon">✍️</text>
          <text class="mode-name">新词学习</text>
          <text class="mode-desc">今天学 {{ learnState.settings.wordsPerDay }} 个新单词</text>
        </view>

        <view class="mode-card" @click="startMode('review')">
          <text class="mode-icon">🔄</text>
          <text class="mode-name">智能复习</text>
          <text class="mode-desc">{{ reviewPendingCount }} 个单词待复习</text>
        </view>

        <view class="mode-card" @click="startMode('flashcard')">
          <text class="mode-icon">🎴</text>
          <text class="mode-name">闪卡模式</text>
          <text class="mode-desc">快速翻卡片记忆</text>
        </view>

        <view class="mode-card" @click="startMode('choice')">
          <text class="mode-icon">✅</text>
          <text class="mode-name">选择题</text>
          <text class="mode-desc">看词选义，强化记忆</text>
        </view>

        <view class="mode-card" @click="startMode('spell')">
          <text class="mode-icon">🔤</text>
          <text class="mode-name">拼写练习</text>
          <text class="mode-desc">听音拼写，深度记忆</text>
        </view>

        <view class="mode-card" @click="startMode('listening')">
          <text class="mode-icon">🎧</text>
          <text class="mode-name">听音辨词</text>
          <text class="mode-desc">只听发音，测试听力</text>
        </view>
      </view>
    </view>

    <!-- 学习数据与辅助功能 -->
    <view class="tools-section">
      <view class="section-header">
        <text class="section-title">⚙️ 辅助功能</text>
      </view>

      <view class="tools-grid">
        <view class="tool-card" @click="openMistakes">
          <text class="tool-icon">❌</text>
          <text class="tool-name">错题本</text>
          <text class="tool-count">{{ learnState.mistakes.length }}</text>
        </view>

        <view class="tool-card" @click="openFavorites">
          <text class="tool-icon">⭐</text>
          <text class="tool-name">生词本</text>
          <text class="tool-count">{{ learnState.favorites.length }}</text>
        </view>

        <view class="tool-card" @click="openStats">
          <text class="tool-icon">📊</text>
          <text class="tool-name">学习统计</text>
          <text class="tool-count">查看</text>
        </view>

        <view class="tool-card" @click="openSettings">
          <text class="tool-icon">⚙️</text>
          <text class="tool-name">设置</text>
          <text class="tool-count">每日{{ learnState.settings.wordsPerDay }}词</text>
        </view>
      </view>
    </view>

    <!-- 空白占位 -->
    <view class="bottom-space"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  getAllWordBooks,
  getWordBookMeta,
  loadWordBook,
  loadLearningState,
  setActiveBook,
  getBookProgress as getWordBookProgress
} from '../../utils/vocabulary/index.js';

// 学习状态
const learnState = ref(loadLearningState());
const books = ref(getAllWordBooks());
const currentBookMeta = computed(() => getWordBookMeta(learnState.value.activeBook));

// 今日学习统计
const todayStats = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  const dayStat = learnState.value.stats.dailyStats[today];
  const total = learnState.value.settings.wordsPerDay;
  if (dayStat) {
    return {
      total,
      learned: dayStat.learned + dayStat.reviewed,
      accuracy: dayStat.learned + dayStat.wrong > 0
        ? Math.round((dayStat.correct / (dayStat.correct + dayStat.wrong)) * 100)
        : 0
    };
  }
  return { total, learned: 0, accuracy: 0 };
});

// 进度百分比
const progressPercent = computed(() => {
  if (todayStats.value.total === 0) return 0;
  return Math.min(100, Math.round((todayStats.value.learned / todayStats.value.total) * 100));
});

// 已掌握单词数
const masteredCount = computed(() => {
  let count = 0;
  for (const wordId in learnState.value.words) {
    if (learnState.value.words[wordId].stage >= 8) {
      count += 1;
    }
  }
  return count;
});

// 待复习单词数
const reviewPendingCount = ref(0);

// 获取某词书进度
function getBookProgress(bookId) {
  const book = books.value.find(b => b.id === bookId);
  if (!book) return 0;
  const progress = getWordBookProgress(learnState.value, bookId, book.count);
  return progress.percentage;
}

// 选择词书
async function selectBook(bookId) {
  const newState = setActiveBook(bookId);
  learnState.value = newState;
  // 预先加载词书内容
  await loadWordBook(bookId);
  uni.showToast({ title: '已切换：' + getWordBookMeta(bookId).name, icon: 'none' });
}

// 开始学习模式
async function startMode(mode) {
  uni.setStorageSync('vocab_mode', mode);
  if (mode === 'learn' || mode === 'review' || mode === 'flashcard') {
    uni.navigateTo({ url: '/pages/vocabulary/vocab-detail?mode=' + mode });
  } else if (mode === 'choice') {
    uni.navigateTo({ url: '/pages/vocabulary/vocab-detail?mode=choice' });
  } else if (mode === 'spell') {
    uni.navigateTo({ url: '/pages/vocabulary/vocab-detail?mode=spell' });
  } else if (mode === 'listening') {
    uni.navigateTo({ url: '/pages/vocabulary/vocab-detail?mode=listening' });
  }
}

// 打开错题本
function openMistakes() {
  uni.navigateTo({ url: '/pages/vocabulary/vocab-manager?type=mistakes' });
}

// 打开生词本
function openFavorites() {
  uni.navigateTo({ url: '/pages/vocabulary/vocab-manager?type=favorites' });
}

// 打开统计
function openStats() {
  uni.navigateTo({ url: '/pages/vocabulary/vocab-stats' });
}

// 打开设置
function openSettings() {
  uni.showActionSheet({
    itemList: ['每天学习 10 个', '每天学习 20 个', '每天学习 30 个', '每天学习 50 个'],
    success: (res) => {
      const counts = [10, 20, 30, 50];
      const newState = { ...learnState.value };
      newState.settings.wordsPerDay = counts[res.tapIndex];
      uni.setStorageSync('vocabulary_learning_state', newState);
      learnState.value = newState;
      uni.showToast({ title: '已设置每天' + counts[res.tapIndex] + '个单词', icon: 'none' });
    }
  });
}

// 页面加载
onMounted(async () => {
  // 加载当前词书并统计待复习数量
  const currentBook = learnState.value.activeBook || 'senior';
  const currentWords = await loadWordBook(currentBook);
  let pending = 0;
  const now = Date.now();
  for (const w of currentWords) {
    const record = learnState.value.words[w.word];
    if (record && record.nextReviewTime && record.nextReviewTime <= now) {
      pending += 1;
    } else if (!record) {
      // 新词也计入
    }
  }
  reviewPendingCount.value = pending;
});
</script>

<style scoped>
.vocabulary-container {
  min-height: 100vh;
  background-color: #f7f9fc;
  padding: 24rpx;
}

/* 数据看板 */
.dashboard {
  background: linear-gradient(135deg, #4a90e2 0%, #7aa3e5 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  color: #fff;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 226, 0.25);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.dashboard-title {
  font-size: 36rpx;
  font-weight: 700;
}

.streak-badge {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
}

.streak-icon { font-size: 28rpx; margin-right: 4rpx; }
.streak-count { font-size: 28rpx; font-weight: 700; }
.streak-label { font-size: 22rpx; margin-left: 4rpx; opacity: 0.9; }

/* 今日卡片 */
.today-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.today-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-value { font-size: 44rpx; font-weight: 700; }
.stat-label { font-size: 22rpx; opacity: 0.9; margin-top: 6rpx; }

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar-bg {
  flex: 1;
  height: 14rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd93d, #fff);
  border-radius: 10rpx;
  transition: width 0.5s;
}

.progress-text { font-size: 22rpx; opacity: 0.9; }

/* 总体统计 */
.overall-stats {
  display: flex;
  justify-content: space-around;
}

.overall-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 20rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
}

.overall-value { font-size: 32rpx; font-weight: 700; }
.overall-label { font-size: 20rpx; opacity: 0.85; margin-top: 4rpx; }

/* 通用section头部 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

.section-hint {
  font-size: 24rpx;
  color: #888;
}

/* 词书选择 */
.book-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.book-scroll {
  white-space: nowrap;
}

.book-list {
  display: inline-flex;
  gap: 16rpx;
}

.book-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 220rpx;
  background: #f7f9fc;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  border: 3rpx solid transparent;
  transition: all 0.3s;
}

.book-card.active {
  background: linear-gradient(135deg, #e8f1ff 0%, #d4e8ff 100%);
  border-color: #4a90e2;
  box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.2);
}

.book-icon { font-size: 44rpx; margin-bottom: 8rpx; }
.book-name { font-size: 26rpx; font-weight: 700; color: #333; }
.book-desc { font-size: 20rpx; color: #888; margin-top: 4rpx; white-space: normal; text-align: center; }
.book-progress { display: flex; align-items: center; width: 100%; margin-top: 12rpx; gap: 8rpx; }
.book-progress-bg { flex: 1; height: 8rpx; background: #e0e6ed; border-radius: 6rpx; overflow: hidden; }
.book-progress-fill { height: 100%; background: linear-gradient(90deg, #4a90e2, #7aa3e5); border-radius: 6rpx; }
.book-count { font-size: 18rpx; color: #666; }
.book-difficulty { font-size: 18rpx; margin-top: 8rpx; color: #ffb800; }

/* 学习模式 */
.mode-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f7f9fc;
  border-radius: 16rpx;
  padding: 24rpx 12rpx;
  transition: all 0.2s;
}

.mode-card:active {
  transform: scale(0.96);
  background: #e8f1ff;
}

.mode-icon { font-size: 44rpx; margin-bottom: 8rpx; }
.mode-name { font-size: 26rpx; font-weight: 700; color: #333; margin-bottom: 4rpx; }
.mode-desc { font-size: 20rpx; color: #888; text-align: center; line-height: 1.3; }

/* 辅助功能 */
.tools-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f7f9fc;
  border-radius: 12rpx;
  padding: 20rpx 8rpx;
  transition: all 0.2s;
}

.tool-card:active { transform: scale(0.96); }
.tool-icon { font-size: 40rpx; margin-bottom: 8rpx; }
.tool-name { font-size: 24rpx; font-weight: 600; color: #333; margin-bottom: 4rpx; }
.tool-count { font-size: 18rpx; color: #4a90e2; font-weight: 600; }

.bottom-space { height: 60rpx; }
</style>
