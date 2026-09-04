# 校园留言板（scbj）

一个给校园场景用的留言板系统。学生注册登录之后，可以发帖、按分类浏览、评论和点赞。适合作为本科毕业设计的 B/S 小系统：功能完整、结构清楚、本地就能跑。

公开仓库：https://github.com/SudaZitong/scbj

---

## 1. 项目简介

校园里通知、闲聊、找资料经常散落在群聊里，事后很难翻。本项目做一个轻量 Web 留言板：

- 前台是网页，浏览器打开就能用
- 后台提供 REST 风格接口
- 数据存在本地 SQLite 文件里，不依赖额外数据库软件

题目可以概括成：**基于 Vue 3 与 Node.js 的校园留言板系统设计与实现**。

---

## 2. 技术选型

| 层次 | 方案 | 原因 |
| --- | --- | --- |
| 前端 | Vue 3 + Vite | 组件化开发，热更新快 |
| 样式 | 原生 CSS | 不引入 UI 库，体积小、好讲 |
| 后端 | Node.js 原生 `http` | 不套 Express，请求处理流程直观 |
| 数据库 | SQLite（sql.js） | 单文件、免安装，答辩演示方便 |
| 认证 | JWT + bcryptjs | 密码哈希存储，登录态用 Token |

开发时前端跑在 `5173`，通过 Vite 代理把 `/api` 转到后端 `1556`，浏览器只访问一个源，少很多跨域麻烦。

```
用户浏览器
    │
    ▼
Vite 前端  :5173
    │  proxy /api
    ▼
Node API   :1556
    │
    ▼
campus_board.db  （SQLite）
```

---

## 3. 功能说明

### 用户

- 注册：用户名 2–20 位，密码至少 6 位
- 登录：校验通过后发放 JWT，有效期 7 天
- Token 存在 `localStorage`，刷新页面保持登录
- 登录失败统一提示「用户名或密码错误」，不暴露账号是否存在

### 留言

- 发布标题、正文，选择分类（综合 / 学习 / 生活 / 活动 / 其他）
- 列表分页，支持按分类筛选
- 排序：最新、最热（浏览量）、点赞
- 详情页增加浏览次数
- 只能删除自己发的帖

### 互动

- 点赞 / 取消点赞
- 发表评论、删除自己的评论
- 列表和详情都会显示点赞数、评论数、浏览量
- 已登录用户在列表里能看到自己是否已点赞

---

## 4. 目录结构

```
scbj/
├── src/                       前端
│   ├── api/                   请求封装
│   │   ├── request.js         fetch + Token
│   │   ├── auth.js            登录注册
│   │   └── index.js           留言 / 评论
│   ├── components/
│   │   ├── AuthModal.vue      登录注册弹窗
│   │   ├── MessageList.vue    列表 + 排序 + 分页
│   │   ├── MessageDetail.vue  详情 + 评论
│   │   └── CreateMessage.vue  发布
│   ├── utils/time.js          相对时间
│   ├── App.vue
│   └── main.ts
├── server/                    后端
│   ├── index.js               HTTP 路由
│   ├── db.js                  SQLite 初始化 / 保存
│   ├── auth.js                注册登录、JWT
│   ├── messages.js            留言 CRUD、点赞
│   ├── comments.js            评论
│   └── validate.js            输入校验、排序白名单
├── vite.config.ts             开发代理
├── .env.example               JWT 与端口示例
└── README.md
```

---

## 5. 数据库

四张表：`users`、`messages`、`comments`、`likes`。外键开启，查询字段建了索引。

| 表 | 作用 |
| --- | --- |
| users | 用户名、密码哈希、邮箱 |
| messages | 标题、正文、分类、浏览量 |
| comments | 评论内容，可挂 parent_id |
| likes | 用户对留言的点赞，联合唯一 |

数据文件：`server/campus_board.db`。写操作后立刻落盘，进程退出前也会再存一次。删掉这个文件再启动，等于空库重来。

---

## 6. 接口

除特别说明外，需要登录的接口在请求头带：

```
Authorization: Bearer <token>
```

### 认证

**POST `/api/auth/register`**

```json
{ "username": "xiaoming", "password": "123456", "email": "a@b.com" }
```

**POST `/api/auth/login`**

```json
{ "username": "xiaoming", "password": "123456" }
```

成功返回 `token` 和 `user`。

**GET `/api/auth/me`** 当前用户。

### 留言

**GET `/api/messages`**

查询参数：

| 参数 | 说明 |
| --- | --- |
| page | 页码，默认 1 |
| limit | 每页条数，默认 10，最大 50 |
| category | 分类，省略或 `all` 表示全部 |
| sortBy | `created_at` / `view_count` / `like_count` |

非法 `sortBy` 会回落到按时间排序，不会拼进 SQL。

**POST `/api/messages`** 发帖（需登录）

```json
{ "title": "标题", "content": "正文", "category": "study" }
```

**GET `/api/messages/:id`** 详情，浏览量 +1  
**PUT `/api/messages/:id`** 编辑自己的帖  
**DELETE `/api/messages/:id`** 删除自己的帖  
**POST `/api/messages/:id/like`** 点赞切换，返回 `{ liked: true/false }`

### 评论

**GET `/api/messages/:id/comments`**  
**POST `/api/messages/:id/comments`** `{ "content": "评论" }`，最长 500 字  
**DELETE `/api/comments/:id`**

---

## 7. 校验规则

| 字段 | 规则 |
| --- | --- |
| 用户名 | 2–20 字，中文 / 字母 / 数字 / 下划线 |
| 密码 | 6–64 位 |
| 标题 | 非空，最长 100 字 |
| 正文 | 非空，最长 5000 字 |
| 评论 | 非空，最长 500 字 |
| 分类 | 不在白名单则记为 `general` |

请求体超过 1MB 会直接拒绝。

---

## 8. 运行方法

环境：Node.js 20 或以上。

```bash
git clone https://github.com/SudaZitong/scbj.git
cd scbj
npm install
cd server && npm install && cd ..
npm run dev:all
```

然后打开 http://localhost:5173

也可以分开启动：

```bash
npm run server    # 后端 :1556
npm run dev       # 前端 :5173
```

可选配置：复制 `.env.example` 为 `.env`，修改 `JWT_SECRET` 和 `PORT`。不配也能跑，开发环境有默认值。

打包前端：

```bash
npm run build
```

---

## 9. 实现上的几点说明

1. **没上 Express。** 路由写在 `server/index.js`，答辩时可以把「一次请求怎么进来、怎么鉴权、怎么回 JSON」顺着讲完。
2. **排序不允许前端随便传列名。** 只认三个字段，防止拼接注入。
3. **sql.js 是内存库再导出文件。** 所以每次写入后调用 `db.save()`，避免只靠定时保存导致关机丢数据。
4. **前端不写死后端地址。** 开发走 `/api` 代理，换机器不用改请求代码。
5. **权限。** 删帖、删评、改帖都在服务端比对 `user_id`，不能只靠页面隐藏按钮。

---

## 10. 后续可以做的（论文展望）

- 管理员角色、违规内容处理
- 搜索、@提醒、图片上传
- 换成 better-sqlite3 或 MySQL
- 部署到一台校园网服务器，前后端同域

当前版本已经覆盖注册登录、发帖互动、分类排序和基本安全校验，足够把系统实现章节写完。

仅供学习与毕业设计使用。
