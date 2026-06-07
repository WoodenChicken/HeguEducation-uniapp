<template>
  <view class="container">
    <view class="header">
      <text class="title">角色扮演</text>
      <text class="subtitle">与经典角色进行AI英语对话</text>
    </view>

    <!-- 角色选择 -->
    <view class="character-selection" v-if="step === 1">
      <text class="section-title">选择角色</text>
      <view class="character-grid">
        <view
          v-for="char in characters"
          :key="char.id"
          :class="['character-item', { selected: selectedCharacterId === char.id }]"
          @click="selectCharacter(char.id)"
        >
          <view class="character-icon">{{ char.icon }}</view>
          <text class="character-name">{{ char.name }}</text>
          <text class="character-scene">{{ char.scene }}</text>
        </view>
      </view>
    </view>

    <!-- 角色介绍 -->
    <view class="character-intro" v-if="step === 2 && selectedCharacter">
      <view class="intro-header">
        <view class="intro-icon">{{ selectedCharacter.icon }}</view>
        <view class="intro-info">
          <text class="intro-name">{{ selectedCharacter.name }}</text>
          <text class="intro-scene">{{ selectedCharacter.scene }}</text>
        </view>
      </view>
      <view class="intro-content">
        <text class="intro-label">角色设定</text>
        <text class="intro-text">{{ selectedCharacter.personality }}</text>
      </view>
      <view class="intro-content">
        <text class="intro-label">对话场景</text>
        <text class="intro-text">{{ selectedCharacter.scenario }}</text>
      </view>
      <view class="intro-tips">
        <text class="tips-title">对话技巧</text>
        <text class="tips-item">• 尝试用简单的英语句子</text>
        <text class="tips-item">• 不要担心犯错误，尽情练习</text>
        <text class="tips-item">• 注意角色的说话风格</text>
      </view>
      <button type="primary" class="start-btn" @click="startRolePlay">开始对话</button>
      <button class="back-btn" @click="step = 1">返回选择</button>
    </view>

    <!-- 对话练习 -->
    <view class="dialogue-practice" v-if="step === 3">
      <view class="practice-header">
        <view class="practice-info">
          <text class="practice-icon">{{ selectedCharacter.icon }}</text>
          <text class="practice-name">{{ selectedCharacter.name }}</text>
        </view>
        <view class="practice-level">
          <text class="level-label">难度</text>
          <text class="level-value">{{ selectedCharacter.difficulty }}</text>
        </view>
      </view>

      <view class="chat-container">
        <scroll-view scroll-y class="chat-messages" :scroll-top="scrollTop">
          <view class="message ai-message">
            <view class="message-avatar">{{ selectedCharacter.icon }}</view>
            <view class="message-bubble">
              <text class="message-sender">{{ selectedCharacter.name }}</text>
              <text class="message-text">{{ selectedCharacter.greeting }}</text>
            </view>
          </view>

          <view
            v-for="(msg, index) in conversationHistory"
            :key="index"
            :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']"
          >
            <view v-if="msg.role === 'user'" class="message-avatar user-avatar">我</view>
            <view v-else class="message-avatar">{{ selectedCharacter.icon }}</view>
            <view class="message-bubble">
              <text v-if="msg.role === 'ai'" class="message-sender">{{ selectedCharacter.name }}</text>
              <text class="message-text">{{ msg.content }}</text>
            </view>
          </view>

          <view class="message ai-message" v-if="isAIThinking">
            <view class="message-avatar">{{ selectedCharacter.icon }}</view>
            <view class="message-bubble thinking">
              <text class="thinking-dots">...</text>
            </view>
          </view>
        </scroll-view>

        <view class="input-area">
          <input
            type="text"
            v-model="inputText"
            placeholder="用英语回复..."
            class="input"
            :disabled="isAIThinking"
            @confirm="sendMessage"
          />
          <button
            type="primary"
            class="send-btn"
            @click="sendMessage"
            :disabled="isAIThinking || !inputText.trim()"
          >
            {{ isAIThinking ? '思考中' : '发送' }}
          </button>
        </view>
      </view>

      <view class="practice-actions">
        <button class="action-btn" @click="resetConversation">
          <text class="action-icon">🔄</text>
          <text>重置对话</text>
        </button>
        <button class="action-btn" @click="getHint">
          <text class="action-icon">💡</text>
          <text>获取提示</text>
        </button>
        <button class="action-btn" @click="endPractice">
          <text class="action-icon">📤</text>
          <text>结束练习</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const characters = [
  {
    id: 'spongebob',
    name: 'SpongeBob',
    icon: '🧽',
    scene: '海绵宝宝',
    difficulty: '⭐',
    personality: '乐观、热情、精力充沛的海底服务员。说话友好、活泼，喜欢用感叹句。',
    scenario: '在蟹堡王餐厅工作，向顾客介绍美味的蟹堡！',
    greeting: 'Good morning, friend! Welcome to the Krusty Krab! I\'m SpongeBob! What can I get for you today?'
  },
  {
    id: 'harry',
    name: 'Harry Potter',
    icon: '⚡',
    scene: '哈利·波特',
    difficulty: '⭐⭐⭐',
    personality: '勇敢、好奇、友善的年轻巫师。说话正式但友好，有时会用到魔法术语。',
    scenario: '在霍格沃茨魔法学校，与朋友讨论课程和冒险！',
    greeting: 'Hi there! I\'m Harry. Welcome to Hogwarts! Have you been to the Great Hall yet? The food there is amazing!'
  },
  {
    id: 'elsa',
    name: 'Elsa',
    icon: '❄️',
    scene: '冰雪奇缘',
    difficulty: '⭐⭐',
    personality: '优雅、自信、独立的公主。说话温柔但有力量，充满诗意。',
    scenario: '在冰雪城堡中，与客人分享她的冰雪魔法故事！',
    greeting: 'Hello, my friend. Welcome to my ice castle. The snow is beautiful here, isn\'t it? Let me show you my frozen garden!'
  },
  {
    id: 'sherlock',
    name: 'Sherlock Holmes',
    icon: '🔍',
    scene: '福尔摩斯',
    difficulty: '⭐⭐⭐⭐',
    personality: '聪明、观察力极强、逻辑缜密的侦探。说话简洁、直接，喜欢分析细节。',
    scenario: '在贝克街221B，分析棘手的案件！',
    greeting: 'Elementary, my dear friend. I can tell you\'ve been thinking hard today. Tell me, what brings you to my door?'
  },
  {
    id: 'olaf',
    name: 'Olaf',
    icon: '⛄',
    scene: '雪宝',
    difficulty: '⭐',
    personality: '善良、好奇、天真的雪人。说话可爱、充满想象力，喜欢问问题。',
    scenario: '与朋友们一起冒险，探索夏天的乐趣！',
    greeting: 'Hi! I\'m Olaf, and I like warm hugs! Oh, I love summer! Do you want to build a snowman together?'
  },
  {
    id: 'tony',
    name: 'Tony Stark',
    icon: '💼',
    scene: '钢铁侠',
    difficulty: '⭐⭐⭐⭐',
    personality: '自信、聪明、幽默的天才企业家。说话调侃、时尚，喜欢用俚语。',
    scenario: '在斯塔克工业，展示最新科技！',
    greeting: 'Hey there! Tony Stark here. Welcome to Stark Industries. Ever seen an arc reactor in action? Let me show you something cool.'
  }
]

const step = ref(1)
const selectedCharacterId = ref('')
const inputText = ref('')
const conversationHistory = ref([])
const isAIThinking = ref(false)
const scrollTop = ref(0)

const selectedCharacter = computed(() => {
  return characters.find(c => c.id === selectedCharacterId.value)
})

const selectCharacter = (id) => {
  selectedCharacterId.value = id
  step.value = 2
}

const startRolePlay = () => {
  step.value = 3
  conversationHistory.value = []
}

const scrollToBottom = () => {
  nextTick(() => {
    scrollTop.value = conversationHistory.value.length * 1000
  })
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isAIThinking.value) return

  inputText.value = ''
  conversationHistory.value.push({
    role: 'user',
    content: text
  })
  scrollToBottom()

  isAIThinking.value = true

  try {
    const { callAI } = await import('../../api/ai.js')

    const systemPrompt = `You are ${selectedCharacter.value.name} from ${selectedCharacter.value.scene}.
Your personality: ${selectedCharacter.value.personality}
Scenario: ${selectedCharacter.value.scenario}

Please respond in character, keeping responses short (1-3 sentences). Use the speaking style of this character. Respond ONLY with the dialogue, no descriptions.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.value.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ]

    const result = await callAI(messages, { provider: 'deepseek' })

    if (result) {
      conversationHistory.value.push({
        role: 'ai',
        content: result.trim()
      })
    } else {
      throw new Error('Empty response')
    }
  } catch (err) {
    console.error('AI对话失败:', err)
    const fallbackResponses = [
      "That's interesting! Tell me more about that.",
      "Hmm, let me think about that for a moment.",
      "I see what you mean! What else would you like to discuss?",
      "Great point! I never thought of it that way."
    ]
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    conversationHistory.value.push({
      role: 'ai',
      content: randomResponse
    })
  } finally {
    isAIThinking.value = false
    scrollToBottom()
  }
}

const getHint = async () => {
  if (conversationHistory.value.length === 0) {
    uni.showToast({ title: '请先开始对话', icon: 'none' })
    return
  }

  uni.showLoading({ title: '生成提示中...' })

  try {
    const { callAI } = await import('../../api/ai.js')

    const lastUserMessage = [...conversationHistory.value].reverse().find(m => m.role === 'user')

    const prompt = `作为${selectedCharacter.value.name}的角色扮演练习，请给用户一个简单的英语回复建议。

当前对话：
${conversationHistory.value.map(m => `${m.role === 'user' ? '用户' : selectedCharacter.value.name}: ${m.content}`).join('\n')}

请给出3个简单的英语回复选项供用户选择，每个1-2句话。格式如下：
1. [回复1]
2. [回复2]
3. [回复3]`

    const result = await callAI([{ role: 'user', content: prompt }], { provider: 'deepseek' })

    uni.hideLoading()
    uni.showModal({
      title: '💡 回复提示',
      content: result || 'Try saying: "That sounds great!" or "Can you tell me more?"',
      showCancel: false
    })
  } catch (err) {
    console.error('获取提示失败:', err)
    uni.hideLoading()
    uni.showToast({ title: '获取提示失败', icon: 'none' })
  }
}

const resetConversation = () => {
  uni.showModal({
    title: '确认重置',
    content: '确定要重置对话吗？这将清除所有对话历史。',
    success: (res) => {
      if (res.confirm) {
        conversationHistory.value = []
        inputText.value = ''
        step.value = 1
        selectedCharacterId.value = ''
      }
    }
  })
}

const endPractice = () => {
  const messageCount = conversationHistory.value.length
  if (messageCount === 0) {
    uni.showToast({ title: '还没有对话内容', icon: 'none' })
    return
  }

  uni.showModal({
    title: '结束练习',
    content: `你完成了 ${messageCount} 轮对话！太棒了！`,
    showCancel: true,
    confirmText: '再来一次',
    cancelText: '返回',
    success: (res) => {
      if (res.confirm) {
        conversationHistory.value = []
        inputText.value = ''
      } else {
        step.value = 1
        selectedCharacterId.value = ''
      }
    }
  })
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding: 30rpx;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  display: block;
  color: #333333;
  margin-bottom: 8rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #666666;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
  display: block;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.character-item {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  transition: all 0.3s;
  border: 4rpx solid transparent;
}

.character-item.selected {
  border-color: #4A90D9;
  background-color: #F0F7FF;
}

.character-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.character-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
  display: block;
}

.character-scene {
  font-size: 22rpx;
  color: #888888;
}

.intro-header {
  display: flex;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.intro-icon {
  font-size: 80rpx;
  margin-right: 24rpx;
}

.intro-info {
  flex: 1;
}

.intro-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.intro-scene {
  font-size: 26rpx;
  color: #666666;
}

.intro-content {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.intro-label {
  font-size: 24rpx;
  color: #4A90D9;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.intro-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
}

.intro-tips {
  background-color: #FFF9E6;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.tips-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #996600;
  display: block;
  margin-bottom: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #996600;
  display: block;
  margin-bottom: 6rpx;
}

.start-btn {
  background: linear-gradient(135deg, #4A90D9, #67CF8C);
  color: white;
  border: none;
  border-radius: 44rpx;
  height: 88rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 217, 0.3);
}

.back-btn {
  background-color: #F5F5F5;
  color: #666666;
  border: none;
  border-radius: 44rpx;
  height: 80rpx;
  font-size: 30rpx;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.practice-info {
  display: flex;
  align-items: center;
}

.practice-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
}

.practice-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.practice-level {
  display: flex;
  align-items: center;
}

.level-label {
  font-size: 24rpx;
  color: #999999;
  margin-right: 8rpx;
}

.level-value {
  font-size: 24rpx;
  color: #FFB800;
}

.chat-container {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  margin-bottom: 20rpx;
}

.chat-messages {
  height: 600rpx;
  padding: 24rpx;
  background-color: #FAFAFA;
}

.message {
  display: flex;
  margin-bottom: 24rpx;
  align-items: flex-start;
}

.message-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: #E8F4FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.user-avatar {
  background-color: #4A90D9;
  color: white;
  font-size: 26rpx;
}

.message-bubble {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}

.message-sender {
  font-size: 22rpx;
  color: #4A90D9;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.message-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
}

.user-message {
  flex-direction: row-reverse;
}

.user-message .message-avatar {
  margin-right: 0;
  margin-left: 16rpx;
}

.user-message .message-bubble {
  background-color: #4A90D9;
}

.user-message .message-sender {
  color: #E8F4FF;
  text-align: right;
}

.user-message .message-text {
  color: white;
}

.thinking {
  background-color: #FFF3E0;
}

.thinking-dots {
  font-size: 32rpx;
  color: #FF9800;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.input-area {
  display: flex;
  padding: 20rpx;
  background-color: #FFFFFF;
  border-top: 1rpx solid #EEEEEE;
}

.input {
  flex: 1;
  height: 80rpx;
  background-color: #F5F5F5;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  margin-right: 16rpx;
}

.send-btn {
  width: 160rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #4A90D9, #67CF8C);
  color: white;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.send-btn[disabled] {
  background: #CCCCCC;
}

.practice-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background-color: #FFFFFF;
  border: none;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.action-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.action-btn text:last-child {
  font-size: 22rpx;
  color: #666666;
}
</style>