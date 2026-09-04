# 校园留言板

本科毕业设计项目：基于 B/S 架构的校园留言板，支持注册登录、发帖、分类、评论和点赞。

仓库地址：https://github.com/SudaZitong/scbj

## 技术栈

- 前端：Vue 3 + Vite + TypeScript
- 后端：Node.js 原生 HTTP + SQLite（sql.js）
- 认证：JWT（7 天有效期）

```
浏览器  →  Vite 开发服务器(:5173)
                │  /api 代理
                ▼
           Node API(:1556)  →  SQLite 文件 campus_board.db
```

## 功能

- 用户注册 / 登录，刷新后保持登录状态
- 发布、查看、删除自己的留言（综合 / 学习 / 生活 / 活动 / 其他）
- 按分类筛选，按最新 / 最热 / 点赞排序
- 评论、点赞、浏览量统计

## 运行

需要 Node.js 20+。

```bash
cd scbj
npm install
cd server && npm install && cd ..
npm run dev:all
```

浏览器打开 http://localhost:5173

- 前端：http://localhost:5173
- 后端：http://localhost:1556

清空数据：删除 `server/campus_board.db` 后重启后端。

可选：复制 `.env.example` 为 `.env`，修改 `JWT_SECRET`。

## 接口摘要

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 当前用户 |
| GET | /api/messages | 留言列表 |
| POST | /api/messages | 发布留言 |
| GET | /api/messages/:id | 留言详情 |
| PUT | /api/messages/:id | 编辑留言 |
| DELETE | /api/messages/:id | 删除留言 |
| POST | /api/messages/:id/like | 点赞 / 取消 |
| GET | /api/messages/:id/comments | 评论列表 |
| POST | /api/messages/:id/comments | 发表评论 |
| DELETE | /api/comments/:id | 删除评论 |

## 说明

仅供学习与毕业设计使用。
