// 词汇学习状态管理器
// 负责：生词本、错题库、学习进度、艾宾浩斯复习安排

import { calculateNextReviewTime, adjustStage, needsReview } from './ebbinghaus.js';

const STORAGE_KEY = 'vocabulary_learning_state';

// 初始学习状态结构
function createDefaultState() {
  return {
    activeBook: 'senior',        // 当前学习的词书ID
    settings: {
      wordsPerDay: 20,            // 每日新词量
      autoAddMistakes: true,      // 错题自动加入错题本
      enableReview: true,         // 启用智能复习
      voiceEnabled: true          // 启用发音
    },
    books: {},                    // 各词书的学习状态
    words: {},                    // 每个单词的详细学习记录
    mistakes: [],                 // 错题ID列表
    favorites: [],                // 收藏ID列表
    history: [],                  // 学习历史记录
    stats: {
      totalLearned: 0,            // 总学习单词数
      totalDays: 0,               // 学习天数
      currentStreak: 0,           // 连续学习天数
      lastStudyDate: null,        // 上次学习日期
      dailyStats: {}              // 每日学习详情 { '2025-01-15': {learned,reviewed,correct,wrong} }
    },
    achievements: []              // 成就徽章
  };
}

// 读取学习状态
export function loadLearningState() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY);
    if (data) {
      const state = typeof data === 'string' ? JSON.parse(data) : data;
      return { ...createDefaultState(), ...state };
    }
  } catch (e) {
    console.error('加载学习状态失败:', e);
  }
  return createDefaultState();
}

// 保存学习状态
export function saveLearningState(state) {
  try {
    uni.setStorageSync(STORAGE_KEY, state);
    return true;
  } catch (e) {
    console.error('保存学习状态失败:', e);
    return false;
  }
}

// 记录一次学习（学习或复习）
// result: 'correct' | 'fuzzy' | 'wrong'
export function recordLearning(bookId, wordId, result) {
  const state = loadLearningState();
  const now = Date.now();
  const dateKey = new Date(now).toISOString().slice(0, 10);

  // 更新单词记录
  if (!state.words[wordId]) {
    state.words[wordId] = {
      wordId,
      bookId,
      stage: 0,
      correctCount: 0,
      wrongCount: 0,
      totalAttempts: 0,
      firstLearnTime: now,
      lastReviewTime: now,
      nextReviewTime: null,
      history: []
    };
    state.stats.totalLearned += 1;
  }

  const wordState = state.words[wordId];
  wordState.totalAttempts += 1;
  wordState.lastReviewTime = now;
  wordState.history.push({ time: now, result });

  if (result === 'correct') {
    wordState.correctCount += 1;
  } else {
    wordState.wrongCount += 1;
  }

  // 计算下次复习时间
  const newStage = adjustStage(wordState.stage, result);
  wordState.stage = newStage;
  const nextReview = calculateNextReviewTime(newStage, now);
  wordState.nextReviewTime = nextReview.nextReviewTime;

  // 更新词书进度
  if (!state.books[bookId]) {
    state.books[bookId] = { learned: [], review: [], mastered: [] };
  }
  if (result === 'wrong' && state.settings.autoAddMistakes) {
    if (!state.mistakes.includes(wordId)) {
      state.mistakes.push(wordId);
    }
  }

  // 更新统计
  if (!state.stats.dailyStats[dateKey]) {
    state.stats.dailyStats[dateKey] = { learned: 0, reviewed: 0, correct: 0, wrong: 0 };
  }
  const dayStat = state.stats.dailyStats[dateKey];
  if (wordState.totalAttempts === 1) {
    dayStat.learned += 1;
  } else {
    dayStat.reviewed += 1;
  }
  if (result === 'correct') {
    dayStat.correct += 1;
  } else if (result === 'wrong') {
    dayStat.wrong += 1;
  }

  // 连续天数
  if (state.stats.lastStudyDate !== dateKey) {
    const yesterday = new Date(now - 86400000).toISOString().slice(0, 10);
    if (state.stats.lastStudyDate === yesterday) {
      state.stats.currentStreak += 1;
    } else {
      state.stats.currentStreak = 1;
    }
    state.stats.lastStudyDate = dateKey;
  }

  // 添加到历史记录（最多保留100条）
  state.history.unshift({ time: now, wordId, bookId, result });
  if (state.history.length > 100) {
    state.history = state.history.slice(0, 100);
  }

  // 检查成就
  checkAchievements(state);

  saveLearningState(state);
  return state;
}

// 添加到生词本
export function addToFavorites(wordId) {
  const state = loadLearningState();
  if (!state.favorites.includes(wordId)) {
    state.favorites.push(wordId);
    saveLearningState(state);
  }
  return state;
}

// 从生词本移除
export function removeFromFavorites(wordId) {
  const state = loadLearningState();
  const idx = state.favorites.indexOf(wordId);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
    saveLearningState(state);
  }
  return state;
}

// 从错题本移除
export function removeFromMistakes(wordId) {
  const state = loadLearningState();
  const idx = state.mistakes.indexOf(wordId);
  if (idx >= 0) {
    state.mistakes.splice(idx, 1);
    saveLearningState(state);
  }
  return state;
}

// 获取词书内需要复习的单词列表
export function getReviewWords(state, bookId, allWordsInBook) {
  const bookWords = allWordsInBook.filter(w => {
    const record = state.words[w.word];
    return record && needsReview(record);
  });
  return bookWords;
}

// 获取词书学习进度统计
export function getBookProgress(state, bookId, totalWordsInBook) {
  const bookState = state.books[bookId] || {};
  let learned = 0;
  let mastered = 0;
  let reviewing = 0;

  for (const wordId in state.words) {
    const record = state.words[wordId];
    if (record && record.bookId === bookId) {
      learned += 1;
      if (record.stage >= 8) mastered += 1;
      else if (record.stage > 0) reviewing += 1;
    }
  }

  return {
    total: totalWordsInBook,
    learned,
    reviewing,
    mastered,
    percentage: totalWordsInBook > 0 ? Math.round((learned / totalWordsInBook) * 100) : 0
  };
}

// 获取今日复习列表
export function getTodayReviewList(state, allWords) {
  return allWords.filter(w => {
    const record = state.words[w.word];
    return record && needsReview(record);
  });
}

// 检查和更新成就
function checkAchievements(state) {
  const achievements = [
    { id: 'first_word', name: '初识单词', desc: '学习第一个单词', check: s => s.stats.totalLearned >= 1 },
    { id: 'ten_words', name: '初入词海', desc: '学习10个单词', check: s => s.stats.totalLearned >= 10 },
    { id: 'hundred_words', name: '百日筑基', desc: '学习100个单词', check: s => s.stats.totalLearned >= 100 },
    { id: 'thousand_words', name: '千词达人', desc: '学习1000个单词', check: s => s.stats.totalLearned >= 1000 },
    { id: 'streak_3', name: '三日坚持', desc: '连续学习3天', check: s => s.stats.currentStreak >= 3 },
    { id: 'streak_7', name: '一周达人', desc: '连续学习7天', check: s => s.stats.currentStreak >= 7 },
    { id: 'streak_30', name: '月度冠军', desc: '连续学习30天', check: s => s.stats.currentStreak >= 30 }
  ];

  for (const ach of achievements) {
    if (!state.achievements.includes(ach.id) && ach.check(state)) {
      state.achievements.push(ach.id);
    }
  }
}

// 获取成就列表
export function getAchievementsList() {
  return [
    { id: 'first_word', name: '初识单词', desc: '学习第一个单词', icon: '🌱' },
    { id: 'ten_words', name: '初入词海', desc: '学习10个单词', icon: '📖' },
    { id: 'hundred_words', name: '百日筑基', desc: '学习100个单词', icon: '📚' },
    { id: 'thousand_words', name: '千词达人', desc: '学习1000个单词', icon: '🏆' },
    { id: 'streak_3', name: '三日坚持', desc: '连续学习3天', icon: '🔥' },
    { id: 'streak_7', name: '一周达人', desc: '连续学习7天', icon: '⭐' },
    { id: 'streak_30', name: '月度冠军', desc: '连续学习30天', icon: '👑' }
  ];
}

// 更新设置
export function updateSettings(settings) {
  const state = loadLearningState();
  state.settings = { ...state.settings, ...settings };
  saveLearningState(state);
  return state;
}

// 切换词书
export function setActiveBook(bookId) {
  const state = loadLearningState();
  state.activeBook = bookId;
  saveLearningState(state);
  return state;
}

export default {
  loadLearningState,
  saveLearningState,
  recordLearning,
  addToFavorites,
  removeFromFavorites,
  removeFromMistakes,
  getReviewWords,
  getBookProgress,
  getTodayReviewList,
  getAchievementsList,
  updateSettings,
  setActiveBook
};
