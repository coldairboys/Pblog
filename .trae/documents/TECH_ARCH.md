# 程序员简约个人博客 - 技术架构文档

## 1. 架构设计

### 1.1 整体架构
```
┌─────────────────────────────────┐
│         index.html              │
│  ┌───────────────────────────┐  │
│  │     HTML Structure        │  │
│  │  - Navigation Bar         │  │
│  │  - Main Content Area      │  │
│  │  - Footer (optional)      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     CSS Styles            │  │
│  │  - CSS Variables          │  │
│  │  - Responsive Layout      │  │
│  │  - Component Styles       │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     JavaScript            │  │
│  │  - Router Logic           │  │
│  │  - DOM Manipulation       │  │
│  │  - Event Handlers         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     Data Layer            │  │
│  │  - Articles Array         │  │
│  │  - Article Content        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 1.2 技术选型
- **前端**：原生 HTML5 + CSS3 + JavaScript ES6
- **无框架**：纯原生实现，无任何外部依赖
- **单文件**：所有代码集成在 index.html

## 2. HTML 结构设计

### 2.1 文档结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>博客标题</title>
    <style>/* 所有CSS */</style>
</head>
<body>
    <nav><!-- 导航栏 --></nav>
    <main id="app"><!-- 动态内容区 --></main>
    <script>/* 所有JS */</script>
</body>
</html>
```

### 2.2 视图模板
- **首页视图**：`#home-template`
- **文章列表视图**：`#articles-template`
- **文章详情视图**：`#article-template`
- **关于我视图**：`#about-template`

## 3. CSS 设计

### 3.1 CSS 变量定义
```css
:root {
    --color-primary: #000000;
    --color-bg: #ffffff;
    --color-gray-dark: #333333;
    --color-gray: #666666;
    --color-gray-light: #999999;
    --color-code-bg: #1e1e1e;
    --color-code-text: #00ff00;
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --spacing-unit: 1rem;
}
```

### 3.2 响应式断点
- 移动端：< 768px
- 桌面端：>= 768px

### 3.3 组件样式
- **导航栏**：固定顶部，高度 60px
- **汉堡菜单**：仅移动端显示
- **文章卡片**：白色背景，hover 时轻微阴影
- **代码块**：深色背景，绿色文字，等宽字体

## 4. JavaScript 设计

### 4.1 路由系统
```javascript
const routes = {
    '/': renderHome,
    '/articles': renderArticles,
    '/article/:id': renderArticle,
    '/about': renderAbout
};
```

### 4.2 数据结构
```javascript
const articles = [
    {
        id: 1,
        title: '文章标题',
        date: '2026-05-12',
        summary: '摘要内容',
        content: '完整文章内容...'
    }
];
```

### 4.3 核心函数
- `init()`：初始化应用，绑定事件
- `router()`：路由处理函数
- `renderHome()`：渲染首页
- `renderArticles()`：渲染文章列表
- `renderArticle(id)`：渲染文章详情
- `renderAbout()`：渲染关于页面
- `toggleMobileMenu()`：切换移动端菜单

## 5. 文件结构

```
/workspace/
├── index.html          # 单文件博客（包含所有代码）
└── README.md           # 项目说明
```

## 6. 浏览器兼容

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- 移动端浏览器（iOS Safari、Android Chrome）
