<script setup>
import { ref, computed, onMounted } from 'vue';
import AuthModal from './components/AuthModal.vue';
import MessageList from './components/MessageList.vue';
import MessageDetail from './components/MessageDetail.vue';
import CreateMessage from './components/CreateMessage.vue';
import { getCurrentUser, logout } from './api/auth.js';
import { isLoggedIn, removeToken } from './api/request.js';

// 当前视图：'list' | 'detail' | 'create'
const currentView = ref('list');

// 当前用户
const currentUser = ref(null);

// 选中的留言 ID
const selectedMessageId = ref(null);

// 选中的分类
const selectedCategory = ref('all');

// 显示认证弹窗
const showAuthModal = ref(false);

// 分类列表
const categories = [
  { value: 'all', label: '全部' },
  { value: 'general', label: '综合' },
  { value: 'study', label: '学习' },
  { value: 'life', label: '生活' },
  { value: 'activity', label: '活动' },
  { value: 'other', label: '其他' }
];

// 检查登录状态
onMounted(async () => {
  if (isLoggedIn()) {
    try {
      const result = await getCurrentUser();
      if (result.success) {
        currentUser.value = result.user;
      } else {
        removeToken();
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      removeToken();
    }
  }
});

// 处理登录成功
function handleLoginSuccess(user) {
  currentUser.value = user;
  showAuthModal.value = false;
}

// 处理退出登录
function handleLogout() {
  logout();
  currentUser.value = null;
  currentView.value = 'list';
  selectedMessageId.value = null;
}

// 选择留言
function selectMessage(id) {
  selectedMessageId.value = id;
  currentView.value = 'detail';
}

// 需要登录
function needLogin() {
  showAuthModal.value = true;
}

// 发布成功
function handleCreateSuccess() {
  currentView.value = 'list';
  selectedMessageId.value = null;
}

// 计算是否显示侧边栏
const showSidebar = computed(() => {
  return currentView.value === 'list';
});
</script>

<template>
  <div class="app">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo" @click="currentView = 'list'; selectedMessageId = null">
          📝 校园留言板
        </h1>
        
        <div class="header-actions">
          <template v-if="currentUser">
            <span class="welcome">欢迎，{{ currentUser.username }}</span>
            <button class="btn btn-primary" @click="currentView = 'create'">
              发布留言
            </button>
            <button class="btn btn-outline" @click="handleLogout">
              退出
            </button>
          </template>
          <template v-else>
            <button class="btn btn-primary" @click="showAuthModal = true">
              登录 / 注册
            </button>
          </template>
        </div>
      </div>
    </header>
    
    <div class="container">
      <!-- 侧边栏分类 -->
      <aside v-if="showSidebar" class="sidebar">
        <nav class="category-nav">
          <h3>分类</h3>
          <ul>
            <li 
              v-for="cat in categories" 
              :key="cat.value"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectedCategory = cat.value"
            >
              {{ cat.label }}
            </li>
          </ul>
        </nav>
        
        <div class="sidebar-info">
          <h3>关于</h3>
          <p>欢迎来到校园留言板，在这里你可以分享想法、提问交流、发布活动信息。</p>
        </div>
      </aside>
      
      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 留言列表 -->
        <MessageList
          v-if="currentView === 'list'"
          :category="selectedCategory"
          @select-message="selectMessage"
          @need-login="needLogin"
        />
        
        <!-- 留言详情 -->
        <MessageDetail
          v-if="currentView === 'detail'"
          :message-id="selectedMessageId"
          :current-user="currentUser"
          @close="currentView = 'list'; selectedMessageId = null"
          @need-login="needLogin"
        />
        
        <!-- 发布留言 -->
        <CreateMessage
          v-if="currentView === 'create'"
          @success="handleCreateSuccess"
          @cancel="currentView = 'list'"
        />
      </main>
    </div>
    
    <!-- 认证弹窗 -->
    <AuthModal
      v-if="showAuthModal"
      @login-success="handleLoginSuccess"
      @close="showAuthModal = false"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
  color: #333;
  line-height: 1.6;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.9;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome {
  font-size: 14px;
  opacity: 0.9;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 14px;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.btn-outline:hover {
  border-color: white;
  background: rgba(255, 255, 255, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 250px;
  flex-shrink: 0;
}

.category-nav {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.category-nav h3 {
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
}

.category-nav ul {
  list-style: none;
}

.category-nav li {
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  color: #666;
}

.category-nav li:hover {
  background: #f5f7fa;
  color: #667eea;
}

.category-nav li.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar-info {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.sidebar-info h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 18px;
}

.sidebar-info p {
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
  
  .header-content {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
