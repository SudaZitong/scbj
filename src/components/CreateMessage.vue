<script setup>
import { ref } from 'vue';
import { createMessage } from '../api/index.js';

const emit = defineEmits(['success', 'cancel']);

const form = ref({
  title: '',
  content: '',
  category: 'general'
});

const submitting = ref(false);
const error = ref('');

const categories = [
  { value: 'general', label: '综合' },
  { value: 'study', label: '学习' },
  { value: 'life', label: '生活' },
  { value: 'activity', label: '活动' },
  { value: 'other', label: '其他' }
];

async function handleSubmit() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    error.value = '标题和内容不能为空';
    return;
  }
  
  submitting.value = true;
  error.value = '';
  
  try {
    await createMessage(form.value.title, form.value.content, form.value.category);
    emit('success');
  } catch (err) {
    error.value = err.message || '发布失败';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="create-message">
    <div class="header">
      <h2>发布新留言</h2>
      <button class="close-btn" @click="emit('cancel')">×</button>
    </div>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="category">分类</label>
        <select id="category" v-model="form.category">
          <option v-for="cat in categories" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="title">标题</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="请输入标题"
          maxlength="100"
        />
      </div>
      
      <div class="form-group">
        <label for="content">内容</label>
        <textarea
          id="content"
          v-model="form.content"
          placeholder="请输入内容..."
          rows="8"
          maxlength="5000"
        ></textarea>
        <p class="char-count">{{ form.content.length }} / 5000</p>
      </div>
      
      <div v-if="error" class="error-message">{{ error }}</div>
      
      <div class="actions">
        <button type="button" class="cancel-btn" @click="emit('cancel')">
          取消
        </button>
        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? '发布中...' : '发布' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-message {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 700px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 40px;
  height: 40px;
}

.close-btn:hover {
  color: #333;
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

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
}

.char-count {
  text-align: right;
  color: #999;
  font-size: 12px;
  margin-top: 6px;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn,
.submit-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 2px solid #e0e0e0;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
