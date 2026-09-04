import http from "http";
import { initDatabase } from "./db.js";
import * as auth from "./auth.js";
import * as messages from "./messages.js";
import * as comments from "./comments.js";
import {
  validateUsername,
  validatePassword,
  validateTitle,
  validateContent,
} from "./validate.js";

const PORT = Number(process.env.PORT) || 1556;
const MAX_BODY_BYTES = 1024 * 1024;

// 解析 JSON 请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > MAX_BODY_BYTES) {
        req.destroy();
        reject(Object.assign(new Error("请求体过大"), { statusCode: 413 }));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(Object.assign(new Error("JSON 格式错误"), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

// 发送 JSON 响应
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

// 从请求头获取用户 ID
function getUserIdFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = auth.verifyToken(token);
  return decoded ? decoded.userId : null;
}

// 路由处理
async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);
  const method = req.method;

  // 处理 CORS 预检请求 ； 跨域问题处理
  if (method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  try {
    // API 路由
    if (pathname.startsWith("/api/")) {
      // 用户认证
      if (pathname === "/api/auth/register" && method === "POST") {
        const body = await parseBody(req);
        const { username, password, email } = body;

        const usernameError = validateUsername(username);
        const passwordError = validatePassword(password);
        if (usernameError || passwordError) {
          return sendJSON(res, 400, {
            success: false,
            message: usernameError || passwordError,
          });
        }

        const result = auth.register(username, password, email);
        const status = result.success ? 201 : 400;
        return sendJSON(res, status, result);
      }

      if (pathname === "/api/auth/login" && method === "POST") {
        const body = await parseBody(req);
        const { username, password } = body;

        if (!username || !password) {
          return sendJSON(res, 400, {
            success: false,
            message: "用户名和密码不能为空",
          });
        }

        const result = auth.login(username, password);
        const status = result.success ? 200 : 401;
        return sendJSON(res, status, result);
      }

      if (pathname === "/api/auth/me" && method === "GET") {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { success: false, message: "未授权" });
        }

        const user = auth.getUserInfo(userId);
        if (!user) {
          return sendJSON(res, 404, { success: false, message: "用户不存在" });
        }

        return sendJSON(res, 200, { success: true, user });
      }

      // 留言
      if (pathname === "/api/messages" && method === "GET") {
        const { page, limit, category, sortBy } = query;
        const userId = getUserIdFromRequest(req);
        const result = messages.getMessages(
          parseInt(page) || 1,
          parseInt(limit) || 10,
          category,
          sortBy || "created_at",
          userId,
        );
        return sendJSON(res, 200, { success: true, ...result });
      }

      if (pathname === "/api/messages" && method === "POST") {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { success: false, message: "请先登录" });
        }

        const body = await parseBody(req);
        const { title, content, category } = body;

        const titleError = validateTitle(title);
        const contentError = validateContent(content);
        if (titleError || contentError) {
          return sendJSON(res, 400, {
            success: false,
            message: titleError || contentError,
          });
        }

        const result = messages.createMessage(
          userId,
          title,
          content,
          category || "general",
        );
        const status = result.success ? 201 : 400;
        return sendJSON(res, status, result);
      }

      if (pathname.match(/^\/api\/messages\/\d+$/) && method === "GET") {
        const id = parseInt(pathname.split("/").pop());
        const message = messages.getMessageById(id);

        if (!message) {
          return sendJSON(res, 404, { success: false, message: "留言不存在" });
        }

        // 点赞
        const userId = getUserIdFromRequest(req);
        if (userId) {
          message.isLiked = messages.checkLikeStatus(id, userId);
        }

        return sendJSON(res, 200, { success: true, message });
      }

      if (pathname.match(/^\/api\/messages\/\d+$/) && method === "PUT") {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { success: false, message: "请先登录" });
        }

        const id = parseInt(pathname.split("/").pop());
        const body = await parseBody(req);
        const { title, content, category } = body;
        const titleError = validateTitle(title);
        const contentError = validateContent(content);
        if (titleError || contentError) {
          return sendJSON(res, 400, {
            success: false,
            message: titleError || contentError,
          });
        }

        const result = messages.updateMessage(
          id,
          userId,
          title,
          content,
          category,
        );
        const status = result.success ? 200 : 403;
        return sendJSON(res, status, result);
      }

      if (pathname.match(/^\/api\/messages\/\d+$/) && method === "DELETE") {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
          return sendJSON(res, 401, { success: false, message: "请先登录" });
        }

        const id = parseInt(pathname.split("/").pop());
        const result = messages.deleteMessage(id, userId);
        const status = result.success ? 200 : 403;
        return sendJSON(res, status, result);
      }

      if (pathname.match(/^\/api\/messages\/\d+\/like$/) && method === "POST") {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { success: false, message: "请先登录" });
        }

        const messageId = parseInt(pathname.split("/")[3]);
        const result = messages.toggleLike(messageId, userId);
        return sendJSON(res, 200, result);
      }

      // 评论
      if (
        pathname.match(/^\/api\/messages\/\d+\/comments$/) &&
        method === "GET"
      ) {
        const messageId = parseInt(pathname.split("/")[3]);
        const commentList = comments.getCommentsByMessageId(messageId);
        return sendJSON(res, 200, { success: true, comments: commentList });
      }

      if (
        pathname.match(/^\/api\/messages\/\d+\/comments$/) &&
        method === "POST"
      ) {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { success: false, message: "请先登录" });
        }

        const messageId = parseInt(pathname.split("/")[3]);
        const body = await parseBody(req);
        const { content, parentId } = body;

        const commentError = validateContent(content, 500);
        if (commentError) {
          return sendJSON(res, 400, {
            success: false,
            message: commentError === "内容不能为空" ? "评论内容不能为空" : commentError,
          });
        }

        const result = comments.createComment(
          messageId,
          userId,
          content,
          parentId || null,
        );
        const status = result.success ? 201 : 400;
        return sendJSON(res, status, result);
      }

      if (pathname.match(/^\/api\/comments\/\d+$/) && method === "DELETE") {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
          return sendJSON(res, 401, { success: false, message: "请先登录" });
        }

        const id = parseInt(pathname.split("/").pop());
        const result = comments.deleteComment(id, userId);
        const status = result.success ? 200 : 403;
        return sendJSON(res, status, result);
      }

      return sendJSON(res, 404, { success: false, message: "API 不存在" });
    }

    return sendJSON(res, 404, { success: false, message: "Not Found" });
  } catch (error) {
    console.error("请求处理错误:", error);
    const status = error.statusCode || 500;
    sendJSON(res, status, {
      success: false,
      message: status === 500 ? "服务器内部错误" : error.message,
    });
  }
}

// 启动！
initDatabase()
  .then(() => {
    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
      console.log(`API 地址 http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`端口被占用，请手动关闭占用的进程或使用其他端口`);
      } else {
        console.error("服务器启动失败:", err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("数据库初始化失败:", err);
    process.exit(1);
  });
