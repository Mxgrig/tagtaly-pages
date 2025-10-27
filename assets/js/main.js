// Tagtaly Website JavaScript
// Enhanced with centralized data provider and dynamic updates

// Mobile menu toggle (for future implementation)
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

/**
 * Legacy updateStatistics function - maintained for backwards compatibility
 * Now delegates to the new dynamic updates system
 */
async function updateStatistics() {
    try {
        const data = await dataProvider.loadAllData();
        updateAllStatistics(data);
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

/**
 * Enhanced initialization on page load
 * Loads all data and updates all page components
 */
async function initializePageContent() {
    try {
        console.log('🚀 Initializing Tagtaly page...');
        
        // Load and update all page content
        await updateAllPageContent();
        
        // Setup auto-refresh every 30 minutes
        setupAutoRefresh(30);
        
        console.log('✅ Page initialization complete');
    } catch (error) {
        console.error('❌ Error during page initialization:', error);
    }
}

// Chart loading functionality
function loadLatestCharts() {
    // Charts are now dynamically loaded through dynamic-updates.js
    // The updateAllPageContent() function handles all chart rendering
    console.log('📊 Charts loading via dynamic update system...');
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

// Listen for data updates to trigger animations or other effects
document.addEventListener('tagtaly-data-updated', function(e) {
    console.log('📡 Data updated event fired:', e.detail);
    
    // Add animation class to updated elements
    document.querySelectorAll('[data-stat].updated').forEach(el => {
        el.classList.add('pulse-animation');
        setTimeout(() => el.classList.remove('pulse-animation'), 1000);
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Tagtaly website loaded');

    // Initialize all page content with new system
    initializePageContent();
});

// Fallback for when scripts are loaded in different order
if (document.readyState !== 'loading') {
    console.log('📄 Tagtaly website already loaded (DOMContentLoaded already fired)');
    initializePageContent();
}
