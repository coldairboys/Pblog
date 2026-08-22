(function() {
    const THEME_KEY = 'pblog-theme';
    const LEGACY_THEME_KEY = 'codelog-theme'; // 旧版残留 key，用于迁移用户偏好
    const POSTS_INDEX = 'posts/posts.json';
    const BASE_TITLE = document.title;

    let homeMarkup = ''; // 首页结构快照，用于从文章页返回时还原视图

    function init() {
        const main = document.querySelector('.main');
        if (main) homeMarkup = main.innerHTML;

        initTheme();
        handleRoute();
        initNavigation();
        console.log('咩~ Pblog 已就绪，愿代码与你同在。');
    }

    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        // 未手动选择过主题时：系统偏好浅色则用浅色，否则默认深色
        const theme = savedTheme || (prefersLight ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', theme);

        document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
    }

    function initNavigation() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function() {
                navMenu.classList.toggle('active');
            });

            document.addEventListener('click', function(event) {
                if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                    navMenu.classList.remove('active');
                }
            });
        }
    }

    function handleRoute() {
        const path = window.location.pathname;
        const hash = window.location.hash;

        if (path.endsWith('.md') || hash.startsWith('#/post/')) {
            const file = path.endsWith('.md') ? path : decodeURIComponent(hash.split('/post/')[1]);
            renderPost(file);
        } else {
            renderHome();
        }
    }

    async function renderHome() {
        const main = document.querySelector('.main');
        if (!main) return;

        // 从文章页返回时，先还原首页结构
        if (!document.getElementById('articleList') && homeMarkup) {
            main.innerHTML = homeMarkup;
        }

        const list = document.getElementById('articleList');
        if (!list) return;

        document.title = BASE_TITLE;

        let articles;
        try {
            const response = await fetch(POSTS_INDEX);
            if (!response.ok) throw new Error('文章索引加载失败');
            articles = await response.json();
        } catch (error) {
            list.innerHTML = `<div class="loading">${escapeHtml(error.message)}。请确认 posts/posts.json 存在，并通过本地服务器访问（http://localhost:xxxx）</div>`;
            return;
        }

        if (!Array.isArray(articles) || articles.length === 0) {
            list.innerHTML = '<div class="loading">暂无文章</div>';
            return;
        }

        // 按发布日期倒序排列
        articles.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

        list.innerHTML = articles.map(article => `
            <a href="#/post/${encodeURIComponent(article.file)}" class="article-card">
                <span class="article-date">${escapeHtml(article.date || '')}</span>
                <h3 class="article-title">${escapeHtml(article.title || '')}</h3>
                <p class="article-summary">${escapeHtml(article.summary || '')}</p>
                <span class="read-more">阅读全文 →</span>
            </a>
        `).join('');
    }

    async function renderPost(file) {
        const main = document.querySelector('.main');
        if (!main) return;

        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error('文章加载失败');

            const markdown = await response.text();
            const html = parseMarkdown(markdown);
            const meta = extractMeta(markdown);

            document.title = meta.title ? `${meta.title} - 咩` : BASE_TITLE;

            main.innerHTML = `
                <div class="post-page">
                    <a href="index.html" class="back-link">← 返回首页</a>
                    <header class="post-header">
                        <h1 class="post-title">${escapeHtml(meta.title || '无标题')}</h1>
                        <div class="post-meta">
                            <span class="post-date">${escapeHtml(meta.date)}</span>
                            ${meta.category ? `<span class="post-tag">${escapeHtml(meta.category)}</span>` : ''}
                        </div>
                    </header>
                    <article class="post-content">
                        ${html}
                    </article>
                </div>
            `;

            // 为代码块添加复制按钮功能
            addCopyButtons();

            // 使用 Prism.js 进行语法高亮
            if (window.Prism) {
                Prism.highlightAll();
            }
        } catch (error) {
            document.title = BASE_TITLE;
            main.innerHTML = `
                <div class="post-page">
                    <a href="index.html" class="back-link">← 返回首页</a>
                    <h1>文章加载失败</h1>
                    <p style="color: var(--text-secondary); margin-top: 16px;">${escapeHtml(error.message)}</p>
                    <p style="color: var(--text-secondary); margin-top: 8px;">请确保通过本地服务器访问（http://localhost:xxxx），且 posts/posts.json 中登记的路径正确</p>
                </div>
            `;
        }
    }

    // 剥离文章开头的元信息块（标题 / 日期 / 分类 / 摘要 / 分割线 / 空行）
    function stripMeta(markdown) {
        const lines = markdown.split('\n');
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();
            if (line === '' || line === '---' ||
                line.startsWith('# ') ||
                line.startsWith('**日期:**') || line.startsWith('**发布日期:**') ||
                line.startsWith('**分类:**') ||
                line.startsWith('> ')) {
                i++;
            } else {
                break;
            }
        }

        return lines.slice(i).join('\n');
    }

    function extractMeta(markdown) {
        const lines = markdown.split('\n');
        const meta = { title: '', date: '', summary: '', category: '' };

        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].trim();
            if (!meta.title && line.startsWith('# ')) {
                meta.title = line.substring(2).trim();
            } else if (line.startsWith('**日期:**') || line.startsWith('**发布日期:**')) {
                const match = line.match(/\d{4}-\d{2}-\d{2}/);
                if (match) meta.date = match[0];
            } else if (line.startsWith('**分类:**')) {
                meta.category = line.replace('**分类:**', '').trim();
            } else if (line.startsWith('> ') && !meta.summary) {
                meta.summary = line.substring(2).trim();
            }
        }

        if (!meta.date) {
            meta.date = new Date().toISOString().split('T')[0];
        }

        return meta;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 正文转义：保留 > 以支持引用语法
    function escapeText(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function addCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const pre = this.parentElement;
                const code = pre.querySelector('code');
                const text = code.textContent;

                navigator.clipboard.writeText(text).then(() => {
                    const originalText = this.textContent;
                    this.textContent = '已复制!';
                    this.classList.add('copied');

                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                });
            });
        });
    }

    function parseTable(tableText) {
        const lines = tableText.trim().split('\n').filter(line => line.trim());
        if (lines.length < 2) return tableText;

        let html = '<table>';

        // 表头
        const headerRow = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell !== '');
        html += '<thead><tr>';
        headerRow.forEach(cell => {
            html += `<th>${cell}</th>`;
        });
        html += '</tr></thead>';

        // 数据行
        html += '<tbody>';
        for (let i = 2; i < lines.length; i++) {
            const row = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody>';

        html += '</table>';
        return html;
    }

    function parseMarkdown(md) {
        let html = stripMeta(md);

        // 1. 提取围栏代码块（保留原文，还原时统一转义）
        const codeBlocks = [];
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, lang, code) {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push({ placeholder, lang, code });
            return placeholder;
        });

        // 2. 转义正文中的 HTML，防止注入（保留 > 以支持引用语法）
        html = escapeText(html);

        // 3. 提取表格（单元格内容已随正文转义）
        const tableBlocks = [];
        html = html.replace(/(\|.*\|\n\|[-:| ]*\|\n(?:\|.*\|\n?)*)/g, function(match) {
            const placeholder = `__TABLE_BLOCK_${tableBlocks.length}__`;
            tableBlocks.push({ placeholder, table: parseTable(match) });
            return placeholder;
        });

        // 4. 提取行内代码（避免其内容被其他语法误处理）
        const inlineCodes = [];
        html = html.replace(/`([^`]+)`/g, function(match, code) {
            const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
            inlineCodes.push({ placeholder, html: `<code>${code}</code>` });
            return placeholder;
        });

        // 5. 行级语法转换
        html = html
            .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
            .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
            .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
            // 无序 / 有序列表
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<oli>$2</oli>')
            .replace(/(<li>.*<\/li>)\n(?=<li>)/g, '$1')
            .replace(/(<oli>.*<\/oli>)\n(?=<oli>)/g, '$1')
            .replace(/(<li>[\s\S]*?)(?=\n(?!<li>)|$)/g, '<ul>$1</ul>')
            .replace(/(<oli>[\s\S]*?)(?=\n(?!<oli>)|$)/g, '<ol>$1</ol>')
            .replace(/<\/ul>\n<ul>/g, '')
            .replace(/<\/ol>\n<ol>/g, '')
            .replace(/<oli>/g, '<li>')
            .replace(/<\/oli>/g, '</li>')
            .replace(/^---$/gm, '<hr>')
            // 链接：拦截 javascript: / data: 等危险协议
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, text, url) {
                const href = url.trim();
                const blocked = /^(javascript|data|vbscript):/i.test(href);
                return `<a href="${blocked ? '#' : href}">${text}</a>`;
            })
            .replace(/\n{3,}/g, '\n\n');

        // 6. 还原表格 / 行内代码 / 代码块（用函数形式避免 $ 序列干扰）
        tableBlocks.forEach(item => {
            html = html.replace(item.placeholder, () => item.table);
        });
        inlineCodes.forEach(item => {
            html = html.replace(item.placeholder, () => item.html);
        });
        codeBlocks.forEach(item => {
            const cls = item.lang ? ` class="language-${item.lang}"` : '';
            const markup = `<pre class="line-numbers"><button class="copy-btn">复制</button><code${cls}>${escapeHtml(item.code)}</code></pre>`;
            html = html.replace(item.placeholder, () => markup);
        });

        // 7. 段落包裹（块级元素跳过）
        const paragraphs = html.split('\n\n');
        html = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            if (/^<(h[1-6]|ul|ol|pre|blockquote|hr|table)/.test(p)) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');

        // 8. 清理误包裹在 <p> 内的块级元素
        html = html
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<\/?(?:h[1-6]|ul|ol|pre|blockquote|hr|table)[^>]*>)/g, '$1')
            .replace(/(<\/(?:h[1-6]|ul|ol|pre|blockquote|hr|table)[^>]*>)<\/p>/g, '$1');

        return html;
    }

    window.addEventListener('hashchange', handleRoute);
    document.addEventListener('DOMContentLoaded', init);
})();
