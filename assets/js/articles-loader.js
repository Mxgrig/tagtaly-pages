// Tagtaly Articles Loader
// Loads and displays articles from the articles.json data file

async function loadArticles() {
    try {
        const response = await fetch('assets/data/articles.json', { cache: 'no-store' });
        const data = await response.json();
        const articles = data.articles || [];

        if (articles.length === 0) {
            const fallback = `
                <div class="empty-state" style="text-align:center; padding:32px 0; color:#6b7280;">
                    <p style="margin-bottom:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase;">No articles yet</p>
                    <p style="margin:0; font-size:0.95rem;">The daily pipeline hasn't published stories yet. Check back after the next run.</p>
                </div>`;
            document.getElementById('articles-section').innerHTML = fallback;
            return;
        }

        // Show all articles - the data structure uses 'headline', 'url', 'source', 'viral_score' fields
        const categoryArticles = articles.slice(0, 20);

        // Calculate metrics
        const totalHeadlines = categoryArticles.length;
        const avgViral = categoryArticles.length > 0
            ? Math.round(categoryArticles.reduce((sum, a) => sum + (a.viral_score || 0), 0) / categoryArticles.length)
            : 0;

        // Get top source
        const sourceCount = new Map();
        categoryArticles.forEach(a => {
            if (a.source) sourceCount.set(a.source, (sourceCount.get(a.source) || 0) + 1);
        });
        const topSource = Array.from(sourceCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

        // Format time
        const now = new Date();
        const updated = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        // Update metrics
        document.getElementById('metric-headlines').textContent = totalHeadlines;
        document.getElementById('metric-viral').textContent = avgViral;
        document.getElementById('metric-source').textContent = topSource.substring(0, 10);
        document.getElementById('metric-updated').textContent = updated;

        // Build articles list
        const articlesList = document.getElementById('articles-list');
        articlesList.innerHTML = ''; // Clear placeholder

        categoryArticles.slice(0, 6).forEach(article => {
            const li = document.createElement('div');
            li.style.cssText = 'padding: 14px 0; border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s; cursor: pointer;';
            
            // Use correct field names: 'headline' (not title), 'url' (not link)
            const articleUrl = article.url || article.link || '#';
            const articleTitle = article.headline || article.title || 'Untitled';
            const articleSource = article.source || 'Unknown';

            li.innerHTML = `
                <a href="${articleUrl}" target="_blank" rel="noreferrer" style="color: #0f172a; font-weight: 600; font-size: 0.95rem; text-decoration: none; line-height: 1.5; display: block; transition: color 0.2s; padding: 4px 0;">
                    ${articleTitle}
                </a>
                <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 6px; font-weight: 500;">
                    ${articleSource}
                </div>
            `;

            // Add hover effect to link
            const link = li.querySelector('a');
            if (link) {
                link.addEventListener('mouseover', () => { link.style.color = '#3b82f6'; });
                link.addEventListener('mouseout', () => { link.style.color = '#0f172a'; });
            }

            // Add hover effect to container
            li.addEventListener('mouseover', function() { this.style.backgroundColor = '#f9fafb'; });
            li.addEventListener('mouseout', function() { this.style.backgroundColor = 'transparent'; });

            articlesList.appendChild(li);
        });

        console.log('✅ Articles loaded:', totalHeadlines, 'headlines');
    } catch (err) {
        console.error('❌ Error loading articles:', err);
        const section = document.getElementById('articles-section');
        if (section) {
            section.innerHTML = '<p style="color: #ef4444; padding: 20px; text-align: center;">Error loading articles. Please refresh the page.</p>';
        }
    }
}

// Load when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadArticles);
} else {
    loadArticles();
}
