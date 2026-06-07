<template>
  <view class="detail-container">
    <!-- 顶部导航 -->
    <view class="top-bar">
      <view class="top-left" @click="goBack">
        <text class="back-icon">‹</text>
        <text class="back-text">返回</text>
      </view>
      <view class="top-title">
        <text>{{ modeNames[currentMode] }}</text>
      </view>
      <view class="top-right">
        <text class="progress-indicator">{{ currentIndex + 1 }} / {{ wordList.length }}</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="progress-wrapper">
      <view class="progress-track">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="progress-label">{{ progressPercent }}%</text>
    </view>

    <!-- 学习内容区 -->
    <scroll-view scroll-y class="content-area" v-if="currentWord">
      <!-- 新词学习 / 单词详情模式 -->
      <view v-if="currentMode === 'learn' || currentMode === 'review' || currentMode === 'flashcard'" class="word-card">
        <!-- 闪卡模式: 先显示英文, 点击后显示释义 -->
        <template v-if="currentMode === 'flashcard'">
          <view class="flashcard" @click="flipCard" :class="{ flipped: cardFlipped }">
            <view v-if="!cardFlipped" class="flashcard-front">
              <text class="flashcard-word">{{ currentWord.word }}</text>
              <text class="flashcard-phonetic" v-if="currentWord.phoneticUK">{{ currentWord.phoneticUK }}</text>
              <text class="flashcard-hint">点击查看释义</text>
            </view>
            <view v-else class="flashcard-back">
              <text class="flashcard-meaning" v-for="(part, idx) in currentWord.parts" :key="idx">
                {{ part.pos }}. {{ getFirstDefinition(part) }}
              </text>
              <text class="flashcard-hint" style="margin-top: 40rpx;">记得了吗？选择下方按钮</text>
            </view>
          </view>

          <!-- 发声按钮 (闪卡模式始终显示) -->
          <view class="pronounce-row">
            <view class="pronounce-btn" @click="playPronunciation(currentWord.word)">
              <text class="pronounce-icon">🔊</text>
              <text class="pronounce-text">播放发音</text>
            </view>
          </view>

          <!-- 闪卡操作按钮 -->
          <view class="action-row">
            <view class="action-btn wrong" @click="submitAnswer('wrong')">
              <text class="action-icon">❌</text>
              <text class="action-text">不熟</text>
            </view>
            <view class="action-btn fuzzy" @click="submitAnswer('fuzzy')">
              <text class="action-icon">🤔</text>
              <text class="action-text">模糊</text>
            </view>
            <view class="action-btn correct" @click="submitAnswer('correct')">
              <text class="action-icon">✅</text>
              <text class="action-text">认识</text>
            </view>
          </view>
        </template>

        <!-- 学习模式: 展示完整单词详情 -->
        <template v-else>
          <!-- 单词标题区 -->
          <view class="word-header">
            <text class="word-title">{{ currentWord.word }}</text>
            <view class="word-phonetics">
              <view class="phonetic-item" @click="playPronunciation(currentWord.word)">
                <text class="phonetic-label">英</text>
                <text class="phonetic-text">{{ currentWord.phoneticUK || '' }}</text>
                <text class="phonetic-icon">🔊</text>
              </view>
              <view class="phonetic-item" @click="playPronunciation(currentWord.word)">
                <text class="phonetic-label">美</text>
                <text class="phonetic-text">{{ currentWord.phoneticUS || '' }}</text>
                <text class="phonetic-icon">🔊</text>
              </view>
            </view>
            <text class="word-frequency" v-if="currentWord.frequency">{{ currentWord.frequency }}</text>
          </view>

          <!-- 词形变化 -->
          <view class="word-section" v-if="currentWord.forms && currentWord.forms.length > 0">
            <text class="section-title">词形变化</text>
            <view class="forms-row">
              <view v-for="(form, idx) in currentWord.forms" :key="idx" class="form-tag">
                <text>{{ form }}</text>
              </view>
            </view>
          </view>

          <!-- 词性释义 -->
          <view class="word-section">
            <text class="section-title">释义</text>
            <view v-for="(part, idx) in currentWord.parts" :key="idx" class="part-block">
              <view class="part-header">
                <text class="part-pos">{{ part.pos }}</text>
              </view>
              <view v-for="(def, dIdx) in part.definitions" :key="dIdx" class="definition-item">
                <text class="def-number">{{ dIdx + 1 }}.</text>
                <text class="def-text">{{ def }}</text>
              </view>
              <view v-for="(ex, eIdx) in (part.examples || [])" :key="eIdx" class="example-block">
                <text class="example-text">📝 {{ ex }}</text>
              </view>
            </view>
          </view>

          <!-- 词根词缀 -->
          <view class="word-section" v-if="currentWord.roots && currentWord.roots.length > 0">
            <text class="section-title">词根词缀</text>
            <view v-for="(root, idx) in currentWord.roots" :key="idx" class="root-block">
              <text class="root-name">{{ root.root }}</text>
              <text class="root-meaning">{{ root.meaning }}</text>
              <text class="root-origin">{{ root.origin }}</text>
            </view>
          </view>

          <!-- 助记 -->
          <view class="word-section" v-if="currentWord.mnemonics && currentWord.mnemonics.length > 0">
            <text class="section-title">趣味记忆</text>
            <view v-for="(mnemonic, idx) in currentWord.mnemonics" :key="idx" class="mnemonic-block">
              <text class="mnemonic-text">💡 {{ mnemonic }}</text>
            </view>
          </view>

          <!-- 同义词 -->
          <view class="word-section" v-if="currentWord.synonyms && currentWord.synonyms.length > 0">
            <text class="section-title">同义词</text>
            <view class="word-tags">
              <text v-for="(syn, idx) in currentWord.synonyms" :key="idx" class="word-tag">{{ syn }}</text>
            </view>
          </view>

          <!-- 反义词 -->
          <view class="word-section" v-if="currentWord.antonyms && currentWord.antonyms.length > 0">
            <text class="section-title">反义词</text>
            <view class="word-tags">
              <text v-for="(ant, idx) in currentWord.antonyms" :key="idx" class="word-tag antonym">{{ ant }}</text>
            </view>
          </view>

          <!-- 常用搭配 -->
          <view class="word-section" v-if="currentWord.collocations && currentWord.collocations.length > 0">
            <text class="section-title">常用搭配</text>
            <view v-for="(col, idx) in currentWord.collocations" :key="idx" class="collocation-block">
              <text class="col-text">{{ col }}</text>
            </view>
          </view>
        </template>
      </view>

      <!-- 学习模式操作按钮 (非闪卡) -->
      <view v-if="currentMode === 'learn' || currentMode === 'review'" class="learn-actions" style="margin-top: 24rpx;">
        <view class="fav-btn" @click="toggleFavorite">
          <text>{{ isFavorite ? '⭐ 已收藏' : '☆ 收藏' }}</text>
        </view>
        <view class="next-btn" @click="nextWord('correct')">
          <text>下一个 →</text>
        </view>
      </view>

      <!-- 选择题模式 -->
      <view v-if="currentMode === 'choice'" class="choice-card">
        <view class="choice-header">
          <text class="choice-title">{{ currentWord.word }}</text>
          <view class="choice-phonetic" @click="playPronunciation(currentWord.word)">
            <text>{{ currentWord.phoneticUK || currentWord.phoneticUS || '' }}</text>
            <text class="small-icon">🔊</text>
          </view>
        </view>

        <text class="choice-question">请选择正确的释义：</text>

        <view class="choice-options">
          <view
            v-for="(opt, idx) in currentChoices"
            :key="idx"
            :class="['option-card', { selected: selectedOption === idx, correct: showAnswer && opt.isCorrect, wrong: showAnswer && selectedOption === idx && !opt.isCorrect }]"
            @click="selectOption(idx)"
          >
            <text class="option-letter">{{ optionLabels[idx] }}</text>
            <text class="option-text">{{ opt.text }}</text>
          </view>
        </view>

        <view v-if="showAnswer" class="answer-feedback" :class="{ correct: answerCorrect, wrong: !answerCorrect }">
          <text>{{ answerCorrect ? '🎉 回答正确！' : '❌ 回答错误！正确答案是 ' + optionLabels[correctAnswerIndex] }}</text>
        </view>

        <view class="choice-actions">
          <view class="action-btn next" @click="nextWord(answerCorrect ? 'correct' : 'wrong')">
            <text>下一个 →</text>
          </view>
        </view>
      </view>

      <!-- 拼写模式 -->
      <view v-if="currentMode === 'spell'" class="spell-card">
        <view class="spell-header">
          <text class="spell-label">听音拼写</text>
          <view class="spell-play" @click="playPronunciation(currentWord.word)">
            <text class="big-icon">🔊</text>
            <text>点击播放</text>
          </view>
        </view>

        <text class="spell-meaning">{{ getFirstDefinition(currentWord.parts[0]) }}</text>

        <input
          class="spell-input"
          v-model="spellInput"
          placeholder="请输入英文单词"
          :disabled="showAnswer"
          @confirm="checkSpell"
        />

        <view class="spell-btn-row">
          <view class="spell-btn check" @click="checkSpell" v-if="!showAnswer">
            <text>检查</text>
          </view>
          <view class="spell-btn next" @click="nextWord(spellCorrect ? 'correct' : 'wrong')" v-else>
            <text>下一个 →</text>
          </view>
        </view>

        <view v-if="showAnswer" class="spell-answer" :class="{ correct: spellCorrect, wrong: !spellCorrect }">
          <text>正确答案：{{ currentWord.word }}</text>
        </view>
      </view>

      <!-- 听音辨词模式 -->
      <view v-if="currentMode === 'listening'" class="listening-card">
        <view class="listen-header">
          <text class="listen-title">听音辨词</text>
          <view class="listen-play" @click="playPronunciation(listeningWord)">
            <text class="big-icon">🔊</text>
            <text>播放发音</text>
          </view>
        </view>

        <text class="listen-hint">请根据发音选择正确的单词</text>

        <view class="listen-options">
          <view
            v-for="(opt, idx) in listeningChoices"
            :key="idx"
            :class="['listen-option', { selected: listeningSelected === idx, correct: listeningShowAnswer && opt === listeningWord, wrong: listeningShowAnswer && listeningSelected === idx && opt !== listeningWord }]"
            @click="selectListening(idx)"
          >
            <text>{{ opt }}</text>
          </view>
        </view>

        <view v-if="listeningShowAnswer" class="answer-feedback" :class="{ correct: listeningCorrect, wrong: !listeningCorrect }">
          <text>{{ listeningCorrect ? '🎉 听力准确！' : '❌ 再听听看！正确答案是 ' + listeningWord }}</text>
        </view>

        <view class="choice-actions">
          <view class="action-btn next" @click="nextWord(listeningCorrect ? 'correct' : 'wrong')">
            <text>下一个 →</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 完成提示 -->
    <view v-if="isFinished" class="finished-overlay">
      <view class="finished-card">
        <text class="finished-icon">🎊</text>
        <text class="finished-title">学习完成！</text>
        <view class="finished-stats">
          <view class="stat-block">
            <text class="stat-num">{{ stats.total }}</text>
            <text class="stat-desc">总题数</text>
          </view>
          <view class="stat-block">
            <text class="stat-num correct-color">{{ stats.correct }}</text>
            <text class="stat-desc">正确</text>
          </view>
          <view class="stat-block">
            <text class="stat-num wrong-color">{{ stats.wrong }}</text>
            <text class="stat-desc">错误</text>
          </view>
          <view class="stat-block">
            <text class="stat-num">{{ accuracyPercent }}%</text>
            <text class="stat-desc">正确率</text>
          </view>
        </view>
        <view class="finished-actions">
          <view class="finished-btn primary" @click="goBack">
            <text>返回首页</text>
          </view>
          <view class="finished-btn secondary" @click="restart">
            <text>再来一轮</text>
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
  recordLearning,
  addToFavorites,
  removeFromFavorites
} from '../../utils/vocabulary/index.js';

const modeNames = {
  learn: '新词学习',
  review: '智能复习',
  flashcard: '闪卡记忆',
  choice: '选择题',
  spell: '拼写练习',
  listening: '听音辨词'
};

const optionLabels = ['A', 'B', 'C', 'D'];

const currentMode = ref('learn');
const wordList = ref([]);
const currentIndex = ref(0);
const learnState = ref(loadLearningState());

// 闪卡状态
const cardFlipped = ref(false);

// 选择题状态
const currentChoices = ref([]);
const selectedOption = ref(-1);
const showAnswer = ref(false);
const answerCorrect = ref(false);
const correctAnswerIndex = ref(0);

// 拼写状态
const spellInput = ref('');
const spellCorrect = ref(false);

// 听音辨词状态
const listeningWord = ref('');
const listeningChoices = ref([]);
const listeningSelected = ref(-1);
const listeningShowAnswer = ref(false);
const listeningCorrect = ref(false);

// 统计
const stats = ref({ total: 0, correct: 0, wrong: 0 });

// 完成
const isFinished = ref(false);

const currentWord = computed(() => wordList.value[currentIndex.value]);
const progressPercent = computed(() =>
  wordList.value.length > 0
    ? Math.round(((currentIndex.value) / wordList.value.length) * 100)
    : 0
);
const accuracyPercent = computed(() =>
  stats.value.total > 0
    ? Math.round((stats.value.correct / stats.value.total) * 100)
    : 0
);
const isFavorite = computed(() => {
  if (!currentWord.value) return false;
  return learnState.value.favorites.includes(currentWord.value.word);
});

// 辅助函数
function getFirstDefinition(part) {
  if (!part || !part.definitions || part.definitions.length === 0) return '';
  return part.definitions[0];
}

// 播放发音（使用微信内置语音或提示）
function playPronunciation(word) {
  if (!word) return;
  // 使用 uni.createInnerAudioContext 加载网络音频，这里用轻量提示
  // 实际上建议接入有道/金山 API，下面只是提示用户
  uni.showToast({
    title: '🔊 ' + word,
    icon: 'none',
    duration: 1000
  });
}

// 切换收藏
function toggleFavorite() {
  if (!currentWord.value) return;
  const word = currentWord.value.word;
  if (learnState.value.favorites.includes(word)) {
    learnState.value = removeFromFavorites(word);
    uni.showToast({ title: '已取消收藏', icon: 'none' });
  } else {
    learnState.value = addToFavorites(word);
    uni.showToast({ title: '已加入生词本', icon: 'none' });
  }
}

// 初始化选择题
function initChoice() {
  if (!currentWord.value) return;
  const correctDef = getFirstDefinition(currentWord.value.parts[0]);

  // 从词库中随机选 3 个干扰项
  const distractors = [];
  const availableWords = wordList.value.filter(w => w.word !== currentWord.value.word);
  for (let i = 0; i < Math.min(3, availableWords.length); i++) {
    const randomIdx = Math.floor(Math.random() * availableWords.length);
    const w = availableWords[randomIdx];
    distractors.push(getFirstDefinition(w.parts[0]));
    availableWords.splice(randomIdx, 1);
  }

  // 若词库词少，用占位文本
  while (distractors.length < 3) {
    distractors.push('（其他释义选项）');
  }

  // 打乱顺序
  const choices = [
    { text: correctDef, isCorrect: true },
    { text: distractors[0], isCorrect: false },
    { text: distractors[1], isCorrect: false },
    { text: distractors[2], isCorrect: false }
  ];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  currentChoices.value = choices;
  correctAnswerIndex.value = choices.findIndex(c => c.isCorrect);
  selectedOption.value = -1;
  showAnswer.value = false;
  answerCorrect.value = false;
}

// 选择选项
function selectOption(idx) {
  if (showAnswer.value) return;
  selectedOption.value = idx;
  showAnswer.value = true;
  answerCorrect.value = currentChoices.value[idx].isCorrect;
}

// 初始化拼写
function initSpell() {
  spellInput.value = '';
  showAnswer.value = false;
  spellCorrect.value = false;
}

// 检查拼写
function checkSpell() {
  if (!currentWord.value || !spellInput.value.trim()) return;
  showAnswer.value = true;
  spellCorrect.value = spellInput.value.trim().toLowerCase() === currentWord.value.word.toLowerCase();
}

// 初始化听音辨词
function initListening() {
  if (!currentWord.value) return;
  listeningWord.value = currentWord.value.word;

  const distractors = [];
  const availableWords = wordList.value.filter(w => w.word !== currentWord.value.word);
  for (let i = 0; i < Math.min(3, availableWords.length); i++) {
    const randomIdx = Math.floor(Math.random() * availableWords.length);
    distractors.push(availableWords[randomIdx].word);
    availableWords.splice(randomIdx, 1);
  }

  while (distractors.length < 3) {
    distractors.push('placeholder' + distractors.length);
  }

  const options = [listeningWord.value, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  listeningChoices.value = options;
  listeningSelected.value = -1;
  listeningShowAnswer.value = false;
  listeningCorrect.value = false;

  // 自动播放一次发音
  setTimeout(() => playPronunciation(listeningWord.value), 300);
}

function selectListening(idx) {
  if (listeningShowAnswer.value) return;
  listeningSelected.value = idx;
  listeningShowAnswer.value = true;
  listeningCorrect.value = listeningChoices.value[idx] === listeningWord.value;
}

// 闪卡翻转
function flipCard() {
  cardFlipped.value = !cardFlipped.value;
}

// 提交闪卡答案
function submitAnswer(result) {
  nextWord(result);
}

// 下一个单词
function nextWord(result) {
  if (!currentWord.value) return;

  // 更新统计
  stats.value.total += 1;
  if (result === 'correct') stats.value.correct += 1;
  else stats.value.wrong += 1;

  // 记录学习
  learnState.value = recordLearning(
    learnState.value.activeBook || 'senior',
    currentWord.value.word,
    result
  );

  // 检查是否完成
  if (currentIndex.value + 1 >= wordList.value.length) {
    isFinished.value = true;
    return;
  }

  // 切换到下一个单词
  currentIndex.value += 1;
  cardFlipped.value = false;

  // 根据模式重新初始化
  if (currentMode.value === 'choice') initChoice();
  else if (currentMode.value === 'spell') initSpell();
  else if (currentMode.value === 'listening') initListening();
}

// 重新开始
function restart() {
  currentIndex.value = 0;
  stats.value = { total: 0, correct: 0, wrong: 0 };
  isFinished.value = false;
  cardFlipped.value = false;
  if (currentMode.value === 'choice') initChoice();
  else if (currentMode.value === 'spell') initSpell();
  else if (currentMode.value === 'listening') initListening();
}

// 返回
function goBack() {
  uni.navigateBack();
}

// 加载单词列表
async function loadWords() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  const mode = options.mode || 'learn';
  currentMode.value = mode;

  const bookId = learnState.value.activeBook || 'senior';
  let words = await loadWordBook(bookId);

  if (mode === 'learn') {
    // 新词学习: 取尚未学习过的，按每日数量
    const unlearned = words.filter(w => !learnState.value.words[w.word]);
    const wordsPerDay = learnState.value.settings.wordsPerDay || 20;
    wordList.value = shuffle(unlearned).slice(0, wordsPerDay);
    // 如果新词不够，混入一些待复习的
    if (wordList.value.length < wordsPerDay) {
      const reviewWords = getReviewPendingWords(words);
      const needed = wordsPerDay - wordList.value.length;
      wordList.value = wordList.value.concat(shuffle(reviewWords).slice(0, needed));
    }
  } else if (mode === 'review') {
    // 复习: 取所有待复习
    wordList.value = shuffle(getReviewPendingWords(words));
    if (wordList.value.length === 0) {
      uni.showToast({ title: '暂无待复习单词', icon: 'none' });
      wordList.value = shuffle(words).slice(0, 10);
    }
  } else {
    // 闪卡/选择/拼写/听音: 从整本书随机取
    wordList.value = shuffle(words).slice(0, 20);
  }

  // 初始化当前模式状态
  if (currentMode.value === 'choice') initChoice();
  else if (currentMode.value === 'spell') initSpell();
  else if (currentMode.value === 'listening') initListening();
}

// 获取待复习单词
function getReviewPendingWords(allWords) {
  const now = Date.now();
  return allWords.filter(w => {
    const record = learnState.value.words[w.word];
    return record && record.nextReviewTime && record.nextReviewTime <= now;
  });
}

// 打乱数组
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

onMounted(() => {
  loadWords();
});
</script>

<style scoped>
.detail-container {
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
.top-right .progress-indicator { font-size: 24rpx; color: #888; }

.progress-wrapper {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  gap: 12rpx;
}

.progress-track { flex: 1; height: 10rpx; background: #e0e6ed; border-radius: 10rpx; overflow: hidden; }
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #7aa3e5);
  transition: width 0.3s;
}
.progress-label { font-size: 22rpx; color: #888; min-width: 60rpx; text-align: right; }

.content-area {
  flex: 1;
  padding: 24rpx;
}

/* 单词卡片 */
.word-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

/* 闪卡 */
.flashcard {
  min-height: 500rpx;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0f0ff 100%);
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 32rpx;
  transition: all 0.3s;
}

.flashcard.flipped {
  background: linear-gradient(135deg, #fff5e0 0%, #ffe4b8 100%);
}

.flashcard-word {
  font-size: 72rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}

.flashcard-phonetic {
  font-size: 32rpx;
  color: #888;
  margin-bottom: 40rpx;
}

.flashcard-hint {
  font-size: 24rpx;
  color: #999;
}

.flashcard-meaning {
  font-size: 34rpx;
  color: #333;
  line-height: 1.8;
  margin-bottom: 12rpx;
  text-align: center;
}

.pronounce-row {
  display: flex;
  justify-content: center;
  margin-top: 32rpx;
}

.pronounce-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #4a90e2;
  color: #fff;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
}

.pronounce-icon { font-size: 32rpx; }
.pronounce-text { font-size: 28rpx; }

/* 闪卡操作 */
.action-row {
  display: flex;
  gap: 16rpx;
  margin-top: 40rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 16rpx;
  border-radius: 16rpx;
}

.action-btn.wrong { background: #ffe0e0; color: #e74c3c; }
.action-btn.fuzzy { background: #fff3d9; color: #f39c12; }
.action-btn.correct { background: #d5f5e0; color: #27ae60; }

.action-icon { font-size: 44rpx; margin-bottom: 8rpx; }
.action-text { font-size: 28rpx; font-weight: 600; }

/* 单词头部 */
.word-header {
  text-align: center;
  padding-bottom: 32rpx;
  border-bottom: 2rpx solid #f0f4f8;
  margin-bottom: 32rpx;
}

.word-title {
  font-size: 64rpx;
  font-weight: 700;
  color: #333;
}

.word-phonetics {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  margin-top: 16rpx;
}

.phonetic-item {
  display: flex;
  align-items: center;
  background: #f7f9fc;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
}

.phonetic-label {
  font-size: 20rpx;
  color: #4a90e2;
  margin-right: 8rpx;
  font-weight: 700;
}

.phonetic-text { font-size: 24rpx; color: #666; }
.phonetic-icon { font-size: 24rpx; margin-left: 8rpx; }
.word-frequency { font-size: 22rpx; color: #999; margin-top: 12rpx; display: block; }

/* 各 section */
.word-section {
  margin-bottom: 32rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #4a90e2;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
  border-left: 6rpx solid #4a90e2;
}

.part-block { margin-bottom: 20rpx; }
.part-header { margin-bottom: 12rpx; }
.part-pos {
  font-size: 24rpx;
  font-weight: 700;
  color: #27ae60;
  background: #eaf9ef;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.definition-item {
  display: flex;
  margin-bottom: 12rpx;
  padding-left: 12rpx;
}

.def-number { font-size: 26rpx; color: #888; margin-right: 12rpx; }
.def-text { font-size: 28rpx; color: #333; line-height: 1.6; flex: 1; }

.example-block {
  background: #f7f9fc;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  margin-top: 8rpx;
  margin-left: 32rpx;
}

.example-text { font-size: 26rpx; color: #666; line-height: 1.5; }

.forms-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.form-tag {
  background: #fff4e0;
  color: #e67e22;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.root-block, .mnemonic-block, .collocation-block {
  background: #f0f7ff;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.root-name { font-size: 28rpx; font-weight: 700; color: #4a90e2; margin-right: 12rpx; }
.root-meaning { font-size: 26rpx; color: #333; }
.root-origin { font-size: 22rpx; color: #888; margin-left: 12rpx; }

.mnemonic-text, .col-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.word-tags { display: flex; flex-wrap: wrap; gap: 12rpx; }
.word-tag {
  background: #d5f5e0;
  color: #27ae60;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

.word-tag.antonym {
  background: #ffe0e0;
  color: #e74c3c;
}

/* 学习操作按钮 */
.learn-actions {
  display: flex;
  gap: 16rpx;
}

.fav-btn {
  flex: 1;
  padding: 20rpx;
  background: #fff4e0;
  color: #e67e22;
  text-align: center;
  border-radius: 12rpx;
  font-weight: 600;
  font-size: 28rpx;
}

.next-btn {
  flex: 2;
  padding: 20rpx;
  background: linear-gradient(135deg, #4a90e2, #7aa3e5);
  color: #fff;
  text-align: center;
  border-radius: 12rpx;
  font-weight: 700;
  font-size: 28rpx;
}

/* 选择题卡片 */
.choice-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.choice-header {
  text-align: center;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #f0f4f8;
  margin-bottom: 32rpx;
}

.choice-title {
  font-size: 56rpx;
  font-weight: 700;
  color: #333;
}

.choice-phonetic {
  display: inline-flex;
  align-items: center;
  background: #f7f9fc;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #666;
}

.small-icon { font-size: 24rpx; margin-left: 8rpx; }

.choice-question {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 24rpx;
  display: block;
}

.choice-options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.option-card {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  background: #f7f9fc;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.option-card.selected {
  background: #e8f1ff;
  border-color: #4a90e2;
}

.option-card.correct {
  background: #d5f5e0;
  border-color: #27ae60;
}

.option-card.wrong {
  background: #ffe0e0;
  border-color: #e74c3c;
}

.option-letter {
  width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  background: #fff;
  border-radius: 50%;
  font-size: 28rpx;
  font-weight: 700;
  color: #4a90e2;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.option-card.correct .option-letter { background: #fff; color: #27ae60; }
.option-card.wrong .option-letter { background: #fff; color: #e74c3c; }

.option-text { font-size: 28rpx; color: #333; line-height: 1.5; }

.answer-feedback {
  margin-top: 24rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  text-align: center;
  font-weight: 700;
  font-size: 28rpx;
}

.answer-feedback.correct { background: #d5f5e0; color: #27ae60; }
.answer-feedback.wrong { background: #ffe0e0; color: #e74c3c; }

.choice-actions { display: flex; margin-top: 24rpx; }
.choice-actions .action-btn.next {
  flex: 1;
  background: linear-gradient(135deg, #4a90e2, #7aa3e5);
  color: #fff;
  padding: 24rpx;
  border-radius: 12rpx;
  text-align: center;
  font-weight: 700;
}

/* 拼写练习 */
.spell-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.spell-header {
  text-align: center;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #f0f4f8;
  margin-bottom: 24rpx;
}

.spell-label {
  font-size: 28rpx;
  color: #4a90e2;
  font-weight: 700;
  display: block;
  margin-bottom: 20rpx;
}

.spell-play {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 48rpx;
  background: linear-gradient(135deg, #e8f1ff, #d4e8ff);
  border-radius: 20rpx;
}

.big-icon { font-size: 56rpx; margin-bottom: 8rpx; }
.spell-play text:last-child { font-size: 24rpx; color: #4a90e2; }

.spell-meaning {
  font-size: 32rpx;
  color: #333;
  text-align: center;
  margin-bottom: 32rpx;
  padding: 16rpx;
  background: #f7f9fc;
  border-radius: 12rpx;
}

.spell-input {
  width: 100%;
  padding: 24rpx 32rpx;
  border: 2rpx solid #e0e6ed;
  border-radius: 12rpx;
  font-size: 32rpx;
  text-align: center;
  margin-bottom: 24rpx;
}

.spell-btn-row { display: flex; gap: 16rpx; }

.spell-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  text-align: center;
  font-weight: 700;
  font-size: 28rpx;
}

.spell-btn.check {
  background: linear-gradient(135deg, #4a90e2, #7aa3e5);
  color: #fff;
}

.spell-btn.next {
  background: linear-gradient(135deg, #27ae60, #52d57e);
  color: #fff;
}

.spell-answer {
  margin-top: 24rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  text-align: center;
  font-weight: 700;
  font-size: 28rpx;
}

.spell-answer.correct { background: #d5f5e0; color: #27ae60; }
.spell-answer.wrong { background: #ffe0e0; color: #e74c3c; }

/* 听音辨词 */
.listening-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.listen-header {
  text-align: center;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #f0f4f8;
  margin-bottom: 24rpx;
}

.listen-title {
  font-size: 28rpx;
  color: #4a90e2;
  font-weight: 700;
  display: block;
  margin-bottom: 20rpx;
}

.listen-play {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 48rpx;
  background: linear-gradient(135deg, #fff4e0, #ffe4b8);
  border-radius: 20rpx;
}

.listen-play text:last-child { font-size: 24rpx; color: #e67e22; }

.listen-hint {
  font-size: 28rpx;
  color: #666;
  text-align: center;
  margin-bottom: 24rpx;
  display: block;
}

.listen-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.listen-option {
  padding: 32rpx;
  background: #f7f9fc;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  transition: all 0.2s;
}

.listen-option.selected { background: #e8f1ff; border-color: #4a90e2; color: #4a90e2; }
.listen-option.correct { background: #d5f5e0; border-color: #27ae60; color: #27ae60; }
.listen-option.wrong { background: #ffe0e0; border-color: #e74c3c; color: #e74c3c; }

/* 完成页面 */
.finished-overlay {
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

.finished-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 32rpx;
  margin: 48rpx;
  width: 80%;
  max-width: 600rpx;
}

.finished-icon {
  font-size: 120rpx;
  display: block;
  text-align: center;
  margin-bottom: 16rpx;
}

.finished-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 32rpx;
}

.finished-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.stat-block {
  background: #f7f9fc;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.stat-num { font-size: 48rpx; font-weight: 700; color: #4a90e2; display: block; }
.stat-num.correct-color { color: #27ae60; }
.stat-num.wrong-color { color: #e74c3c; }

.stat-desc { font-size: 24rpx; color: #888; }

.finished-actions { display: flex; gap: 16rpx; }

.finished-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  text-align: center;
  font-weight: 700;
  font-size: 28rpx;
}

.finished-btn.primary {
  background: linear-gradient(135deg, #4a90e2, #7aa3e5);
  color: #fff;
}

.finished-btn.secondary {
  background: #f7f9fc;
  color: #4a90e2;
}
</style>
