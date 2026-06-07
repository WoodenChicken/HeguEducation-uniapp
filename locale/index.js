import zhCN from './zh-CN';
import zhTW from './zh-TW';
import enUS from './en-US';
import jaJP from './ja-JP';
import koKR from './ko-KR';

const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR
};

let currentLang = 'zh-CN';

// 从本地存储获取语言设置
try {
  const storedLang = uni.getStorageSync('language');
  if (storedLang && messages[storedLang]) {
    currentLang = storedLang;
  }
} catch (e) {
  console.error('获取语言设置失败:', e);
}

export default {
  // 获取当前语言
  getLang() {
    return currentLang;
  },
  
  // 设置语言
  setLang(lang) {
    if (messages[lang]) {
      currentLang = lang;
      try {
        uni.setStorageSync('language', lang);
      } catch (e) {
        console.error('保存语言设置失败:', e);
      }
      return true;
    }
    return false;
  },
  
  // 获取翻译
  t(key, defaultValue = '') {
    const keys = key.split('.');
    let result = messages[currentLang];
    
    for (const k of keys) {
      if (result && typeof result === 'object') {
        result = result[k];
      } else {
        return defaultValue;
      }
    }
    
    return result || defaultValue;
  },
  
  // 获取支持的语言列表
  getSupportedLanguages() {
    return [
      { value: 'zh-CN', label: '简体中文' },
      { value: 'zh-TW', label: '繁體中文' },
      { value: 'en-US', label: 'English' },
      { value: 'ja-JP', label: '日本語' },
      { value: 'ko-KR', label: '한국어' }
    ];
  }
};