<template>
  <view class="stats-container">
    <!-- 顶部导航 -->
    <view class="top-bar">
      <view class="top-left" @click="goBack">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
      <view class="top-title">
        <text>学习统计</text>
      </view>
      <view class="top-right"></view>
    </view>

    <!-- 总体成绩 -->
    <view class="overview">
      <view class="overview-header">
        <text class="overview-title">📊 学习总览</text>
      </view>

      <view class="overview-grid">
        <view class="stat-box">
          <text class="stat-value">{{ totalStats.totalWords }}</text>
          <text class="stat-label">总词汇</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ totalStats.mastered }}</text>
          <text class="stat-label">已掌握</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ totalStats.learning }}</text>
          <text class="stat-label">学习中</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ totalStats.streak }}</text>
          <text class="stat-label">连续天数</text>
        </view>
      </view>
    </view>

    <!-- 最近7天学习 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">📅 最近7天学习</text>
      </view>

      <view class="daily-chart">
        <view v-for="(day, idx) in dailyStats" :key="idx" class="day-bar">
          <view class="bar-wrapper">
            <view class="bar-fill" :style="{ height: getBarHeight(day.total) + '%' }"></view>
          </view>
          <text class="bar-label">{{ day.label }}</text>
          <text class="bar-value" v-if="day.total > 0">{{ day.total }}</text>
        </view>
      </view>
    </view>

    <!-- 每日学习数据 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">🏆 成就徽章</text>
      </view>

      <view class="achievement-grid">
        <view
          v-for="achievement in allAchievements" :key="achievement.id"
          :class="['achievement-item', { unlocked: isAchievementUnlocked(achievement.id) }]"
        >
          <text class="achievement-icon">{{ achievement.icon }}</text>
          <text class="achievement-name">{{ achievement.name }}</text>
          <text class="achievement-desc">{{ achievement.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 错题Top10 -->
    <view class="section-card">
      <view class="section-header">
        <text class="section-title">🎯 学习数据</text>
      </view>

      <view class="data-rows">
        <view class="data-row">
          <text class="data-label">收藏生词</text>
          <text class="data-value">{{ learnState.favorites.length }}</text>
        </view>
        <view class="data-row">
          <text class="data-label">错题数量</text>
          <text class="data-value">{{ learnState.mistakes.length }}</text>
        </view>
        <view class="data-row">
          <text class="data-label">平均正确率</text>
          <text class="data-value">{{ accuracyRate }}%</text>
        </view>
      </view>
    </view>

    <view class="bottom-space"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  loadLearningState,
  getAchievementsList
} from '../../utils/vocabulary/index.js';

const learnState = ref(loadLearningState());

const totalStats = computed(() => {
  const state = learnState.value;
  let totalWords = 0;
  let mastered = 0;
  let learning = 0;
  for (const wordId in state.words) {
    totalWords += 1;
    const record = state.words[wordId];
    if (record.stage >= 8) mastered += 1;
    else learning += 1;
  }
  return {
    totalWords, mastered, learning, streak: state.stats.currentStreak || 0
  };
});

const dailyStats = computed(() => {
  const days = [];
  const stats = learnState.value.stats.dailyStats || {};
  const now = new Date();
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const dayData = stats[key];
    days.push({
      label: '周' + dayNames[d.getDay()],
      date: key,
      learned: dayData ? dayData.learned || 0,
      reviewed: dayData ? dayData.reviewed || 0,
      total: (dayData ? (dayData.learned || 0) + (dayData.reviewed || 0) : 0
    });
  }
  return days;
});

const accuracyRate = computed(() => {
  const dailyStats = learnState.value.stats;
  let totalCorrect = 0;
  let totalAttempts = 0;
  for (const date in dailyStats.dailyStats) {
    const day = dailyStats.dailyStats[date];
    totalCorrect += (day.correct || 0);
    totalAttempts += (day.correct || 0) + (day.wrong || 0);
  }
  if (totalAttempts === 0) return 0;
  return Math.round((totalCorrect / totalAttempts) * 100);
});

const allAchievements = ref([]);

function isAchievementUnlocked(id) {
  return learnState.value.achievements.includes(id);
}

function getBarHeight(value) {
  const max = Math.max(...dailyStats.value.map(d => d.total), 1);
  return Math.min(100, (value / max) * 100);
}

function goBack() {
  uni.navigateBack();
}

onMounted(() => {
  allAchievements.value = getAchievementsList();
});
</script>

<style scoped>
.stats-container {
  min-height: 100vh;
  background-color: #f7f9fc;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #e0e6ed;
  align-items: center;
}

.top-left { display: flex; align-items: center; }
.back-icon { font-size: 44rpx; color: #4a90e2; margin-right: 8rpx; }
.back-text { font-size: 28rpx; color: #4a90e2; }
.top-title { font-size: 32rpx; font-weight: 700; color: #333; }

.overview {
  background: linear-gradient(135deg, #4a90e2 0%, #7aa3e5 100%);
  margin: 24rpx;
  border-radius: 20rpx;
  padding: 32rpx;
  color: #fff;
}

.overview-header {
  margin-bottom: 24rpx;
}

.overview-title { font-size: 32rpx; font-weight: 700; }

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.stat-box {
  background: rgba(255, 255, 255, 0.2);
  padding: 24rpx;
  border-radius: 16rpx;
  text-align: center;
}

.stat-value { font-size: 48rpx; font-weight: 700; display: block; }
.stat-label { font-size: 24rpx; opacity: 0.9; }

.section-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin: 0 24rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
}

.section-header { margin-bottom: 20rpx; }

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

.daily-chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
  align-items: end;
  height: 300rpx;
  padding-top: 20rpx;
}

.day-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-wrapper {
  width: 100%;
  height: 180rpx;
  background: #f7f9fc;
  border-radius: 8rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 8rpx;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #4a90e2, #7aa3e5);
  border-radius: 8rpx;
  transition: height 0.3s;
  min-height: 8rpx;
}

.bar-label { font-size: 22rpx; color: #888; }
.bar-value { font-size: 18rpx; color: #4a90e2; font-weight: 700; margin-top: 4rpx; }

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.achievement-item {
  padding: 20rpx 12rpx;
  border-radius: 16rpx;
  text-align: center;
  opacity: 0.5;
  background: #f7f9fc;
}

.achievement-item.unlocked {
  background: linear-gradient(135deg, #fff4e0, #ffe4b8);
  opacity: 1;
}

.achievement-icon { font-size: 48rpx; display: block; margin-bottom: 8rpx; }
.achievement-name { font-size: 24rpx; font-weight: 700; color: #333; display: block; }
.achievement-desc { font-size: 20rpx; color: #888; margin-top: 4rpx; display: block; }

.data-rows {
  display: flex;
  flex-direction: column;
}

.data-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f4f8;
}

.data-row:last-child { border-bottom: none; }

.data-label { font-size: 28rpx; color: #666; }
.data-value { font-size: 28rpx; color: #4a90e2; font-weight: 700; }

.bottom-space { height: 60rpx; }
</style>
