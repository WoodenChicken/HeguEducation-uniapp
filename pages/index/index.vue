<template>
  <view class="container">
    <!-- 顶部切换标签 -->
    <view class="tab-container">
      <view class="tab-item" :class="{ active: activeTab === 'english' }" @click="activeTab = 'english'">
        <text class="tab-text">{{ i18n.t('index.englishTab') }}</text>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'calligraphy' }" @click="activeTab = 'calligraphy'">
        <text class="tab-text">{{ i18n.t('index.calligraphyTab') }}</text>
      </view>
    </view>

    <!-- 轮播图 -->
    <view class="swiper-container">
      <swiper 
        :indicator-dots="true" 
        :autoplay="true" 
        :interval="3000" 
        :duration="1000"
        indicator-color="rgba(255, 255, 255, 0.5)"
        indicator-active-color="#ffffff"
      >
        <swiper-item>
          <image src="https://www.hegueducation.com/images/swiper1.jpg" mode="aspectFill" class="swiper-image" />
          <view class="swiper-text">{{ i18n.t('index.swiper1') }}</view>
        </swiper-item>
        <swiper-item>
          <image src="https://www.hegueducation.com/images/swiper2.jpg" mode="aspectFill" class="swiper-image" />
          <view class="swiper-text">{{ i18n.t('index.swiper2') }}</view>
        </swiper-item>
        <swiper-item>
          <image src="https://www.hegueducation.com/images/swiper3.jpg" mode="aspectFill" class="swiper-image" />
          <view class="swiper-text">{{ i18n.t('index.swiper3') }}</view>
        </swiper-item>
        <swiper-item>
          <image src="https://www.hegueducation.com/images/swiper4.jpg" mode="aspectFill" class="swiper-image" />
          <view class="swiper-text">{{ i18n.t('index.swiper4') }}</view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <!-- 英语AI学习内容 -->
      <view v-if="activeTab === 'english'" class="tab-content">
        <view class="header">
          <text class="title">{{ i18n.t('index.englishTab') }}</text>
          <text class="subtitle">智能英语学习助手</text>
        </view>
        
        <view class="menu-grid">
          <navigator url="../oral-practice/oral-practice" class="menu-item">
            <view class="menu-icon">🗣️</view>
            <text class="menu-text">{{ i18n.t('index.oralPractice') }}</text>
            <text class="menu-desc">{{ i18n.t('index.oralPracticeDesc') }}</text>
          </navigator>
          
          <navigator url="../vocabulary/vocabulary" class="menu-item">
            <view class="menu-icon">📚</view>
            <text class="menu-text">{{ i18n.t('index.vocabulary') }}</text>
            <text class="menu-desc">{{ i18n.t('index.vocabularyDesc') }}</text>
          </navigator>
          
          <navigator url="../role-play/role-play" class="menu-item">
            <view class="menu-icon">🎭</view>
            <text class="menu-text">{{ i18n.t('index.rolePlay') }}</text>
            <text class="menu-desc">{{ i18n.t('index.rolePlayDesc') }}</text>
          </navigator>
          
          <navigator url="../grammar/grammar" class="menu-item">
            <view class="menu-icon">🔍</view>
            <text class="menu-text">{{ i18n.t('index.grammar') }}</text>
            <text class="menu-desc">{{ i18n.t('index.grammarDesc') }}</text>
          </navigator>
        </view>
      </view>

      <!-- 书法篆刻学习内容 -->
      <view v-else class="tab-content">
        <view class="header">
          <text class="title">{{ i18n.t('index.calligraphyTitle') }}</text>
          <text class="subtitle">{{ i18n.t('index.calligraphySubtitle') }}</text>
        </view>
        
        <view class="menu-grid">
          <navigator url="/pages/grid-tool/grid-tool" class="menu-item">
            <view class="menu-icon">📐</view>
            <text class="menu-text">{{ i18n.t('index.gridTool') }}</text>
            <text class="menu-desc">{{ i18n.t('index.gridToolDesc') }}</text>
          </navigator>
          
          <navigator url="/pages/compare/compare" class="menu-item">
            <view class="menu-icon">📊</view>
            <text class="menu-text">{{ i18n.t('index.compare') }}</text>
            <text class="menu-desc">{{ i18n.t('index.compareDesc') }}</text>
          </navigator>
          
          <navigator url="/pages/practice/practice" class="menu-item">
            <view class="menu-icon">🖌️</view>
            <text class="menu-text">{{ i18n.t('index.practice') }}</text>
            <text class="menu-desc">{{ i18n.t('index.practiceDesc') }}</text>
          </navigator>
          
          <navigator url="../seal/seal" class="menu-item">
            <view class="menu-icon">🏺</view>
            <text class="menu-text">{{ i18n.t('index.seal') }}</text>
            <text class="menu-desc">{{ i18n.t('index.sealDesc') }}</text>
          </navigator>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import i18n from '../../locale'

// 活跃标签
const activeTab = ref('calligraphy')
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
}

/* 顶部切换标签 */
.tab-container {
  display: flex;
  background-color: #FFFFFF;
  border-bottom: 2rpx solid #EEEEEE;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 轮播图 */
.swiper-container {
  width: 100%;
  height: 400rpx;
  margin-bottom: 40rpx;
  border-radius: 0;
  overflow: hidden;
}

.swiper-image {
  width: 100%;
  height: 100%;
}

.swiper-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 20rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: bold;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  position: relative;
}

.tab-text {
  font-size: 32rpx;
  color: #666666;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: #007AFF;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  width: 60%;
  height: 4rpx;
  background-color: #007AFF;
  border-radius: 2rpx;
}

/* 内容区域 */
.content {
  padding: 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  color: #333333;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666666;
}

.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
  margin-bottom: 60rpx;
}

.menu-item {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  text-align: center;
  transition: all 0.3s ease;
}

.menu-item:hover {
  transform: translateY(-5rpx);
  box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.12);
}

.menu-icon {
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.menu-text {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
  color: #333333;
}

.menu-desc {
  font-size: 24rpx;
  color: #888888;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .menu-grid {
    gap: 20rpx;
  }
  
  .menu-item {
    padding: 30rpx 20rpx;
  }
  
  .title {
    font-size: 40rpx;
  }
  
  .subtitle {
    font-size: 24rpx;
  }
}
</style>