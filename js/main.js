(function() {
    const THEME_KEY = 'codelog-theme';
    const articles = [
        { title: '如何发布你的第一篇 Markdown 博客', date: '2026-05-12', summary: '手把手教你用这个静态博客，发布、编辑、预览 Markdown 文章', file: 'posts/guide.md' }
    ];

    function init() {
        initTheme();
        handleRoute();
        initNavigation();
    }

    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'dark');
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

    function renderHome() {
        const list = document.getElementById('articleList');
        if (!list) return;

        if (articles.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">暂无文章</p>';
            return;
        }

        list.innerHTML = articles.map(article => `
            <a href="#/post/${encodeURIComponent(article.file)}" class="article-card">
                <span class="article-date">${article.date}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-summary">${article.summary}</p>
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
            const pageTitle = meta.title ? `${meta.title} - CodeLog` : 'CodeLog';

            document.title = pageTitle;

            main.innerHTML = `
                <div class="post-page">
                    <a href="index.html" class="back-link">← 返回首页</a>
                    <header class="post-header">
                        <h1 class="post-title">${meta.title}</h1>
                        <p class="post-date">${meta.date}</p>
                    </header>
                    <article class="post-content">
                        ${html}
                    </article>
                </div>
            `;

            // 为代码块添加复制按钮功能
            addCopyButtons();
        } catch (error) {
            main.innerHTML = `
                <div class="post-page">
                    <a href="index.html" class="back-link">← 返回首页</a>
                    <h1>文章加载失败</h1>
                    <p style="color: var(--text-secondary); margin-top: 16px;">${error.message}</p>
                    <p style="color: var(--text-secondary); margin-top: 8px;">请确保通过本地服务器访问（http://localhost:xxxx）</p>
                </div>
            `;
        }
    }

    function extractMeta(markdown) {
        const lines = markdown.split('\n');
        const meta = { title: '', date: '', summary: '' };

        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].trim();
            if (line.startsWith('# ')) {
                meta.title = line.substring(2).trim();
            } else if (line.startsWith('**日期:**') || line.startsWith('**发布日期:**')) {
                const match = line.match(/\d{4}-\d{2}-\d{2}/);
                if (match) meta.date = match[0];
            } else if (line.startsWith('> ') && !meta.summary) {
                meta.summary = line.substring(2).trim();
            }
        }

        if (!meta.date) {
            const today = new Date();
            meta.date = today.toISOString().split('T')[0];
        }

        return meta;
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
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
        let html = md;

        const metaLines = [];
        let contentStart = 0;
        const lines = html.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('---') || line.startsWith('# ') || line.startsWith('**日期:') || line.startsWith('**发布日期:')) {
                metaLines.push(i);
                if (i > 0 && lines[i-1].trim() === '') contentStart = i + 1;
            } else if (contentStart > 0 && line !== '') {
                break;
            }
        }

        if (contentStart > 0) {
            html = lines.slice(contentStart).join('\n');
        }

        const codeBlocks = [];
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, lang, code) {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push({
                placeholder: placeholder,
                code: escapeHtml(code)
            });
            return `<pre><button class="copy-btn">复制</button><code>${placeholder}</code></pre>`;
        });

        // 先处理表格
        const tableBlocks = [];
        html = html.replace(/(\|.*\|\n\|[-:| ]*\|\n(?:\|.*\|\n?)*)/g, function(match) {
            const placeholder = `__TABLE_BLOCK_${tableBlocks.length}__`;
            tableBlocks.push({
                placeholder: placeholder,
                table: parseTable(match)
            });
            return placeholder;
        });

        html = html
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/^\- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)\n(<li>)/g, '$1$2')
            .replace(/(<li>[\s\S]*?)(?=\n(?!<li>)|$)/g, '<ul>$1</ul>')
            .replace(/<\/ul>\n<ul>/g, '')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            .replace(/^---$/gm, '<hr>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/^\s*\n/gm, '')
            .replace(/\n{3,}/g, '\n\n');

        // 替换回表格
        tableBlocks.forEach(item => {
            html = html.replace(item.placeholder, item.table);
        });

        codeBlocks.forEach(item => {
            html = html.replace(item.placeholder, item.code);
        });

        const paragraphs = html.split('\n\n');
        html = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') ||
                p.startsWith('<pre') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');

        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-3]>)/g, '$1');
        html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

        return html;
    }

    window.addEventListener('hashchange', handleRoute);
    document.addEventListener('DOMContentLoaded', init);
})();
