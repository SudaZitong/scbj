export const CATEGORIES = ['general', 'study', 'life', 'activity', 'other'];

export const SORT_COLUMNS = {
  created_at: 'm.created_at',
  view_count: 'm.view_count',
  like_count: 'like_count',
};

export function trimStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeCategory(category) {
  return CATEGORIES.includes(category) ? category : 'general';
}

export function sortColumn(sortBy) {
  return SORT_COLUMNS[sortBy] || SORT_COLUMNS.created_at;
}

export function validateUsername(username) {
  const value = trimStr(username);
  if (value.length < 2 || value.length > 20) {
    return '用户名长度需为 2–20 个字符';
  }
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(value)) {
    return '用户名仅支持中文、字母、数字和下划线';
  }
  return null;
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    return '密码至少 6 位';
  }
  if (password.length > 64) {
    return '密码过长';
  }
  return null;
}

export function validateTitle(title) {
  const value = trimStr(title);
  if (!value) return '标题不能为空';
  if (value.length > 100) return '标题不超过 100 字';
  return null;
}

export function validateContent(content, max = 5000) {
  const value = trimStr(content);
  if (!value) return '内容不能为空';
  if (value.length > max) return `内容不超过 ${max} 字`;
  return null;
}
