// ── Tech Stack Radar ────────────────────────────────────────────────

/**
 * Tech Stack Radar — interactive visualization of technologies used
 * across all portfolio projects, with type filtering and tag-click
 * integration.
 *
 * @namespace TechRadar
 */
var TechRadar = (function () {
    /**
     * Classification map: tag name → category type.
     * Tags not listed default to "Domain".
     */
    var CATEGORIES = {
        "Python": "Language", "JavaScript": "Language", "C#": "Language",
        "C": "Language", "Java": "Language", "OCaml": "Language",
        "Dart": "Language", "Swift": "Language", "HTML/JS": "Language",
        "Node.js": "Framework", ".NET 8": "Framework", "ASP.NET": "Framework",
        "Flutter": "Framework", "WPF": "Framework", "BLoC": "Framework",
        "MVC": "Framework", "GPT-4o": "Framework", "Azure OpenAI": "Framework",
        "Compiler": "Tool", "Observability": "Tool", "Analytics": "Tool",
        "Data Viz": "Tool", "Visualization": "Tool", "Code Execution": "Tool",
        "Monte Carlo": "Tool", "RSS": "Tool"
    };

    var _state = { expanded: false, activeType: null };

    // ── Memoization ──────────────────────────────────────────────
    //
    // PROJECTS is built once at page load and never mutated at runtime, so
    // computeStack()/groupByType() are pure functions of constant inputs.
    // Without caching, every render() (i.e. every type-pill click or panel
    // toggle) walked all N projects × T tags to rebuild identical output,
    // and buildPanel() also rebuilt the same projectList strings inside its
    // tooltip loop. We now compute the stack, type-groups, and per-item
    // joined projectList exactly once and reuse them.
    //
    // _cacheKey lets tests / dynamic callers force an invalidation by
    // mutating PROJECTS and pointing _cacheKey at a new sentinel — but in
    // production it stays pinned to the original PROJECTS reference.
    var _stackCache = null;
    var _groupCache = null;
    var _cacheKey = null;

    function _ensureCache() {
        if (_stackCache !== null && _cacheKey === PROJECTS) return;
        _cacheKey = PROJECTS;
        _stackCache = _computeStack();
        _groupCache = _groupByType(_stackCache);
    }

    /** Test/maintenance hook: drop the memoized stack/groups. */
    function invalidateCache() {
        _stackCache = null;
        _groupCache = null;
        _cacheKey = null;
    }

    /**
     * Compute tag usage across all projects.
     * @returns {Array<{tag:string, count:number, type:string, projects:string[], projectList:string}>}
     */
    function _computeStack() {
        // Null-prototype map so a tag literally named "__proto__",
        // "hasOwnProperty", or "toString" cannot collide with inherited
        // Object.prototype members and corrupt counts or pollute the
        // prototype chain (CWE-1321).
        var map = Object.create(null);
        for (var i = 0; i < PROJECTS.length; i++) {
            var p = PROJECTS[i];
            for (var j = 0; j < p.tags.length; j++) {
                var t = p.tags[j];
                if (!map[t]) {
                    map[t] = { tag: t, count: 0, type: CATEGORIES[t] || "Domain", projects: [] };
                }
                map[t].count++;
                map[t].projects.push(p.title);
            }
        }
        var arr = [];
        for (var key in map) {
            arr.push(map[key]);
        }
        arr.sort(function(a, b) {
            if (b.count !== a.count) return b.count - a.count;
            return a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0;
        });
        // Pre-join project lists once so buildPanel's tooltip loop becomes
        // O(1) per item instead of rebuilding the same comma-separated
        // string on every render.
        for (var n = 0; n < arr.length; n++) {
            arr[n].projectList = arr[n].projects.join(", ");
        }
        return arr;
    }

    /** Public accessor — returns the memoized stack (recomputed once). */
    function computeStack() {
        _ensureCache();
        return _stackCache;
    }

    /**
     * Group tech stack items by type.
     * @param {Array} stack - Output of computeStack.
     * @returns {Object<string, Array>} Grouped by type.
     */
    function _groupByType(stack) {
        // Null-prototype map so a CATEGORIES override or future tag whose
        // type string collides with an inherited Object.prototype member
        // cannot corrupt the grouping (CWE-1321).
        var groups = Object.create(null);
        var order = ["Language", "Framework", "Tool", "Domain"];
        for (var o = 0; o < order.length; o++) groups[order[o]] = [];
        for (var i = 0; i < stack.length; i++) {
            var item = stack[i];
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        }
        return groups;
    }

    /**
     * Public accessor for grouped tech stack — uses the memoized result
     * when called with the current cached stack, otherwise falls back to
     * a fresh computation (preserves the historical contract that
     * `groupByType(customStack)` works on caller-supplied data).
     */
    function groupByType(stack) {
        _ensureCache();
        if (stack === _stackCache || stack === undefined) return _groupCache;
        return _groupByType(stack);
    }

    /**
     * Build HTML for the tech stack radar panel.
     * @param {string|null} activeType - Currently active type filter, or null.
     * @returns {string} HTML string.
     */
    function buildPanel(activeType) {
        _ensureCache();
        var stack = _stackCache;
        var groups = _groupCache;
        var typeNames = ["Language", "Framework", "Tool", "Domain"];
        var typeIcons = { Language: "💻", Framework: "⚙️", Tool: "🔧", Domain: "🎯" };

        // Type filter pills
        var pillsHtml = '<div class="techradar-pills">';
        pillsHtml += '<button type="button" class="techradar-pill' +
            (activeType === null ? ' active' : '') +
            '" data-techradar-type="all">All</button>';
        for (var p = 0; p < typeNames.length; p++) {
            var tn = typeNames[p];
            if (groups[tn] && groups[tn].length > 0) {
                pillsHtml += '<button type="button" class="techradar-pill' +
                    (activeType === tn ? ' active' : '') +
                    '" data-techradar-type="' + escapeHTML(tn) + '">' +
                    escapeHTML(typeIcons[tn] || "") + " " + escapeHTML(tn) +
                    ' <span class="techradar-pill-count">' + groups[tn].length + '</span></button>';
            }
        }
        pillsHtml += '</div>';

        // Tech items
        var maxCount = stack.length > 0 ? stack[0].count : 1;
        var itemsHtml = '<div class="techradar-grid">';
        for (var g = 0; g < typeNames.length; g++) {
            var type = typeNames[g];
            if (activeType !== null && activeType !== type) continue;
            var items = groups[type];
            if (!items || items.length === 0) continue;
            for (var k = 0; k < items.length; k++) {
                var item = items[k];
                var pct = Math.round((item.count / maxCount) * 100);
                // projectList is pre-joined once in _computeStack — no
                // per-render concat loop here.
                itemsHtml += '<button type="button" class="techradar-item" ' +
                    'data-techradar-tag="' + escapeHTML(item.tag) + '" ' +
                    'title="' + escapeHTML(item.tag) + ' — used in: ' + escapeHTML(item.projectList) + '">' +
                    '<div class="techradar-bar-bg">' +
                        '<div class="techradar-bar" style="width:' + pct + '%"></div>' +
                    '</div>' +
                    '<span class="techradar-tag-name">' + escapeHTML(item.tag) + '</span>' +
                    '<span class="techradar-tag-count">' + item.count + '</span>' +
                    '<span class="techradar-tag-type">' + escapeHTML(type) + '</span>' +
                '</button>';
            }
        }
        itemsHtml += '</div>';

        // Summary stats
        var langCount = (groups.Language || []).length;
        var fwCount = (groups.Framework || []).length;
        var summaryHtml = '<div class="techradar-summary">' +
            '<span>' + stack.length + ' technologies</span>' +
            '<span>' + langCount + ' languages</span>' +
            '<span>' + fwCount + ' frameworks</span>' +
            '<span>' + PROJECTS.length + ' projects</span>' +
        '</div>';

        return '<div class="techradar">' +
            '<div class="techradar-header">' +
                '<span class="techradar-title">🛠️ Tech Stack</span>' +
                summaryHtml +
            '</div>' +
            pillsHtml + itemsHtml +
        '</div>';
    }

    /** Render the tech radar into its container. */
    function render() {
        if (typeof document === "undefined") return;
        var panel = document.getElementById("techradar-panel");
        if (!panel) return;
        if (!_state.expanded) {
            panel.innerHTML = "";
            return;
        }
        panel.innerHTML = buildPanel(_state.activeType);
        wireEvents();
    }

    /** Toggle the tech radar panel visibility. @returns {boolean} True if now expanded. */
    function toggle() {
        _state.expanded = !_state.expanded;
        if (typeof document !== "undefined") {
            var btn = document.getElementById("techradar-toggle");
            if (btn) {
                btn.setAttribute("aria-expanded", _state.expanded ? "true" : "false");
            }
        }
        render();
        return _state.expanded;
    }

    /** Set the active type filter. @param {string|null} type */
    function setFilter(type) {
        _state.activeType = type;
        render();
    }

    /** Wire click events for type pills and tag items. */
    function wireEvents() {
        if (typeof document === "undefined") return;
        var panel = document.getElementById("techradar-panel");
        if (!panel) return;

        var pills = panel.querySelectorAll(".techradar-pill");
        for (var i = 0; i < pills.length; i++) {
            (function(pill) {
                pill.addEventListener("click", function() {
                    var type = pill.getAttribute("data-techradar-type");
                    if (type === "all") {
                        setFilter(null);
                    } else {
                        setFilter(_state.activeType === type ? null : type);
                    }
                });
            })(pills[i]);
        }

        var items = panel.querySelectorAll(".techradar-item");
        for (var j = 0; j < items.length; j++) {
            (function(item) {
                item.addEventListener("click", function() {
                    var tag = item.getAttribute("data-techradar-tag");
                    if (tag) {
                        setTagFilter(tag);
                    }
                });
            })(items[j]);
        }
    }

    /** Initialize the tech radar toggle button. */
    function init() {
        if (typeof document === "undefined") return;
        var btn = document.getElementById("techradar-toggle");
        if (btn) {
            btn.addEventListener("click", function() {
                toggle();
            });
        }
    }

    return {
        CATEGORIES: CATEGORIES,
        _state: _state,
        computeStack: computeStack,
        groupByType: groupByType,
        buildPanel: buildPanel,
        render: render,
        toggle: toggle,
        setFilter: setFilter,
        wireEvents: wireEvents,
        init: init,
        invalidateCache: invalidateCache
    };
})();

// Legacy aliases for backward compatibility with tests
var TECH_CATEGORIES = TechRadar.CATEGORIES;
var _techRadarState = TechRadar._state;
/** @see TechRadar.computeStack */
function computeTechStack() { return TechRadar.computeStack(); }
/** @see TechRadar.groupByType */
function groupTechByType(stack) { return TechRadar.groupByType(stack); }
/** @see TechRadar.buildPanel */
function buildTechRadar(activeType) { return TechRadar.buildPanel(activeType); }
/** @see TechRadar.render */
function renderTechRadar() { TechRadar.render(); }
/** @see TechRadar.toggle */
function toggleTechRadar() { return TechRadar.toggle(); }
/** @see TechRadar.setFilter */
function setTechRadarFilter(type) { TechRadar.setFilter(type); }
/** @see TechRadar.wireEvents */
function wireTechRadarEvents() { TechRadar.wireEvents(); }
/** @see TechRadar.init */
function initTechRadar() { TechRadar.init(); }
