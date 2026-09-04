import { get, post, setToken, removeToken } from './request.js';

// 用户注册
export function register(username, password, email) {
  return post('/auth/register', { username, password, email });
}

// 用户登录
export function login(username, password) {
  return post('/auth/login', { username, password });
}

// 获取当前用户信息
export function getCurrentUser() {
  return get('/auth/me');
}

// 退出登录
export function logout() {
  removeToken();
  window.dispatchEvent(new Event('storage'));
}

// 保存 token
export function saveToken(token) {
  setToken(token);
}
