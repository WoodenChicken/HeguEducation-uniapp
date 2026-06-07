// 词汇学习统一入口模块
import ebbinghaus from './ebbinghaus.js';
import wordBooks from './word-books.js';
import learningState from './learning-state.js';

export * from './ebbinghaus.js';
export * from './word-books.js';
export * from './learning-state.js';

export const VocabularyEngine = {
  ...ebbinghaus,
  ...wordBooks,
  ...learningState
};

export default VocabularyEngine;
