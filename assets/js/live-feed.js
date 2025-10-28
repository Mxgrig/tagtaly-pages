// Tagtaly Live Feed Module
// Renders cross-source stories and headline tracking

// Color palette matching Tagtaly brand
const LIVE_FEED_COLORS = {
    primary: '#3b82f6',
    secondary: '#1e293b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    neutral: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827'
    }
};

// ============================================
// CROSS-SOURCE STORIES RENDERER
// ============================================
async function renderCrossSourceStories() {
    try {
        const container = document.getElementById('cross-source-container');
        if (!container) return;

        const response = await fetch('assets/data/cross_source_stories.json', { cache: 'no-store' });
        const data = await response.json();
        const stories = Array.isArray(data.stories) ? data.stories : [];

        if (stories.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                    <p style="margin: 0; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">No Cross-Source Stories</p>
                    <p style="margin: 0; font-size: 13px;">No stories covered by multiple outlets today.</p>
                </div>
            `;
            return;
        }

        // Build stories list
        let html = '';
        stories.slice(0, 10).forEach((story, idx) => {
            const outletCount = story.outlets ? story.outlets.length : 1;
            const outlets = story.outlets ? story.outlets.join(', ') : 'Unknown';
            const coverageColor = outletCount >= 5 ? LIVE_FEED_COLORS.success : outletCount >= 3 ? LIVE_FEED_COLORS.warning : LIVE_FEED_COLORS.primary;

            html += `
                <div style="padding: 16px; border-bottom: 1px solid ${LIVE_FEED_COLORS.neutral[200]}; transition: background-color 0.2s; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: ${LIVE_FEED_COLORS.neutral[900]}; line-height: 1.5;">
                                ${story.headline || story.title || 'Untitled Story'}
                            </h4>
                        </div>
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: ${coverageColor}15; border: 1px solid ${coverageColor}40; border-radius: 6px; padding: 4px 10px; white-space: nowrap; font-size: 12px; font-weight: 700; color: ${coverageColor};">
                            <span style="display: inline-block; width: 6px; height: 6px; background: ${coverageColor}; border-radius: 50%;"></span>
                            ${outletCount} outlets
                        </div>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: ${LIVE_FEED_COLORS.neutral[500]}; line-height: 1.4;">
                        ${outlets}
                    </p>
                </div>
            `;
        });

        container.innerHTML = html;

        // Add hover effects
        const items = container.querySelectorAll('div[style*="padding: 16px"]');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = LIVE_FEED_COLORS.neutral[50];
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });
        });

    } catch (error) {
        console.error('Error rendering cross-source stories:', error);
        const container = document.getElementById('cross-source-container');
        if (container) {
            container.innerHTML = `<p style="color: #ef4444; padding: 20px; text-align: center;">Error loading cross-source stories</p>`;
        }
    }
}

// ============================================
// HEADLINE FEED UPDATES
// ============================================
async function updateHeadlineFeed() {
    try {
        const feedContainer = document.querySelector('[data-live-feed]');
        if (!feedContainer) return;

        const response = await fetch('assets/data/articles.json', { cache: 'no-store' });
        const data = await response.json();
        const articles = Array.isArray(data.articles) ? data.articles.slice(0, 5) : [];

        if (articles.length === 0) return;

        let html = '';
        articles.forEach(article => {
            const source = article.source || 'Unknown';
            const topic = article.topic || article.qwe_primary || 'General';
            
            html += `
                <div class="headline-item" style="padding: 20px; border-left: 4px solid ${LIVE_FEED_COLORS.primary}; background: linear-gradient(to right, ${LIVE_FEED_COLORS.neutral[50]}, white); border-radius: 8px; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    <div class="headline-meta" style="display: flex; gap: 12px; font-size: 11px; color: ${LIVE_FEED_COLORS.neutral[500]}; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;">
                        <span>${source}</span>
                        <span>•</span>
                        <span>${topic}</span>
                    </div>
                    <p class="headline-text" style="font-size: 16px; font-weight: 700; color: ${LIVE_FEED_COLORS.neutral[900]}; margin: 0; line-height: 1.5;">
                        ${article.title || article.headline || 'Untitled'}
                    </p>
                </div>
            `;
        });

        feedContainer.innerHTML = html;

        // Add hover effects
        feedContainer.querySelectorAll('.headline-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                item.style.transform = 'translateY(-2px)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                item.style.transform = 'translateY(0)';
            });
        });

    } catch (error) {
        console.error('Error updating headline feed:', error);
    }
}

// ============================================
// INITIALIZE LIVE FEED
// ============================================
function initializeLiveFeed() {
    console.log('Initializing live feed...');
    renderCrossSourceStories();
    updateHeadlineFeed();
}

// Run on document ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLiveFeed);
} else {
    initializeLiveFeed();
}
