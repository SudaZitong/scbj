# 校园留言板

基于 B/S 架构的校园留言板。用户注册登录后可以发布留言、按分类浏览、评论和点赞。

仓库：https://github.com/SudaZitong/scbj

## 技术栈

- 前端：Vue 3 + Vite + TypeScript
- 后端：Node.js 原生 HTTP 模块
- 数据库：SQLite（sql.js）
- 认证：JWT + bcryptjs

开发环境下，浏览器访问前端 `http://localhost:5173`，接口请求走 `/api`，由 Vite 代理到后端 `http://localhost:1556`。

```
浏览器 → Vite(:5173) → /api 代理 → Node API(:1556) → campus_board.db
```

## 功能

- 注册、登录，Token 保存在 localStorage，刷新后保持登录
- 发布、查看、编辑、删除自己的留言
- 分类：综合、学习、生活、活动、其他
- 列表分页，支持按最新、浏览量、点赞数排序
- 评论、点赞、浏览量统计

## 运行

需要 Node.js 20 或以上。

```bash
git clone https://github.com/SudaZitong/scbj.git
cd scbj
npm install
cd server && npm install && cd ..
npm run dev:all
```

浏览器打开 http://localhost:5173

分开启动：

```bash
npm run server    # 后端 http://localhost:1556
npm run dev       # 前端 http://localhost:5173
```

可选：复制 `.env.example` 为 `.env`，设置 `JWT_SECRET` 和 `PORT`。不配置时使用开发默认值。

清空数据：删除 `server/campus_board.db` 后重启后端。

```bash
npm run build     # 打包前端
```

## 项目结构

```
scbj/
├── src/
│   ├── api/                 # 前端请求
│   ├── components/          # 页面组件
│   ├── utils/time.js        # 相对时间格式化
│   ├── App.vue
│   └── main.ts
├── server/
│   ├── index.js             # HTTP 服务与路由
│   ├── db.js                # 数据库初始化与持久化
│   ├── auth.js              # 注册登录、JWT
│   ├── messages.js          # 留言与点赞
│   ├── comments.js          # 评论
│   └── validate.js          # 输入校验
├── vite.config.ts
└── .env.example
```

主要组件：

| 文件 | 说明 |
| --- | --- |
| `AuthModal.vue` | 登录 / 注册弹窗 |
| `MessageList.vue` | 留言列表、分类筛选、排序、分页 |
| `MessageDetail.vue` | 留言详情与评论 |
| `CreateMessage.vue` | 发布留言 |

## 数据库

数据文件为 `server/campus_board.db`。写入后立即保存，进程退出时再保存一次。

| 表 | 说明 |
| --- | --- |
| users | 用户名、密码哈希、邮箱 |
| messages | 标题、正文、分类、浏览量 |
| comments | 评论内容，支持 parent_id |
| likes | 用户与留言的点赞关系，(message_id, user_id) 唯一 |

外键已开启，常用查询字段建有索引。

## 接口

需要登录的接口在请求头中携带：

```
Authorization: Bearer <token>
```

### 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 当前用户信息 |

注册示例：

```json
{ "username": "xiaoming", "password": "123456", "email": "a@b.com" }
```

登录成功返回 `token` 与 `user`。

### 留言

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/messages | 留言列表 |
| POST | /api/messages | 发布留言 |
| GET | /api/messages/:id | 留言详情（浏览量 +1） |
| PUT | /api/messages/:id | 更新自己的留言 |
| DELETE | /api/messages/:id | 删除自己的留言 |
| POST | /api/messages/:id/like | 点赞 / 取消点赞 |

列表查询参数：

| 参数 | 说明 |
| --- | --- |
| page | 页码，默认 1 |
| limit | 每页条数，默认 10，最大 50 |
| category | 分类；省略或 `all` 表示全部 |
| sortBy | `created_at`、`view_count` 或 `like_count` |

`sortBy` 仅接受上述三个值，其它值按时间排序。

发布示例：

```json
{ "title": "标题", "content": "正文", "category": "study" }
```

点赞接口返回 `{ "success": true, "liked": true }` 或 `liked: false`。

### 评论

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/messages/:id/comments | 评论列表 |
| POST | /api/messages/:id/comments | 发表评论 |
| DELETE | /api/comments/:id | 删除自己的评论 |

```json
{ "content": "评论内容" }
```

## 校验规则

| 字段 | 规则 |
| --- | --- |
| 用户名 | 2–20 个字符，限中文、字母、数字、下划线 |
| 密码 | 6–64 位 |
| 标题 | 必填，最长 100 字 |
| 正文 | 必填，最长 5000 字 |
| 评论 | 必填，最长 500 字 |
| 分类 | 不在白名单时记为 `general` |

请求体超过 1MB 会被拒绝。删除、修改操作在服务端校验资源所属用户。

## 许可证

仅供学习与毕业设计使用。
