# 咩 · Pblog

一个极简的纯静态 Markdown 博客。无框架、无构建、无数据库，原生 HTML / CSS / JavaScript。

## 特性

- 默认深色模式，可切换浅色，偏好自动保存（localStorage）
- 文章为 `posts/` 目录下的 `.md` 文件，通过 `posts/posts.json` 登记，按日期倒序展示
- 内置手写 Markdown 解析器：标题、粗体 / 斜体、行内代码、代码块、列表、引用、链接、表格、分割线
- Prism.js 语法高亮 + 代码块复制按钮
- 响应式布局，移动端汉堡菜单

## 目录结构

```
├── index.html          # 页面骨架
├── css/style.css       # 全局样式（深色 / 浅色主题）
├── js/main.js          # 路由、主题、Markdown 解析
├── js/vendor/          # Prism.js 及语法文件
└── posts/              # 文章仓库（.md 文章 + posts.json 索引）
```

## 本地预览

需通过本地服务器访问（直接双击 HTML 会因浏览器安全策略无法加载 .md 文件）：

```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 发布新文章

1. 在 `posts/` 下创建 `.md` 文件，开头写元信息：

```markdown
# 文章标题
**发布日期:** 2026-05-13
**分类:** 教程

> 一句话摘要
```

2. 在 `posts/posts.json` 中登记：

```json
[{ "title": "文章标题", "date": "2026-05-13", "summary": "一句话摘要", "file": "posts/xxx.md" }]
```

3. 刷新首页即可看到新文章。

## 部署

任意静态托管均可：GitHub Pages、Netlify、Vercel 等，上传全部文件即可。
