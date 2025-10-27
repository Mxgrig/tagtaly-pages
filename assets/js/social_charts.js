// Check if required libraries are loaded
if (typeof echarts === 'undefined') {
    console.error('ERROR: echarts library not loaded');
}
if (typeof Chart === 'undefined') {
    console.error('ERROR: Chart.js library not loaded');
}

// Ensure all container elements have proper sizing before chart init
function ensureChartContainerSizes() {
    const containers = document.querySelectorAll('.chart-container');
    console.log('ensureChartContainerSizes: Found', containers.length, 'containers');
    containers.forEach(container => {
        // Ensure height
        const computedHeight = parseFloat(getComputedStyle(container).height);
        if (!container.style.height || container.style.height === 'auto') {
            if (!isNaN(computedHeight) && computedHeight > 0) {
                container.style.height = `${computedHeight}px`;
            } else if (!container.style.minHeight) {
                container.style.height = '400px';
            } else {
                container.style.height = container.style.minHeight;
            }
        }

        // Ensure width - critical for ECharts rendering
        const computedWidth = getComputedStyle(container).width;
        console.log('Container width:', computedWidth, 'id:', container.id);
        if (computedWidth === '0px' || !container.style.width) {
            container.style.width = '100%';
            console.log('Set width to 100% for', container.id);
        }

        const firstChild = container.firstElementChild;
        if (firstChild) {
            const childRect = firstChild.getBoundingClientRect();
            if (childRect.height <= 0) {
                firstChild.style.minHeight = container.style.height || getComputedStyle(container).height || '400px';
            }
            if (childRect.width <= 0) {
                firstChild.style.minWidth = '100%';
            }
        }
    });
}

// Utility function to add dual-chart hover switching
function setupDualChartHover(containerId, chartInstance, primaryChartInit, alternateChartInit) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found for dual-chart hover`);
        return;
    }

    const cardHeader = container.closest('.chart-card');
    if (!cardHeader) {
        console.warn(`Chart card not found for ${containerId}`);
        return;
    }

    let isPrimary = true;

    cardHeader.addEventListener('mouseenter', () => {
        if (isPrimary && chartInstance) {
            isPrimary = false;
            console.log(`Switching to alternate: ${containerId}`);
            alternateChartInit(chartInstance);
        }
    });

    cardHeader.addEventListener('mouseleave', () => {
        if (!isPrimary && chartInstance) {
            isPrimary = true;
            console.log(`Switching back to primary: ${containerId}`);
            primaryChartInit(chartInstance);
        }
    });
}

const ECHART_TEXT_STYLE = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    color: 'hsl(0 0% 45.1%)'
};

// Mock data fallbacks when actual data is not available
const MOCK_DATA = {
    emotional: {
        headline: "📊 Emotional Rollercoaster - Sentiment Trend",
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        scores: [42.5, 38.2, 45.8, 52.3, 48.9]
    },
    surge: {
        headline: "🚨 Topic Surge Alert",
        surges: [
            { topic: 'Technology', change_pct: 67.5, today: 125, yesterday: 74 },
            { topic: 'Health', change_pct: 45.2, today: 89, yesterday: 61 },
            { topic: 'Politics', change_pct: 38.8, today: 67, yesterday: 48 },
            { topic: 'Climate', change_pct: 22.3, today: 45, yesterday: 37 },
            { topic: 'Entertainment', change_pct: 18.5, today: 38, yesterday: 32 }
        ]
    },
    mediaDivide: {
        headline: "📰 Media Divide - Outlet Sentiment",
        positive_outlets: [
            { source: 'BBC', mood_score: 8 },
            { source: 'Guardian', mood_score: 12 }
        ],
        negative_outlets: [
            { source: 'Daily Mail', mood_score: -15 },
            { source: 'Telegraph', mood_score: -9 }
        ]
    },
    sentiment: {
        headline: "Sentiment Showdown - BBC vs Daily Mail",
        positive: { source: 'BBC', mood_score: 24 },
        negative: { source: 'Daily Mail', mood_score: 31 }
    },
    categories: {
        labels: ['Technology', 'Politics', 'Health', 'Business', 'Entertainment'],
        data: [35, 25, 18, 15, 7]
    },
    sources: {
        labels: ['BBC', 'Guardian', 'Sky News', 'Independent', 'Telegraph'],
        data: [45, 38, 32, 28, 22]
    },
    rhythm: {
        labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'],
        data: [12, 28, 42, 35, 38, 25, 18]
    }
};

const DATA_BASE_URL = (() => {
    const resolveFromSrc = (src) => {
        try {
            return new URL('../data/', src).href;
        } catch (error) {
            console.warn('Chart asset base resolution failed for', src, error);
            return null;
        }
    };

    const current = document.currentScript;
    if (current?.src) {
        const base = resolveFromSrc(current.src);
        if (base) {
            return base;
        }
    }

    const scripts = Array.from(document.getElementsByTagName('script') || []);
    for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i].src;
        if (src && src.includes('social_charts.js')) {
            const base = resolveFromSrc(src);
            if (base) {
                return base;
            }
        }
    }

    return 'assets/data/';
})();

function resolveDataUrl(file) {
    try {
        return new URL(file, DATA_BASE_URL).href;
    } catch {
        const normalizedBase = DATA_BASE_URL.endsWith('/') ? DATA_BASE_URL : `${DATA_BASE_URL}/`;
        return `${normalizedBase}${file}`;
    }
}

function fetchDashboardJson(file, init = {}) {
    const options = { cache: 'no-store', ...init };
    return fetch(resolveDataUrl(file), options);
}

// --- CHART 1: EMOTIONAL ROLLERCOASTER (Line Chart with Dual Hover) ---
function initEmotionalRollercoaster() {
    console.log('>>>>> initEmotionalRollercoaster called');
    const chartDom = document.getElementById('emotional-rollercoaster-chart');
    console.log('chartDom found:', !!chartDom, chartDom);
    if (!chartDom) {
        console.warn('emotional-rollercoaster-chart not found');
        return;
    }

    console.log('Starting fetch for sentiment_tracker.json');
    fetchDashboardJson('sentiment_tracker.json')
        .then(r => r.json())
        .then(data => {
            console.log('Emotional Rollercoaster data received:', data);
            const myChart = echarts.init(chartDom);
            console.log('echarts initialized, myChart:', !!myChart);
            const titleEl = document.getElementById('rollercoaster-title');

            // Convert dates to short format (Mon, Tue, etc)
            const dates = (data.dates || []).map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('en-GB', { weekday: 'short' });
            });
            const scores = data.mood_scores || MOCK_DATA.emotional.scores;
            console.log('Converted dates:', dates, 'scores:', scores);

            // Primary chart: Line chart
            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Emotional Rollercoaster - Sentiment Trend (Hover for area view)";

                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '15%', containLabel: true },
                    xAxis: { type: 'category', data: dates.length > 0 ? dates : MOCK_DATA.emotional.dates, axisLabel: { ...ECHART_TEXT_STYLE } },
                    yAxis: { type: 'value', name: 'Mood Score', nameTextStyle: { ...ECHART_TEXT_STYLE }, axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [{
                        name: 'Mood Score',
                        type: 'line',
                        data: scores.length > 0 ? scores : MOCK_DATA.emotional.scores,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 8,
                        lineStyle: { color: '#8b5cf6', width: 3 },
                        itemStyle: { color: '#8b5cf6' }
                    }]
                };
                console.log('Setting chart option:', option);
                chart.setOption(option);
                console.log('Chart option set');
            };

            // Alternate chart: Area chart with filled background
            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Emotional Rollercoaster - Area View (More detail on hover)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'line' },
                        formatter: (params) => {
                            if (!params.length) return '';
                            const p = params[0];
                            return `${p.name}<br/><strong>Sentiment: ${p.value}</strong>`;
                        }
                    },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '15%', containLabel: true },
                    xAxis: { type: 'category', data: dates.length > 0 ? dates : MOCK_DATA.emotional.dates, axisLabel: { ...ECHART_TEXT_STYLE } },
                    yAxis: { type: 'value', name: 'Mood Score', nameTextStyle: { ...ECHART_TEXT_STYLE }, axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [{
                        name: 'Mood Score',
                        type: 'line',
                        data: scores.length > 0 ? scores : MOCK_DATA.emotional.scores,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 10,
                        lineStyle: { color: '#8b5cf6', width: 4 },
                        itemStyle: { color: '#8b5cf6', borderWidth: 2, borderColor: '#fff' },
                        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
                            { offset: 1, color: 'rgba(139, 92, 246, 0.1)' }
                        ]) }
                    }]
                };
                chart.setOption(option);
            };

            // Initialize with primary chart
            console.log('✓ Emotional Rollercoaster: Rendering primary view with', dates.length, 'dates');
            renderPrimary(myChart);

            // Setup dual-chart hover switching
            console.log('✓ Emotional Rollercoaster: Setting up dual-chart hover');
            setupDualChartHover('emotional-rollercoaster-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        })
        .catch(error => {
            console.warn('Sentiment tracker error:', error);
            const myChart = echarts.init(chartDom);
            const titleEl = document.getElementById('rollercoaster-title');

            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Emotional Rollercoaster - Sentiment Trend (Hover for area view)";
                const option = {
                    tooltip: { trigger: 'axis' },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '15%', containLabel: true },
                    xAxis: { type: 'category', data: MOCK_DATA.emotional.dates, axisLabel: { ...ECHART_TEXT_STYLE } },
                    yAxis: { type: 'value', name: 'Mood Score', nameTextStyle: { ...ECHART_TEXT_STYLE }, axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [{
                        name: 'Mood Score',
                        type: 'line',
                        data: MOCK_DATA.emotional.scores,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 8,
                        lineStyle: { color: '#8b5cf6', width: 3 },
                        itemStyle: { color: '#8b5cf6' }
                    }]
                };
                chart.setOption(option);
            };

            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Emotional Rollercoaster - Area View";
                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '15%', containLabel: true },
                    xAxis: { type: 'category', data: MOCK_DATA.emotional.dates, axisLabel: { ...ECHART_TEXT_STYLE } },
                    yAxis: { type: 'value', name: 'Mood Score', nameTextStyle: { ...ECHART_TEXT_STYLE }, axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [{
                        name: 'Mood Score',
                        type: 'line',
                        data: MOCK_DATA.emotional.scores,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 10,
                        lineStyle: { color: '#8b5cf6', width: 4 },
                        itemStyle: { color: '#8b5cf6', borderWidth: 2, borderColor: '#fff' },
                        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
                            { offset: 1, color: 'rgba(139, 92, 246, 0.1)' }
                        ]) }
                    }]
                };
                chart.setOption(option);
            };

            renderPrimary(myChart);
            setupDualChartHover('emotional-rollercoaster-chart', myChart, renderPrimary, renderAlternate);
        })
        .catch((error) => {
            console.warn('Emotional Rollercoaster fetch failed:', error);
            if (!chartDom) return;
            const myChart = echarts.init(chartDom);
            const renderFallback = (chart) => {
                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '15%', containLabel: true },
                    xAxis: { type: 'category', data: MOCK_DATA.emotional.dates, axisLabel: { ...ECHART_TEXT_STYLE } },
                    yAxis: { type: 'value', name: 'Mood Score', nameTextStyle: { ...ECHART_TEXT_STYLE }, axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [{
                        name: 'Mood Score',
                        type: 'line',
                        data: MOCK_DATA.emotional.scores,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 8,
                        lineStyle: { color: '#8b5cf6', width: 3 },
                        itemStyle: { color: '#8b5cf6' }
                    }]
                };
                chart.setOption(option);
            };
            renderFallback(myChart);
            console.log('✓ Emotional Rollercoaster (fallback): Using mock data');
        });
}

// --- CHART 2: WEEKLY WINNER (Simple Card Display) ---
function initWeeklyWinner() {
    const container = document.getElementById('weekly-winner-chart');
    if (!container) return;

    const renderCard = ({ name, value, color, change, share }) => {
        const arrow = change !== null && change !== undefined
            ? (change > 0 ? '▲' : change < 0 ? '▼' : '—')
            : '';
        const changeColor = change > 0 ? '#16a34a' : change < 0 ? '#f97316' : '#64748b';
        const changeBlock = change !== null && change !== undefined
            ? `<div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="text-transform:uppercase; font-size:0.65rem; letter-spacing:0.18em; color:#64748b;">Spread vs #2</span>
                    <span style="font-size:1.1rem; font-weight:700; color:${changeColor};">${arrow} ${Math.abs(change)}%</span>
               </div>`
            : '';

        const headerRight = share !== null && share !== undefined
            ? `<div style="display:flex; align-items:center; gap:8px; text-transform:uppercase; letter-spacing:0.24em; font-size:0.7rem; color:rgba(15,23,42,0.55);">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${color};"></span>
                    ${share}% share
               </div>`
            : `<div style="text-transform:uppercase; letter-spacing:0.24em; font-size:0.7rem; color:rgba(15,23,42,0.45); display:flex; align-items:center; gap:8px;">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${color};"></span>
                    Lead Topic
               </div>`;

        container.innerHTML = `
            <div style="background: linear-gradient(145deg, #ffffff 0%, #eff6ff 100%); border-radius: 16px; padding: 28px; color: #0f172a; border: 1px solid rgba(37, 99, 235, 0.12); box-shadow: 0 20px 34px rgba(37, 99, 235, 0.18); font-family: 'Inter', sans-serif;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 22px;">
                    <div style="text-transform: uppercase; letter-spacing: 0.28em; font-size: 0.7rem; color: rgba(15,23,42,0.55);">Weekly Winner</div>
                    ${headerRight}
                </div>

                <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:24px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:220px;">
                        <div style="font-size: 2.4rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1.12;">${name}</div>
                        <div style="margin-top: 18px; display:flex; gap:24px; align-items:flex-end; flex-wrap: wrap;">
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <span style="text-transform:uppercase; font-size:0.65rem; letter-spacing:0.18em; color:#64748b;">Articles</span>
                                <span style="font-size:2rem; font-weight:700; color:#0f172a;">${value}</span>
                            </div>
                            ${changeBlock}
                        </div>
                    </div>
                    <div style="width:110px; height:110px; border-radius:18px; background: radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 70%); border: 1px solid rgba(37, 99, 235, 0.18); display:flex; align-items:center; justify-content:center;">
                        <span style="font-size: 40px;">🗞️</span>
                    </div>
                </div>

                <div style="margin-top: 24px; height: 4px; background: linear-gradient(90deg, ${color}, rgba(37, 99, 235, 0.25), transparent); border-radius: 9999px;"></div>
            </div>
        `;
    };

    const computeChange = (sorted) => {
        if (!sorted || sorted.length <= 1) return null;
        const leader = sorted[0].value || 0;
        const runnerUp = sorted[1].value || 0;
        if (runnerUp === 0) {
            return leader > 0 ? 100 : 0;
        }
        return Math.round(((leader - runnerUp) / runnerUp) * 100);
    };

    fetchDashboardJson('category_dominance.json')
        .then(r => r.json())
        .then(data => {
            const categories = data.categories || [];

            // Normalize data: handle both 'value' and 'count' properties
            const normalized = categories.map(cat => ({
                name: cat.name,
                value: cat.value !== undefined ? cat.value : cat.count || 0,
                color: cat.color || '#3b82f6'
            }));

            // Find top category (highest value)
            const topCategory = normalized.length > 0
                ? normalized.reduce((a, b) => a.value > b.value ? a : b)
                : { name: 'Unknown', value: 0, color: '#3b82f6' };

            // Calculate percentage change (comparing to second place)
            const sorted = [...normalized].sort((a, b) => b.value - a.value);
            const change = computeChange(sorted);

            const totalVolume = normalized.reduce((sum, item) => sum + (item.value || 0), 0);
            const share = totalVolume > 0 ? Math.round((topCategory.value / totalVolume) * 100) : null;
            const accent = topCategory.color || '#22d3ee';

            renderCard({
                name: topCategory.name,
                value: topCategory.value,
                color: accent,
                change,
                share
            });
            console.log('✓ Weekly Winner: Rendering card -', topCategory.name, topCategory.value);
        })
        .catch(() => {
            const labels = MOCK_DATA.categories.labels;
            const values = MOCK_DATA.categories.data;
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

            const topValue = Math.max(...values);
            const topIndex = values.indexOf(topValue);
            const topName = labels[topIndex];
            const topColor = colors[topIndex];

            // Calculate change
            const sorted = values.map((v, i) => ({ value: v, name: labels[i] })).sort((a, b) => b.value - a.value);
            const change = computeChange(sorted);

            const totalVolume = values.reduce((sum, v) => sum + v, 0);
            const share = totalVolume > 0 ? Math.round((topValue / totalVolume) * 100) : null;

            renderCard({
                name: topName,
                value: topValue,
                color: topColor,
                change,
                share
            });
            console.log('✓ Weekly Winner (fallback): Rendering card');
        });
}

// --- CHART 3: SURGE ALERT (Bar Chart with Dual Hover) ---
function initSurgeAlert() {
    const chartDom = document.getElementById('surge-alert-chart');
    if (!chartDom) return;

    fetchDashboardJson('topic_surges.json')
        .then(r => r.json())
        .then(data => {
            const myChart = echarts.init(chartDom);
            const titleEl = document.getElementById('surge-alert-title');

            // Transform surges data - show most volatile topics with direction (up/down)
            const surges = data.surges || [];
            const chartData = surges
                .filter(s => s.change_pct !== 0) // Filter out zero change
                .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)) // Sort by absolute change
                .slice(0, 5)
                .map(s => ({
                    topic: s.topic,
                    value: s.change_pct, // Keep sign for color coding
                    abs_value: Math.abs(s.change_pct),
                    color: s.change_pct > 0 ? '#10b981' : '#ef4444', // Green for gains, red for losses
                    today: s.today,
                    yesterday: s.yesterday
                }));

            // Primary: Horizontal bars
            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Topic Attention - Topics gaining or losing coverage (Hover for vertical view)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => {
                            if (params.length === 0) return '';
                            const p = params[0];
                            const item = chartData.find(d => d.topic === p.name);
                            return `<strong>${p.name}</strong><br/>Yesterday: ${item.yesterday}<br/>Today: ${item.today}<br/>${item.value > 0 ? '📈 +' : '📉 '}${Math.abs(item.value).toFixed(1)}%`;
                        }
                    },
                    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
                    xAxis: { type: 'value', boundaryGap: [0, 0.01], axisLabel: { ...ECHART_TEXT_STYLE } },
                    yAxis: {
                        type: 'category',
                        data: chartData.map(item => item.topic).reverse(),
                        axisLabel: { ...ECHART_TEXT_STYLE, fontWeight: 'bold' }
                    },
                    series: [{
                        name: 'Coverage Change',
                        type: 'bar',
                        data: chartData.map(item => ({
                            value: item.abs_value,
                            itemStyle: { color: item.color }
                        })).reverse(),
                        label: { show: true, position: 'right', fontWeight: 'bold', formatter: (v) => v.value + '%' }
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Vertical bars with values comparison
            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Topic Attention - Detailed View (Articles count)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => {
                            if (params.length === 0) return '';
                            return params.map(p => {
                                const item = chartData.find(d => d.topic === p.name);
                                return `<strong>${p.name}</strong><br/>${p.seriesName}: ${p.value}`;
                            }).join('<br/>');
                        }
                    },
                    grid: { left: '3%', right: '10%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: chartData.map(item => item.topic).reverse(),
                        axisLabel: { ...ECHART_TEXT_STYLE, interval: 0, rotate: 45 }
                    },
                    yAxis: { type: 'value', axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [
                        {
                            name: 'Yesterday',
                            type: 'bar',
                            data: chartData.map(item => item.yesterday).reverse(),
                            itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] }
                        },
                        {
                            name: 'Today',
                            type: 'bar',
                            data: chartData.map(item => item.today).reverse(),
                            itemStyle: {
                                color: (params) => {
                                    const item = chartData.reverse().find(d => d.topic === params.name);
                                    chartData.reverse();
                                    return item.color;
                                },
                                borderRadius: [4, 4, 0, 0]
                            }
                        }
                    ]
                };
                chart.setOption(option);
            };

            console.log('✓ Surge Alert: Rendering primary view with', chartData.length, 'topics');
            renderPrimary(myChart);
            console.log('✓ Surge Alert: Setting up dual-chart hover');
            setupDualChartHover('surge-alert-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        })
        .catch(error => {
            console.warn('Surge Alert Error:', error);
            const myChart = echarts.init(chartDom);
            const titleEl = document.getElementById('surge-alert-title');

            // Use mock data structure
            const mockData = (MOCK_DATA.surge.surges || []).map(s => ({
                topic: s.topic,
                value: s.change_pct,
                abs_value: Math.abs(s.change_pct),
                color: s.change_pct > 0 ? '#10b981' : '#ef4444',
                today: s.today || 0,
                yesterday: s.yesterday || 0
            }));

            // Primary: Horizontal bars
            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Topic Attention - Topics gaining or losing coverage (Hover for vertical view)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => {
                            if (params.length === 0) return '';
                            const p = params[0];
                            const item = mockData.find(d => d.topic === p.name);
                            return `<strong>${p.name}</strong><br/>Yesterday: ${item.yesterday}<br/>Today: ${item.today}<br/>${item.value > 0 ? '📈 +' : '📉 '}${Math.abs(item.value).toFixed(1)}%`;
                        }
                    },
                    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
                    xAxis: { type: 'value', boundaryGap: [0, 0.01], axisLabel: { ...ECHART_TEXT_STYLE } },
                    yAxis: {
                        type: 'category',
                        data: mockData.map(item => item.topic).reverse(),
                        axisLabel: { ...ECHART_TEXT_STYLE, fontWeight: 'bold' }
                    },
                    series: [{
                        name: 'Coverage Change',
                        type: 'bar',
                        data: mockData.map(item => ({
                            value: item.abs_value,
                            itemStyle: { color: item.color }
                        })).reverse(),
                        label: { show: true, position: 'right', fontWeight: 'bold', formatter: (v) => v.value + '%' }
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Vertical bars with values comparison
            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = "📊 Topic Attention - Detailed View (Articles count)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => {
                            if (params.length === 0) return '';
                            return params.map(p => {
                                const item = mockData.find(d => d.topic === p.name);
                                return `<strong>${p.name}</strong><br/>${p.seriesName}: ${p.value}`;
                            }).join('<br/>');
                        }
                    },
                    grid: { left: '3%', right: '10%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: mockData.map(item => item.topic).reverse(),
                        axisLabel: { ...ECHART_TEXT_STYLE, interval: 0, rotate: 45 }
                    },
                    yAxis: { type: 'value', axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [
                        {
                            name: 'Yesterday',
                            type: 'bar',
                            data: mockData.map(item => item.yesterday).reverse(),
                            itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] }
                        },
                        {
                            name: 'Today',
                            type: 'bar',
                            data: mockData.map(item => item.today).reverse(),
                            itemStyle: {
                                color: (params) => {
                                    const item = mockData.reverse().find(d => d.topic === params.name);
                                    mockData.reverse();
                                    return item.color;
                                },
                                borderRadius: [4, 4, 0, 0]
                            }
                        }
                    ]
                };
                chart.setOption(option);
            };

            renderPrimary(myChart);
            setupDualChartHover('surge-alert-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        });
}

// --- CHART 4: MEDIA DIVIDE (Horizontal Bar Chart with Dual Hover) ---
function initMediaDivide() {
    const chartDom = document.getElementById('media-divide-chart');
    if (!chartDom) return;

    fetchDashboardJson('outlet_sentiment.json')
        .then(r => r.json())
        .then(data => {
            const myChart = echarts.init(chartDom);
            const titleEl = document.getElementById('media-divide-title');

            // Transform outlet sentiment data
            const outlets = (data.top_10 || []).map(o => ({
                source: o.source,
                sentiment_score: o.mood_score
            }));
            const sortedOutlets = outlets.sort((a, b) => a.sentiment_score - b.sentiment_score);

            // Primary: Horizontal bars
            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = "📰 Media Divide - Comparing outlet sentiment (Hover for vertical view)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => `${params[0].name}: <strong>${params[0].value > 0 ? '+' : ''}${params[0].value.toFixed(1)}</strong>`
                    },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'value',
                        position: 'top',
                        splitLine: { lineStyle: { type: 'dashed' } },
                        axisLabel: { ...ECHART_TEXT_STYLE, formatter: '{value}' }
                    },
                    yAxis: {
                        type: 'category',
                        axisLine: { show: false },
                        axisTick: { show: false },
                        axisLabel: { ...ECHART_TEXT_STYLE, fontWeight: 'bold' },
                        data: sortedOutlets.map(o => o.source)
                    },
                    series: [{
                        name: 'Sentiment',
                        type: 'bar',
                        label: { show: false },
                        data: sortedOutlets.map(outlet => ({
                            value: outlet.sentiment_score || 0,
                            itemStyle: {
                                color: (outlet.sentiment_score || 0) > 0 ? '#22c55e' : '#ef4444'
                            }
                        }))
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Vertical bars
            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = "📰 Media Divide - Vertical Comparison (Hover for horizontal view)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => `${params[0].name}: <strong>${params[0].value > 0 ? '+' : ''}${params[0].value.toFixed(1)}</strong>`
                    },
                    grid: { left: '3%', right: '10%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: sortedOutlets.map(o => o.source),
                        axisLabel: { ...ECHART_TEXT_STYLE, interval: 0, rotate: 45 }
                    },
                    yAxis: { type: 'value', axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [{
                        name: 'Sentiment',
                        type: 'bar',
                        data: sortedOutlets.map(outlet => ({
                            value: outlet.sentiment_score || 0,
                            itemStyle: {
                                color: (outlet.sentiment_score || 0) > 0 ? '#22c55e' : '#ef4444',
                                borderRadius: [4, 4, 0, 0]
                            }
                        })),
                        label: { show: true, position: 'top', formatter: (v) => v.value.toFixed(1) }
                    }]
                };
                chart.setOption(option);
            };

            console.log('✓ Media Divide: Rendering primary view with', sortedOutlets.length, 'outlets');
            renderPrimary(myChart);
            console.log('✓ Media Divide: Setting up dual-chart hover');
            setupDualChartHover('media-divide-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        })
        .catch(error => {
            console.warn('Media Divide Error:', error);
            const myChart = echarts.init(chartDom);
            const titleEl = document.getElementById('media-divide-title');

            const positiveOutlets = MOCK_DATA.mediaDivide.positive_outlets;
            const negativeOutlets = MOCK_DATA.mediaDivide.negative_outlets;
            const allOutlets = [...positiveOutlets, ...negativeOutlets];
            const sortedOutlets = allOutlets.sort((a, b) => a.mood_score - b.mood_score);

            // Primary: Horizontal bars
            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = "📰 Media Divide - Comparing outlet sentiment (Hover for vertical view)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => `${params[0].name}: <strong>${params[0].value > 0 ? '+' : ''}${params[0].value.toFixed(1)}</strong>`
                    },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'value',
                        position: 'top',
                        splitLine: { lineStyle: { type: 'dashed' } },
                        axisLabel: { ...ECHART_TEXT_STYLE, formatter: '{value}' }
                    },
                    yAxis: {
                        type: 'category',
                        axisLine: { show: false },
                        axisTick: { show: false },
                        axisLabel: { ...ECHART_TEXT_STYLE, fontWeight: 'bold' },
                        data: sortedOutlets.map(o => o.source)
                    },
                    series: [{
                        name: 'Sentiment',
                        type: 'bar',
                        label: { show: false },
                        data: sortedOutlets.map(outlet => ({
                            value: outlet.mood_score || 0,
                            itemStyle: {
                                color: (outlet.mood_score || 0) > 0 ? '#22c55e' : '#ef4444'
                            }
                        }))
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Vertical bars
            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = "📰 Media Divide - Vertical Comparison (Hover for horizontal view)";

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => `${params[0].name}: <strong>${params[0].value > 0 ? '+' : ''}${params[0].value.toFixed(1)}</strong>`
                    },
                    grid: { left: '3%', right: '10%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: sortedOutlets.map(o => o.source),
                        axisLabel: { ...ECHART_TEXT_STYLE, interval: 0, rotate: 45 }
                    },
                    yAxis: { type: 'value', axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [{
                        name: 'Sentiment',
                        type: 'bar',
                        data: sortedOutlets.map(outlet => ({
                            value: outlet.mood_score || 0,
                            itemStyle: {
                                color: (outlet.mood_score || 0) > 0 ? '#22c55e' : '#ef4444',
                                borderRadius: [4, 4, 0, 0]
                            }
                        })),
                        label: { show: true, position: 'top', formatter: (v) => v.value.toFixed(1) }
                    }]
                };
                chart.setOption(option);
            };

            console.log('✓ Media Divide (fallback): Rendering primary view with', sortedOutlets.length, 'outlets');
            renderPrimary(myChart);
            console.log('✓ Media Divide (fallback): Setting up dual-chart hover');
            setupDualChartHover('media-divide-chart', myChart, renderPrimary, renderAlternate);
        });
}

// --- CHART 5: SENTIMENT SHOWDOWN (Diverging Bar with Dual Hover) ---
function initSentimentShowdown() {
    const chartDom = document.getElementById('sentiment-showdown-chart');
    if (!chartDom) return;

    fetchDashboardJson('outlet_sentiment.json')
        .then(r => r.json())
        .then(data => {
            const myChart = echarts.init(chartDom);
            const titleEl = document.getElementById('sentiment-showdown-title');

            // Get top positive and negative outlets
            const outlets = (data.top_10 || []).map(o => ({
                outlet: o.source,
                sentiment_score: o.mood_score
            }));
            const positive = outlets.filter(o => (o.sentiment_score || 0) > 0).sort((a, b) => b.sentiment_score - a.sentiment_score)[0];
            const negative = outlets.filter(o => (o.sentiment_score || 0) < 0).sort((a, b) => a.sentiment_score - b.sentiment_score)[0];

            const pos = positive || MOCK_DATA.sentiment.positive;
            const neg = negative || MOCK_DATA.sentiment.negative;

            // Primary: Diverging horizontal bar
            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = `Sentiment Showdown - ${pos.outlet || pos.source} vs ${neg.outlet || neg.source} (Hover for details)`;

                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    grid: { left: '3%', right: '3%', bottom: '3%', containLabel: true },
                    xAxis: { type: 'value', show: false },
                    yAxis: { type: 'category', data: [''], show: false },
                    series: [
                        {
                            name: pos.outlet || pos.source,
                            type: 'bar',
                            stack: 'Showdown',
                            data: [pos.sentiment_score || pos.mood_score],
                            itemStyle: { color: '#22c55e' },
                            label: { show: true, position: 'insideLeft', formatter: `${pos.outlet || pos.source}\n+${(pos.sentiment_score || pos.mood_score).toFixed(1)}`, fontWeight: 'bold', fontSize: 14, color: '#fff' }
                        },
                        {
                            name: neg.outlet || neg.source,
                            type: 'bar',
                            stack: 'Showdown',
                            data: [-(neg.sentiment_score || neg.mood_score)],
                            itemStyle: { color: '#ef4444' },
                            label: { show: true, position: 'insideRight', formatter: `${neg.outlet || neg.source}\n${(neg.sentiment_score || neg.mood_score).toFixed(1)}`, fontWeight: 'bold', fontSize: 14, color: '#fff' }
                        }
                    ]
                };
                chart.setOption(option);
            };

            // Alternate: Side-by-side vertical comparison
            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = `Sentiment Showdown - Side-by-Side Comparison (Hover for diverging view)`;

                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: (params) => {
                            if (!params.length) return '';
                            return params.map(p => `${p.seriesName}: <strong>${p.value > 0 ? '+' : ''}${p.value.toFixed(1)}</strong>`).join('<br/>');
                        }
                    },
                    grid: { left: '3%', right: '3%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: [pos.outlet || pos.source, neg.outlet || neg.source],
                        axisLabel: { ...ECHART_TEXT_STYLE, fontWeight: 'bold' }
                    },
                    yAxis: { type: 'value', axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [
                        {
                            name: pos.outlet || pos.source,
                            type: 'bar',
                            data: [pos.sentiment_score || pos.mood_score, 0],
                            itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
                            label: { show: true, position: 'top' }
                        },
                        {
                            name: neg.outlet || neg.source,
                            type: 'bar',
                            data: [0, neg.sentiment_score || neg.mood_score],
                            itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
                            label: { show: true, position: 'top' }
                        }
                    ]
                };
                chart.setOption(option);
            };

            console.log('✓ Sentiment Showdown: Rendering primary view');
            renderPrimary(myChart);
            console.log('✓ Sentiment Showdown: Setting up dual-chart hover');
            setupDualChartHover('sentiment-showdown-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        })
        .catch(error => {
            console.warn('Sentiment Showdown Error:', error);
            const myChart = echarts.init(chartDom);
            const titleEl = document.getElementById('sentiment-showdown-title');

            const pos = MOCK_DATA.sentiment.positive;
            const neg = MOCK_DATA.sentiment.negative;

            const renderPrimary = (chart) => {
                if (titleEl) titleEl.textContent = `Sentiment Showdown - ${pos.source} vs ${neg.source} (Hover for details)`;

                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    grid: { left: '3%', right: '3%', bottom: '3%', containLabel: true },
                    xAxis: { type: 'value', show: false },
                    yAxis: { type: 'category', data: [''], show: false },
                    series: [
                        {
                            name: pos.source,
                            type: 'bar',
                            stack: 'Showdown',
                            data: [pos.mood_score],
                            itemStyle: { color: '#22c55e' },
                            label: { show: true, position: 'insideLeft', formatter: `${pos.source}\n+${pos.mood_score}`, fontWeight: 'bold', fontSize: 14, color: '#fff' }
                        },
                        {
                            name: neg.source,
                            type: 'bar',
                            stack: 'Showdown',
                            data: [-neg.mood_score],
                            itemStyle: { color: '#ef4444' },
                            label: { show: true, position: 'insideRight', formatter: `${neg.source}\n${neg.mood_score}`, fontWeight: 'bold', fontSize: 14, color: '#fff' }
                        }
                    ]
                };
                chart.setOption(option);
            };

            const renderAlternate = (chart) => {
                if (titleEl) titleEl.textContent = `Sentiment Showdown - Side-by-Side (Hover for diverging view)`;

                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    grid: { left: '3%', right: '3%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: [pos.source, neg.source],
                        axisLabel: { ...ECHART_TEXT_STYLE, fontWeight: 'bold' }
                    },
                    yAxis: { type: 'value', axisLabel: { ...ECHART_TEXT_STYLE } },
                    series: [
                        {
                            name: pos.source,
                            type: 'bar',
                            data: [pos.mood_score, 0],
                            itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
                            label: { show: true, position: 'top' }
                        },
                        {
                            name: neg.source,
                            type: 'bar',
                            data: [0, neg.mood_score],
                            itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
                            label: { show: true, position: 'top' }
                        }
                    ]
                };
                chart.setOption(option);
            };

            console.log('✓ Sentiment Showdown (fallback): Rendering primary view');
            renderPrimary(myChart);
            console.log('✓ Sentiment Showdown (fallback): Setting up dual-chart hover');
            setupDualChartHover('sentiment-showdown-chart', myChart, renderPrimary, renderAlternate);
        });
}

// --- CHART 6: CATEGORY DOMINANCE (Pie Chart with Dual Hover) ---
function initCategoryDominance() {
    const container = document.getElementById('category-dominance-chart');
    if (!container) return;

    fetchDashboardJson('category_dominance.json')
        .then(r => r.json())
        .then(data => {
            const myChart = echarts.init(container);
            const categories = data.categories || [];
            const labels = categories.map(c => c.name || 'Unknown');
            const values = categories.map(c => c.value || 0);
            const total = values.reduce((a, b) => a + b, 0);
            const percentages = values.map(v => ((v / total) * 100).toFixed(1));
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

            // Primary: Pie with legend
            const renderPrimary = (chart) => {
                const option = {
                    tooltip: {
                        trigger: 'item',
                        formatter: (params) => `${params.name}: ${params.value} articles (${params.percent}%)`
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'right',
                        data: labels,
                        textStyle: { ...ECHART_TEXT_STYLE, fontSize: 12 }
                    },
                    series: [{
                        name: 'Articles',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        data: labels.map((label, i) => ({
                            value: values[i],
                            name: label,
                            itemStyle: { color: colors[i % colors.length] }
                        })),
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Pie with labels and percentages inside slices
            const renderAlternate = (chart) => {
                const option = {
                    tooltip: {
                        trigger: 'item',
                        formatter: (params) => `${params.name}: ${params.value} articles (${params.percent}%)`
                    },
                    series: [{
                        name: 'Articles',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        data: labels.map((label, i) => ({
                            value: values[i],
                            name: label,
                            itemStyle: { color: colors[i % colors.length] }
                        })),
                        label: {
                            show: true,
                            position: 'inside',
                            formatter: (params) => {
                                const idx = labels.indexOf(params.name);
                                return `${params.name}\n${percentages[idx]}%`;
                            },
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textShadowColor: 'rgba(0, 0, 0, 0.7)',
                            textShadowBlur: 3
                        },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                };
                chart.setOption(option);
            };

            console.log('✓ Category Dominance: Rendering primary view');
            renderPrimary(myChart);
            console.log('✓ Category Dominance: Setting up dual-chart hover');
            setupDualChartHover('category-dominance-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        })
        .catch(() => {
            const myChart = echarts.init(container);
            const labels = MOCK_DATA.categories.labels;
            const values = MOCK_DATA.categories.data;
            const total = values.reduce((a, b) => a + b, 0);
            const percentages = values.map(v => ((v / total) * 100).toFixed(1));
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

            // Primary: Pie with legend
            const renderPrimary = (chart) => {
                const option = {
                    tooltip: {
                        trigger: 'item',
                        formatter: (params) => `${params.name}: ${params.value} articles (${params.percent}%)`
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'right',
                        data: labels,
                        textStyle: { ...ECHART_TEXT_STYLE, fontSize: 12 }
                    },
                    series: [{
                        name: 'Articles',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        data: labels.map((label, i) => ({
                            value: values[i],
                            name: label,
                            itemStyle: { color: colors[i % colors.length] }
                        })),
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Pie with labels and percentages inside slices
            const renderAlternate = (chart) => {
                const option = {
                    tooltip: {
                        trigger: 'item',
                        formatter: (params) => `${params.name}: ${params.value} articles (${params.percent}%)`
                    },
                    series: [{
                        name: 'Articles',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        data: labels.map((label, i) => ({
                            value: values[i],
                            name: label,
                            itemStyle: { color: colors[i % colors.length] }
                        })),
                        label: {
                            show: true,
                            position: 'inside',
                            formatter: (params) => {
                                const idx = labels.indexOf(params.name);
                                return `${params.name}\n${percentages[idx]}%`;
                            },
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textShadowColor: 'rgba(0, 0, 0, 0.7)',
                            textShadowBlur: 3
                        },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }]
                };
                chart.setOption(option);
            };

            console.log('✓ Category Dominance (fallback): Rendering primary view');
            renderPrimary(myChart);
            console.log('✓ Category Dominance (fallback): Setting up dual-chart hover');
            setupDualChartHover('category-dominance-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        });
}

// --- CHART 7: SOURCE PRODUCTIVITY (Horizontal Bar) ---
function initSourceProductivity() {
    const canvas = document.getElementById('source-productivity-chart');
    if (!canvas) {
        console.warn('source-productivity-chart canvas not found');
        return;
    }

    // Wait for Chart.js to load
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, retrying in 100ms...');
        setTimeout(initSourceProductivity, 100);
        return;
    }

    fetchDashboardJson('source_productivity.json')
        .then(r => r.json())
        .then(data => {
            if (!data || !data.top_sources) {
                throw new Error('Invalid data structure: missing top_sources');
            }

            const sources = (data.top_sources || []).slice(0, 8);
            const labels = sources.map(s => s.source || 'Unknown');
            const values = sources.map(s => s.count || 0);

            console.log('✓ Source productivity chart data loaded:', labels);

            // Ensure canvas context is available
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context is not available');
            }

            // Get parent container dimensions
            const parent = canvas.parentElement;
            const width = parent.clientWidth;
            const height = parent.clientHeight;

            console.log('Canvas dimensions:', { width, height });
            // CRITICAL FIX: Set explicit canvas dimensions before Chart.js init
            canvas.style.width = "100%";
            canvas.style.height = "100%";

            // Also set actual width/height attributes for proper canvas rendering
            canvas.width = width;
            canvas.height = height;

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Articles Published',
                        data: values,
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6',
                        borderWidth: 0,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            padding: 12,
                            titleColor: '#fff',
                            bodyColor: '#fff'
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: { color: '#6b7280' },
                            grid: { color: '#e5e7eb' }
                        },
                        y: {
                            ticks: { color: '#6b7280' },
                            grid: { display: false }
                        }
                    }
                }
            });
            console.log('✓ Source productivity chart rendered successfully');
        })
        .catch((error) => {
            console.warn('⚠️ Failed to load source_productivity.json, using mock data:', error);

            // Ensure Chart is available before rendering mock data
            if (typeof Chart === 'undefined') {
                console.error('Chart.js still not available, cannot render mock data');
                return;
            }

            try {
                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: MOCK_DATA.sources.labels,
                        datasets: [{
                            label: 'Articles Published',
                            data: MOCK_DATA.sources.data,
                            backgroundColor: '#3b82f6',
                            borderRadius: 4,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { beginAtZero: true }
                        }
                    }
                });
                console.log('✓ Rendered mock source productivity data');
            } catch (chartError) {
                console.error('Error rendering source productivity chart:', chartError);
            }
        });
}

// --- CHART 8: PUBLISHING RHYTHM (Line Chart with Clock View) ---
function initPublishingRhythm() {
    const container = document.getElementById('publishing-rhythm-chart');
    if (!container) return;

    fetchDashboardJson('publishing_rhythm.json')
        .then(r => r.json())
        .then(data => {
            const myChart = echarts.init(container);
            const hourlyData = data.hourly_counts || [];
            const hourLabels = hourlyData.map((_, i) => `${i}:00`);

            // Primary: Line chart
            const renderPrimary = (chart) => {
                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: hourLabels,
                        axisLabel: { ...ECHART_TEXT_STYLE }
                    },
                    yAxis: {
                        type: 'value',
                        name: 'Articles Published',
                        nameTextStyle: { ...ECHART_TEXT_STYLE },
                        axisLabel: { ...ECHART_TEXT_STYLE }
                    },
                    series: [{
                        name: 'Articles',
                        type: 'line',
                        data: hourlyData,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 6,
                        lineStyle: { color: '#3b82f6', width: 2 },
                        itemStyle: { color: '#3b82f6' },
                        areaStyle: { color: 'rgba(59, 130, 246, 0.2)' }
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Vertical bar chart showing peak hours (IMPROVED)
            const renderAlternate = (chart) => {
                const maxValue = Math.max(...hourlyData);
                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        textStyle: { color: '#f1f5f9', fontSize: 13, fontWeight: 600 },
                        borderColor: '#e2e8f0'
                    },
                    grid: { left: '5%', right: '8%', bottom: '18%', top: '8%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: hourLabels,
                        axisLabel: {
                            ...ECHART_TEXT_STYLE,
                            rotate: 45,
                            interval: 0,
                            fontSize: 12,
                            fontWeight: 600
                        },
                        axisLine: { lineStyle: { color: '#cbd5e1' } }
                    },
                    yAxis: {
                        type: 'value',
                        name: 'Articles Published',
                        nameTextStyle: { ...ECHART_TEXT_STYLE, fontSize: 14, fontWeight: 700 },
                        axisLabel: { ...ECHART_TEXT_STYLE, fontSize: 12 },
                        axisLine: { lineStyle: { color: '#cbd5e1' } },
                        splitLine: { lineStyle: { color: 'rgba(203, 213, 225, 0.3)' } }
                    },
                    series: [{
                        name: 'Articles',
                        type: 'bar',
                        data: hourlyData.map((val, i) => ({
                            value: val,
                            itemStyle: {
                                color: val === maxValue ? '#ef4444' : '#3b82f6',
                                borderRadius: [6, 6, 0, 0],
                                shadowColor: 'rgba(59, 130, 246, 0.3)',
                                shadowBlur: 8
                            }
                        })),
                        label: {
                            show: true,
                            position: 'top',
                            formatter: '{c}',
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#0f172a'
                        },
                        barWidth: '60%'
                    }]
                };
                chart.setOption(option);
            };

            console.log('✓ Publishing Rhythm: Rendering primary view with', hourlyData.length, 'hours');
            renderPrimary(myChart);
            console.log('✓ Publishing Rhythm: Setting up dual-chart hover');
            setupDualChartHover('publishing-rhythm-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        })
        .catch(() => {
            const myChart = echarts.init(container);
            const hourlyData = MOCK_DATA.rhythm.data;
            const hourLabels = MOCK_DATA.rhythm.labels;

            // Primary: Line chart
            const renderPrimary = (chart) => {
                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    grid: { left: '3%', right: '10%', bottom: '3%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: hourLabels,
                        axisLabel: { ...ECHART_TEXT_STYLE }
                    },
                    yAxis: {
                        type: 'value',
                        name: 'Articles Published',
                        nameTextStyle: { ...ECHART_TEXT_STYLE },
                        axisLabel: { ...ECHART_TEXT_STYLE }
                    },
                    series: [{
                        name: 'Articles',
                        type: 'line',
                        data: hourlyData,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 6,
                        lineStyle: { color: '#3b82f6', width: 2 },
                        itemStyle: { color: '#3b82f6' },
                        areaStyle: { color: 'rgba(59, 130, 246, 0.2)' }
                    }]
                };
                chart.setOption(option);
            };

            // Alternate: Vertical bar chart showing peak hours
            const renderAlternate = (chart) => {
                const maxValue = Math.max(...hourlyData);
                const option = {
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    grid: { left: '3%', right: '10%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                        type: 'category',
                        data: hourLabels,
                        axisLabel: { ...ECHART_TEXT_STYLE, rotate: 45, interval: 0 }
                    },
                    yAxis: {
                        type: 'value',
                        name: 'Article Count',
                        nameTextStyle: { ...ECHART_TEXT_STYLE },
                        axisLabel: { ...ECHART_TEXT_STYLE }
                    },
                    series: [{
                        name: 'Articles',
                        type: 'bar',
                        data: hourlyData.map((val, i) => ({
                            value: val,
                            itemStyle: {
                                color: val === maxValue ? '#ef4444' : '#3b82f6',
                                borderRadius: [4, 4, 0, 0]
                            }
                        })),
                        label: {
                            show: true,
                            position: 'top',
                            formatter: '{c}',
                            fontSize: 10,
                            color: '#94a3b8'
                        }
                    }]
                };
                chart.setOption(option);
            };

            console.log('✓ Publishing Rhythm (fallback): Rendering primary view');
            renderPrimary(myChart);
            console.log('✓ Publishing Rhythm (fallback): Setting up dual-chart hover');
            setupDualChartHover('publishing-rhythm-chart', myChart, renderPrimary, renderAlternate);

            window.addEventListener('resize', () => myChart.resize());
        });
}

// --- CHART 9: WORDCLOUD ---
function initWordcloud() {
    const container = document.getElementById('wordcloud-chart');
    if (!container) return;

    fetchDashboardJson('wordcloud.json')
        .then(r => r.json())
        .then(data => {
            if (!window.echarts) {
                console.error('ECharts not loaded');
                return;
            }

            // Comprehensive stop words list - HTML artifacts, pronouns, prepositions, common words
            const stopWords = new Set([
                // HTML artifacts
                'href', 'https', 'http', 'apos', 'quot', 'nbsp', 'amp', 'lt', 'gt',
                // Pronouns
                'the', 'a', 'an', 'i', 'me', 'we', 'he', 'she', 'it', 'they', 'you', 'him', 'her', 'them', 'his', 'hers', 'our', 'ours', 'their', 'theirs',
                // Prepositions and conjunctions
                'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'that', 'this', 'as', 'about', 'is', 'are', 'was', 'were',
                // Common verbs
                'be', 'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'can',
                // Common words
                'said', 'say', 'says', 'like', 'go', 'just', 'now', 'more', 'also', 'very', 'some', 'which', 'get', 'been',
                // Single/double letters and numbers
                ...[...Array(26)].map((_, i) => String.fromCharCode(97 + i)), // a-z
                ...[...Array(10)].map((_, i) => i.toString()) // 0-9
            ]);

            const wordData = (data.keywords || [])
                .filter(k => {
                    // Filter: must have name and value, length > 3 chars, not a stop word
                    return k.name && k.value && k.name.length > 3 && !stopWords.has(k.name.toLowerCase());
                })
                .sort((a, b) => b.value - a.value) // Sort by frequency descending
                .slice(0, 50) // Get top 50 keywords (more content for better cloud)
                .map(k => ({ name: k.name, value: k.value }));

            if (wordData.length === 0) {
                wordData.push(...[
                    { name: 'Technology', value: 450 },
                    { name: 'News', value: 380 },
                    { name: 'Politics', value: 320 }
                ]);
            }

            const chart = echarts.init(container);
            const titleEl = document.getElementById('wordcloud-title') || document.createElement('div');

            // Primary: Wordcloud
            const renderPrimary = (chartInstance) => {
                if (titleEl) titleEl.textContent = '☁️ Trending Keywords - Visual Cloud';

                const option = {
                    tooltip: {},
                    series: [{
                        type: 'wordCloud',
                        shape: 'square', // Best packing efficiency
                        left: 'center',
                        top: 'center',
                        width: '100%',
                        height: '100%',
                        right: null,
                        bottom: null,
                        gridSize: 8, // Slightly tighter spacing for bigger glyphs
                        sizeRange: [32, 72], // Larger font range for better readability
                        rotationRange: [0, 0], // No rotation - text is straight and readable
                        emphasis: {
                            focus: 'self',
                            textStyle: {
                                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                                textShadowBlur: 10
                            }
                        },
                        textStyle: {
                            color: () => {
                                // Better color distribution - more vibrant
                                const hue = Math.random() * 360;
                                return `hsl(${hue}, 70%, 50%)`;
                            },
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 'bold'
                        },
                        data: wordData
                    }]
                };
                chartInstance.setOption(option);
            };

            console.log('✓ Wordcloud: Rendering primary view with', wordData.length, 'keywords');
            renderPrimary(chart);
            console.log('✓ Wordcloud: Displaying cloud only (bar view disabled)');

            window.addEventListener('resize', () => chart.resize());
        })
        .catch(error => {
            console.warn('Wordcloud Error:', error);
            const chart = echarts.init(container);
            const titleEl = document.getElementById('wordcloud-title') || document.createElement('div');
            const mockWords = [
                { name: 'Technology', value: 450 },
                { name: 'News', value: 380 },
                { name: 'Politics', value: 320 },
                { name: 'Health', value: 280 },
                { name: 'Business', value: 250 },
                { name: 'Climate', value: 200 },
                { name: 'Entertainment', value: 180 },
                { name: 'Sports', value: 160 }
            ];

            // Primary: Wordcloud
            const renderPrimary = (chartInstance) => {
                if (titleEl) titleEl.textContent = '☁️ Trending Keywords - Visual Cloud';

                const option = {
                    tooltip: {},
                    series: [{
                        type: 'wordCloud',
                        shape: 'square',
                        left: 'center',
                        top: 'center',
                        width: '100%',
                        height: '100%',
                        right: null,
                        bottom: null,
                        gridSize: 8,
                        sizeRange: [32, 72],
                        rotationRange: [0, 0], // Straight text
                        emphasis: {
                            focus: 'self',
                            textStyle: {
                                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                                textShadowBlur: 10
                            }
                        },
                        textStyle: {
                            color: () => {
                                const hue = Math.random() * 360;
                                return `hsl(${hue}, 70%, 50%)`;
                            },
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 'bold'
                        },
                        data: mockWords
                    }]
                };
                chartInstance.setOption(option);
            };

            console.log('✓ Wordcloud (fallback): Rendering primary view with', mockWords.length, 'keywords');
            renderPrimary(chart);
            console.log('✓ Wordcloud (fallback): Displaying cloud only (bar view disabled)');
        });
}

// --- CHART 10: CROSS-SOURCE STORIES ---
function initCrossSourceStories() {
    const container = document.getElementById('cross-source-container');
    if (!container) return;

    fetchDashboardJson('cross_source_stories.json')
        .then(r => r.json())
        .then(data => {
            const stories = data.stories || [];
            
            if (stories.length === 0) {
                // Don't show placeholder - let fallback handle it
                return;
            }

            let html = '';
            stories.slice(0, 10).forEach(story => {
                const outlets = story.sources || story.outlets || [];
                html += `
                    <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background 0.2s;">
                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 8px; line-height: 1.5;">${story.headline || 'Untitled'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            <strong>${outlets.length}</strong> outlets: ${outlets.slice(0, 3).join(', ')}${outlets.length > 3 ? '...' : ''}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        })
        .catch(error => {
            console.warn('Cross-source Error:', error);
            // Silently fail - don't show error message
        });
}

// ============================================
// INITIALIZE ALL CHARTS ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing Tagtaly Dashboard Charts...');

    // Ensure chart containers have proper sizing
    ensureChartContainerSizes();

    // Initialize all charts in order
    console.log('📊 Loading: Emotional Rollercoaster');
    initEmotionalRollercoaster();

    console.log('📊 Loading: Weekly Winner');
    initWeeklyWinner();

    console.log('📊 Loading: Surge Alert');
    initSurgeAlert();

    console.log('📊 Loading: Media Divide');
    initMediaDivide();

    console.log('📊 Loading: Sentiment Showdown');
    initSentimentShowdown();

    console.log('📊 Loading: Category Dominance');
    initCategoryDominance();

    console.log('📊 Loading: Source Productivity');
    initSourceProductivity();

    console.log('📊 Loading: Publishing Rhythm');
    initPublishingRhythm();

    console.log('📊 Loading: Wordcloud');
    initWordcloud();

    console.log('📊 Loading: Cross-Source Stories');
    initCrossSourceStories();

    console.log('✅ All charts initialized successfully!');
});
