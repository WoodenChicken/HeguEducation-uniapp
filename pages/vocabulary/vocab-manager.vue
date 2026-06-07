<template>
  <view class="manager-container">
    <!-- 顶部导航 -->
    <view class="top-bar">
      <view class="top-left" @click="goBack">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
      <view class="top-title">
        <text>{{ type === 'mistakes' ? '错题本' : '生词本' }}</text>
      </view>
      <view class="top-right">
        <text>{{ wordList.length }} 个词</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="wordList.length === 0" class="empty-state">
      <text class="empty-icon">{{ type === 'mistakes' ? '📝' : '⭐' }}</text>
      <text class="empty-title">{{ type === 'mistakes' ? '暂无错题' : '生词本空空如也' }}</text>
      <text class="empty-desc">{{ type === 'mistakes' ? '继续学习，答错的单词会自动收集到这里' : '在学习中点击收藏按钮将生词加入生词本' }}</text>
    </view>

    <!-- 单词列表 -->
    <scroll-view v-else scroll-y class="word-list">
      <view
        v-for="word in wordList"
        :key="word.word"
        class="word-item"
        @click="showDetail(word)"
      >
        <view class="word-info">
          <text class="word-name">{{ word.word }}</text>
          <text class="word-phonetic">{{ word.phoneticUK || word.phoneticUS || '' }}</text>
          <text class="word-meaning">{{ getMeaning(word) }}</text>
        </view>
        <view class="word-actions">
          <view class="act-btn" @click.stop="playSound(word.word)">
            <text>🔊</text>
          </view>
          <view class="act-btn danger" @click.stop="removeWord(word.word)">
            <text>{{ type === 'mistakes' ? '🗑' : '📌' }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 单词详情弹窗 -->
    <view v-if="detailWord" class="detail-overlay" @click="closeDetail">
      <view class="detail-modal" @click.stop>
        <view class="detail-header">
          <text class="detail-title">{{ detailWord.word }}</text>
          <view class="close-btn" @click="closeDetail">
            <text>✕</text>
          </view>
        </view>
        <scroll-view scroll-y class="detail-content" style="max-height: 60vh;">
          <view v-for="(part, idx) in detailWord.parts" :key="idx" class="part-block">
            <text class="part-pos">{{ part.pos }}.</text>
            <view v-for="(def, dIdx) in part.definitions" :key="dIdx" class="def-line">
              <text>{{ dIdx + 1 }}. {{ def }}</text>
            </view>
            <view v-for="(ex, eIdx) in (part.examples || [])" :key="eIdx" class="ex-line">
              <text>📝 {{ ex }}</text>
            </view>
          </view>

          <view v-if="detailWord.synonyms && detailWord.synonyms.length" class="detail-section">
            <text class="detail-label">同义词:</text>
            <text class="detail-text">{{ detailWord.synonyms.join(', ') }}</text>
          </view>

          <view v-if="detailWord.antonyms && detailWord.antonyms.length" class="detail-section">
            <text class="detail-label">反义词:</text>
            <text class="detail-text">{{ detailWord.antonyms.join(', ') }}</text>
          </view>

          <view v-if="detailWord.collocations && detailWord.collocations.length" class="detail-section">
            <text class="detail-label">搭配:</text>
            <view v-for="(col, idx) in detailWord.collocations" :key="idx" class="col-line">
              <text>• {{ col }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="detail-actions">
          <view class="detail-btn primary" @click="studyThis(detailWord)">
            <text>开始学习</text>
          </view>
          <view class="detail-btn secondary" @click="playSound(detailWord.word)">
            <text>🔊 发音</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  loadWordBook,
  loadLearningState,
  removeFromMistakes,
  removeFromFavorites
} from '../../utils/vocabulary/index.js';

const type = ref('favorites');
const learnState = ref(loadLearningState());
const allWords = ref([]);
const detailWord = ref(null);

const wordList = computed(() => {
  const ids = type.value === 'mistakes'
    ? learnState.value.mistakes
    : learnState.value.favorites;

  return allWords.value.filter(w => ids.includes(w.word));
});

function getMeaning(word) {
  if (!word.parts || word.parts.length === 0) return '暂无释义';
  const part = word.parts[0];
  if (!part.definitions || part.definitions.length === 0) return '暂无释义';
  return part.definitions[0];
}

function goBack() {
  uni.navigateBack();
}

function playSound(word) {
  uni.showToast({ title: '🔊 ' + word, icon: 'none', duration: 1000 });
}

function showDetail(word) {
  detailWord.value = word;
}

function closeDetail() {
  detailWord.value = null;
}

function removeWord(word) {
  uni.showModal({
    title: '确认删除',
    content: '确定要从' + (type.value === 'mistakes' ? '错题本' : '生词本') + '中移除吗？',
    success: (res) => {
      if (res.confirm) {
        if (type.value === 'mistakes') {
          learnState.value = removeFromMistakes(word);
        } else {
          learnState.value = removeFromFavorites(word);
        }
        uni.showToast({ title: '已移除', icon: 'none' });
      }
    }
  });
}

function studyThis(word) {
  uni.navigateTo({
    url: '/pages/vocabulary/vocab-detail?mode=flashcard&word=' + word.word
  });
}

onMounted(async () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  type.value = options.type || 'favorites';

  const bookId = learnState.value.activeBook || 'senior';
  allWords.value = await loadWordBook(bookId);
});
</script>

<style scoped>
.manager-container {
  min-height: 100vh;
  background-color: #f7f9fc;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #e0e6ed;
}

.top-left { display: flex; align-items: center; }
.back-icon { font-size: 44rpx; color: #4a90e2; margin-right: 8rpx; }
.back-text { font-size: 28rpx; color: #4a90e2; }
.top-title { font-size: 32rpx; font-weight: 700; color: #333; }
.top-right { font-size: 24rpx; color: #888; }

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx;
}

.empty-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.empty-title { font-size: 36rpx; font-weight: 700; color: #333; margin-bottom: 12rpx; }
.empty-desc { font-size: 26rpx; color: #888; text-align: center; line-height: 1.6; }

.word-list {
  flex: 1;
  padding: 16rpx;
}

.word-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.word-info {
  flex: 1;
  padding-right: 16rpx;
}

.word-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.word-phonetic {
  font-size: 22rpx;
  color: #888;
  display: block;
  margin-bottom: 8rpx;
}

.word-meaning {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.word-actions {
  display: flex;
  gap: 8rpx;
}

.act-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fc;
  border-radius: 50%;
  font-size: 28rpx;
}

.act-btn.danger { background: #ffe0e0; }

/* 详情弹窗 */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.detail-modal {
  background: #fff;
  border-radius: 24rpx;
  width: 85%;
  max-width: 650rpx;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid #f0f4f8;
}

.detail-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.close-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fc;
  border-radius: 50%;
  font-size: 28rpx;
  color: #888;
}

.detail-content {
  padding: 24rpx 32rpx;
}

.part-block {
  margin-bottom: 24rpx;
}

.part-pos {
  font-size: 24rpx;
  font-weight: 700;
  color: #27ae60;
  background: #eaf9ef;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
  margin-bottom: 12rpx;
}

.def-line {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 8rpx;
  padding-left: 12rpx;
}

.ex-line {
  background: #f7f9fc;
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  margin-top: 8rpx;
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #666;
}

.detail-section {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0f4f8;
}

.detail-label {
  font-size: 24rpx;
  font-weight: 700;
  color: #4a90e2;
  margin-right: 12rpx;
}

.detail-text {
  font-size: 26rpx;
  color: #333;
}

.col-line {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-top: 8rpx;
  padding-left: 8rpx;
}

.detail-actions {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 2rpx solid #f0f4f8;
}

.detail-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  text-align: center;
  font-weight: 700;
  font-size: 28rpx;
}

.detail-btn.primary {
  background: linear-gradient(135deg, #4a90e2, #7aa3e5);
  color: #fff;
}

.detail-btn.secondary {
  background: #f7f9fc;
  color: #4a90e2;
}
</style>
