// Tagtaly Website JavaScript

// Mobile menu toggle (for future implementation)
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Update statistics from articles.json
async function updateStatistics() {
    try {
        const response = await fetch('assets/data/articles.json', { cache: 'no-store' });
        const data = await response.json();
        const articles = data.articles || [];

        if (articles.length === 0) return;

        // Calculate metrics
        const total_articles = articles.length;
        const positive_count = articles.filter(a => a.sentiment === 'positive').length;
        const neutral_count = articles.filter(a => a.sentiment === 'neutral').length;
        const negative_count = articles.filter(a => a.sentiment === 'negative').length;

        const positive_pct = total_articles > 0 ? Math.round((positive_count / total_articles) * 100) : 0;
        const neutral_pct = total_articles > 0 ? Math.round((neutral_count / total_articles) * 100) : 0;
        const negative_pct = total_articles > 0 ? Math.round((negative_count / total_articles) * 100) : 0;

        // Topic distribution
        const topics = {};
        articles.forEach(a => {
            const topic = a.topic || 'Other';
            topics[topic] = (topics[topic] || 0) + 1;
        });
        const top_topic = Object.keys(topics).reduce((a, b) => topics[a] > topics[b] ? a : b);
        const top_topic_share = topics[top_topic] ? Math.round((topics[top_topic] / total_articles) * 100 * 10) / 10 : 0;

        // Country distribution
        const uk_articles = articles.filter(a => a.country === 'UK').length;
        const us_articles = articles.filter(a => a.country === 'US').length;

        // Unique sources
        const sources = new Set(articles.map(a => a.source).filter(Boolean));
        const total_sources = sources.size;

        // Update all data-stat elements
        const updates = {
            'total-articles': total_articles,
            'positive-pct': positive_pct + '%',
            'neutral-pct': neutral_pct + '%',
            'negative-pct': negative_pct + '%',
            'top-topic-name': top_topic,
            'top-topic-share': top_topic_share + '%',
            'total-sources': total_sources,
            'uk-articles': uk_articles,
            'us-articles': us_articles,
            'updated-time': new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        };

        // Apply updates to DOM
        Object.entries(updates).forEach(([key, value]) => {
            const elements = document.querySelectorAll(`[data-stat="${key}"]`);
            elements.forEach(el => {
                el.textContent = value;
            });
        });

        console.log('✅ Statistics updated:', updates);
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Chart loading functionality (will be enhanced with actual data)
function loadLatestCharts() {
    // Placeholder for dynamic chart loading
    // Future: Fetch from GitHub API or JSON manifest
    console.log('Charts loading...');
}

// Filter functionality for archive page
function applyFilters() {
    const topicFilter = document.getElementById('topic-filter')?.value;
    const typeFilter = document.getElementById('type-filter')?.value;
    const dateFilter = document.getElementById('date-filter')?.value;

    console.log('Filters:', { topicFilter, typeFilter, dateFilter });
    // Future: Implement actual filtering logic
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tagtaly website loaded');

    // Update statistics from latest data
    updateStatistics();

    // Add any initialization code here
    loadLatestCharts();
});
