# GAKUZAI Demo

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh-CN.md)

GAKUZAI Demo 是一个面向课堂场景的自托管教学材料编辑与学习过程分析原型。它的使用方式是：教师电脑在教室内作为本地服务器启动，学生通过同一 Wi-Fi / LAN，使用手机、平板或电脑浏览器访问系统。

这个项目的核心不是简单做一个页面，而是解决一个很实际的课堂问题：当很多学生同时编辑电子教材时，系统既要采集有价值的学习操作日志，又不能把每一次点击都变成一次独立的数据库写入。

![GAKUZAI system overview](docs/readme-system-overview.svg)

## 项目截图

| iPad / 平板视图 | 手机视图 | 手机视图 |
|---|---|---|
| ![iPad screenshot](assets/images/smartphone/ipad.png) | ![Smartphone screenshot 1](assets/images/smartphone/微信截图_20260731214700.png) | ![Smartphone screenshot 2](assets/images/smartphone/微信截图_20260731214737.png) |

| 学生课程页面 | 学生教材编辑页面 |
|---|---|
| ![Student course page](docs/screenshots/student-courses.png) | ![Student textbook editor](docs/screenshots/student-editor.png) |

## 面试讲解重点

这个仓库很适合作为面试重点项目，因为它是一个规模不大但链路完整的全栈系统：

- 前端支持学生对教材进行高亮、关键词隐藏、弹窗笔记、撤销/重做和保存。
- 后端通过 Express API 实现认证、课程管理、教材管理、课题、分析和 CSV 导出。
- 数据库使用本地 SQLite，便于在教师电脑上部署，不依赖云服务器。
- 学生操作日志先进入浏览器侧队列，再批量发送，降低同一时间大量请求带来的压力。
- 后端通过批量 API 接收操作日志，并在 SQLite 事务中一次性写入。
- SQLite 配置了 WAL 模式和 busy timeout，用来降低课堂规模并发读写时的锁冲突。
- `stress-test.js` 可以模拟 40 名学生并发发送操作日志，用于说明优化效果。

## 主要功能

### 学生端

- 学生注册与登录
- 通过课程邀请码加入课程
- 查看教师发布的教材
- 根据自己的理解加工教材内容
- 使用课堂友好的编辑工具：
  - 高亮标记
  - 文字颜色
  - 加粗和下划线
  - 关键词隐藏 / 替换
  - 弹窗笔记
  - 清除样式
  - 撤销与重做
- 保存加工后的教材
- 提交课题答案
- 支持手机、平板、电脑浏览器访问

### 教师端

- 教师注册与登录
- 创建和管理课程
- 发布或下架教材
- 基于课程教材创建课题
- 查看学生参与情况和保存情况
- 按课程、教材、学生、段落、操作类型分析学习过程
- 导出操作日志 CSV，用于后续研究或统计

### 系统端

- Node.js + Express 本地服务器
- 项目目录内生成 SQLite 数据库
- JWT API 认证
- bcryptjs 密码哈希
- helmet 与 express-rate-limit API 保护
- 浏览器侧操作队列，并使用 localStorage 持久化
- 批量操作日志 API 与事务写入
- SQLite busy timeout 与 WAL 模式

## 高并发下的 Queue 队列设计

这个项目最值得讲的设计点，是没有让学生每一次操作都立刻请求后端。

```text
学生操作
  -> 浏览器侧队列
  -> 批量请求
  -> Express API
  -> SQLite 事务
  -> operation_events 表
```

### 为什么要做 Queue

课堂里学生的操作会非常碎片化：标记一个词、隐藏一个关键词、添加笔记、反复修改同一个段落、保存自己的教材版本。这些行为单看都很小，但如果几十名学生同时操作，瞬间请求数会变多。

例如 40 名学生每人进行 20 次编辑操作，如果每次操作都直接发送请求，就可能产生约 800 个小请求和 800 次数据库写入。对于运行在教师电脑上的本地 SQLite 服务来说，这会带来不必要的 HTTP 开销，也会增加数据库写锁竞争。

所以项目采用了浏览器侧操作队列：先把操作日志收集起来，再按时间或数量批量发送。

### 前端队列实现

队列配置在 `assets/scripts/app.js` 中：

```js
const OPERATION_QUEUE_BATCH_SIZE = 20;
const OPERATION_QUEUE_FLUSH_DELAY_MS = 2500;
const OPERATION_QUEUE_MAX_RETRY_DELAY_MS = 30000;
const OPERATION_QUEUE_MAX_ITEMS = 1000;
```

实现要点：

- 每条操作日志都有 `clientEventId`，避免重复加入队列。
- 操作先进入 `state.operationQueue`，而不是立即请求后端。
- 队列会保存到 `localStorage`，临时断网或刷新页面时，不会马上丢失未发送日志。
- 系统会等待一小段时间再发送，把连续操作合并成更少的批量请求。
- `operationQueueInFlight` 保证同一个浏览器不会同时发送多个批次。
- 发送失败后不删除队列内容，而是使用指数退避重试，最长延迟 30 秒。
- 页面隐藏、跳转、关闭前，会尝试使用较小批次的 `keepalive` 发送。

核心代码位置：

| 内容 | 文件 |
|---|---|
| 队列参数 | `assets/scripts/app.js` |
| 操作入队 | `assets/scripts/app.js` |
| 批量发送和失败重试 | `assets/scripts/app.js` |
| 页面隐藏 / 关闭前补发 | `assets/scripts/app.js` |

### 后端批量写入

后端通过这个接口接收批量操作日志：

```text
POST /api/analytics/operation-events/batch
```

这个接口一次最多接收 50 条事件，并在 SQLite 事务中写入：

```js
const writeBatch = db.transaction(() => events.map(event => (
  insertOperationEventForUser(req.user, event, materialCache)
)));
```

也就是说，系统把很多分散的小写入，压缩成更少的事务写入，从而降低数据库锁竞争。

### SQLite 并发优化

这个 demo 的定位是教室内本地运行，而不是大型公网生产系统。因此它选择 SQLite 来降低部署复杂度，同时通过以下配置提升课堂规模并发读写的稳定性：

```js
db = new Database(dbPath, { timeout: 15000 });
db.pragma('busy_timeout = 15000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```

面试时可以这样讲：

- `busy_timeout` 让 SQLite 在遇到短暂锁冲突时先等待，而不是立即失败。
- WAL 模式相比默认 rollback journal，更适合读写同时发生的场景。
- 批量写入减少事务次数，也就减少进入写锁的次数。
- `clientEventId` 与重复防护让失败重试更安全，避免同一条操作日志被重复记录。

![Concurrency design](docs/concurrency-explanation-ja.svg)

## 压力测试

仓库包含 `stress-test.js`，它会创建临时教师、课程、教材和 40 名测试学生，然后让每名学生向批量 API 发送 20 条操作事件。

```bash
node stress-test.js
```

脚本会输出：

- 批量请求数量
- 被 API 接收的操作事件数量
- 实际插入的操作事件数量
- 数据库中保存的事件数量
- 保存到数据库的学生数量
- 执行时间

你可以在面试中把它概括为：

```text
40 名学生 x 20 次操作 = 800 条操作事件
800 次单独写入 -> 压缩为约 40 个批量请求
```

这能很清楚地说明：queue 的作用不是“看起来高级”，而是为了削峰、减少 HTTP 请求、降低 SQLite 写锁竞争，并提升本地课堂环境下的稳定性。

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | HTML, CSS, 原生 JavaScript |
| 后端 | Node.js, Express |
| 数据库 | SQLite with better-sqlite3 |
| 认证 | JWT, bcryptjs |
| API 保护 | helmet, express-rate-limit |
| 数据导出 | CSV export endpoint |
| 部署方式 | 教室内自托管本地服务器 |

## 项目结构

```text
Gakuzai_demo/
├─ index.html
├─ app.html
├─ assets/
│  ├─ images/
│  │  ├─ smartphone/
│  │  └─ digital-logic/
│  ├─ scripts/
│  │  ├─ app.js
│  │  ├─ auth-page.js
│  │  └─ sample-lessons.js
│  └─ styles/
├─ server/
│  ├─ app.js
│  ├─ db.js
│  ├─ schema.sql
│  └─ routes/
├─ scripts/
├─ docs/
└─ stress-test.js
```

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
```

默认访问地址：

```text
http://localhost:3000/
```

如果是在教室局域网测试，学生设备可以访问教师电脑的局域网 IP：

```text
http://<YOUR_LOCAL_IP>:3000/
```

示例：

```text
http://192.168.xx.xx:3000/
```

## 常用命令

```bash
npm start
node stress-test.js
node scripts/import-digital-logic-material.js
node --check assets/scripts/app.js
node --check server/app.js
```

PowerShell 修改端口示例：

```powershell
$env:PORT="3988"
npm start
```

## 环境变量

请参考 `.env.example`。

| 变量 | 默认值 | 说明 |
|---|---:|---|
| `PORT` | `3000` | 服务端口 |
| `GAKUZAI_DATA_DIR` | `server/data` | 数据库目录 |
| `GAKUZAI_DB_PATH` | `server/data/gakuzai.sqlite` | 显式指定数据库路径 |
| `JSON_BODY_LIMIT` | `25mb` | JSON 请求体大小限制 |
| `API_RATE_LIMIT` | `2000` | 15 分钟窗口内 API 限流值 |

## 数据库说明

主数据库会在运行时生成：

```text
server/data/gakuzai.sqlite
```

启用 WAL 模式后，也可能出现：

```text
server/data/gakuzai.sqlite-wal
server/data/gakuzai.sqlite-shm
```

这些是正常运行时文件，不应该提交到 Git。

## 局限与后续优化

这个 demo 适合教室内小规模实验。如果要作为大型公网生产系统，需要继续加强：

- 从 SQLite 迁移到 PostgreSQL / MySQL
- 配置 HTTPS 和域名
- 增加进程管理与监控
- 增加自动备份
- 强化角色和权限管理
- 集中化日志与运行指标

## License

当前仓库没有包含 license 文件。如果要在 demo 场景之外分发或复用，请先补充 `LICENSE` 文件。
