<script setup>
import { ref, computed } from 'vue';
import { login, register } from '../api/auth.js';
import { saveToken } from '../api/request.js';

const emit = defineEmits(['login-success', 'close']);

const isLoginMode = ref(true);
const loading = ref(false);
const error = ref('');

// 表单数据
const loginForm = ref({
  username: '',
  password: '',
});

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
});

// 计算属性：当前用户名字段
const currentUsername = computed({
  get: () => isLoginMode.value ? loginForm.value.username : registerForm.value.username,
  set: (val) => {
    if (isLoginMode.value) {
      loginForm.value.username = val;
    } else {
      registerForm.value.username = val;
    }
  }
});

// 计算属性：当前密码字段
const currentPassword = computed({
  get: () => isLoginMode.value ? loginForm.value.password : registerForm.value.password,
  set: (val) => {
    if (isLoginMode.value) {
      loginForm.value.password = val;
    } else {
      registerForm.value.password = val;
    }
  }
});

// 切换登录/注册模式
function toggleMode() {
  isLoginMode.value = !isLoginMode.value;
  error.value = '';
}

// 关闭弹窗
function handleClose() {
  emit('close');
}

// 处理登录
async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    error.value = '请填写用户名和密码';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const result = await login(loginForm.value.username, loginForm.value.password);
    saveToken(result.token);
    emit('login-success', result.user);
    handleClose();
  } catch (err) {
    error.value = err.message || '登录失败';
  } finally {
    loading.value = false;
  }
}

// 处理注册
async function handleRegister() {
  if (!registerForm.value.username || !registerForm.value.password) {
    error.value = '请填写用户名和密码';
    return;
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    error.value = '两次输入的密码不一致';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const result = await register(
      registerForm.value.username,
      registerForm.value.password,
      registerForm.value.email
    );
    
    if (result.success) {
      // 注册成功后自动登录
      const loginResult = await login(registerForm.value.username, registerForm.value.password);
      saveToken(loginResult.token);
      emit('login-success', loginResult.user);
      handleClose();
    } else {
      error.value = result.message || '注册失败';
    }
  } catch (err) {
    error.value = err.message || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-overlay" @click.self="handleClose">
    <div class="auth-container">
      <button class="close-btn" @click="handleClose">×</button>
      
      <div class="auth-card">
        <h2 class="auth-title">{{ isLoginMode ? '欢迎回来' : '创建账号' }}</h2>
        
        <form @submit.prevent="isLoginMode ? handleLogin() : handleRegister()">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="currentUsername"
              type="text"
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div class="form-group" v-if="!isLoginMode">
            <label for="email">邮箱（可选）</label>
            <input
              id="email"
              v-model="registerForm.email"
              type="email"
              placeholder="请输入邮箱"
            />
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="currentPassword"
              type="password"
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div class="form-group" v-if="!isLoginMode">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              required
            />
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
          
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '加载中...' : (isLoginMode ? '登录' : '注册') }}
          </button>
        </form>
        
        <p class="toggle-text">
          {{ isLoginMode ? '还没有账号？' : '已有账号？' }}
          <span class="toggle-link" @click="toggleMode">
            {{ isLoginMode ? '立即注册' : '去登录' }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.auth-container {
  position: relative;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  font-size: 36px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #667eea;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-text {
  text-align: center;
  margin-top: 24px;
  color: #666;
}

.toggle-link {
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  margin-left: 4px;
}

.toggle-link:hover {
  text-decoration: underline;
}
</style>
