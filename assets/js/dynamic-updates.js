/**
 * Tagtaly Dynamic Updates Module
 * Handles all dynamic content updates from data provider
 * Replaces hardcoded data with live-generated content
 */

/**
 * Update all date references on the page
 */
function updateDateReferences(dateStr) {
    try {
        const formattedDate = dataProvider.formatDate(dateStr);
        
        // Update main article headline date
        const headlineElement = document.getElementById('article-headline');
        if (headlineElement) {
            headlineElement.textContent = `${formattedDate}: Breaking Down the News Cycle`;
        }

        // Update article body date references
        const dateElements = document.querySelectorAll('[data-date-placeholder]');
        dateElements.forEach(el => {
            el.textContent = formattedDate;
        });

        console.log(`📅 Date references updated to: ${formattedDate}`);
    } catch (error) {
        console.error('Error updating date references:', error);
    }
}

/**
 * Update article headline with current date and trending topic
 */
function updateArticleHeadline(data) {
    try {
        // Ensure we have data
        if (!data || !data.articles) {
            console.warn('⚠️ No data available for article headline');
            return;
        }

        const stats = dataProvider.calculateStatistics(data);
        const dateStr = dataProvider.formatDate(data.date || new Date().toISOString());
        const topTopic = stats.topTopic || 'News';

        const headlineElement = document.getElementById('article-headline');
        if (headlineElement) {
            const headline = `${dateStr}: <span class="highlight-topic">${topTopic}</span> Dominates Today's News`;
            headlineElement.innerHTML = headline;
            headlineElement.textContent = headline.replace(/<[^>]*>/g, ''); // Also set plain text for fallback
            console.log(`📰 Article headline updated: "${dateStr}: ${topTopic} Dominates Today's News"`);
        } else {
            console.warn('⚠️ article-headline element not found');
        }
    } catch (error) {
        console.error('Error updating article headline:', error);
        // Fallback: at least show current date
        const headlineElement = document.getElementById('article-headline');
        if (headlineElement) {
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            headlineElement.textContent = `${today}: Breaking Down the News Cycle`;
        }
    }
}

/**
 * Update main article body paragraphs with live statistics
 */
function updateArticleBody(data) {
    try {
        const stats = dataProvider.calculateStatistics(data);
        const dateStr = dataProvider.formatDate(data.date);
        const topicTrend = dataProvider.getTopTopics(data, 3);

        // Update pipeline summary paragraph
        const summaryEl = document.getElementById('pipeline-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                Tagtaly's news intelligence pipeline analyzed 
                <strong id="article-count">${stats.totalArticles}</strong> articles from
                <strong id="source-count">${stats.totalSources}</strong> major news sources
                across the UK and US on <strong id="article-date">${dateStr}</strong>.
                Here's what the data reveals about today's news cycle.
            `;
        }

        // Update sentiment summary
        const sentimentEl = document.getElementById('sentiment-summary');
        if (sentimentEl) {
            const sentiment = dataProvider.getSentimentTrend(data);
            const sentimentText = sentiment.current > 55 ? 'largely positive' 
                                 : sentiment.current > 45 ? 'mixed' 
                                 : 'cautious';
            sentimentEl.innerHTML = `
                Overall sentiment analysis shows <strong>${Math.round(sentiment.current)}% positive</strong> coverage,
                indicating a <strong>${sentimentText}</strong> tone across major outlets today.
            `;
        }

        // Update trending topics paragraph
        const topicsEl = document.getElementById('trending-topics');
        if (topicsEl && topicTrend.length > 0) {
            const topicsList = topicTrend.slice(0, 2)
                .map((t, i) => `<strong>${i + 1}. ${t.topic}</strong> (up ${t.change_pct}%)`)
                .join(' and ');
            topicsEl.innerHTML = `
                Today's dominant narrative centers on ${topicsList}.
                These topics are gaining significant coverage compared to yesterday's priorities.
            `;
        }

        console.log(`📝 Article body paragraphs updated`);
    } catch (error) {
        console.error('Error updating article body:', error);
    }
}

/**
 * Load and display live headlines feed from articles.json
 */
function loadLiveHeadlines(data) {
    try {
        const topArticles = dataProvider.getTopArticles(data, 5);
        const container = document.querySelector('[data-live-feed]');

        if (!container) {
            console.warn('⚠️ Live feed container not found');
            return;
        }

        if (topArticles.length === 0) {
            container.innerHTML = '<div class="headline-item"><span>No articles available</span></div>';
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Populate with top articles
        topArticles.forEach(article => {
            const articleDate = dataProvider.formatDate(article.published_date || article.fetched_at);
            const sentiment = article.sentiment || 'neutral';
            const sentimentBadge = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😞' : '😐';
            
            // Use display_topic if available (shows subcategory for "Other" category)
            const displayTopic = article.display_topic || article.topic || 'General';

            const element = document.createElement('div');
            element.className = 'headline-item';
            element.innerHTML = `
                <div class="headline-meta">
                    <span class="source">${article.source}</span>
                    <span class="date">${articleDate}</span>
                    <span class="sentiment-badge" title="${sentiment}">${sentimentBadge}</span>
                </div>
                <p class="headline-text">${article.headline}</p>
                <p class="headline-topic"><span class="topic-tag">${displayTopic}</span></p>
            `;
            container.appendChild(element);
        });

        console.log(`📰 Live feed updated with ${topArticles.length} articles`);
    } catch (error) {
        console.error('Error loading live headlines:', error);
    }
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 * NEW FUNCTION - Missing from original
 */
function formatTimeAgo(isoString) {
    try {
        if (!isoString) return '—';
        
        const date = new Date(isoString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        
        // Format as HH:MM UTC for older timestamps
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC'
        }) + ' UTC';
    } catch (error) {
        console.error('Error formatting time:', error);
        return '—';
    }
}

/**
 * Helper: Update all elements with data-stat attribute
 * NEW FUNCTION - Missing from original
 */
function updateDataStatElements(statName, value) {
    try {
        const elements = document.querySelectorAll(`[data-stat="${statName}"]`);
        elements.forEach(el => {
            el.textContent = value;
            el.classList.add('updated');
        });
    } catch (error) {
        console.error(`Error updating data-stat[${statName}]:`, error);
    }
}

/**
 * Calculate average virality score from articles
 * NEW FUNCTION - Missing from original
 */
function calculateAverageViral(articlesData) {
    try {
        const articles = articlesData.articles || [];
        if (articles.length === 0) return '—';
        
        const totalViral = articles.reduce((sum, a) => sum + (a.viral_score || 0), 0);
        const average = (totalViral / articles.length).toFixed(1);
        return average;
    } catch (error) {
        console.error('Error calculating average viral:', error);
        return '—';
    }
}

/**
 * Calculate sentiment trend (up/down arrow)
 * NEW FUNCTION - Missing from original
 */
function updateSentimentTrend(sentimentData) {
    try {
        if (!sentimentData || !sentimentData.mood_scores || sentimentData.mood_scores.length < 2) {
            return;
        }
        
        const scores = sentimentData.mood_scores;
        const yesterday = scores[scores.length - 2];
        const today = scores[scores.length - 1];
        
        const trendEl = document.getElementById('sentiment-trend');
        if (trendEl) {
            if (today > yesterday) {
                trendEl.textContent = '↗ Improving';
                trendEl.style.color = 'var(--color-success, #34C759)';
            } else if (today < yesterday) {
                trendEl.textContent = '↘ Declining';
                trendEl.style.color = 'var(--color-danger, #FF3B30)';
            } else {
                trendEl.textContent = '→ Steady';
                trendEl.style.color = 'var(--color-neutral-500, #8E8E93)';
            }
        }
    } catch (error) {
        console.error('Error updating sentiment trend:', error);
    }
}

/**
 * Update statistics section with all data-stat elements
 * ENHANCED FUNCTION - Added comprehensive statistics update
 */
function updateStatisticsSection(articlesData, categoryData, sentimentData) {
    try {
        // Calculate metrics from articles
        const totalArticles = articlesData.total_articles || articlesData.articles.length;
        const ukArticles = articlesData.articles.filter(a => a.country === 'UK').length;
        const usArticles = articlesData.articles.filter(a => a.country === 'US').length;
        const uniqueSources = new Set(articlesData.articles.map(a => a.source)).size;
        
        // Calculate sentiment %
        const positiveSentiment = articlesData.articles.filter(a => 
            a.sentiment === 'positive'
        ).length;
        const sentimentPercentage = Math.round((positiveSentiment / totalArticles) * 100);
        
        // Get top topic from category data
        const topTopic = categoryData?.dominant_category || categoryData?.categories?.[0]?.category || 'Tech';
        const topTopicCount = categoryData?.categories?.[0]?.count || 0;
        const topTopicShare = totalArticles > 0 ? Math.round((topTopicCount / totalArticles) * 100) : 0;
        
        // Update all data-stat elements (fixes most hardcoded data points)
        updateDataStatElements('total-articles', totalArticles.toString());
        updateDataStatElements('uk-articles', ukArticles.toString());
        updateDataStatElements('us-articles', usArticles.toString());
        updateDataStatElements('total-sources', uniqueSources.toString());
        updateDataStatElements('top-topic-name', topTopic);
        updateDataStatElements('top-topic-share', `${topTopicShare}%`);
        updateDataStatElements('positive-pct', `${sentimentPercentage}%`);
        updateDataStatElements('updated-time', formatTimeAgo(articlesData.updated_at));
        
        // Update metric elements by ID
        const metricHeadlines = document.getElementById('metric-headlines');
        if (metricHeadlines) metricHeadlines.textContent = totalArticles;
        
        const metricViral = document.getElementById('metric-viral');
        if (metricViral) metricViral.textContent = calculateAverageViral(articlesData);
        
        const metricSource = document.getElementById('metric-source');
        if (metricSource) metricSource.textContent = articlesData.articles[0]?.source || '—';
        
        const metricUpdated = document.getElementById('metric-updated');
        if (metricUpdated) metricUpdated.textContent = formatTimeAgo(articlesData.updated_at);
        
        // Update sentiment trend
        updateSentimentTrend(sentimentData);
        
        console.log('✅ Statistics section updated');
    } catch (error) {
        console.error('Error updating statistics section:', error);
    }
}

/**
 * Update all data-stat elements with current statistics
 */
function updateAllStatistics(data) {
    try {
        const stats = dataProvider.calculateStatistics(data);
        const sentiment = dataProvider.getSentimentTrend(data);

        // Define all statistics to update
        const updates = {
            'total-articles': stats.totalArticles.toString(),
            'uk-articles': stats.ukArticles.toString(),
            'us-articles': stats.usArticles.toString(),
            'positive-pct': stats.positivePct + '%',
            'neutral-pct': stats.neutralPct + '%',
            'negative-pct': stats.negativePct + '%',
            'top-topic-name': stats.topTopic,
            'top-topic-share': stats.topicShare + '%',
            'total-sources': stats.totalSources.toString(),
            'sentiment-mood': Math.round(sentiment.current) + '%',
            'sentiment-trend': sentiment.trend > 0 ? '↑ Improving' : sentiment.trend < 0 ? '↓ Declining' : '→ Stable'
        };

        // Apply updates to all data-stat elements
        Object.entries(updates).forEach(([key, value]) => {
            const elements = document.querySelectorAll(`[data-stat="${key}"]`);
            elements.forEach(el => {
                el.textContent = value;
                el.classList.add('updated'); // Add CSS class for animation
            });
        });

        console.log('✅ All statistics updated:', updates);
        return updates;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

/**
 * Render word cloud from keywords data
 */
function renderWordCloud(data) {
    try {
        const keywords = dataProvider.getKeywords(data, 50);
        const container = document.getElementById('wordcloud-container');

        if (!container || keywords.length === 0) {
            console.warn('⚠️ Word cloud container not found or no keywords');
            return;
        }

        // Calculate max frequency for scaling
        const maxFreq = keywords.length > 0 ? Math.max(...keywords.map(k => k.value)) : 1;

        // Clear existing content
        container.innerHTML = '';

        // Create word cloud elements
        keywords.forEach(keyword => {
            const scaleFactor = (keyword.value / maxFreq) * 0.8 + 0.5; // Scale between 0.5x and 1.3x
            const element = document.createElement('span');
            element.className = 'word-cloud-item';
            element.textContent = keyword.name;
            element.style.fontSize = (scaleFactor * 100) + '%';
            element.style.opacity = (keyword.value / maxFreq) * 0.7 + 0.3; // Opacity between 0.3 and 1.0
            element.title = `${keyword.value} mentions`;
            container.appendChild(element);
        });

        console.log(`☁️ Word cloud rendered with ${keywords.length} keywords`);
    } catch (error) {
        console.error('Error rendering word cloud:', error);
    }
}

/**
 * Update sentiment visualization data
 */
function updateSentimentCharts(data) {
    try {
        if (!data.sentiment || !data.sentiment.mood_scores) {
            console.warn('⚠️ No sentiment data available');
            return;
        }

        const sentiment = dataProvider.getSentimentTrend(data);
        
        // Update sentiment indicator
        const indicatorEl = document.getElementById('sentiment-indicator');
        if (indicatorEl) {
            const mood = sentiment.current;
            let moodClass = mood > 55 ? 'positive' : mood > 45 ? 'neutral' : 'negative';
            indicatorEl.className = `sentiment-indicator ${moodClass}`;
            indicatorEl.textContent = Math.round(mood) + '% Positive';
        }

        // Update sentiment trend
        const trendEl = document.getElementById('sentiment-trend');
        if (trendEl) {
            const trendText = sentiment.trend > 0 ? `📈 +${sentiment.trend.toFixed(1)}% (Improving)` 
                            : sentiment.trend < 0 ? `📉 ${sentiment.trend.toFixed(1)}% (Declining)` 
                            : `→ Stable`;
            trendEl.textContent = trendText;
        }

        console.log(`📊 Sentiment charts updated`);
    } catch (error) {
        console.error('Error updating sentiment charts:', error);
    }
}

/**
 * Update trending topics section
 */
function updateTrendingTopics(data) {
    try {
        const topTopics = dataProvider.getTopTopics(data, 5);
        const container = document.getElementById('trending-topics-list');

        if (!container || topTopics.length === 0) {
            console.warn('⚠️ Trending topics container not found');
            return;
        }

        container.innerHTML = '';

        topTopics.forEach((topic, index) => {
            const element = document.createElement('div');
            element.className = 'trending-topic-item';
            const trendIcon = topic.change_pct > 0 ? '📈' : '📉';
            const trendColor = topic.change_pct > 0 ? 'green' : 'red';
            
            element.innerHTML = `
                <div class="topic-rank">#${index + 1}</div>
                <div class="topic-info">
                    <div class="topic-name">${topic.topic}</div>
                    <div class="topic-change" style="color: ${trendColor}">
                        ${trendIcon} ${Math.abs(topic.change_pct)}% 
                        ${topic.change_pct > 0 ? 'increase' : 'decrease'}
                    </div>
                </div>
            `;
            container.appendChild(element);
        });

        console.log(`🔥 Trending topics updated`);
    } catch (error) {
        console.error('Error updating trending topics:', error);
    }
}

/**
 * Main initialization function - call on page load
 * NEW FUNCTION - Missing from original, critical for startup
 */
async function initializePageData() {
    try {
        console.log('🔄 Initializing Tagtaly page data...');
        const startTime = performance.now();
        
        // Fetch all required data files in parallel
        const [articlesRes, categoriesRes, sentimentRes, sourceRes] = await Promise.all([
            fetch('assets/data/articles.json', { cache: 'no-store' }).catch(e => null),
            fetch('assets/data/category_dominance.json', { cache: 'no-store' }).catch(e => null),
            fetch('assets/data/sentiment_tracker.json', { cache: 'no-store' }).catch(e => null),
            fetch('assets/data/source_productivity.json', { cache: 'no-store' }).catch(e => null)
        ]);
        
        // Parse JSON responses with fallbacks
        const articles = articlesRes && articlesRes.ok ? await articlesRes.json() : { articles: [], total_articles: 0, updated_at: new Date().toISOString() };
        const categories = categoriesRes && categoriesRes.ok ? await categoriesRes.json() : { categories: [] };
        const sentiment = sentimentRes && sentimentRes.ok ? await sentimentRes.json() : { mood_scores: [] };
        const sources = sourceRes && sourceRes.ok ? await sourceRes.json() : { sources: [] };
        
        // Update all page sections
        console.log('📋 Articles loaded:', articles.total_articles);
        console.log('📊 Categories loaded:', categories.categories?.length || 0);
        console.log('💭 Sentiment loaded:', sentiment.mood_scores?.length || 0);
        
        // Update dynamic content
        updateArticleHeadline(articles);
        updateArticleBody(articles);
        updateStatisticsSection(articles, categories, sentiment);
        updateAllStatistics(articles);
        loadLiveHeadlines(articles);
        
        const duration = performance.now() - startTime;
        console.log(`✅ Page data initialized successfully in ${duration.toFixed(0)}ms`);
        
        // Dispatch custom event for charts and other modules
        document.dispatchEvent(new CustomEvent('tagtaly-data-ready', { 
            detail: { articles, categories, sentiment, sources } 
        }));
        
    } catch (error) {
        console.error('❌ Error initializing page data:', error);
    }
}

/**
 * Master update function - coordinates all dynamic updates
 */
async function updateAllPageContent() {
    try {
        console.log('🔄 Starting comprehensive page update...');
        const startTime = performance.now();

        // Load all data
        const data = await dataProvider.loadAllData();

        // Update all components in parallel where possible
        updateDateReferences(data.date);
        updateArticleHeadline(data);
        updateArticleBody(data);
        updateAllStatistics(data);
        loadLiveHeadlines(data);
        renderWordCloud(data);
        updateSentimentCharts(data);
        updateTrendingTopics(data);
        // Note: Outlet chart is handled by social_charts.js using source_productivity.json

        const duration = performance.now() - startTime;
        console.log(`✅ Page update complete in ${duration.toFixed(0)}ms`);

        // Dispatch custom event for other modules to listen
        document.dispatchEvent(new CustomEvent('tagtaly-data-updated', { detail: data }));

    } catch (error) {
        console.error('❌ Error during page update:', error);
    }
}

/**
 * Setup auto-refresh at specified interval (useful for live updates)
 */
function setupAutoRefresh(intervalMinutes = 30) {
    try {
        const intervalMs = intervalMinutes * 60 * 1000;
        
        setInterval(() => {
            console.log('🔄 Auto-refresh triggered');
            updateAllPageContent();
        }, intervalMs);

        console.log(`⏱️ Auto-refresh enabled every ${intervalMinutes} minutes`);
    } catch (error) {
        console.error('Error setting up auto-refresh:', error);
    }
}

/**
 * Run initialization when DOM is ready
 * CRITICAL - Automatically starts page data loading on page load
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageData);
} else {
    initializePageData();
}
