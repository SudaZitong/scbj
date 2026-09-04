import { get, post, put, del } from './request.js';

// 获取留言列表
export function getMessages(page = 1, limit = 10, category = null, sortBy = 'created_at') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
  });
  
  if (category && category !== 'all') {
    params.append('category', category);
  }
  
  return get(`/messages?${params.toString()}`);
}

// 获取单个留言详情
export function getMessageById(id) {
  return get(`/messages/${id}`);
}

// 创建留言
export function createMessage(title, content, category = 'general') {
  return post('/messages', { title, content, category });
}

// 更新留言
export function updateMessage(id, title, content, category) {
  return put(`/messages/${id}`, { title, content, category });
}

// 删除留言
export function deleteMessage(id) {
  return del(`/messages/${id}`);
}

// 点赞/取消点赞
export function toggleLike(messageId) {
  return post(`/messages/${messageId}/like`);
}

// 获取评论列表
export function getComments(messageId) {
  return get(`/messages/${messageId}/comments`);
}

// 创建评论
export function createComment(messageId, content, parentId = null) {
  return post(`/messages/${messageId}/comments`, { content, parentId });
}

// 删除评论
export function deleteComment(commentId) {
  return del(`/comments/${commentId}`);
}
