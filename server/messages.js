import db from './db.js';
import { normalizeCategory, sortColumn, trimStr } from './validate.js';

// 获取所有留言（带分页）
export function getMessages(page = 1, limit = 10, category = null, sortBy = 'created_at', userId = null) {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(50, Math.max(1, Number(limit) || 10));
  const offset = (page - 1) * limit;
  const orderCol = sortColumn(sortBy);
  const likeSelect = userId
    ? '(SELECT COUNT(*) FROM likes lx WHERE lx.message_id = m.id AND lx.user_id = ?) as isLiked'
    : '0 as isLiked';

  const params = [];
  if (userId) params.push(userId);

  let where = '';
  if (category && category !== 'all') {
    where = ' WHERE m.category = ?';
    params.push(category);
  }

  const query = `
    SELECT
      m.*,
      u.username,
      u.avatar,
      COUNT(DISTINCT c.id) as comment_count,
      COUNT(DISTINCT l.id) as like_count,
      ${likeSelect}
    FROM messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN comments c ON c.message_id = m.id
    LEFT JOIN likes l ON l.message_id = m.id
    ${where}
    GROUP BY m.id
    ORDER BY ${orderCol} DESC
    LIMIT ? OFFSET ?
  `;

  const messages = db.prepare(query).all(...params, limit, offset).map((item) => ({
    ...item,
    isLiked: Number(item.isLiked) > 0,
  }));

  let countQuery = 'SELECT COUNT(*) as total FROM messages';
  let total;
  if (category && category !== 'all') {
    total = db.prepare(`${countQuery} WHERE category = ?`).get(category).total;
  } else {
    total = db.prepare(countQuery).get().total;
  }

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

// 获取单个留言详情
export function getMessageById(id) {
  const message = db.prepare(`
    SELECT 
      m.*,
      u.username,
      u.avatar,
      COUNT(DISTINCT l.id) as like_count
    FROM messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN likes l ON l.message_id = m.id
    WHERE m.id = ?
    GROUP BY m.id
  `).get(id);
  
  if (!message) {
    return null;
  }

  db.prepare('UPDATE messages SET view_count = view_count + 1 WHERE id = ?').run(id);
  db.save();
  message.view_count = Number(message.view_count || 0) + 1;
  return message;
}

// 创建留言
export function createMessage(userId, title, content, category = 'general') {
  try {
    const result = db.prepare(
      'INSERT INTO messages (user_id, title, content, category) VALUES (?, ?, ?, ?)'
    ).run(userId, trimStr(title), trimStr(content), normalizeCategory(category));

    db.save();
    return { success: true, messageId: result.lastInsertRowid };
  } catch (error) {
    console.error('创建留言错误:', error);
    return { success: false, message: '创建失败' };
  }
}

// 更新留言
export function updateMessage(id, userId, title, content, category) {
  try {
    // 检查权限
    const message = db.prepare('SELECT user_id FROM messages WHERE id = ?').get(id);
    if (!message || Number(message.user_id) !== Number(userId)) {
      return { success: false, message: '无权修改此留言' };
    }

    db.prepare(
      'UPDATE messages SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(trimStr(title), trimStr(content), normalizeCategory(category), id);

    db.save();
    return { success: true };
  } catch (error) {
    console.error('更新留言错误:', error);
    return { success: false, message: '更新失败' };
  }
}

// 删除留言
export function deleteMessage(id, userId) {
  try {
    const message = db.prepare('SELECT user_id FROM messages WHERE id = ?').get(id);
    
    if (!message || Number(message.user_id) !== Number(userId)) {
      return { success: false, message: '无权删除此留言' };
    }
    
    db.prepare('DELETE FROM messages WHERE id = ?').run(id);
    db.save();
    return { success: true };
  } catch (error) {
    console.error('删除留言错误:', error);
    return { success: false, message: '删除失败' };
  }
}

// 点赞/取消点赞
export function toggleLike(messageId, userId) {
  try {
    const existingLike = db.prepare(
      'SELECT id FROM likes WHERE message_id = ? AND user_id = ?'
    ).get(messageId, userId);
    
    if (existingLike) {
      // 取消点赞
      db.prepare('DELETE FROM likes WHERE message_id = ? AND user_id = ?').run(messageId, userId);
      db.save();
      return { success: true, liked: false };
    } else {
      db.prepare('INSERT INTO likes (message_id, user_id) VALUES (?, ?)').run(messageId, userId);
      db.save();
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('点赞错误:', error);
    return { success: false, message: '操作失败' };
  }
}

// 检查用户是否已点赞
export function checkLikeStatus(messageId, userId) {
  const like = db.prepare(
    'SELECT id FROM likes WHERE message_id = ? AND user_id = ?'
  ).get(messageId, userId);
  
  return !!like;
}
