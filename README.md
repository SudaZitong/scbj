# 校园留言板 - 运行说明

## 项目简介

一个基于 B/S 架构的校园留言板系统，支持用户发布留言、评论互动、点赞等功能。

## 技术栈

- **前端**: Vue 3 + Vite + TypeScript + 原生 CSS
- **后端**: Node.js 原生 HTTP 模块 + SQLite (sql.js)
- **认证**: JWT Token 身份验证

## 快速开始

### 1. 启动后端服务器

打开终端，进入项目目录：

```bash
cd server
npm install
npm run dev
```

后端将启动在 **http://localhost:1556**

### 2. 启动前端开发服务器

打开**新终端**，进入项目目录：

```bash
npm install
npm run dev
```

前端将启动在 **http://localhost:5173**

### 3. 一次启动双服务器

```bash
npm run dev:all
```

### 4. 访问应用

在浏览器中打开 **http://localhost:5173** 即可使用留言板。

> **提示**: 建议使用 Chrome、Edge 或 Firefox 等现代浏览器，以获得最佳体验。

## 功能特性

### 用户认证

- ✅ 用户注册（用户名、密码、邮箱）
- ✅ 用户登录（JWT 令牌认证）
- ✅ 自动登录状态保持

### 留言管理

- ✅ 发布新留言（支持分类：综合/学习/生活/活动/其他）
- ✅ 查看留言列表（分页显示）
- ✅ 查看留言详情
- ✅ 编辑/删除自己的留言
- ✅ 按分类筛选留言

### 互动功能

- ✅ 点赞/取消点赞
- ✅ 发表评论
- ✅ 删除自己的评论
- ✅ 实时统计点赞数、评论数、浏览量

## API 接口文档

### 用户认证

| 方法   | 路径                 | 描述       |
| ---- | ------------------ | -------- |
| POST | /api/auth/register | 用户注册     |
| POST | /api/auth/login    | 用户登录     |
| GET  | /api/auth/me       | 获取当前用户信息 |

### 留言管理

| 方法     | 路径                     | 描述      |
| ------ | ---------------------- | ------- |
| GET    | /api/messages          | 获取留言列表  |
| POST   | /api/messages          | 创建留言    |
| GET    | /api/messages/:id      | 获取留言详情  |
| PUT    | /api/messages/:id      | 更新留言    |
| DELETE | /api/messages/:id      | 删除留言    |
| POST   | /api/messages/:id/like | 点赞/取消点赞 |

### 评论管理

| 方法     | 路径                         | 描述     |
| ------ | -------------------------- | ------ |
| GET    | /api/messages/:id/comments | 获取评论列表 |
| POST   | /api/messages/:id/comments | 创建评论   |
| DELETE | /api/comments/:id          | 删除评论   |

## 项目结构

```
scbj/
├── src/                        # 前端源码
│   ├── api/                   # API 接口层
│   │   ├── request.js         # HTTP 请求封装
│   │   ├── index.js           # 留言 API
│   │   └── auth.js            # 认证 API
│   ├── components/            # Vue 组件
│   │   ├── AuthModal.vue      # 登录注册弹窗
│   │   ├── MessageList.vue    # 留言列表
│   │   ├── MessageDetail.vue  # 留言详情
│   │   ├── CreateMessage.vue  # 发布留言
│   ├── assets/                # 静态资源
│   ├── App.vue                # 根组件
│   └── main.ts                # 入口文件
├── server/                    # 后端源码
│   ├── index.js               # HTTP 服务器主文件
│   ├── db.js                  # SQLite 数据库配置
│   ├── auth.js                # 用户认证逻辑
│   ├── messages.js            # 留言 CRUD 操作
│   └── comments.js            # 评论 CRUD 操作
├── package.json               # 前端依赖配置
└── RUN.md                     # 运行说明文档
```

## 常见问题

### Q: 无法删除留言或评论？

A: 只能删除自己发布的留言和评论。请确保你已登录且是当前内容的所有者。

### Q: 浏览器无法弹出 alert 窗口？

A: 某些浏览器会阻止网页弹出窗口。请检查浏览器地址栏右侧是否有拦截提示，并允许该网站的弹窗。或者查看浏览器控制台（F12）的错误信息。

### Q: 如何清空所有数据重新开始？

A: 删除 `server/campus_board.db` 文件，然后重启后端服务器即可。

### Q: 登录后刷新页面就退出了？

A: token 保存在 localStorage 中，刷新页面应该保持登录状态。如果退出，请检查浏览器是否禁用了 localStorage。

## 开发说明

### 数据库自动保存

SQLite 数据库每分钟自动保存到 `server/campus_board.db` 文件。

## 注意事项

1. **端口要求**: 后端固定使用端口 **1556**，前端默认使用端口 **5173**
2. **浏览器建议**: 推荐使用 Chrome、Edge 或 Firefox 等现代浏览器
3. **数据持久化**: 数据库文件位于 `server/campus_board.db`，删除此文件将清空所有数据

## 许可证

本项目仅供学习和研究使用。
