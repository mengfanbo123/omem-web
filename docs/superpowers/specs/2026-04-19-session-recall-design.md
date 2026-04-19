# Omem 第三次迭代设计文档：Session 维度记忆注入记录

**日期**: 2026-04-19
**版本**: v0.3.0
**状态**: 草案，待审批

---

## 1. 背景与目标

### 1.1 背景

当前 omem plugin 的 `autoRecallHook` 在每个 OpenCode session 开始时自动从记忆库搜索相关记忆，并注入到 system prompt 中作为上下文。这些被注入的记忆对 assistant 的回复质量至关重要，但目前没有任何记录机制来追踪：
- 哪些记忆被注入了？
- 基于什么消息(query)注入的？
- 注入的记忆与最终回复的关联是什么？

### 1.2 目标

1. **服务端**: 记录每次 `autoRecallHook` 触发时注入的记忆，提供 Web 查询接口
2. **前端**: 按 OpenCode session 维度展示注入记录，支持查看详情
3. **体验**: 两个页面（列表页 + 详情页）设计精良，信息展示完整

---

## 2. 数据模型

### 2.1 新建表: `session_recalls`

| 字段 | 类型 |  nullable | 说明 |
|------|------|-----------|------|
| `id` | UUID | false | 主键 |
| `session_id` | string | false | OpenCode session ID (e.g. `ses_xxx`) |
| `session_name` | string | true | session 名称，当前取 query 前 50 字符 |
| `tenant_id` | string | false | 租户 ID，用于权限隔离 |
| `agent_id` | string | true | 来源 agent (e.g. `opencode`) |
| `query` | string | false | 触发 recall 的 query (session 第一条消息) |
| `injected_memories` | JSON | false | `SearchResult[]` 数组，含 memory 完整字段 + score |
| `context_block` | string | true | 注入的完整文本块 (原始 `<omem-context>` 内容) |
| `memory_count` | int | false | 注入的记忆数量 |
| `created_at` | timestamp | false | 创建时间 |

### 2.2 数据结构详情

`injected_memories` JSON 结构：

```json
[
  {
    "memory": {
      "id": "uuid",
      "content": "string",
      "l2_content": "string",
      "category": "string",
      "memory_type": "string",
      "state": "string",
      "tags": ["string"],
      "source": "string",
      "tenant_id": "string",
      "agent_id": "string",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    },
    "score": 0.95
  }
]
```

---

## 3. 服务端 API 设计

### 3.1 新增 API

#### `POST /v1/session-recalls`

Plugin 端调用，保存一次 recall 注入记录。

**请求体:**
```json
{
  "session_id": "ses_xxx",
  "session_name": "omem-web 前端 bug 修复...",
  "query": "这段代码有什么问题？",
  "injected_memories": [...],
  "context_block": "<omem-context>...",
  "agent_id": "opencode"
}
```

**响应:**
```json
{
  "id": "uuid",
  "status": "saved"
}
```

#### `GET /v1/session-recalls`

Web 端查询列表，支持分页和搜索。

**查询参数:**
- `page` (int, default: 1)
- `page_size` (int, default: 20, max: 100)
- `session_id` (string, optional) - 精确匹配
- `query` (string, optional) - 模糊搜索 query 内容

**响应:**
```json
{
  "items": [
    {
      "id": "uuid",
      "session_id": "ses_xxx",
      "session_name": "omem-web 前端 bug 修复...",
      "query": "这段代码有什么问题？",
      "memory_count": 5,
      "created_at": "2026-04-19T14:32:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

#### `GET /v1/session-recalls/:id`

Web 端查询单条详情。

**响应:**
```json
{
  "id": "uuid",
  "session_id": "ses_xxx",
  "session_name": "omem-web 前端 bug 修复...",
  "tenant_id": "...",
  "agent_id": "opencode",
  "query": "这段代码有什么问题？",
  "injected_memories": [...],
  "context_block": "<omem-context>...",
  "memory_count": 5,
  "created_at": "2026-04-19T14:32:00Z"
}
```

### 3.2 权限控制

- 所有 API 通过 `X-API-Key` header 认证
- `tenant_id` 从 API Key 解析
- 列表和详情查询均按 `tenant_id` 过滤

---

## 4. Plugin 改造

### 4.1 改造点

在 `autoRecallHook` 中， Recall 成功后，将 `results` + `query` + `session_id` 发送到新 API `POST /v1/session-recalls`。

**代码位置:** `omem-server-source/plugins/opencode/src/hooks.ts`

**改造逻辑:**

```typescript
// 在 autoRecallHook 中，搜索结果成功后
const results = await client.searchMemories(query, MAX_RECALL_RESULTS, undefined, containerTags);

// 新增: 保存 recall 记录
await client.saveSessionRecall({
  session_id: input.sessionID,
  session_name: truncate(query, 50),
  query,
  injected_memories: results,
  context_block: block,
  agent_id: "opencode",
});
```

### 4.2 Client 新增方法

在 `OmemClient` 中新增 `saveSessionRecall` 方法：

```typescript
async saveSessionRecall(data: {
  session_id: string;
  session_name?: string;
  query: string;
  injected_memories: SearchResult[];
  context_block?: string;
  agent_id?: string;
}): Promise<{ id: string; status: string } | null> {
  return this.post("/v1/session-recalls", data);
}
```

---

## 5. 前端设计

### 5.1 新增路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/sessions` | Session Recall 列表页 | 展示所有 recall 记录 |
| `/sessions/:id` | Session Recall 详情页 | 展示单条 recall 的完整信息 |

### 5.2 侧边栏

新增菜单项：
- 图标: `📦` 或 `GitBranch`
- 标签: "会话注入"
- 路径: `/sessions`

### 5.3 页面A: Session Recall 列表页 (`/sessions`)

**布局:** 卡片式网格布局（类似空间管理页风格）

**每卡片内容:**
- **顶部**: session 名称（`session_name`），若为空则显示 `session_id` 截断
- **中间**: 
  - query 摘要（前 80 字符）
  - 注入记忆数量 badge
  - 相关性分数范围（最低 ~ 最高 score）
- **底部**: 时间 + 标签（agent_id）
- **点击**: 进入详情页

**搜索/筛选:**
- 搜索框: 按 `session_name` 或 `query` 模糊搜索
- 分页: 底部页码

### 5.4 页面B: Session Recall 详情页 (`/sessions/:id`)

**布局:** 左右分栏或上下分区

**头部区域:**
- 返回按钮 ←
- session 名称（大号字体）
- session_id（小号，灰色）
- 时间 + agent badge

**Query 区域:**
- 标题: "触发消息"
- 卡片展示 `query` 完整内容
- 样式: 引用块风格，左侧有竖线装饰

**注入记忆列表区域:**
- 标题: "注入的记忆 (N 条)"
- 每条记忆用卡片展示:
  - **顶部**: category badge + memory_type badge + score badge（颜色按分数梯度）
  - **内容**: `content`（支持 markdown 渲染）
  - **展开后**: 展示完整字段
    - `l2_content`（详细内容）
    - `tags`（标签列表）
    - `source`
    - `created_at`
    - `agent_id`
  - **操作**: "查看原记忆" 链接（跳转 `/memories/:memoryId`）

**Context Block 区域（可折叠）:**
- 标题: "注入的原始上下文"
- 折叠面板，展示 `context_block` 完整文本
- 代码块样式，带复制按钮

---

## 6. 技术实现要点

### 6.1 LanceDB JSON 字段

LanceDB 支持 `FixedSizeList` 和 `List` 类型。`injected_memories` 使用 JSON string 存储，查询时反序列化。

### 6.2 服务端路由

参考现有 `/v1/memories` 路由实现，在 `router.rs` 中新增：

```rust
.route("/v1/session-recalls", get(handlers::list_session_recalls).post(handlers::create_session_recall))
.route("/v1/session-recalls/:id", get(handlers::get_session_recall))
```

### 6.3 前端组件复用

- 复用现有 `Card`, `Badge`, `Skeleton` 等 shadcn/ui 组件
- 复用 `apiClient`（自动注入 X-API-Key）
- 新增 `SessionRecallList` 和 `SessionRecallDetail` 页面组件

---

## 7. 实现顺序

1. **服务端**: 新建表 + 新增 API 路由和 handlers
2. **Plugin**: 改造 `autoRecallHook`，调用新 API
3. **前端**: 
   - 新增路由配置
   - 新增侧边栏菜单项
   - 实现列表页
   - 实现详情页
4. **测试**: 端到端验证

---

## 8. 待确认事项

1. **Session 名称**: 当前 plugin API 无法获取 OpenCode 的 session 标题，方案是用 query 前 50 字符作为默认名称。未来 SDK 支持后可升级。
2. **频率**: `autoRecallHook` 当前每个 session 只触发一次。如果师尊希望每条消息都记录，需要修改 plugin 逻辑。
3. **数据保留策略**: `session_recalls` 表是否需要定期清理？

---

*文档版本: 草案 v0.1*
*等待师尊审批...*
