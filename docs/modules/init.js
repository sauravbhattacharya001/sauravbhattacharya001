
/**
 * Initialize the portfolio app — render projects, wire up filters,
 * theme, keyboard nav, analytics, spotlight, tech radar, quiz, and timeline.
 */
function initApp() {
    initSortAndView();
    initBookmarks();
    renderProjects();
    initFilters();
    initDeepLink();
    initTheme();
    initKeyboardNav();
    initAnalytics();
    initSpotlight();
    initTechRadar();
    initCompare();
    initQuiz();
    initTimeline();
}

// Auto-initialize on DOM ready
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApp);
    } else {
        initApp();
    }
}

// Exports for testing
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        PROJECTS: PROJECTS,
        _filterState: _filterState,
        // HTML helpers
        escapeHTML: escapeHTML,
        sanitizeURL: sanitizeURL,
        // Card builders
        buildCard: buildCard,
        buildCardHeader: buildCardHeader,
        buildCardTags: buildCardTags,
        buildCardLinks: buildCardLinks,
        buildTagList: buildTagList,
        buildLinkList: buildLinkList,
        buildCategoryHTML: buildCategoryHTML,
        // Query & filter
        projectMatchesQuery: projectMatchesQuery,
        groupByCategory: groupByCategory,
        extractCategories: extractCategories,
        filterProjects: filterProjects,
        // Rendering & init
        renderProjects: renderProjects,
        createFilterPills: createFilterPills,
        wireFilterEvents: wireFilterEvents,
        initFilters: initFilters,
        // Tag filtering
        updateTagIndicator: updateTagIndicator,
        clearTagFilter: clearTagFilter,
        setTagFilter: setTagFilter,
        extractTags: extractTags,
        wireTagClicks: wireTagClicks,
        // Theme
        getPreferredTheme: getPreferredTheme,
        applyTheme: applyTheme,
        toggleTheme: toggleTheme,
        initTheme: initTheme,
        // Keyboard navigation
        _kbState: _kbState,
        getVisibleCards: getVisibleCards,
        focusCard: focusCard,
        blurCards: blurCards,
        openFocusedCard: openFocusedCard,
        showKeyboardHelp: showKeyboardHelp,
        hideKeyboardHelp: hideKeyboardHelp,
        toggleKeyboardHelp: toggleKeyboardHelp,
        initKeyboardNav: initKeyboardNav,
        buildHelpOverlay: buildHelpOverlay,
        // Sort & View
        SORT_ORDERS: SORT_ORDERS,
        sortProjects: sortProjects,
        setSortOrder: setSortOrder,
        setViewMode: setViewMode,
        initSortAndView: initSortAndView,
        buildSortControls: buildSortControls,
        buildViewToggle: buildViewToggle,
        // Bookmarks
        _bookmarks: _bookmarks,
        isBookmarked: isBookmarked,
        getBookmarkCount: getBookmarkCount,
        toggleBookmark: toggleBookmark,
        setBookmarkFilter: setBookmarkFilter,
        initBookmarks: initBookmarks,
        // Deep Link
        _deepLinkEnabled: _deepLinkEnabled,
        serializeFilterState: serializeFilterState,
        deserializeFilterState: deserializeFilterState,
        pushFilterState: pushFilterState,
        initDeepLink: initDeepLink,
        // Search index (perf)
        _searchIndex: _searchIndex,
        // Analytics
        computeCategoryDistribution: computeCategoryDistribution,
        computeTagDistribution: computeTagDistribution,
        computePortfolioSummary: computePortfolioSummary,
        buildBarChart: buildBarChart,
        buildTagCloud: buildTagCloud,
        buildAnalyticsPanel: buildAnalyticsPanel,
        toggleAnalytics: toggleAnalytics,
        initAnalytics: initAnalytics,
        // Spotlight Carousel
        _spotlightState: _spotlightState,
        buildSpotlightCard: buildSpotlightCard,
        renderSpotlight: renderSpotlight,
        nextSpotlight: nextSpotlight,
        prevSpotlight: prevSpotlight,
        goToSpotlight: goToSpotlight,
        toggleSpotlightPause: toggleSpotlightPause,
        startSpotlightTimer: startSpotlightTimer,
        stopSpotlightTimer: stopSpotlightTimer,
        wireSpotlightEvents: wireSpotlightEvents,
        initSpotlight: initSpotlight,
        // Tech Stack Radar
        TECH_CATEGORIES: TECH_CATEGORIES,
        _techRadarState: _techRadarState,
        computeTechStack: computeTechStack,
        groupTechByType: groupTechByType,
        buildTechRadar: buildTechRadar,
        renderTechRadar: renderTechRadar,
        toggleTechRadar: toggleTechRadar,
        setTechRadarFilter: setTechRadarFilter,
        wireTechRadarEvents: wireTechRadarEvents,
        initTechRadar: initTechRadar,
        // Project Comparison (namespace + legacy aliases)
        Compare: Compare,
        _compareSet: _compareSet,
        _buildCompareRow: _buildCompareRow,
        toggleCompare: toggleCompare,
        clearCompare: clearCompare,
        syncCompareUI: syncCompareUI,
        renderComparePanel: renderComparePanel,
        closeCompare: closeCompare,
        buildCompareBar: buildCompareBar,
        buildCompareCheckbox: buildCompareCheckbox,
        initCompare: initCompare,
        // Modal focus management
        _modalState: _modalState,
        _activateModal: _activateModal,
        _deactivateModal: _deactivateModal,
        _handleModalTab: _handleModalTab,
        // Project Finder Quiz
        _quizState: _quizState,
        QUIZ_QUESTIONS: QUIZ_QUESTIONS,
        startQuiz: startQuiz,
        answerQuiz: answerQuiz,
        renderQuizStep: renderQuizStep,
        renderQuizResults: renderQuizResults,
        resetQuiz: resetQuiz,
        toggleQuiz: toggleQuiz,
        initQuiz: initQuiz,
        // Project Timeline (namespace + legacy aliases)
        Timeline: Timeline,
        TIMELINE_DATA: TIMELINE_DATA,
        TIMELINE_COLORS: TIMELINE_COLORS,
        TIMELINE_COLORS_LIGHT: TIMELINE_COLORS_LIGHT,
        _timelineState: _timelineState,
        parseTimelineDate: parseTimelineDate,
        formatTimelineDate: formatTimelineDate,
        buildTimelineEntries: buildTimelineEntries,
        computeTimelineRange: computeTimelineRange,
        timelinePosition: timelinePosition,
        buildTimelineMarkers: buildTimelineMarkers,
        getTimelineColors: getTimelineColors,
        renderTimeline: renderTimeline,
        toggleTimeline: toggleTimeline,
        setTimelineZoom: setTimelineZoom,
        setTimelineFilter: setTimelineFilter,
        wireTimelineEvents: wireTimelineEvents,
        initTimeline: initTimeline,
        // App bootstrap
        initApp: initApp
    };
}
