/**
 * Count frequency of keys extracted from items.
 * General-purpose helper that eliminates the repeated pattern of:
 * build-frequency-map → convert-to-array → sort-descending.
 *
 * @param {Object[]} items - Source objects.
 * @param {function(Object): string|string[]} keyFn - Returns one key (string)
 *   or multiple keys (string[]) per item.
 * @returns {{ name: string, count: number }[]} Sorted descending by count.
 */
function _countFrequency(items, keyFn) {
    // Use a null-prototype map so attacker-controlled keys cannot collide
    // with inherited Object.prototype members (e.g. "__proto__",
    // "hasOwnProperty", "toString") and poison the frequency table
    // (CWE-1321).  Removes the need for hasOwnProperty guards on read.
    var map = Object.create(null);
    for (var i = 0; i < items.length; i++) {
        var keys = keyFn(items[i]);
        if (!Array.isArray(keys)) keys = [keys];
        for (var j = 0; j < keys.length; j++) {
            var k = keys[j];
            map[k] = (map[k] || 0) + 1;
        }
    }
    var result = [];
    for (var key in map) {
        result.push({ name: key, count: map[key] });
    }
    result.sort(function(a, b) { return b.count - a.count; });
    return result;
}

/**
 * Compute category frequency distribution across projects.
 * @param {Array} [projects=PROJECTS] - Projects to analyze.
 * @returns {Array<{name: string, count: number}>} Categories sorted by count descending.
 */
function computeCategoryDistribution(projects) {
    return _countFrequency(projects || PROJECTS, function(p) { return p.category; });
}

/**
 * Compute language/tag frequency from projects.
 * Returns sorted array of { name, count } objects (descending by count).
 */
function computeTagDistribution(projects) {
    return _countFrequency(projects || PROJECTS, function(p) { return p.tags || []; });
}

/**
 * Compute portfolio summary statistics.
 *
 * @param {Array} [projects=PROJECTS] - Projects to summarize.
 * @param {Array<{name:string,count:number}>} [catDist] - Pre-computed
 *   category distribution.  Pass it in when the caller has already
 *   built one (see buildAnalyticsPanel) to avoid recomputing the same
 *   O(N) distribution twice on each panel render.
 * @param {Array<{name:string,count:number}>} [tagDist] - Pre-computed
 *   tag distribution.  Same optimization rationale as catDist.
 * @returns {{totalProjects:number,totalCategories:number,totalTags:number,totalLinks:number,avgTagsPerProject:number}}
 */
function computePortfolioSummary(projects, catDist, tagDist) {
    var items = projects || PROJECTS;
    if (!catDist) catDist = computeCategoryDistribution(items);
    if (!tagDist) tagDist = computeTagDistribution(items);

    var totalLinks = 0;
    var totalTags = 0;
    for (var i = 0; i < items.length; i++) {
        totalLinks += (items[i].links || []).length;
        totalTags += (items[i].tags || []).length;
    }

    return {
        totalProjects: items.length,
        totalCategories: catDist.length,
        totalTags: tagDist.length,
        totalLinks: totalLinks,
        avgTagsPerProject: items.length > 0 ? Math.round((totalTags / items.length) * 10) / 10 : 0
    };
}

/**
 * Build a horizontal bar chart HTML string.
 */
function buildBarChart(data, maxBars) {
    if (!data || data.length === 0) return '<p class="bar-empty">No data</p>';
    var limit = maxBars || 10;
    var items = data.slice(0, limit);
    var max = items[0].count;
    var html = '';
    for (var i = 0; i < items.length; i++) {
        var pct = max > 0 ? Math.round((items[i].count / max) * 100) : 0;
        html += '<div class="bar-row">' +
            '<span class="bar-label">' + escapeHTML(items[i].name) + '</span>' +
            '<div class="bar-track"><div class="bar-fill c' + (i % 10) + '" style="width:' + pct + '%"></div></div>' +
            '<span class="bar-value">' + items[i].count + '</span>' +
            '</div>';
    }
    return html;
}

/**
 * Build a tag cloud HTML string with frequency-based sizing (1-5).
 */
function buildTagCloud(tags, maxTags) {
    if (!tags || tags.length === 0) return '<p class="bar-empty">No tags</p>';
    var limit = maxTags || 20;
    var items = tags.slice(0, limit);
    var max = items[0].count;
    var min = items[items.length - 1].count;
    var range = max - min;

    var sorted = items.slice().sort(function(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    var html = '<div class="tag-cloud">';
    for (var i = 0; i < sorted.length; i++) {
        var size;
        if (range === 0) {
            size = 3;
        } else {
            size = Math.ceil(((sorted[i].count - min) / range) * 4) + 1;
            if (size > 5) size = 5;
        }
        html += '<span class="tag-cloud-item size-' + size + '" title="' +
            escapeHTML(sorted[i].name) + ': ' + sorted[i].count + ' project' +
            (sorted[i].count !== 1 ? 's' : '') + '">' +
            escapeHTML(sorted[i].name) + '</span>';
    }
    html += '</div>';
    return html;
}

/**
 * Build the complete analytics panel inner HTML.
 */
function buildAnalyticsPanel(projects) {
    // Compute each distribution once, then thread the results through to
    // computePortfolioSummary so it does not redundantly rebuild them.
    // Without this, every panel render walked PROJECTS four times instead
    // of twice.
    var catDist = computeCategoryDistribution(projects);
    var tagDist = computeTagDistribution(projects);
    var summary = computePortfolioSummary(projects, catDist, tagDist);

    var html = '<div class="analytics-grid">' +
        '<div class="analytics-card"><h4>Projects by Category</h4>' +
        buildBarChart(catDist) + '</div>' +
        '<div class="analytics-card"><h4>Technology Tags</h4>' +
        buildTagCloud(tagDist) + '</div>' +
        '</div>' +
        '<div class="analytics-summary">' +
        '<div class="summary-item"><div class="summary-value">' + summary.totalProjects + '</div><div class="summary-label">Projects</div></div>' +
        '<div class="summary-item"><div class="summary-value">' + summary.totalCategories + '</div><div class="summary-label">Categories</div></div>' +
        '<div class="summary-item"><div class="summary-value">' + summary.totalTags + '</div><div class="summary-label">Unique Tags</div></div>' +
        '<div class="summary-item"><div class="summary-value">' + summary.totalLinks + '</div><div class="summary-label">Links</div></div>' +
        '<div class="summary-item"><div class="summary-value">' + summary.avgTagsPerProject + '</div><div class="summary-label">Avg Tags/Project</div></div>' +
        '</div>';
    return html;
}

/**
 * Toggle the analytics panel visibility. Lazily renders on first open.
 */
var _analyticsRendered = false;
/** Toggle the analytics panel visibility and render charts on first open. */
function toggleAnalytics() {
    var panel = (typeof document !== "undefined") ? document.getElementById("analytics-panel") : null;
    var btn = (typeof document !== "undefined") ? document.getElementById("analytics-toggle") : null;
    if (!panel) return false;

    var isVisible = panel.classList.contains("visible");
    if (isVisible) {
        panel.classList.remove("visible");
        if (btn) {
            btn.classList.remove("active");
            btn.setAttribute("aria-expanded", "false");
        }
        return false;
    }

    if (!_analyticsRendered) {
        panel.innerHTML = buildAnalyticsPanel();
        _analyticsRendered = true;
    }
    panel.classList.add("visible");
    if (btn) {
        btn.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
    }
    return true;
}

/**
 * Initialize the analytics panel toggle button.
 */
function initAnalytics() {
    if (typeof document === "undefined") return;
    var btn = document.getElementById("analytics-toggle");
    if (btn) {
        btn.addEventListener("click", toggleAnalytics);
    }
}
