// Rebuild: 2025-10-27T15:30Z - Expose window.dataProvider
/**
 * Tagtaly Data Provider
 * Centralized module for loading and managing all daily-generated JSON data
 * 
 * Data Sources:
 * - articles.json: All articles with sentiment, topics, country classification
 * - sentiment_tracker.json: Daily mood scores and sentiment trends
 * - topic_surges.json: Trending topics with day-over-day changes
 * - category_dominance.json: Dominant topic and category distribution
 * - wordcloud.json: Keyword frequency data for word cloud visualization
 */

class DataProvider {
    constructor() {
        this.baseUrl = 'assets/data';
        this.cache = {};
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.lastFetch = {};
    }

    /**
     * Load all data sources in parallel
     * Returns consolidated data object with all required fields
     */
    async loadAllData() {
        try {
            const startTime = performance.now();
            
            // Load all data sources in parallel
            const [articles, sentiment, topics, categories, wordcloud] = await Promise.all([
                this.fetchData('articles.json'),
                this.fetchData('sentiment_tracker.json'),
                this.fetchData('topic_surges.json'),
                this.fetchData('category_dominance.json'),
                this.fetchData('wordcloud.json')
            ]);

            const data = {
                articles: articles.articles || [],
                totalArticles: articles.total_articles || 0,
                date: articles.date || new Date().toISOString().split('T')[0],
                sentiment,
                topics,
                categories,
                wordcloud,
                _loadTime: performance.now() - startTime,
                _lastUpdated: new Date().toISOString()
            };

            console.log(`✅ All data loaded in ${data._loadTime.toFixed(0)}ms`);
            return data;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            return this.getEmptyData();
        }
    }

    /**
     * Fetch individual JSON file with caching and error handling
     */
    async fetchData(filename) {
        const key = `_cache_${filename}`;
        const timeKey = `_time_${filename}`;
        const now = Date.now();

        // Return cached data if fresh
        if (this.cache[key] && (now - this.lastFetch[timeKey]) < this.cacheTimeout) {
            console.log(`📦 Using cached data: ${filename}`);
            return this.cache[key];
        }

        try {
            const url = `${this.baseUrl}/${filename}?t=${now}`;
            const response = await fetch(url, { 
                cache: 'no-store',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${filename}`);
            }

            const data = await response.json();
            
            // Cache the data
            this.cache[key] = data;
            this.lastFetch[timeKey] = now;
            
            console.log(`📥 Loaded: ${filename}`);
            return data;
        } catch (error) {
            console.warn(`⚠️ Failed to load ${filename}:`, error.message);
            return this.getEmptyDataForFile(filename);
        }
    }

    /**
     * Calculate derived statistics from articles
     */
    calculateStatistics(data) {
        const articles = data.articles || [];
        const total = articles.length;

        if (total === 0) {
            return {
                totalArticles: 0,
                ukArticles: 0,
                usArticles: 0,
                positiveCount: 0,
                neutralCount: 0,
                negativeCount: 0,
                positivePct: 0,
                neutralPct: 0,
                negativePct: 0,
                topTopic: 'Unknown',
                topicShare: 0,
                totalSources: 0,
                uniqueSources: []
            };
        }

        // Sentiment distribution
        const sentimentCounts = {
            positive: articles.filter(a => a.sentiment === 'positive').length,
            neutral: articles.filter(a => a.sentiment === 'neutral').length,
            negative: articles.filter(a => a.sentiment === 'negative').length
        };

        // Country distribution
        const ukArticles = articles.filter(a => a.country === 'UK').length;
        const usArticles = articles.filter(a => a.country === 'US').length;

        // Topic distribution (use display_topic if available, otherwise use topic)
        const topicCounts = {};
        articles.forEach(a => {
            // Use display_topic for "Other" category, otherwise use topic
            const topic = (a.topic === 'Other' && a.display_topic) ? a.display_topic : (a.topic || 'Other');
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
        
        const topTopic = Object.keys(topicCounts).length > 0
            ? Object.keys(topicCounts).reduce((a, b) => topicCounts[a] > topicCounts[b] ? a : b)
            : 'Unknown';
        
        const topicShare = topicCounts[topTopic] ? Math.round((topicCounts[topTopic] / total) * 100 * 10) / 10 : 0;

        // Unique sources
        const uniqueSources = [...new Set(articles.map(a => a.source).filter(Boolean))];

        return {
            totalArticles: total,
            ukArticles,
            usArticles,
            positiveCount: sentimentCounts.positive,
            neutralCount: sentimentCounts.neutral,
            negativeCount: sentimentCounts.negative,
            positivePct: Math.round((sentimentCounts.positive / total) * 100),
            neutralPct: Math.round((sentimentCounts.neutral / total) * 100),
            negativePct: Math.round((sentimentCounts.negative / total) * 100),
            topTopic,
            topicShare,
            totalSources: uniqueSources.length,
            uniqueSources
        };
    }

    /**
     * Get top N articles for live feed
     */
    getTopArticles(data, count = 5) {
        const articles = data.articles || [];
        return articles.slice(0, count);
    }

    /**
     * Get sentiment trend from sentiment tracker
     */
    getSentimentTrend(data) {
        if (!data.sentiment || !data.sentiment.mood_scores) {
            return { current: 0, previous: 0, trend: 0 };
        }

        const scores = data.sentiment.mood_scores;
        return {
            current: scores[scores.length - 1] || 0,
            previous: scores[scores.length - 2] || 0,
            trend: (scores[scores.length - 1] || 0) - (scores[scores.length - 2] || 0)
        };
    }

    /**
     * Get top trending topics
     */
    getTopTopics(data, count = 5) {
        if (!data.topics || !data.topics.surges) {
            return [];
        }
        return data.topics.surges.slice(0, count);
    }

    /**
     * Get keywords for word cloud
     */
    getKeywords(data, count = 50) {
        if (!data.wordcloud || !data.wordcloud.keywords) {
            return [];
        }
        return data.wordcloud.keywords.slice(0, count);
    }

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    /**
     * Get empty data object with defaults (for error handling)
     */
    getEmptyData() {
        return {
            articles: [],
            totalArticles: 0,
            date: new Date().toISOString().split('T')[0],
            sentiment: { mood_scores: [50], dates: [], days: 1 },
            topics: { date: new Date().toISOString().split('T')[0], surges: [] },
            categories: { date: new Date().toISOString().split('T')[0], dominant_category: 'Unknown', categories: [] },
            wordcloud: { date: new Date().toISOString().split('T')[0], keywords: [] },
            _error: true,
            _lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get empty data for specific file (for partial failures)
     */
    getEmptyDataForFile(filename) {
        const now = new Date().toISOString().split('T')[0];
        
        switch (filename) {
            case 'articles.json':
                return { articles: [], total_articles: 0, date: now };
            case 'sentiment_tracker.json':
                return { mood_scores: [50], dates: [], days: 1 };
            case 'topic_surges.json':
                return { date: now, surges: [] };
            case 'category_dominance.json':
                return { date: now, dominant_category: 'Unknown', categories: [] };
            case 'wordcloud.json':
                return { date: now, keywords: [] };
            default:
                return {};
        }
    }

    /**
     * Clear cache (useful for testing)
     */
    clearCache() {
        this.cache = {};
        this.lastFetch = {};
        console.log('📦 Cache cleared');
    }
}

// Create singleton instance and expose to window
const dataProvider = new DataProvider();
window.dataProvider = dataProvider;
