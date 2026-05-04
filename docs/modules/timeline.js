/**
 * Project Timeline — interactive chronological timeline of project
 * creation and releases.  Shows when each project was started, its
 * release history, and portfolio growth over time.
 *
 * Follows the same revealing-module pattern as Spotlight and TechRadar
 * for consistency and encapsulation.
 *
 * @namespace Timeline
 */
var Timeline = (function () {

    // ── Data ─────────────────────────────────────────────────────

    /**
     * Timeline data for each project keyed by repo name.
     * @type {Object.<string, {created: string, releases: Array.<{tag: string, date: string}>}>}
     */
    var DATA = {
        "agentlens":       { created: "2026-02-14", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v1.2.0", date: "2026-03-06" },
            { tag: "v1.4.0", date: "2026-03-10" }, { tag: "v1.10.0", date: "2026-03-25" },
            { tag: "v1.16.0", date: "2026-03-30" }, { tag: "v1.24.0", date: "2026-04-02" }
        ]},
        "getagentbox":     { created: "2026-02-06", releases: [
            { tag: "v1.0.0", date: "2026-02-20" }, { tag: "v2.0.0", date: "2026-03-07" },
            { tag: "v2.2.0", date: "2026-03-09" }, { tag: "v2.3.0", date: "2026-03-23" }
        ]},
        "agenticchat":     { created: "2025-07-24", releases: [
            { tag: "v1.0.0", date: "2026-02-15" }, { tag: "v2.0.0", date: "2026-03-08" },
            { tag: "v2.10.0", date: "2026-03-27" }, { tag: "v2.20.0", date: "2026-03-31" },
            { tag: "v2.23.1", date: "2026-04-02" }
        ]},
        "ai":              { created: "2020-08-02", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v1.1.0", date: "2026-03-05" },
            { tag: "v2.0.0", date: "2026-03-08" }, { tag: "v3.0.0", date: "2026-03-19" },
            { tag: "v3.4.0", date: "2026-03-31" }
        ]},
        "WinSentinel":     { created: "2026-02-16", releases: [
            { tag: "v1.0.0", date: "2026-02-17" }, { tag: "v1.1.0", date: "2026-02-20" },
            { tag: "v1.2.0", date: "2026-03-16" }, { tag: "v1.3.0", date: "2026-03-20" },
            { tag: "v1.4.1", date: "2026-04-02" }
        ]},
        "sauravcode":      { created: "2024-11-10", releases: [
            { tag: "v2.0.0", date: "2026-02-14" }, { tag: "v3.0.0", date: "2026-03-07" },
            { tag: "v4.0.0", date: "2026-03-21" }, { tag: "v5.0.0", date: "2026-03-23" },
            { tag: "v5.7.0", date: "2026-04-02" }
        ]},
        "prompt":          { created: "2023-08-11", releases: [
            { tag: "v2.0.0", date: "2026-02-14" }, { tag: "v4.0.0", date: "2026-03-07" },
            { tag: "v4.5.0", date: "2026-03-29" }, { tag: "v5.0.0", date: "2026-04-01" },
            { tag: "v5.2.0", date: "2026-04-02" }
        ]},
        "gif-captcha":     { created: "2023-12-16", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v1.1.0", date: "2026-02-25" },
            { tag: "v1.3.0", date: "2026-03-07" }, { tag: "v1.5.0", date: "2026-03-20" },
            { tag: "v1.6.1", date: "2026-03-25" }
        ]},
        "VoronoiMap":      { created: "2016-09-19", releases: [
            { tag: "v1.0.0", date: "2026-02-16" }, { tag: "v1.10.0", date: "2026-03-28" },
            { tag: "v1.20.0", date: "2026-04-02" }, { tag: "v1.22.0", date: "2026-04-02" }
        ]},
        "GraphVisual":     { created: "2016-09-19", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v2.0.0", date: "2026-03-07" },
            { tag: "v2.10.0", date: "2026-03-26" }, { tag: "v2.20.0", date: "2026-03-30" },
            { tag: "v2.29.0", date: "2026-04-02" }
        ]},
        "everything":      { created: "2025-01-17", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v3.0.0", date: "2026-03-08" },
            { tag: "v5.0.0", date: "2026-03-22" }, { tag: "v7.0.0", date: "2026-03-26" },
            { tag: "v7.23.0", date: "2026-04-02" }
        ]},
        "FeedReader":      { created: "2016-09-16", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v1.1.0", date: "2026-03-01" },
            { tag: "v1.3.0", date: "2026-03-27" }, { tag: "v1.6.0", date: "2026-03-31" }
        ]},
        "BioBots":         { created: "2016-09-07", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v1.1.0", date: "2026-03-08" },
            { tag: "v1.10.0", date: "2026-03-29" }, { tag: "v1.18.0", date: "2026-04-02" }
        ]},
        "Vidly":           { created: "2017-06-04", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v2.0.0", date: "2026-03-08" },
            { tag: "v2.3.0", date: "2026-03-27" }, { tag: "v2.4.0", date: "2026-03-29" }
        ]},
        "Ocaml-sample-code": { created: "2015-01-23", releases: [
            { tag: "v1.0.0", date: "2026-02-14" }, { tag: "v1.1.0", date: "2026-03-06" },
            { tag: "v1.3.0", date: "2026-03-08" }, { tag: "v1.4.0", date: "2026-03-09" }
        ]}
    };

    /** Category colour map for timeline items (dark theme). */
    var COLORS = {
        "AI & Agents":         { bg: "#1f3a5f", accent: "#58a6ff" },
        "Security":            { bg: "#3a1f1f", accent: "#f85149" },
        "Languages & Tools":   { bg: "#1f3a2a", accent: "#3fb950" },
        "Visualization & Data":{ bg: "#3a2f1f", accent: "#d29922" },
        "Apps & More":         { bg: "#2a1f3a", accent: "#bc8cff" }
    };

    /** Light-theme category colours. */
    var COLORS_LIGHT = {
        "AI & Agents":         { bg: "#dbeafe", accent: "#2563eb" },
        "Security":            { bg: "#fee2e2", accent: "#dc2626" },
        "Languages & Tools":   { bg: "#dcfce7", accent: "#16a34a" },
        "Visualization & Data":{ bg: "#fef3c7", accent: "#d97706" },
        "Apps & More":         { bg: "#ede9fe", accent: "#7c3aed" }
    };

    /** Month name abbreviations (shared by parseDate and formatDate). */
    var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];

    // ── State ────────────────────────────────────────────────────

    var _state = { visible: false, filter: null, zoom: "all" };

    // ── Pure helpers ─────────────────────────────────────────────

    /** Parse an ISO date string to a timestamp (ms since epoch). */
    function parseDate(dateStr) {
        return new Date(dateStr + "T00:00:00Z").getTime();
    }

    /** Format an ISO date string as a short or full date label. */
    function formatDate(dateStr, full) {
        var parts = dateStr.split("-");
        var m = parseInt(parts[1], 10) - 1;
        var d = parseInt(parts[2], 10);
        if (full) return MONTHS[m] + " " + d + ", " + parts[0];
        return MONTHS[m] + " " + parts[0];
    }

    /**
     * Build sorted timeline entries from PROJECTS + DATA.
     * Pre-computes all release timestamps so computeRange() and
     * render() never call parseDate() again — eliminates O(R)
     * redundant Date constructions on every zoom/filter interaction
     * where R = total release count.
     */
    function buildEntries(categoryFilter) {
        var entries = [];
        for (var i = 0; i < PROJECTS.length; i++) {
            var p = PROJECTS[i];
            if (categoryFilter && p.category !== categoryFilter) continue;
            var td = DATA[p.repo];
            if (!td) continue;
            var rels = td.releases;
            var relsWithTs = new Array(rels.length);
            for (var j = 0; j < rels.length; j++) {
                relsWithTs[j] = { tag: rels[j].tag, date: rels[j].date, ts: parseDate(rels[j].date) };
            }
            entries.push({
                project: p,
                created: td.created,
                releases: relsWithTs,
                createdTs: parseDate(td.created)
            });
        }
        entries.sort(function(a, b) { return a.createdTs - b.createdTs; });
        return entries;
    }

    /**
     * Compute the global date range across all entries.
     * Uses pre-computed .ts on releases instead of calling parseDate().
     */
    function computeRange(entries) {
        var min = Infinity, max = -Infinity;
        for (var i = 0; i < entries.length; i++) {
            var ts = entries[i].createdTs;
            if (ts < min) min = ts;
            if (ts > max) max = ts;
            var rels = entries[i].releases;
            for (var j = 0; j < rels.length; j++) {
                var rts = rels[j].ts;
                if (rts > max) max = rts;
            }
        }
        var range = max - min || 1;
        return { min: min - range * 0.02, max: max + range * 0.05 };
    }

    /** Compute the position (0-100%) of a timestamp within a range. */
    function position(ts, min, max) {
        var range = max - min;
        if (range <= 0) return 50;
        return ((ts - min) / range) * 100;
    }

    /** Build year/month markers for the timeline axis. */
    function buildMarkers(range) {
        var markers = [];
        var startDate = new Date(range.min);
        var endDate = new Date(range.max);
        var spanDays = (range.max - range.min) / (1000 * 60 * 60 * 24);

        if (spanDays > 365 * 3) {
            for (var y = startDate.getUTCFullYear(); y <= endDate.getUTCFullYear(); y++) {
                var ts = new Date(y + "-01-01T00:00:00Z").getTime();
                var pct = position(ts, range.min, range.max);
                if (pct >= 0 && pct <= 100) markers.push({ label: "" + y, pct: pct });
            }
        } else {
            var cur = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
            while (cur.getTime() <= range.max) {
                var ts2 = cur.getTime();
                var pct2 = position(ts2, range.min, range.max);
                if (pct2 >= 0 && pct2 <= 100) {
                    markers.push({ label: MONTHS[cur.getUTCMonth()] + " " + cur.getUTCFullYear(), pct: pct2 });
                }
                cur.setUTCMonth(cur.getUTCMonth() + 1);
            }
        }
        return markers;
    }

    /** Determine which colour palette to use based on current theme. */
    function getColors() {
        if (typeof document === "undefined") return COLORS;
        return document.documentElement.getAttribute("data-theme") === "light"
            ? COLORS_LIGHT : COLORS;
    }

    // ── Rendering ────────────────────────────────────────────────

    /** Render the full timeline HTML. */
    function render() {
        var entries = buildEntries(_state.filter);
        if (entries.length === 0) {
            return '<div class="timeline-empty">No projects to display.</div>';
        }

        var range = computeRange(entries);

        // Apply zoom
        if (_state.zoom === "recent") {
            range.min = Math.max(range.min, range.max - (180 * 24 * 60 * 60 * 1000));
        } else if (_state.zoom === "year") {
            range.min = Math.max(range.min, range.max - (365 * 24 * 60 * 60 * 1000));
        }

        var markers = buildMarkers(range);
        var colors = getColors();

        var html = '<div class="timeline-container" role="region" aria-label="Project timeline">';

        // Controls
        html += '<div class="timeline-controls">';
        html += '<div class="timeline-zoom">';
        var zoomOptions = [
            { key: "all", label: "All Time" },
            { key: "year", label: "Past Year" },
            { key: "recent", label: "6 Months" }
        ];
        for (var z = 0; z < zoomOptions.length; z++) {
            var active = _state.zoom === zoomOptions[z].key ? " timeline-zoom-active" : "";
            html += '<button type="button" class="timeline-zoom-btn' + active +
                '" data-zoom="' + zoomOptions[z].key + '">' +
                escapeHTML(zoomOptions[z].label) + '</button>';
        }
        html += '</div>';

        // Category filter pills
        html += '<div class="timeline-filters">';
        var allActive = !_state.filter ? " timeline-filter-active" : "";
        html += '<button type="button" class="timeline-filter-btn' + allActive +
            '" data-tl-cat="">All</button>';
        var cats = ["AI & Agents", "Security", "Languages & Tools", "Visualization & Data", "Apps & More"];
        for (var c = 0; c < cats.length; c++) {
            var catActive = _state.filter === cats[c] ? " timeline-filter-active" : "";
            var catColor = (colors[cats[c]] || {}).accent || "#888";
            html += '<button type="button" class="timeline-filter-btn' + catActive +
                '" data-tl-cat="' + escapeHTML(cats[c]) +
                '" style="border-color: ' + catColor + '">' +
                escapeHTML(cats[c]) + '</button>';
        }
        html += '</div></div>';

        // Stats summary
        var totalReleases = 0;
        for (var s = 0; s < entries.length; s++) totalReleases += entries[s].releases.length;
        var spanYears = ((range.max - range.min) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
        html += '<div class="timeline-stats">' +
            '<span class="timeline-stat-item">' + entries.length + ' projects</span>' +
            '<span class="timeline-stat-sep">&middot;</span>' +
            '<span class="timeline-stat-item">' + totalReleases + ' releases</span>' +
            '<span class="timeline-stat-sep">&middot;</span>' +
            '<span class="timeline-stat-item">' + spanYears + ' years</span></div>';

        // Timeline axis
        html += '<div class="timeline-axis">';
        for (var m = 0; m < markers.length; m++) {
            html += '<div class="timeline-marker" style="left: ' +
                markers[m].pct.toFixed(2) + '%">' +
                '<div class="timeline-marker-line"></div>' +
                '<span class="timeline-marker-label">' +
                escapeHTML(markers[m].label) + '</span></div>';
        }
        html += '</div>';

        // Project rows
        html += '<div class="timeline-rows">';
        for (var r = 0; r < entries.length; r++) {
            var entry = entries[r];
            var p = entry.project;
            var catColors = colors[p.category] || { bg: "#1a1a2e", accent: "#888" };
            var createdPct = Math.max(0, Math.min(100, position(entry.createdTs, range.min, range.max)));

            var latestPct = createdPct;
            for (var lr = 0; lr < entry.releases.length; lr++) {
                var lrPct = position(entry.releases[lr].ts, range.min, range.max);
                if (lrPct > latestPct) latestPct = lrPct;
            }
            latestPct = Math.max(0, Math.min(100, latestPct));

            html += '<div class="timeline-row" data-repo="' + escapeHTML(p.repo) + '">' +
                '<div class="timeline-row-label">' +
                    '<span class="timeline-row-icon">' + (p.icon || "📦") + '</span>' +
                    '<span class="timeline-row-name">' + escapeHTML(p.title) + '</span>' +
                '</div>' +
                '<div class="timeline-row-bar">';

            var barWidth = Math.max(2, latestPct - createdPct);
            html += '<div class="timeline-span" style="left: ' +
                createdPct.toFixed(2) + '%; width: ' + barWidth.toFixed(2) +
                '%; background: ' + catColors.accent + '"></div>';

            html += '<div class="timeline-dot timeline-dot-created" style="left: ' +
                createdPct.toFixed(2) + '%; background: ' + catColors.accent +
                '" title="Created: ' + formatDate(entry.created, true) +
                '" aria-label="Created ' + formatDate(entry.created, true) + '"></div>';

            for (var rd = 0; rd < entry.releases.length; rd++) {
                var rel = entry.releases[rd];
                var relPct = Math.max(0, Math.min(100,
                    position(rel.ts, range.min, range.max)));
                html += '<div class="timeline-dot timeline-dot-release" style="left: ' +
                    relPct.toFixed(2) + '%; border-color: ' + catColors.accent +
                    '" title="' + escapeHTML(rel.tag) + ' — ' +
                    formatDate(rel.date, true) +
                    '" aria-label="Release ' + escapeHTML(rel.tag) + '"></div>';
            }

            html += '</div></div>'; // row-bar + row
        }
        html += '</div>'; // rows

        // Legend
        html += '<div class="timeline-legend">' +
            '<div class="timeline-legend-item">' +
                '<span class="timeline-legend-dot timeline-legend-created"></span> Created</div>' +
            '<div class="timeline-legend-item">' +
                '<span class="timeline-legend-dot timeline-legend-release"></span> Release</div>';
        var usedCats = {};
        for (var uc = 0; uc < entries.length; uc++) usedCats[entries[uc].project.category] = true;
        for (var catName in usedCats) {
            if (!usedCats.hasOwnProperty(catName)) continue;
            var cc = colors[catName] || {};
            html += '<div class="timeline-legend-item">' +
                '<span class="timeline-legend-color" style="background: ' +
                (cc.accent || "#888") + '"></span> ' + escapeHTML(catName) + '</div>';
        }
        html += '</div></div>'; // legend + container
        return html;
    }

    // ── Interactivity ────────────────────────────────────────────

    /** Wire event listeners for zoom, filter, and row click. */
    function wireEvents() {
        if (typeof document === "undefined") return;
        var panel = document.getElementById("timeline-panel");
        if (!panel) return;

        panel.querySelectorAll(".timeline-zoom-btn").forEach(function(btn) {
            btn.addEventListener("click", function() { setZoom(this.dataset.zoom); });
        });

        panel.querySelectorAll(".timeline-filter-btn").forEach(function(btn) {
            btn.addEventListener("click", function() { setFilter(this.dataset.tlCat); });
        });

        panel.querySelectorAll(".timeline-row").forEach(function(row) {
            row.addEventListener("click", function() {
                var repo = this.dataset.repo;
                // Find the project card by matching the GitHub link in the card header.
                // Cards use class ".card" (not ".project-card") and don't have data-repo;
                // the repo is embedded in the header link's href.
                var cards = document.querySelectorAll("#projects-container .card");
                for (var ci = 0; ci < cards.length; ci++) {
                    var link = cards[ci].querySelector(".card-header a");
                    if (link && link.href && link.href.indexOf("/" + repo) !== -1) {
                        cards[ci].scrollIntoView({ behavior: "smooth", block: "center" });
                        cards[ci].classList.add("timeline-highlight");
                        setTimeout(function(card) {
                            card.classList.remove("timeline-highlight");
                        }.bind(null, cards[ci]), 2000);
                        break;
                    }
                }
            });
        });
    }

    /** Toggle the timeline panel visibility. */
    function toggle() {
        _state.visible = !_state.visible;
        var panel = typeof document !== "undefined" ? document.getElementById("timeline-panel") : null;
        if (!panel) return;
        if (_state.visible) {
            panel.innerHTML = render();
            panel.classList.remove("hidden");
            wireEvents();
        } else {
            panel.classList.add("hidden");
            panel.innerHTML = "";
        }
    }

    /** Set the timeline zoom level and re-render. */
    function setZoom(zoom) {
        _state.zoom = zoom;
        var panel = typeof document !== "undefined" ? document.getElementById("timeline-panel") : null;
        if (!panel || !_state.visible) return;
        panel.innerHTML = render();
        wireEvents();
    }

    /** Set the timeline category filter and re-render. */
    function setFilter(category) {
        _state.filter = category || null;
        var panel = typeof document !== "undefined" ? document.getElementById("timeline-panel") : null;
        if (!panel || !_state.visible) return;
        panel.innerHTML = render();
        wireEvents();
    }

    /** Initialize the timeline feature — add toggle button and panel. */
    function init() {
        if (typeof document === "undefined") return;

        var analyticsBar = document.querySelector(".analytics-bar");
        if (analyticsBar) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "analytics-toggle";
            btn.id = "timeline-toggle";
            btn.setAttribute("aria-expanded", "false");
            btn.setAttribute("aria-controls", "timeline-panel");
            btn.innerHTML = '📅 Timeline <span class="toggle-arrow">▾</span>';
            btn.addEventListener("click", function() {
                toggle();
                this.setAttribute("aria-expanded", _state.visible ? "true" : "false");
            });
            analyticsBar.appendChild(btn);
        }

        var section = document.getElementById("projects");
        if (section) {
            var panel = document.createElement("div");
            panel.id = "timeline-panel";
            panel.className = "timeline-panel hidden";
            panel.setAttribute("role", "region");
            panel.setAttribute("aria-label", "Project timeline");
            var bar = section.querySelector(".analytics-bar");
            if (bar && bar.nextSibling) {
                section.insertBefore(panel, bar.nextSibling);
            } else {
                section.appendChild(panel);
            }
        }
    }

    return {
        DATA: DATA,
        COLORS: COLORS,
        COLORS_LIGHT: COLORS_LIGHT,
        _state: _state,
        parseDate: parseDate,
        formatDate: formatDate,
        buildEntries: buildEntries,
        computeRange: computeRange,
        position: position,
        buildMarkers: buildMarkers,
        getColors: getColors,
        render: render,
        toggle: toggle,
        setZoom: setZoom,
        setFilter: setFilter,
        wireEvents: wireEvents,
        init: init
    };
})();

// Legacy aliases for backward compatibility with tests
var TIMELINE_DATA = Timeline.DATA;
var TIMELINE_COLORS = Timeline.COLORS;
var TIMELINE_COLORS_LIGHT = Timeline.COLORS_LIGHT;
var _timelineState = Timeline._state;
/** @see Timeline.parseDate */
function parseTimelineDate(dateStr) { return Timeline.parseDate(dateStr); }
/** @see Timeline.formatDate */
function formatTimelineDate(dateStr, full) { return Timeline.formatDate(dateStr, full); }
/** @see Timeline.buildEntries */
function buildTimelineEntries(categoryFilter) { return Timeline.buildEntries(categoryFilter); }
/** @see Timeline.computeRange */
function computeTimelineRange(entries) { return Timeline.computeRange(entries); }
/** @see Timeline.position */
function timelinePosition(ts, min, max) { return Timeline.position(ts, min, max); }
/** @see Timeline.buildMarkers */
function buildTimelineMarkers(range) { return Timeline.buildMarkers(range); }
/** @see Timeline.getColors */
function getTimelineColors() { return Timeline.getColors(); }
/** @see Timeline.render */
function renderTimeline() { return Timeline.render(); }
/** @see Timeline.toggle */
function toggleTimeline() { Timeline.toggle(); }
/** @see Timeline.setZoom */
function setTimelineZoom(zoom) { Timeline.setZoom(zoom); }
/** @see Timeline.setFilter */
function setTimelineFilter(category) { Timeline.setFilter(category); }
/** @see Timeline.wireEvents */
function wireTimelineEvents() { Timeline.wireEvents(); }
/** @see Timeline.init */
function initTimeline() { Timeline.init(); }
