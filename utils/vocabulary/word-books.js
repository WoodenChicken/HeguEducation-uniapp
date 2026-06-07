// 词书数据加载管理器
// 统一管理所有词书的加载、查询、统计

const wordBooksMap = {
  'senior': () => import('../../data/vocabulary/words-senior.js').then(m => m.default || m.WORDS_SENIOR),
  'cet4': () => import('../../data/vocabulary/words-cet4.js').then(m => m.default || m.WORDS_CET4),
  'daily': () => import('../../data/vocabulary/words-daily.js').then(m => m.default || m.WORDS_DAILY),
  'business': () => import('../../data/vocabulary/words-business.js').then(m => m.default || m.WORDS_BUSINESS),
  'it': () => import('../../data/vocabulary/words-it.js').then(m => m.default || m.WORDS_IT)
};

const wordBooksMeta = [
  { id: 'senior', name: '高中英语', icon: '🎓', difficulty: 3, description: '高考核心词汇', count: 25 },
  { id: 'cet4', name: '大学四级', icon: '📘', difficulty: 3, description: 'CET-4核心词汇', count: 25 },
  { id: 'daily', name: '日常口语', icon: '💬', difficulty: 2, description: '高频日常口语', count: 20 },
  { id: 'business', name: '商务英语', icon: '💼', difficulty: 3, description: '职场商务词汇', count: 15 },
  { id: 'it', name: 'IT互联网', icon: '💻', difficulty: 3, description: '计算机行业词汇', count: 15 }
];

let cache = {};

// 获取词书元数据列表
export function getAllWordBooks() {
  return wordBooksMeta;
}

// 获取单个词书元数据
export function getWordBookMeta(bookId) {
  return wordBooksMeta.find(b => b.id === bookId);
}

// 统一格式化词书数据为页面期望的格式
// 原始格式: { word, phoneticUK, phoneticUS, partOfSpeech, definitions: [{meaning, example}], 
//            rootAffix, memoryTip, examples: [{en, zh}], synonyms, antonyms, collocations, difficulty, frequency, tags }
// 输出格式: { word, phoneticUK, phoneticUS, parts: [{pos, definitions, examples}], 
//              roots, mnemonics, synonyms, antonyms, collocations, difficulty, frequency, forms }
function normalizeWord(raw) {
  if (!raw) return null;
  const defList = (raw.definitions || []);
  const meanings = defList.map(d => d.meaning || d);
  const defExamples = defList.filter(d => d.example).map(d => d.example);
  const extraExamples = (raw.examples || []).map(e => e.en || e);
  
  return {
    word: raw.word,
    phoneticUK: raw.phoneticUK,
    phoneticUS: raw.phoneticUS,
    parts: [{
      pos: raw.partOfSpeech || 'n.',
      definitions: meanings,
      examples: [...defExamples, ...extraExamples]
    }],
    roots: raw.rootAffix ? [raw.rootAffix] : [],
    mnemonics: raw.memoryTip ? [raw.memoryTip] : [],
    forms: [],
    synonyms: raw.synonyms || [],
    antonyms: raw.antonyms || [],
    collocations: raw.collocations || [],
    difficulty: raw.difficulty || 2,
    frequency: raw.frequency || 3,
    tags: raw.tags || []
  };
}

// 加载词书内容（带缓存）
export async function loadWordBook(bookId) {
  if (cache[bookId]) {
    return cache[bookId];
  }
  const loader = wordBooksMap[bookId];
  if (!loader) {
    return [];
  }
  try {
    const rawWords = await loader();
    const normalized = (rawWords || []).map(normalizeWord);
    cache[bookId] = normalized;
    return normalized;
  } catch (e) {
    console.error('加载词书失败:', bookId, e);
    return [];
  }
}

// 按难度筛选单词
export function filterByDifficulty(words, level) {
  if (!level || level === 0) return words;
  return words.filter(w => w.difficulty === level);
}

// 按关键词搜索单词
export function searchWords(words, keyword) {
  if (!keyword) return words;
  const kw = keyword.toLowerCase().trim();
  return words.filter(w =>
    w.word.toLowerCase().includes(kw) ||
    (w.definitions && w.definitions.some(d => d.meaning && d.meaning.includes(keyword)))
  );
}

// 随机打乱数组
export function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 获取随机练习单词
export function getRandomWords(words, count) {
  if (words.length <= count) {
    return shuffleArray(words);
  }
  return shuffleArray(words).slice(0, count);
}

// 根据ID查找单词
export function findWordById(words, word) {
  return words.find(w => w.word === word);
}

export default {
  getAllWordBooks,
  getWordBookMeta,
  loadWordBook,
  filterByDifficulty,
  searchWords,
  shuffleArray,
  getRandomWords,
  findWordById
};
