import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { trimStr, validateUsername, validatePassword } from './validate.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_message_board_dev_secret';

// 用户注册
export function register(username, password, email) {
  try {
    const name = trimStr(username);
    const usernameError = validateUsername(name);
    if (usernameError) {
      return { success: false, message: usernameError };
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return { success: false, message: passwordError };
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(name);
    if (existingUser) {
      return { success: false, message: '用户名已存在' };
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)'
    ).run(name, hashedPassword, trimStr(email) || null);

    db.save();
    return { success: true, userId: result.lastInsertRowid };
  } catch (error) {
    console.error('注册错误:', error);
    return { success: false, message: '注册失败' };
  }
}

// 用户登录
export function login(username, password) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return { success: false, message: '用户名或密码错误' };
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { 
      success: true, 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    };
  } catch (error) {
    console.error('登录错误:', error);
    return { success: false, message: '登录失败' };
  }
}

// 验证 token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 获取用户信息
export function getUserInfo(userId) {
  const user = db.prepare(
    'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?'
  ).get(userId);
  
  if (!user) {
    return null;
  }
  
  return user;
}
