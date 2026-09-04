<script setup>
import { ref, onMounted, computed } from 'vue';
import { getMessageById, getComments, createComment, deleteComment, toggleLike, deleteMessage } from '../api/index.js';
import { isLoggedIn } from '../api/request.js';

const props = defineProps({
  messageId: Number,
  currentUser: Object
});

const emit = defineEmits(['close', 'need-login']);

const message = ref(null);
const comments = ref([]);
const loading = ref(true);
const commentContent = ref('');
const submitting = ref(false);

// 检查是否可以删除留言
const canDeleteMessage = computed(() => {
  if (!props.currentUser || !message.value) return false;
  const userId = Number(props.currentUser.id);
  const messageId = Number(message.value.user_id);
  return userId === messageId;
});

// 检查是否可以删除评论
function canDeleteComment(commentUserId) {
  if (!props.currentUser) return false;
  return Number(props.currentUser.id) === Number(commentUserId);
}

// 加载留言详情
async function loadMessage() {
  if (!props.messageId) return;
  
  loading.value = true;
  try {
    const result = await getMessageById(props.messageId);
    message.value = result.message;
  } catch (error) {
    console.error('加载留言失败:', error);
  } finally {
    loading.value = false;
  }
}

// 加载评论
async function loadComments() {
  if (!props.messageId) return;
  
  try {
    const result = await getComments(props.messageId);
    comments.value = result.comments;
  } catch (error) {
    console.error('加载评论失败:', error);
  }
}

// 处理点赞
async function handleLike() {
  if (!isLoggedIn()) {
    emit('need-login');
    return;
  }
  
  try {
    const result = await toggleLike(props.messageId);
    if (result.success) {
      message.value.like_count = result.liked 
        ? message.value.like_count + 1 
        : message.value.like_count - 1;
      message.value.isLiked = result.liked;
    }
  } catch (error) {
    console.error('点赞失败:', error);
  }
}

// 提交评论
async function submitComment() {
  if (!commentContent.value.trim()) {
    alert('请输入评论内容');
    return;
  }
  
  if (!isLoggedIn()) {
    emit('need-login');
    return;
  }
  
  submitting.value = true;
  try {
    await createComment(props.messageId, commentContent.value);
    commentContent.value = '';
    await loadComments();
  } catch (error) {
    console.error('发表评论失败:', error);
  } finally {
    submitting.value = false;
  }
}

// 删除评论
async function handleDeleteComment(commentId) {
  if (!confirm('确定要删除这条评论吗？')) return;
  
  try {
    await deleteComment(commentId);
    await loadComments();
  } catch (error) {
    console.error('删除评论失败:', error);
  }
}

// 删除留言
async function handleDeleteMessage() {
  if (!confirm('确定要删除这条留言吗？')) return;
  
  try {
    await deleteMessage(props.messageId);
    emit('close');
  } catch (error) {
    console.error('删除留言失败:', error);
  }
}

// 格式化时间
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < 7 * day) {
    return Math.floor(diff / day) + '天前';
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

const categoryMap = {
  general: '综合',
  study: '学习',
  life: '生活',
  activity: '活动',
  other: '其他'
};

onMounted(() => {
  loadMessage();
  loadComments();
});
</script>

<template>
  <div v-if="loading" class="loading">加载中...</div>
  
  <div v-else-if="!message" class="empty">
    <p>留言不存在</p>
    <button @click="emit('close')">返回</button>
  </div>
  
  <div v-else class="message-detail">
    <div class="detail-header">
      <button class="back-btn" @click="emit('close')">← 返回</button>
      <button v-if="canDeleteMessage" class="delete-btn" @click="handleDeleteMessage">
        删除留言
      </button>
    </div>
    
    <article class="article">
      <div class="article-header">
        <span class="category">{{ categoryMap[message.category] || message.category }}</span>
        <h1 class="title">{{ message.title }}</h1>
      </div>
      
      <div class="article-meta">
        <span class="author">{{ message.username }}</span>
        <span class="time">{{ formatTime(message.created_at) }}</span>
        <span class="views">👁️ {{ message.view_count }}</span>
      </div>
      
      <div class="article-content">
        {{ message.content }}
      </div>
      
      <div class="article-actions">
        <button 
          class="like-btn" 
          :class="{ liked: message.isLiked }"
          @click="handleLike"
        >
          {{ message.isLiked ? '❤️' : '🤍' }} {{ message.like_count }}
        </button>
        <!-- 谁家点赞emo这么难找 -->
      </div>
    </article>
    
    <!-- 评论区 -->
    <section class="comments-section">
      <h3 class="comments-title">评论 ({{ comments.length }})</h3>
      
      <div class="comment-form">
        <textarea
          v-model="commentContent"
          placeholder="写下你的评论..."
          rows="3"
        ></textarea>
        <button 
          class="submit-btn" 
          :disabled="submitting || !commentContent.trim()"
          @click="submitComment"
        >
          {{ submitting ? '发表中...' : '发表评论' }}
        </button>
      </div>
      
      <div class="comments-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <span class="comment-author">{{ comment.username }}</span>
            <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            <button 
              v-if="canDeleteComment(comment.user_id)" 
              class="delete-comment-btn"
              @click="handleDeleteComment(comment.id)"
            >
              删除
            </button>
          </div>
          <div class="comment-content">
            {{ comment.content }}
          </div>
        </div>
        
        <div v-if="comments.length === 0" class="no-comments">
          暂无评论，快来抢沙发吧！
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.message-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty button {
  margin-top: 20px;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
}

.back-btn:hover {
  text-decoration: underline;
}

.delete-btn {
  padding: 8px 16px;
  background: #fee;
  color: #c33;
  border: 2px solid #fcc;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.delete-btn:hover {
  background: #fcc;
  color: white;
}

.article {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.article-header {
  margin-bottom: 16px;
}

.category {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.article-meta {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 14px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  margin-bottom: 24px;
}

.article-actions {
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.like-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
  color: #999;
  transition: color 0.2s;
}

.like-btn.liked {
  color: #ff6b6b;
}

.like-btn:hover {
  color: #ff6b6b;
}

.comments-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
}

.comments-title {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  margin-bottom: 12px;
}

.comment-form textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #333;
}

.comment-time {
  color: #999;
  font-size: 13px;
}

.delete-comment-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
}

.delete-comment-btn:hover {
  color: #c33;
}

.comment-content {
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.no-comments {
  text-align: center;
  color: #999;
  padding: 40px 20px;
}
</style>
