import db from './db.js';

// 获取留言的所有评论
export function getCommentsByMessageId(messageId) {
  const comments = db.prepare(`
    SELECT 
      c.*,
      u.username,
      u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.message_id = ?
    ORDER BY c.created_at ASC
  `).all(messageId);
  
  return comments;
}

// 创建评论
export function createComment(messageId, userId, content, parentId = null) {
  try {
    const result = db.prepare(
      'INSERT INTO comments (message_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)'
    ).run(messageId, userId, String(content).trim(), parentId);

    db.save();
    return { success: true, commentId: result.lastInsertRowid };
  } catch (error) {
    console.error('创建评论错误:', error);
    return { success: false, message: '创建失败' };
  }
}

// 删除评论
export function deleteComment(id, userId) {
  try {
    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(id);
    
    if (!comment || Number(comment.user_id) !== Number(userId)) {
      return { success: false, message: '无权删除此评论' };
    }
    
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    db.save();
    return { success: true };
  } catch (error) {
    console.error('删除评论错误:', error);
    return { success: false, message: '删除失败' };
  }
}
