<script setup>
import { ref, onMounted, watch } from 'vue';
import { getMessages, toggleLike } from '../api/index.js';
import { isLoggedIn } from '../api/request.js';
import { formatTime } from '../utils/time.js';

const props = defineProps({
  category: {
    type: String,
    default: 'all'
  }
});

const emit = defineEmits(['select-message', 'need-login']);

const messages = ref([]);
const loading = ref(false);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});
const sortBy = ref('created_at');
const sortOptions = [
  { value: 'created_at', label: '最新' },
  { value: 'view_count', label: '最热' },
  { value: 'like_count', label: '点赞' },
];

// 分类映射
const categoryMap = {
  all: '全部',
  general: '综合',
  study: '学习',
  life: '生活',
  activity: '活动',
  other: '其他'
};

// 加载留言列表
async function loadMessages() {
  loading.value = true;
  try {
    const result = await getMessages(pagination.value.page, pagination.value.limit, props.category, sortBy.value);
    messages.value = result.messages;
    pagination.value = result.pagination;
  } catch (error) {
    console.error('加载留言失败:', error);
  } finally {
    loading.value = false;
  }
}

// 处理点赞
async function handleLike(messageId, event) {
  event.stopPropagation();
  
  if (!isLoggedIn()) {
    emit('need-login');
    return;
  }
  
  try {
    const result = await toggleLike(messageId);
    if (result.success) {
      // 更新本地数据
      const message = messages.value.find(m => m.id === messageId);
      if (message) {
        message.like_count = result.liked 
          ? message.like_count + 1 
          : message.like_count - 1;
        message.isLiked = result.liked;
      }
    }
  } catch (error) {
    console.error('点赞失败:', error);
  }
}

watch([() => props.category, sortBy], () => {
  pagination.value.page = 1;
  loadMessages();
});

onMounted(() => {
  loadMessages();
});
</script>

<template>
  <div class="message-list">
    <div class="list-toolbar">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        class="sort-btn"
        :class="{ active: sortBy === option.value }"
        @click="sortBy = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="messages.length === 0" class="empty">
      <p>暂无留言，快来发布第一条吧！</p>
    </div>
    
    <div v-else class="messages">
      <div 
        v-for="message in messages" 
        :key="message.id" 
        class="message-item"
        @click="emit('select-message', message.id)"
      >
        <div class="message-header">
          <span class="message-category">{{ categoryMap[message.category] || message.category }}</span>
          <span class="message-title">{{ message.title }}</span>
        </div>
        
        <div class="message-content">
          {{ message.content.substring(0, 100) }}{{ message.content.length > 100 ? '...' : '' }}
        </div>
        
        <div class="message-footer">
          <div class="message-meta">
            <span class="author">{{ message.username }}</span>
            <span class="time">{{ formatTime(message.created_at) }}</span>
          </div>
          
          <div class="message-actions">
            <button 
              class="action-btn like-btn" 
              :class="{ liked: message.isLiked }"
              @click.stop="handleLike(message.id, $event)"
            >
              {{ message.isLiked ? '❤️' : '🤍' }} {{ message.like_count || 0 }}
            </button>
            <span class="action-btn">
              💬 {{ message.comment_count || 0 }}
            </span>
            <span class="action-btn">
              👁️ {{ message.view_count || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button 
        :disabled="pagination.page === 1" 
        @click="pagination.page--; loadMessages()"
      >
        上一页
      </button>
      <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
      <button 
        :disabled="pagination.page === pagination.totalPages" 
        @click="pagination.page++; loadMessages()"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  max-width: 900px;
  margin: 0 auto;
}

.list-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sort-btn {
  padding: 6px 14px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 16px;
  color: #666;
  cursor: pointer;
  font-size: 13px;
}

.sort-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.message-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.message-category {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.message-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.message-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
  font-size: 14px;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.message-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.message-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #999;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn:hover {
  color: #667eea;
}

.like-btn.liked {
  color: #ff6b6b;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
}

.pagination button {
  padding: 10px 20px;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-weight: 500;
}
</style>
