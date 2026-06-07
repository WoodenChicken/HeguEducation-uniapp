// 艾宾浩斯遗忘曲线核心算法
// 艾宾浩斯复习间隔（单位：天）
// 第1次复习：学习后 20 分钟
// 第2次复习：1 小时后
// 第3次复习：9 小时后
// 第4次复习：1 天后
// 第5次复习：2 天后
// 第6次复习：6 天后
// 第7次复习：31 天后
// 超过7次即为完全掌握

export const EBBINGHAUS_INTERVALS = [
  { stage: 0, intervalMinutes: 0, label: '新词' },
  { stage: 1, intervalMinutes: 20, label: '20分钟后' },
  { stage: 2, intervalMinutes: 60, label: '1小时后' },
  { stage: 3, intervalMinutes: 540, label: '9小时后' },
  { stage: 4, intervalMinutes: 1440, label: '1天后' },
  { stage: 5, intervalMinutes: 2880, label: '2天后' },
  { stage: 6, intervalMinutes: 8640, label: '6天后' },
  { stage: 7, intervalMinutes: 44640, label: '31天后' },
  { stage: 8, intervalMinutes: -1, label: '已掌握' }
];

// 学习状态
export const LEARNING_STATUS = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  MASTERED: 'mastered'
};

// 根据单词状态和复习历史计算下次复习时间
// 参数：currentStage(当前阶段0-8), lastReviewTime(上次复习时间戳)
export function calculateNextReviewTime(currentStage, lastReviewTime) {
  if (currentStage >= 8) {
    return { nextReviewTime: null, stage: 8, status: LEARNING_STATUS.MASTERED };
  }
  const interval = EBBINGHAUS_INTERVALS[currentStage + 1];
  if (!interval) {
    return { nextReviewTime: null, stage: 8, status: LEARNING_STATUS.MASTERED };
  }
  const nextReviewTime = lastReviewTime + (interval.intervalMinutes * 60 * 1000);
  const status = currentStage >= 2 ? LEARNING_STATUS.REVIEW : LEARNING_STATUS.LEARNING;
  return { nextReviewTime, stage: currentStage + 1, status };
}

// 根据学习效果调整阶段
// result: 'correct' 正确记忆, 'fuzzy' 模糊, 'wrong' 记错
export function adjustStage(currentStage, result) {
  if (result === 'correct') {
    return Math.min(currentStage + 1, 8);
  } else if (result === 'fuzzy') {
    return Math.max(currentStage - 1, 1);
  } else {
    return 1;
  }
}

// 判断单词是否现在需要复习
export function needsReview(word) {
  if (!word.nextReviewTime) return true;
  const now = Date.now();
  return word.nextReviewTime <= now;
}

// 获取阶段描述
export function getStageLabel(stage) {
  const interval = EBBINGHAUS_INTERVALS[stage];
  return interval ? interval.label : '已掌握';
}

// 根据数量和学习目标计算预计完成时间
export function calculateCompletionPlan(totalWords, wordsPerDay) {
  const days = Math.ceil(totalWords / wordsPerDay);
  return {
    days,
    reviewDays: days + 31, // 最后一轮复习需要31天
    totalDays: days + 31
  };
}

export default {
  EBBINGHAUS_INTERVALS,
  LEARNING_STATUS,
  calculateNextReviewTime,
  adjustStage,
  needsReview,
  getStageLabel,
  calculateCompletionPlan
};
