# Chat APP 开发文档

## ✅ 已完成的功能

### 1. 基础架构
- ✅ Chat APP 全屏容器（`chat-app-container`）
- ✅ 左侧悬浮Dock栏（7个功能板块）
- ✅ IndexedDB 数据库初始化（`AsherChatDB`）
- ✅ 响应式布局，适配移动端

### 2. 左侧Dock栏（7个板块）
1. **Chat（对话）** - 默认激活，显示对话列表
2. **角色库** - 角色管理（待深度开发）
3. **账号** - 账号信息（待深度开发）
4. **动态** - 动态展示（待深度开发）
5. **表情包库** - 表情管理（待深度开发）
6. **钱包** - 虚拟钱包（待深度开发）
7. **游戏** - 小游戏（待深度开发）

### 3. Chat主页面布局
- ✅ **顶部搜索框** - 实时搜索对话和关键词
- ✅ **P1小组件** - 今日语录卡片（可自定义）
- ✅ **新建对话按钮** - 创建新角色对话
- ✅ **分组标签** - 横向滚动分组切换（全部/最近/收藏）
- ✅ **对话列表** - 323框架，微信风格对话卡片

### 4. 数据库结构（IndexedDB）

#### conversations（对话列表）
```javascript
{
  id: auto,
  name: '角色名称',
  avatar: 'base64图片',
  lastMessage: '最后一条消息',
  groupId: '分组ID',
  characterId: '角色ID',
  updatedAt: '更新时间'
}
```

#### messages（消息记录）
```javascript
{
  id: auto,
  conversationId: '对话ID',
  role: 'user' | 'assistant',
  content: '消息内容',
  createdAt: '创建时间'
}
```

#### characters（角色库）
```javascript
{
  id: auto,
  name: '角色名',
  avatar: 'base64',
  personality: '人设',
  groupId: '分组ID'
}
```

#### groups（分组）
```javascript
{
  id: auto,
  name: '分组名',
  order: 排序
}
```

## 📁 文件结构

```
D:\Asher phone\
├── index.html           （新增Chat APP HTML结构）
├── css\
│   └── chat.css        （Chat APP样式，390行）
└── js\
    ├── app.js          （已修改，添加Chat打开逻辑）
    └── chat.js         （Chat APP控制器，380行）
```

## 🎨 样式特点

- INS极简黑白灰粉风格
- 使用CSS变量支持主题切换
  - `var(--color-bg-primary)` - 背景色
  - `var(--color-accent)` - 强调色
- 微磨砂毛玻璃效果（backdrop-filter）
- 圆角卡片设计
- 平滑过渡动画

## 🔧 核心函数

### 初始化
- `initChatDB()` - 初始化IndexedDB数据库
- `initChatApp()` - 初始化Chat APP事件
- `initChatDock()` - 初始化Dock侧边栏

### 对话管理
- `loadConversations(groupId)` - 加载对话列表
- `renderConversations(conversations)` - 渲染对话卡片
- `createNewConversation()` - 创建新对话
- `openConversation(convId)` - 打开对话详情

### Dock视图切换
- `switchDockView(view)` - 切换Dock视图
- `renderCharacterLibrary()` - 角色库视图
- `renderAccountView()` - 账号视图
- `renderMomentsView()` - 动态视图
- `renderStickersView()` - 表情包视图
- `renderWalletView()` - 钱包视图
- `renderGamesView()` - 游戏视图

### 工具函数
- `handleSearch(e)` - 搜索对话
- `formatTime(timestamp)` - 时间格式化
- `renderEmptyState()` - 空状态提示

## 🚀 打开Chat APP

桌面点击Chat图标：
```javascript
openChatApp()
```

关闭Chat APP：
```javascript
closeChatApp()
```

## ⏭️ 下一步开发

### 优先级1：核心对话功能
1. 对话详情页面（消息列表 + 输入框）
2. 发送消息到API（调用设置中的API配置）
3. 消息渲染（用户消息 + AI回复）
4. 消息历史保存到IndexedDB

### 优先级2：角色系统
1. 角色库页面（角色列表 + 创建/编辑）
2. 角色详情（头像、名称、人设、示例对话）
3. 创建对话时选择角色
4. 角色分组管理

### 优先级3：高级功能
1. 表情包系统
2. 语音输入（调用语音设置）
3. 图片发送
4. 世界书集成
5. 记忆向导

## 📝 注意事项

1. **当前状态**：框架已搭建，IndexedDB已初始化，等待数据填充
2. **空状态**：首次打开会显示"还没有对话"提示
3. **测试建议**：
   - 打开浏览器开发者工具 → Application → IndexedDB
   - 查看 `AsherChatDB` 数据库是否正常创建
   - 手动添加测试数据验证渲染

## 🎯 设计参考

- 对话列表：类似微信对话列表
- 323框架：头像(48px) + 信息区(flex) + 时间
- 分组标签：横向滚动，类似小红书分类
- Dock栏：类似QQ左侧面板，悬浮磨砂质感

## 🔗 与其他模块的集成

- **设置APP** → API配置、语音配置、读取设置
- **美化APP** → 主题色调影响Chat界面颜色
- **世界书APP** → 为对话提供背景知识
- **记忆向导APP** → 长期记忆管理

---

**开发时间**: 2026年1月25日  
**版本**: v1.0  
**状态**: ✅ 基础框架完成，等待深度开发
