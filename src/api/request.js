const API_BASE_URL = 'http://localhost:1556/api';

// 获取存储的 token
function getToken() {
  return localStorage.getItem('token');
}

// 通用请求方法
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API 请求错误:', error);
    throw error;
  }
}

// GET 请求
export function get(endpoint) {
  return request(endpoint, { method: 'GET' });
}

// POST 请求
export function post(endpoint, data) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT 请求
export function put(endpoint, data) {
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE 请求
export function del(endpoint) {
  return request(endpoint, { method: 'DELETE' });
}

// 设置 token
export function setToken(token) {
  localStorage.setItem('token', token);
}

// 保存 token（别名）
export const saveToken = setToken;

// 移除 token
export function removeToken() {
  localStorage.removeItem('token');
}

// 检查是否登录
export function isLoggedIn() {
  return !!getToken();
}
