/**
 * app.js — Portfolio project data and card rendering.
 *
 * To add/update a project, edit the PROJECTS array below.
 * The HTML template is generated automatically.
 */

/* exported PROJECTS, _filterState, renderProjects, filterProjects, initFilters, buildCardHeader, buildCardTags, buildCardLinks, buildTagList, buildLinkList, buildCategoryHTML, projectMatchesQuery, groupByCategory, _extractUnique, extractCategories, createFilterPills, wireFilterEvents, updateTagIndicator, clearTagFilter, setTagFilter, extractTags, wireTagClicks, getPreferredTheme, applyTheme, toggleTheme, initTheme, _kbState, getVisibleCards, focusCard, blurCards, openFocusedCard, showKeyboardHelp, hideKeyboardHelp, toggleKeyboardHelp, initKeyboardNav, buildHelpOverlay, sortProjects, setSortOrder, setViewMode, initSortAndView, buildSortControls, buildViewToggle, SORT_ORDERS, _bookmarks, isBookmarked, toggleBookmark, setBookmarkFilter, initBookmarks, getBookmarkCount, serializeFilterState, deserializeFilterState, pushFilterState, initDeepLink, _deepLinkEnabled, computeCategoryDistribution, computeTagDistribution, computePortfolioSummary, buildBarChart, buildTagCloud, buildAnalyticsPanel, toggleAnalytics, initAnalytics, _spotlightState, buildSpotlightCard, renderSpotlight, nextSpotlight, prevSpotlight, goToSpotlight, toggleSpotlightPause, startSpotlightTimer, stopSpotlightTimer, wireSpotlightEvents, initSpotlight, TECH_CATEGORIES, _techRadarState, computeTechStack, groupTechByType, buildTechRadar, renderTechRadar, toggleTechRadar, setTechRadarFilter, wireTechRadarEvents, initTechRadar */

/**
 * Active filter state.
 * @type {{ query: string, category: string|null, tag: string|null }}
 */
var _filterState = { query: "", category: null, tag: null, sort: "default", view: "grid", bookmarked: false };

var PROJECTS = [
    // --- AI & Agents ---
    {
        category: "AI & Agents",
        icon: "🔍", repo: "agentlens", title: "AgentLens",
        desc: "Observability & explainability platform for AI agents — trace, debug, and understand agent behavior at scale. Python SDK + Node.js backend + dashboard.",
        tags: ["Python", "Node.js", "Observability", "AI Agents"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/agentlens" },
            { label: "Docs", url: "https://sauravbhattacharya001.github.io/agentlens/" },
            { label: "v1.0.0", url: "https://github.com/sauravbhattacharya001/agentlens/releases/tag/v1.0.0" }
        ]
    },
    {
        category: "AI & Agents",
        icon: "🤖", repo: "getagentbox", title: "AgentBox",
        desc: "AI agents as a service — personal AI assistants accessible via messaging. Open access, 20 msg/day free tier.",
        tags: ["JavaScript", "AI Agents", "SaaS"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/getagentbox" },
            { label: "Live", url: "https://sauravbhattacharya001.github.io/getagentbox/" },
            { label: "v2.0.0", url: "https://github.com/sauravbhattacharya001/getagentbox/releases/tag/v2.0.0" }
        ]
    },
    {
        category: "AI & Agents",
        icon: "💬", repo: "agenticchat", title: "AgenticChat",
        desc: "Agentic conversation framework — GPT-4o chat with sandboxed code execution, 30+ modular features including voice input, session management, conversation tags, search, bookmarks, annotations, focus mode.",
        tags: ["JavaScript", "GPT-4o", "Code Execution"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/agenticchat" },
            { label: "Demo", url: "https://sauravbhattacharya001.github.io/agenticchat/" }
        ]
    },
    {
        category: "AI & Agents",
        icon: "🛡️", repo: "ai", title: "AI Safety Research",
        desc: "Contract-enforced sandbox for studying AI agent self-replication safety — 39 analysis modules including Monte Carlo simulation, game-theory modeling, alignment drift detection, dependency analysis, and interactive reports.",
        tags: ["Python", "AI Safety", "Monte Carlo"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/ai" },
            { label: "Docs", url: "https://sauravbhattacharya001.github.io/ai/" }
        ]
    },

    // --- Security ---
    {
        category: "Security",
        icon: "🔒", repo: "WinSentinel", title: "WinSentinel",
        desc: "Always-on Windows security agent — real-time monitoring, AI-powered threat detection, auto-remediation, 24 audit modules, compliance profiles.",
        tags: ["C#", ".NET 8", "WPF", "Security"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/WinSentinel" },
            { label: "Docs", url: "https://sauravbhattacharya001.github.io/WinSentinel/" },
            { label: "v1.1.0", url: "https://github.com/sauravbhattacharya001/WinSentinel/releases/tag/v1.1.0" }
        ]
    },

    // --- Languages & Tools ---
    {
        category: "Languages & Tools",
        icon: "🔤", repo: "sauravcode", title: "sauravcode",
        desc: "A programming language with zero noise — no parens, no commas, no semicolons. Interpreter + compiler (.srv → C → native). 2000+ tests.",
        tags: ["Python", "C", "Compiler", "Language Design"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/sauravcode" },
            { label: "Docs", url: "https://sauravbhattacharya001.github.io/sauravcode/" }
        ]
    },
    {
        category: "Languages & Tools",
        icon: "⚡", repo: "prompt", title: "prompt",
        desc: ".NET 8 prompt engineering toolkit — Azure OpenAI client, template engine, prompt chaining, PromptGuard injection detection, prompt sanitization, fallback chains.",
        tags: ["C#", ".NET 8", "Azure OpenAI"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/prompt" },
            { label: "Docs", url: "https://sauravbhattacharya001.github.io/prompt/" },
            { label: "v4.0.0", url: "https://github.com/sauravbhattacharya001/prompt/releases/tag/v4.0.0" }
        ]
    },
    {
        category: "Languages & Tools",
        icon: "🎭", repo: "gif-captcha", title: "gif-captcha",
        desc: "GIF-based CAPTCHA research — 8 interactive tools: visual puzzles, temporal challenges, AI simulator, cognitive load analyzer, accessibility audit. 2450+ tests.",
        tags: ["HTML/JS", "Research", "Security"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/gif-captcha" },
            { label: "Demo", url: "https://sauravbhattacharya001.github.io/gif-captcha/" },
            { label: "v1.3.0", url: "https://github.com/sauravbhattacharya001/gif-captcha/releases/tag/v1.3.0" }
        ]
    },

    // --- Visualization & Data ---
    {
        category: "Visualization & Data",
        icon: "📐", repo: "VoronoiMap", title: "VoronoiMap",
        desc: "Voronoi diagram generation & spatial partitioning — Lloyd relaxation, neighbourhood graphs, KDE heatmaps, spatial clustering, autocorrelation, convex hull analysis. 1990+ tests.",
        tags: ["Python", "Algorithms", "Geometry"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/VoronoiMap" },
            { label: "Demo", url: "https://sauravbhattacharya001.github.io/VoronoiMap/" }
        ]
    },
    {
        category: "Visualization & Data",
        icon: "🔗", repo: "GraphVisual", title: "GraphVisual",
        desc: "Graph visualization for community evolution — centrality (Brandes'), MST, graph coloring, community detection, shortest path, link prediction, graph generation, topological sort, influence spread simulation, GraphML export. 68 analyzers.",
        tags: ["Java", "Graph Theory", "Visualization"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/GraphVisual" },
            { label: "Site", url: "https://sauravbhattacharya001.github.io/GraphVisual/" }
        ]
    },

    // --- Apps & More ---
    {
        category: "Apps & More",
        icon: "📅", repo: "everything", title: "everything",
        desc: "Full-stack Flutter/Dart app — event management with calendar view, recurring events, conflict detection, activity heatmap, time budgets, streak tracking, BLoC pattern, SQLite persistence.",
        tags: ["Dart", "Flutter", "BLoC"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/everything" },
            { label: "App", url: "https://sauravbhattacharya001.github.io/everything/" }
        ]
    },
    {
        category: "Apps & More",
        icon: "📰", repo: "FeedReader", title: "FeedReader",
        desc: "RSS feed reader (Swift/iOS) — read/unread tracking, reading stats dashboard, bookmarks, search, offline support.",
        tags: ["Swift", "iOS", "RSS"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/FeedReader" },
            { label: "Site", url: "https://sauravbhattacharya001.github.io/FeedReader/" }
        ]
    },
    {
        category: "Apps & More",
        icon: "🧬", repo: "BioBots", title: "BioBots",
        desc: "3D bioprinter analytics — 11 metrics, anomaly detection (Z-Score + IQR), interactive data explorer with histograms & regression.",
        tags: ["JavaScript", "Analytics", "Data Viz"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/BioBots" },
            { label: "Site", url: "https://sauravbhattacharya001.github.io/BioBots/" }
        ]
    },
    {
        category: "Apps & More",
        icon: "🎬", repo: "Vidly", title: "Vidly",
        desc: "Video rental management (C# / ASP.NET MVC) — CRUD, 4-tier membership, rental checkout/returns, late fees.",
        tags: ["C#", "ASP.NET", "MVC"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/Vidly" },
            { label: "Site", url: "https://sauravbhattacharya001.github.io/Vidly/" }
        ]
    },
    {
        category: "Apps & More",
        icon: "🐫", repo: "Ocaml-sample-code", title: "OCaml Samples",
        desc: "80+ module functional programming collection — BST, trie, hashmap, bloom filter, red-black trees, union-find, graph algorithms, regex engine, type inference, lambda calculus, SAT solver, persistent vectors, symbolic integration, and more.",
        tags: ["OCaml", "Functional", "Data Structures"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/Ocaml-sample-code" },
            { label: "Site", url: "https://sauravbhattacharya001.github.io/Ocaml-sample-code/" }
        ]
    }
];

// ── Pre-computed Search Index ────────────────────────────────────────
//
// Instead of calling .toLowerCase() on every project field on every
// keystroke / filter change, we pre-compute a search index once at load
// time.  Each entry holds a single concatenated lowercase string for
// full-text matching and a Set of lowercase tag names for O(1) tag
// filtering.  This eliminates ~O(N*T) repeated toLowerCase() calls in
// filterProjects() and projectMatchesQuery(), where N = number of
// projects and T = average tags per project.

var _searchIndex = (function() {
    var idx = [];
    for (var i = 0; i < PROJECTS.length; i++) {
        var p = PROJECTS[i];
        // Concatenate all searchable fields into one lowercase string.
        // Separated by \0 (won't appear in user queries) to prevent
        // false cross-field matches like "codeai" matching "code" + "ai".
        var parts = [
            p.title.toLowerCase(),
            p.desc.toLowerCase(),
            p.repo.toLowerCase()
        ];
        for (var t = 0; t < p.tags.length; t++) {
            parts.push(p.tags[t].toLowerCase());
        }
        var searchText = parts.join("\0");

        // Build a Set of lowercase tags for O(1) tag-filter lookups
        var tagSet = Object.create(null);
        for (var j = 0; j < p.tags.length; j++) {
            tagSet[p.tags[j].toLowerCase()] = true;
        }

        idx.push({ text: searchText, tagSet: tagSet });
    }
    return idx;
})();

/**
 * Escape HTML entities to prevent XSS.
 *
 * Pure regex replacement — faster than the previous DOM-based approach
 * (textContent → innerHTML → regex) because it avoids DOM writes, forced
 * serialization, and works identically in non-browser environments
 * (tests, SSR).  The compiled regex and lookup map are allocated once.
 *
 * Escapes &, <, >, double-quote, and single-quote (&#39; — defense-in-depth
 * for single-quoted attribute delimiters, CWE-79).
 *
 * @param {string} str
 * @returns {string}
 */
var _escapeRe = /[&<>"']/g;
var _escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };
function escapeHTML(str) {
    return String(str).replace(_escapeRe, function(ch) { return _escapeMap[ch]; });
}

/**
 * Sanitize a URL to prevent javascript: protocol and attribute breakout.
 * Only allows http:, https:, and mailto: schemes.
 *
 * Strips ASCII control characters (0x00-0x1F, 0x7F), zero-width Unicode
 * characters (U+200B-U+200F, U+FEFF, U+00AD), Unicode bidirectional
 * override/embedding characters (U+202A-U+202E, U+2066-U+2069), and
 * Unicode line/paragraph separators before checking the scheme.
 *
 * Browsers silently ignore embedded tabs, newlines, null bytes, and
 * zero-width chars when parsing href values, so "ja\u200Bvascript:alert(1)"
 * would execute without this defence.  Bidirectional overrides (CWE-1007)
 * can visually disguise malicious URLs as legitimate ones by reordering
 * rendered text direction.  See also CWE-116 (Improper Encoding or
 * Escaping of Output).
 *
 * Additionally validates that http:/https: URLs contain a valid authority
 * (at least "scheme://host") and rejects bare "http:" without "//".
 *
 * @param {string} url
 * @returns {string}
 */
var _sanitizeStripRe = /[\x00-\x1F\x7F\u00AD\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g;
function sanitizeURL(url) {
    // Strip control chars, zero-width Unicode, bidi overrides, and separators
    var cleaned = url.replace(_sanitizeStripRe, "");
    var trimmed = cleaned.replace(/^\s+/, "").toLowerCase();
    if (trimmed.indexOf("https://") === 0 ||
        trimmed.indexOf("http://") === 0) {
        // Require at least one char after "scheme://" (i.e. a host)
        var slashIdx = trimmed.indexOf("://");
        if (trimmed.length > slashIdx + 3) {
            return escapeHTML(cleaned.replace(/^\s+/, ""));
        }
        return "#";
    }
    if (trimmed.indexOf("mailto:") === 0) {
        return escapeHTML(cleaned.replace(/^\s+/, ""));
    }
    return "#";
}

/**
 * Build a single project card HTML string.
 * @param {Object} p - Project from PROJECTS array.
 * @returns {string}
 */
function buildCardHeader(p) {
    var bookmarked = isBookmarked(p.repo);
    return '<div class="card-header">' +
        '<span class="card-icon">' + escapeHTML(p.icon) + '</span>' +
        '<h3><a href="https://github.com/sauravbhattacharya001/' +
            escapeHTML(p.repo) + '" target="_blank" rel="noopener">' +
            escapeHTML(p.title) + '</a></h3>' +
        '<button type="button" class="bookmark-btn' + (bookmarked ? ' bookmarked' : '') +
            '" data-repo="' + escapeHTML(p.repo) +
            '" aria-label="' + (bookmarked ? 'Remove bookmark' : 'Bookmark') +
            '" title="' + (bookmarked ? 'Remove bookmark' : 'Bookmark') + '">' +
            (bookmarked ? '★' : '☆') +
        '</button>' +
        '</div>';
}

/**
 * Build a list of tag elements as HTML string.
 * Used by both project cards (clickable filter buttons) and spotlight
 * (display-only spans).  Centralises tag rendering to avoid duplication.
 *
 * @param {string[]} tags
 * @param {{ clickable?: boolean, wrapperClass?: string }} [opts]
 * @returns {string}
 */
function buildTagList(tags, opts) {
    var o = opts || {};
    var clickable = o.clickable !== false; // default true
    var cls = o.wrapperClass || "card-tags";
    return '<div class="' + cls + '">' +
        tags.map(function(t) {
            if (clickable) {
                return '<button type="button" class="tag tag-clickable" data-tag="' +
                    escapeHTML(t) + '">' + escapeHTML(t) + '</button>';
            }
            return '<span class="tag">' + escapeHTML(t) + '</span>';
        }).join("") +
        '</div>';
}

/**
 * Build tag pills for a project card.
 * Tags are clickable buttons that filter to show all projects with that tag.
 * @param {string[]} tags
 * @returns {string}
 */
function buildCardTags(tags) {
    return buildTagList(tags, { clickable: true, wrapperClass: "card-tags" });
}

/**
 * Build a list of link anchor elements as HTML string.
 * Used by both project cards and spotlight cards.
 *
 * @param {Object[]} links - Array of {label, url} objects.
 * @param {{ wrapperClass?: string }} [opts]
 * @returns {string}
 */
function buildLinkList(links, opts) {
    var cls = (opts && opts.wrapperClass) || "card-links";
    return '<div class="' + cls + '">' +
        links.map(function(l) {
            return '<a href="' + sanitizeURL(l.url) +
                '" target="_blank" rel="noopener">' +
                escapeHTML(l.label) + '</a>';
        }).join("") +
        '</div>';
}

/**
 * Build link buttons for a project card.
 * @param {Object[]} links - Array of {label, url} objects.
 * @returns {string}
 */
function buildCardLinks(links) {
    return buildLinkList(links, { wrapperClass: "card-links" });
}

/**
 * Assemble a full project card from its constituent parts.
 * @param {Object} p - Project from PROJECTS array.
 * @param {{ tabindex?: string }} [opts] - Optional attributes.
 * @returns {string}
 */
function buildCard(p, opts) {
    var extra = (opts && opts.tabindex) ? ' tabindex="' + escapeHTML(opts.tabindex) + '"' : '';
    return '<div class="card"' + extra + '>' +
        buildCardHeader(p) +
        '<p>' + escapeHTML(p.desc) + '</p>' +
        buildCardTags(p.tags) +
        buildCardLinks(p.links) +
        '</div>';
}

/**
 * Check if a project matches a text query (case-insensitive).
 * Searches across title, description, repo name, and tags.
 *
 * Uses the pre-computed _searchIndex for O(1) lowercase lookups
 * instead of calling .toLowerCase() on every field per call.
 *
 * @param {Object} p - Project from PROJECTS array.
 * @param {string} query - Lowercase search query.
 * @returns {boolean}
 */
function projectMatchesQuery(p, query) {
    if (!query) return true;
    var idx = PROJECTS.indexOf(p);
    if (idx >= 0 && idx < _searchIndex.length) {
        return _searchIndex[idx].text.indexOf(query) !== -1;
    }
    // Fallback for dynamically added projects (shouldn't happen, but safe)
    if (p.title.toLowerCase().indexOf(query) !== -1) return true;
    if (p.desc.toLowerCase().indexOf(query) !== -1) return true;
    if (p.repo.toLowerCase().indexOf(query) !== -1) return true;
    for (var i = 0; i < p.tags.length; i++) {
        if (p.tags[i].toLowerCase().indexOf(query) !== -1) return true;
    }
    return false;
}

/**
 * Filter PROJECTS by current _filterState (query + category + tag).
 * Returns the filtered list without mutating PROJECTS.
 *
 * Text search matches against title, desc, tags, and repo name
 * (case-insensitive) via the pre-computed _searchIndex.  Category
 * filter matches the category field exactly.  Tag filter uses the
 * pre-computed tagSet for O(1) lookups.
 * All filters are AND-combined.
 *
 * @returns {Object[]}
 */
function filterProjects() {
    var q = _filterState.query.toLowerCase();
    var cat = _filterState.category;
    var tag = _filterState.tag;
    var tagLower = tag ? tag.toLowerCase() : null;
    var onlyBookmarked = _filterState.bookmarked;

    return PROJECTS.filter(function(p, idx) {
        if (onlyBookmarked && !isBookmarked(p.repo)) return false;
        if (cat && p.category !== cat) return false;
        if (tagLower) {
            // Use pre-computed tagSet for O(1) lookup
            if (idx < _searchIndex.length && !_searchIndex[idx].tagSet[tagLower]) {
                return false;
            }
        }
        return projectMatchesQuery(p, q);
    });
}

/**
 * Group an array of projects by their category field.
 * Returns an ordered array of { name, items } objects, preserving
 * the insertion order of categories.
 *
 * Uses Object.create(null) for the lookup map so that inherited
 * properties like "constructor", "toString", or "__proto__" can never
 * collide with a category name — preventing prototype-pollution-style
 * bugs (CWE-1321).
 *
 * @param {Object[]} items - Array of projects.
 * @returns {{ name: string, items: Object[] }[]}
 */
function groupByCategory(items) {
    var groups = [];
    var groupMap = Object.create(null);
    items.forEach(function(p) {
        if (!groupMap[p.category]) {
            groupMap[p.category] = [];
            groups.push({ name: p.category, items: groupMap[p.category] });
        }
        groupMap[p.category].push(p);
    });
    return groups;
}

/**
 * Build the HTML for a single category section (label + grid of cards).
 *
 * @param {{ name: string, items: Object[] }} group - Category group.
 * @returns {string}
 */
function buildCategoryHTML(group) {
    return '<div class="category">' +
        '<div class="category-label">' + escapeHTML(group.name) + '</div>' +
        '<div class="projects-grid">' +
        group.items.map(buildCard).join("") +
        '</div></div>';
}

/**
 * Render all project cards into #projects-container, grouped by category.
 * Also updates the active tag indicator if tag filtering is active.
 *
 * @param {Object[]} [projects] - Optional filtered project list.
 *   Defaults to all PROJECTS.
 */
function renderProjects(projects) {
    var container = document.getElementById("projects-container");
    if (!container) return;

    var items = projects || PROJECTS;

    // Show/hide no-results message (uses CSS class instead of inline style)
    var noResults = document.getElementById("no-results");
    if (noResults) {
        if (items.length === 0) {
            noResults.classList.remove("hidden");
        } else {
            noResults.classList.add("hidden");
        }
    }

    // When sorted (non-default), render a flat grid without category headers.
    // Category grouping only makes sense in default order.
    if (_filterState.sort && _filterState.sort !== "default") {
        var html = '<div class="projects-grid">';
        items.forEach(function(p) {
            html += buildCard(p, { tabindex: "-1" });
        });
        html += '</div>';
        container.innerHTML = html;
    } else {
        var groups = groupByCategory(items);
        container.innerHTML = groups.map(buildCategoryHTML).join("");
    }

    // Update active tag indicator
    updateTagIndicator();
}

/**
 * Extract unique values from an array of objects, preserving insertion order.
 * Uses Object.create(null) for the lookup map (prototype-pollution safe).
 *
 * @param {Object[]} items - Array of objects to extract from.
 * @param {function(Object): string|string[]} accessor - Returns the key(s) for each item.
 * @returns {string[]}
 */
function _extractUnique(items, accessor) {
    var result = [];
    var seen = Object.create(null);
    items.forEach(function(item) {
        var keys = accessor(item);
        if (!Array.isArray(keys)) keys = [keys];
        keys.forEach(function(k) {
            var normalized = k.toLowerCase();
            if (!seen[normalized]) {
                seen[normalized] = true;
                result.push(k);
            }
        });
    });
    return result;
}

/**
 * Extract unique categories from the PROJECTS array, preserving
 * insertion order.
 *
 * @param {Object[]} [projects] - Optional project list. Defaults to PROJECTS.
 * @returns {string[]}
 */
function extractCategories(projects) {
    return _extractUnique(projects || PROJECTS, function(p) { return p.category; });
}

/**
 * Create filter pill buttons inside a container element.
 * Prepends an "All" pill, then one pill per category.
 *
 * @param {HTMLElement} container - DOM element to append pills into.
 * @param {string[]} categories - Category names.
 */
function createFilterPills(container, categories) {
    var allPill = document.createElement("button");
    allPill.className = "filter-pill active";
    allPill.textContent = "All";
    allPill.setAttribute("data-category", "");
    allPill.type = "button";
    container.appendChild(allPill);

    categories.forEach(function(cat) {
        var pill = document.createElement("button");
        pill.className = "filter-pill";
        pill.textContent = cat;
        pill.setAttribute("data-category", cat);
        pill.type = "button";
        container.appendChild(pill);
    });
}

/**
 * Wire up event handlers for filter pills and the search input.
 * Pill clicks update the active pill and trigger re-render.
 * Search input is debounced at 200ms.
 *
 * @param {HTMLElement} filtersContainer - Container holding pill buttons.
 * @param {HTMLInputElement|null} searchInput - Search text input (may be null).
 */
function wireFilterEvents(filtersContainer, searchInput) {
    filtersContainer.addEventListener("click", function(e) {
        var pill = e.target;
        if (!pill.classList.contains("filter-pill")) return;

        var pills = filtersContainer.querySelectorAll(".filter-pill");
        for (var i = 0; i < pills.length; i++) {
            pills[i].classList.remove("active");
        }
        pill.classList.add("active");

        var cat = pill.getAttribute("data-category");
        _filterState.category = cat || null;
        _applyFilters();
    });

    var debounceTimer = null;
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                _filterState.query = searchInput.value;
                _applyFilters();
            }, 200);
        });
    }
}

/**
 * Re-render projects using the current filter state.
 * Centralises the common filterProjects() → renderProjects() call
 * pattern that was previously duplicated in pill clicks, search input,
 * setTagFilter, and clearTagFilter.
 *
 * Skips DOM rebuild when the filtered result set hasn't changed (same
 * project IDs in same order), which matters during rapid keystroke
 * sequences where the debounced query yields the same matches.
 */
var _lastRenderedIds = null;
function _applyFilters() {
    var filtered = filterProjects();
    filtered = sortProjects(filtered, _filterState.sort);
    var ids = filtered.map(function(p) { return p.repo; }).join(",");
    // Include bookmark state in cache key so toggling a bookmark re-renders
    var bookmarkKey = _bookmarks ? Array.from(_bookmarks).sort().join(",") : "";
    var cacheKey = ids + "|" + bookmarkKey;
    if (cacheKey === _lastRenderedIds) return;
    _lastRenderedIds = cacheKey;
    renderProjects(filtered);
    _applyViewMode();
    _updateBookmarkFilterPill();
    pushFilterState();
}

/**
 * Update the active tag indicator shown below the filter bar.
 * Creates or updates the indicator element showing which tag is
 * currently filtering, with a clear button.
 */
function updateTagIndicator() {
    var container = document.getElementById("active-tag-indicator");
    if (!container) return;

    if (!_filterState.tag) {
        container.innerHTML = "";
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    container.innerHTML =
        '<span class="tag-indicator-label">Filtered by tag:</span>' +
        '<span class="tag tag-active">' + escapeHTML(_filterState.tag) + '</span>' +
        '<button type="button" class="tag-clear" aria-label="Clear tag filter">&times;</button>';

    var clearBtn = container.querySelector(".tag-clear");
    if (clearBtn) {
        clearBtn.addEventListener("click", function() {
            clearTagFilter();
        });
    }
}

/**
 * Clear the active tag filter and re-render.
 */
function clearTagFilter() {
    _filterState.tag = null;
    _applyFilters();
}

/**
 * Set the active tag filter and re-render.
 * @param {string} tagName - Tag name to filter by.
 */
function setTagFilter(tagName) {
    _filterState.tag = tagName;
    _applyFilters();
}

/**
 * Extract all unique tags from the PROJECTS array.
 * @param {Object[]} [projects] - Optional project list. Defaults to PROJECTS.
 * @returns {string[]}
 */
function extractTags(projects) {
    return _extractUnique(projects || PROJECTS, function(p) { return p.tags || []; }).sort();
}

/**
 * Initialize the category filter pills and search input.
 * Delegates to extractCategories, createFilterPills, and wireFilterEvents.
 */
function initFilters() {
    var filtersContainer = document.getElementById("category-filters");
    var searchInput = document.getElementById("project-search");
    if (!filtersContainer) return;

    var categories = extractCategories();
    createFilterPills(filtersContainer, categories);
    wireFilterEvents(filtersContainer, searchInput);
    wireTagClicks();
}

// ── Sort & View Toggle ──────────────────────────────────────────────

/**
 * Available sort orders.
 * Each entry has a label (for UI) and a comparator function.
 * "default" preserves the original PROJECTS array order (by category).
 */
var SORT_ORDERS = {
    "default": {
        label: "Default",
        compare: function() { return 0; }
    },
    "a-z": {
        label: "A → Z",
        compare: function(a, b) {
            return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        }
    },
    "z-a": {
        label: "Z → A",
        compare: function(a, b) {
            return b.title.toLowerCase().localeCompare(a.title.toLowerCase());
        }
    },
    "most-tags": {
        label: "Most Tags",
        compare: function(a, b) {
            return b.tags.length - a.tags.length;
        }
    },
    "most-links": {
        label: "Most Links",
        compare: function(a, b) {
            return b.links.length - a.links.length;
        }
    }
};

/**
 * Sort a project array according to the given sort key.
 * Returns a new array (does not mutate the input).
 *
 * "default" returns the array in its original insertion order.
 * Other keys use stable sort via the comparator in SORT_ORDERS.
 *
 * @param {Object[]} projects - Array of projects to sort.
 * @param {string} sortKey - Key from SORT_ORDERS.
 * @returns {Object[]}
 */
function sortProjects(projects, sortKey) {
    if (!sortKey || sortKey === "default" || !SORT_ORDERS[sortKey]) {
        return projects.slice();
    }
    return projects.slice().sort(SORT_ORDERS[sortKey].compare);
}

/**
 * Set the active sort order and re-render.
 * Persists choice in localStorage.
 *
 * @param {string} sortKey - Sort key (must be a key in SORT_ORDERS).
 */
function setSortOrder(sortKey) {
    if (!SORT_ORDERS[sortKey]) return;
    _filterState.sort = sortKey;
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("sort-order", sortKey);
    }
    _updateSortPillActive();
    _applyFilters();
}

/**
 * Set the view mode (grid or list) and update the DOM.
 * Persists choice in localStorage.
 *
 * @param {"grid"|"list"} mode - View mode.
 */
function setViewMode(mode) {
    if (mode !== "grid" && mode !== "list") return;
    _filterState.view = mode;
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("view-mode", mode);
    }
    _applyViewMode();
    _updateViewToggleActive();
}

/**
 * Apply the current view mode class to the projects container.
 */
function _applyViewMode() {
    if (typeof document === "undefined") return;
    var container = document.getElementById("projects-container");
    if (!container) return;
    if (_filterState.view === "list") {
        container.classList.add("view-list");
    } else {
        container.classList.remove("view-list");
    }
}

/**
 * Update sort pill active states in the DOM.
 */
function _updateSortPillActive() {
    if (typeof document === "undefined") return;
    var sortContainer = document.getElementById("sort-controls");
    if (!sortContainer) return;
    var pills = sortContainer.querySelectorAll(".sort-pill");
    for (var i = 0; i < pills.length; i++) {
        var key = pills[i].getAttribute("data-sort");
        if (key === _filterState.sort) {
            pills[i].classList.add("active");
        } else {
            pills[i].classList.remove("active");
        }
    }
}

/**
 * Update view toggle button active states in the DOM.
 */
function _updateViewToggleActive() {
    if (typeof document === "undefined") return;
    var viewContainer = document.getElementById("view-toggle");
    if (!viewContainer) return;
    var btns = viewContainer.querySelectorAll(".view-btn");
    for (var i = 0; i < btns.length; i++) {
        var mode = btns[i].getAttribute("data-view");
        if (mode === _filterState.view) {
            btns[i].classList.add("active");
        } else {
            btns[i].classList.remove("active");
        }
    }
}

/**
 * Build sort control pills into a container element.
 *
 * @param {HTMLElement} container - DOM element for sort pills.
 */
function buildSortControls(container) {
    var label = document.createElement("span");
    label.className = "sort-label";
    label.textContent = "Sort:";
    container.appendChild(label);

    var keys = Object.keys(SORT_ORDERS);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var pill = document.createElement("button");
        pill.type = "button";
        pill.className = "sort-pill" + (key === _filterState.sort ? " active" : "");
        pill.textContent = SORT_ORDERS[key].label;
        pill.setAttribute("data-sort", key);
        container.appendChild(pill);
    }

    container.addEventListener("click", function(e) {
        var pill = e.target;
        if (!pill.classList.contains("sort-pill")) return;
        var sortKey = pill.getAttribute("data-sort");
        if (sortKey) setSortOrder(sortKey);
    });
}

/**
 * Build view mode toggle buttons into a container element.
 *
 * @param {HTMLElement} container - DOM element for view toggle.
 */
function buildViewToggle(container) {
    var gridBtn = document.createElement("button");
    gridBtn.type = "button";
    gridBtn.className = "view-btn" + (_filterState.view === "grid" ? " active" : "");
    gridBtn.setAttribute("data-view", "grid");
    gridBtn.setAttribute("aria-label", "Grid view");
    gridBtn.setAttribute("title", "Grid view");
    gridBtn.innerHTML = "&#9638;&#9638;"; // ▦▦ grid icon
    container.appendChild(gridBtn);

    var listBtn = document.createElement("button");
    listBtn.type = "button";
    listBtn.className = "view-btn" + (_filterState.view === "list" ? " active" : "");
    listBtn.setAttribute("data-view", "list");
    listBtn.setAttribute("aria-label", "List view");
    listBtn.setAttribute("title", "List view");
    listBtn.innerHTML = "&#9776;"; // ☰ list icon
    container.appendChild(listBtn);

    container.addEventListener("click", function(e) {
        var btn = e.target.closest ? e.target.closest(".view-btn") : e.target;
        if (!btn || !btn.classList.contains("view-btn")) return;
        var mode = btn.getAttribute("data-view");
        if (mode) setViewMode(mode);
    });
}

/**
 * Initialize sort controls and view toggle.
 * Restores persisted preferences from localStorage.
 */
function initSortAndView() {
    // Restore persisted preferences
    if (typeof localStorage !== "undefined") {
        var storedSort = localStorage.getItem("sort-order");
        if (storedSort && SORT_ORDERS[storedSort]) {
            _filterState.sort = storedSort;
        }
        var storedView = localStorage.getItem("view-mode");
        if (storedView === "grid" || storedView === "list") {
            _filterState.view = storedView;
        }
    }

    var sortContainer = document.getElementById("sort-controls");
    if (sortContainer) {
        buildSortControls(sortContainer);
    }

    var viewContainer = document.getElementById("view-toggle");
    if (viewContainer) {
        buildViewToggle(viewContainer);
    }

    _applyViewMode();
}

// ── Bookmarks ───────────────────────────────────────────────────────

/**
 * Set of bookmarked project repo names.
 * Loaded from localStorage on init, persisted on every toggle.
 * @type {Set<string>}
 */
var _bookmarks = new (typeof Set !== "undefined" ? Set : function() {
    this._items = {};
    this.has = function(k) { return this._items.hasOwnProperty(k); };
    this.add = function(k) { this._items[k] = true; return this; };
    this.delete = function(k) { delete this._items[k]; };
    this.forEach = function(fn) { for (var k in this._items) { if (this._items.hasOwnProperty(k)) fn(k); } };
    this.size = 0;
})();

/**
 * Check if a project is bookmarked.
 * @param {string} repo - Repository name.
 * @returns {boolean}
 */
function isBookmarked(repo) {
    return _bookmarks.has(repo);
}

/**
 * Get the number of bookmarked projects.
 * @returns {number}
 */
function getBookmarkCount() {
    return _bookmarks.size;
}

/**
 * Toggle a project's bookmark status.
 * Persists to localStorage and re-renders.
 *
 * @param {string} repo - Repository name to toggle.
 * @returns {boolean} New bookmark state (true = bookmarked).
 */
function toggleBookmark(repo) {
    var nowBookmarked;
    if (_bookmarks.has(repo)) {
        _bookmarks.delete(repo);
        nowBookmarked = false;
    } else {
        _bookmarks.add(repo);
        nowBookmarked = true;
    }
    _persistBookmarks();
    _lastRenderedIds = null; // force re-render
    _applyFilters();
    return nowBookmarked;
}

/**
 * Toggle the bookmark-only filter on/off.
 * When active, only bookmarked projects are shown.
 *
 * @param {boolean} [active] - Force a specific state. Omit to toggle.
 */
function setBookmarkFilter(active) {
    if (typeof active === "undefined") {
        _filterState.bookmarked = !_filterState.bookmarked;
    } else {
        _filterState.bookmarked = !!active;
    }
    _lastRenderedIds = null;
    _applyFilters();
}

/**
 * Save bookmarks to localStorage.
 */
function _persistBookmarks() {
    if (typeof localStorage === "undefined") return;
    var arr = [];
    _bookmarks.forEach(function(repo) { arr.push(repo); });
    localStorage.setItem("bookmarks", JSON.stringify(arr));
}

/**
 * Load bookmarks from localStorage.
 */
function _loadBookmarks() {
    if (typeof localStorage === "undefined") return;
    try {
        var stored = localStorage.getItem("bookmarks");
        if (stored) {
            var arr = JSON.parse(stored);
            if (Array.isArray(arr)) {
                for (var i = 0; i < arr.length; i++) {
                    _bookmarks.add(arr[i]);
                }
            }
        }
    } catch (e) {
        // Corrupted data — start fresh
    }
}

/**
 * Update the bookmark filter pill active state and count badge.
 */
function _updateBookmarkFilterPill() {
    if (typeof document === "undefined") return;
    var pill = document.getElementById("bookmark-filter");
    if (!pill) return;
    var count = getBookmarkCount();
    if (_filterState.bookmarked) {
        pill.classList.add("active");
    } else {
        pill.classList.remove("active");
    }
    var badge = pill.querySelector(".bookmark-count");
    if (badge) {
        badge.textContent = count > 0 ? count : "";
    }
}

/**
 * Initialize the bookmark system.
 * Loads persisted bookmarks, creates the filter pill, and wires
 * click handlers for bookmark buttons (delegated on the container).
 */
function initBookmarks() {
    _loadBookmarks();

    // Create bookmark filter pill in the filter bar
    var filterBarRight = document.querySelector(".filter-bar-right");
    if (filterBarRight) {
        var pill = document.createElement("button");
        pill.type = "button";
        pill.id = "bookmark-filter";
        pill.className = "bookmark-filter-pill";
        pill.setAttribute("aria-label", "Show bookmarked projects only");
        pill.setAttribute("title", "Show bookmarked projects only");
        pill.innerHTML = '★ Bookmarks <span class="bookmark-count">' +
            (getBookmarkCount() > 0 ? getBookmarkCount() : "") + '</span>';
        pill.addEventListener("click", function() {
            setBookmarkFilter();
        });
        // Insert at the beginning of the right section
        filterBarRight.insertBefore(pill, filterBarRight.firstChild);
    }

    // Delegate bookmark button clicks on the projects container
    var container = document.getElementById("projects-container");
    if (container) {
        container.addEventListener("click", function(e) {
            var btn = e.target;
            if (!btn.classList.contains("bookmark-btn")) return;
            e.preventDefault();
            e.stopPropagation();
            var repo = btn.getAttribute("data-repo");
            if (repo) toggleBookmark(repo);
        });
    }
}

// ── Deep Link Filter State ──────────────────────────────────────────

/**
 * Whether deep link URL updates are enabled.
 * Disabled during deserialization to prevent re-entrant hash updates.
 * @type {boolean}
 */
var _deepLinkEnabled = false;

/**
 * Serialize current _filterState to a URL hash string.
 * Only includes non-default values to keep the URL clean.
 *
 * Format: #q=search&cat=Category&tag=Tag&sort=a-z&view=list&bm=1
 *
 * @returns {string} Hash string without leading '#', or "" if all defaults.
 */
function serializeFilterState() {
    var parts = [];
    if (_filterState.query) {
        parts.push("q=" + encodeURIComponent(_filterState.query));
    }
    if (_filterState.category) {
        parts.push("cat=" + encodeURIComponent(_filterState.category));
    }
    if (_filterState.tag) {
        parts.push("tag=" + encodeURIComponent(_filterState.tag));
    }
    if (_filterState.sort && _filterState.sort !== "default") {
        parts.push("sort=" + encodeURIComponent(_filterState.sort));
    }
    if (_filterState.view && _filterState.view !== "grid") {
        parts.push("view=" + encodeURIComponent(_filterState.view));
    }
    if (_filterState.bookmarked) {
        parts.push("bm=1");
    }
    return parts.join("&");
}

/**
 * Deserialize a URL hash string into filter state values.
 * Returns an object with only the keys present in the hash.
 *
 * @param {string} hash - Hash string (with or without leading '#').
 * @returns {{ q?: string, cat?: string, tag?: string, sort?: string, view?: string, bm?: boolean }}
 */
function deserializeFilterState(hash) {
    var str = hash || "";
    if (str.charAt(0) === "#") str = str.substring(1);
    if (!str) return {};

    var result = {};
    var pairs = str.split("&");
    for (var i = 0; i < pairs.length; i++) {
        var eqIdx = pairs[i].indexOf("=");
        if (eqIdx < 0) continue;
        var key = pairs[i].substring(0, eqIdx);
        var val = decodeURIComponent(pairs[i].substring(eqIdx + 1));
        if (key === "q") result.q = val;
        else if (key === "cat") result.cat = val;
        else if (key === "tag") result.tag = val;
        else if (key === "sort") result.sort = val;
        else if (key === "view") result.view = val;
        else if (key === "bm") result.bm = val === "1";
    }
    return result;
}

/**
 * Push current filter state to the URL hash.
 * Only updates if deep linking is enabled (prevents loops during init).
 */
function pushFilterState() {
    if (!_deepLinkEnabled) return;
    if (typeof history === "undefined" || typeof location === "undefined") return;
    var hash = serializeFilterState();
    try {
        var newUrl = hash ? "#" + hash : location.pathname + location.search;
        if (location.hash.substring(1) !== hash) {
            history.replaceState(null, "", newUrl);
        }
    } catch (e) {
        // JSDOM or older browsers may not support replaceState fully
    }
}

/**
 * Apply a deserialized state object to _filterState and update UI.
 *
 * @param {{ q?: string, cat?: string, tag?: string, sort?: string, view?: string, bm?: boolean }} state
 */
function _applyDeepLinkState(state) {
    var changed = false;
    if (typeof state.q === "string" && state.q !== _filterState.query) {
        _filterState.query = state.q;
        var searchInput = document.getElementById("project-search");
        if (searchInput) searchInput.value = state.q;
        changed = true;
    }
    if (typeof state.cat === "string") {
        _filterState.category = state.cat || null;
        var pills = document.querySelectorAll("#category-filters .filter-pill");
        for (var i = 0; i < pills.length; i++) {
            var pillCat = pills[i].getAttribute("data-category");
            if (pillCat === state.cat || (pillCat === "" && !state.cat)) {
                pills[i].classList.add("active");
            } else {
                pills[i].classList.remove("active");
            }
        }
        changed = true;
    }
    if (typeof state.tag === "string") {
        _filterState.tag = state.tag || null;
        changed = true;
    }
    if (typeof state.sort === "string" && SORT_ORDERS[state.sort]) {
        _filterState.sort = state.sort;
        var sortSelect = document.getElementById("sort-select");
        if (sortSelect) sortSelect.value = state.sort;
        changed = true;
    }
    if (typeof state.view === "string" && (state.view === "grid" || state.view === "list")) {
        _filterState.view = state.view;
        changed = true;
    }
    if (typeof state.bm === "boolean") {
        _filterState.bookmarked = state.bm;
        changed = true;
    }
    if (changed) {
        _lastRenderedIds = null;
        _applyFilters();
        updateTagIndicator();
    }
}

/**
 * Initialize deep link support.
 * Reads the URL hash on load, applies filter state, and listens
 * for hashchange events (browser back/forward).
 */
function initDeepLink() {
    if (typeof location === "undefined") {
        _deepLinkEnabled = true;
        return;
    }
    var initial = deserializeFilterState(location.hash);
    if (Object.keys(initial).length > 0) {
        _applyDeepLinkState(initial);
    }
    _deepLinkEnabled = true;

    if (typeof window !== "undefined") {
        window.addEventListener("hashchange", function() {
            _deepLinkEnabled = false;
            var state = deserializeFilterState(location.hash);
            _filterState.query = "";
            _filterState.category = null;
            _filterState.tag = null;
            _filterState.sort = "default";
            _filterState.view = "grid";
            _filterState.bookmarked = false;
            _applyDeepLinkState(state);
            _deepLinkEnabled = true;
        });
    }
}

// ── Theme toggle ────────────────────────────────────────────────────

/**
 * Get the resolved theme: explicit localStorage choice, or system preference,
 * or "dark" as the default.
 * @returns {"dark"|"light"}
 */
function getPreferredTheme() {
    if (typeof localStorage !== "undefined") {
        var stored = localStorage.getItem("theme");
        if (stored === "dark" || stored === "light") return stored;
    }
    if (typeof window !== "undefined" && window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
    }
    return "dark";
}

/**
 * Apply a theme by setting the data-theme attribute on <html> and
 * updating the toggle button icon.
 * @param {"dark"|"light"} theme
 */
function applyTheme(theme) {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.textContent = theme === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F"; // 🌙 or ☀️
        btn.setAttribute("aria-label",
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
}

/**
 * Toggle between dark and light themes.  Persists the choice in localStorage.
 * @returns {"dark"|"light"} The new theme.
 */
function toggleTheme() {
    var current = (typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-theme")) || "dark";
    var next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("theme", next);
    }
    return next;
}

/**
 * Wire up the theme toggle button and apply the initial theme.
 * Also listens for OS-level theme changes when no explicit preference is stored.
 */
function initTheme() {
    applyTheme(getPreferredTheme());

    var btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.addEventListener("click", toggleTheme);
    }

    // Listen for OS-level changes (only when user hasn't set an explicit preference)
    if (typeof window !== "undefined" && window.matchMedia) {
        var mql = window.matchMedia("(prefers-color-scheme: light)");
        if (mql.addEventListener) {
            mql.addEventListener("change", function() {
                if (typeof localStorage !== "undefined" &&
                    localStorage.getItem("theme") !== null) return;
                applyTheme(getPreferredTheme());
            });
        }
    }
}

/**
 * Wire up click handlers for tag buttons on project cards.
 * Uses event delegation on the projects container for efficiency.
 */
function wireTagClicks() {
    var container = document.getElementById("projects-container");
    if (!container) return;

    container.addEventListener("click", function(e) {
        var tagEl = e.target;
        if (!tagEl.classList.contains("tag-clickable")) return;

        e.preventDefault();
        e.stopPropagation();

        var tagName = tagEl.getAttribute("data-tag");
        if (!tagName) return;

        // Toggle: if same tag is clicked again, clear it
        if (_filterState.tag && _filterState.tag.toLowerCase() === tagName.toLowerCase()) {
            clearTagFilter();
        } else {
            setTagFilter(tagName);
        }
    });
}

// ── Keyboard navigation ─────────────────────────────────────────────

/**
 * Keyboard navigation state.
 * @type {{ focusIndex: number, helpVisible: boolean }}
 */
var _kbState = { focusIndex: -1, helpVisible: false };

/**
 * Get all currently visible project cards in DOM order.
 * @returns {HTMLElement[]}
 */
function getVisibleCards() {
    if (typeof document === "undefined") return [];
    var container = document.getElementById("projects-container");
    if (!container) return [];
    return Array.prototype.slice.call(container.querySelectorAll(".card"));
}

/**
 * Apply visual focus to a card at the given index.
 * Scrolls the card into view and sets the focus outline.
 *
 * @param {number} index - Index into the visible cards array.
 * @returns {boolean} True if a card was focused.
 */
function focusCard(index) {
    var cards = getVisibleCards();
    if (cards.length === 0) return false;

    // Clamp to valid range
    if (index < 0) index = 0;
    if (index >= cards.length) index = cards.length - 1;

    // Remove previous focus
    blurCards();

    _kbState.focusIndex = index;
    var card = cards[index];
    card.classList.add("card-focused");
    card.setAttribute("tabindex", "-1");
    card.focus({ preventScroll: true });
    if (card.scrollIntoView) {
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    return true;
}

/**
 * Remove focus styling from all cards.
 */
function blurCards() {
    if (typeof document === "undefined") return;
    var focused = document.querySelectorAll(".card-focused");
    for (var i = 0; i < focused.length; i++) {
        focused[i].classList.remove("card-focused");
        focused[i].removeAttribute("tabindex");
    }
}

/**
 * Open the GitHub repo link of the currently focused card.
 * @returns {boolean} True if a link was opened.
 */
function openFocusedCard() {
    var cards = getVisibleCards();
    if (_kbState.focusIndex < 0 || _kbState.focusIndex >= cards.length) return false;
    var card = cards[_kbState.focusIndex];
    var link = card.querySelector(".card-header a");
    if (link && link.href) {
        if (typeof window !== "undefined" && window.open) {
            window.open(link.href, "_blank", "noopener");
        }
        return true;
    }
    return false;
}

/**
 * Build the keyboard shortcuts help overlay HTML.
 * @returns {string}
 */
function buildHelpOverlay() {
    var shortcuts = [
        { key: "j / ↓", desc: "Next project card" },
        { key: "k / ↑", desc: "Previous project card" },
        { key: "Enter", desc: "Open focused project on GitHub" },
        { key: "/", desc: "Focus search input" },
        { key: "Escape", desc: "Clear search / close help" },
        { key: "?", desc: "Toggle this help" }
    ];
    var rows = shortcuts.map(function(s) {
        return '<tr><td class="kb-help-key"><kbd>' + escapeHTML(s.key) + '</kbd></td>' +
               '<td class="kb-help-desc">' + escapeHTML(s.desc) + '</td></tr>';
    }).join("");
    return '<div class="kb-help-overlay" id="kb-help-overlay" role="dialog" aria-label="Keyboard shortcuts">' +
        '<div class="kb-help-panel">' +
        '<div class="kb-help-header">' +
        '<h3>⌨️ Keyboard Shortcuts</h3>' +
        '<button type="button" class="kb-help-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<table class="kb-help-table"><tbody>' + rows + '</tbody></table>' +
        '</div></div>';
}

/**
 * Show the keyboard shortcuts help overlay.
 */
function showKeyboardHelp() {
    if (typeof document === "undefined") return;
    _kbState.helpVisible = true;
    var existing = document.getElementById("kb-help-overlay");
    if (existing) {
        existing.classList.remove("hidden");
        return;
    }
    var wrapper = document.createElement("div");
    wrapper.innerHTML = buildHelpOverlay();
    var overlay = wrapper.firstChild;
    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) hideKeyboardHelp();
    });
    // Close button
    var closeBtn = overlay.querySelector(".kb-help-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", hideKeyboardHelp);
    }
}

/**
 * Hide the keyboard shortcuts help overlay.
 */
function hideKeyboardHelp() {
    _kbState.helpVisible = false;
    if (typeof document === "undefined") return;
    var overlay = document.getElementById("kb-help-overlay");
    if (overlay) overlay.classList.add("hidden");
}

/**
 * Toggle the keyboard shortcuts help overlay.
 */
function toggleKeyboardHelp() {
    if (_kbState.helpVisible) {
        hideKeyboardHelp();
    } else {
        showKeyboardHelp();
    }
}

/**
 * Initialize keyboard navigation.
 * Listens for keydown events on the document and dispatches
 * to the appropriate handler based on the key pressed.
 *
 * Shortcuts are suppressed when the user is typing in an input,
 * textarea, or contenteditable element (except Escape).
 */
function initKeyboardNav() {
    if (typeof document === "undefined") return;

    // Wire keyboard hint button in nav
    var hintBtn = document.getElementById("kb-hint");
    if (hintBtn) {
        hintBtn.addEventListener("click", toggleKeyboardHelp);
    }

    document.addEventListener("keydown", function(e) {
        var tag = e.target.tagName;
        var isInput = (tag === "INPUT" || tag === "TEXTAREA" ||
                       e.target.isContentEditable);

        // Escape always works
        if (e.key === "Escape") {
            e.preventDefault();
            if (_kbState.helpVisible) {
                hideKeyboardHelp();
                return;
            }
            // Clear search input if it has content
            var searchInput = document.getElementById("project-search");
            if (searchInput && searchInput.value) {
                searchInput.value = "";
                _filterState.query = "";
                _applyFilters();
                searchInput.blur();
                return;
            }
            // Clear tag filter
            if (_filterState.tag) {
                clearTagFilter();
                return;
            }
            // Blur focused card
            if (_kbState.focusIndex >= 0) {
                blurCards();
                _kbState.focusIndex = -1;
                return;
            }
            return;
        }

        // Suppress shortcuts when typing in an input
        if (isInput) return;

        // Don't intercept modified keys (Ctrl+C etc.)
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        switch (e.key) {
            case "j":
            case "ArrowDown":
                e.preventDefault();
                focusCard(_kbState.focusIndex + 1);
                break;
            case "k":
            case "ArrowUp":
                e.preventDefault();
                focusCard(_kbState.focusIndex - 1);
                break;
            case "Enter":
                if (_kbState.focusIndex >= 0) {
                    e.preventDefault();
                    openFocusedCard();
                }
                break;
            case "/":
                e.preventDefault();
                var search = document.getElementById("project-search");
                if (search) {
                    search.focus();
                    search.select();
                }
                break;
            case "?":
                e.preventDefault();
                toggleKeyboardHelp();
                break;
        }
    });
}

// ── Portfolio Analytics ──────────────────────────────────────────────

/**
 * Compute category distribution from projects.
 * Returns sorted array of { name, count } objects (descending by count).
 */
function computeCategoryDistribution(projects) {
    var items = projects || PROJECTS;
    var map = Object.create(null);
    for (var i = 0; i < items.length; i++) {
        var cat = items[i].category;
        map[cat] = (map[cat] || 0) + 1;
    }
    var result = [];
    for (var key in map) {
        result.push({ name: key, count: map[key] });
    }
    result.sort(function(a, b) { return b.count - a.count; });
    return result;
}

/**
 * Compute language/tag frequency from projects.
 * Returns sorted array of { name, count } objects (descending by count).
 */
function computeTagDistribution(projects) {
    var items = projects || PROJECTS;
    var map = Object.create(null);
    for (var i = 0; i < items.length; i++) {
        var tags = items[i].tags || [];
        for (var j = 0; j < tags.length; j++) {
            map[tags[j]] = (map[tags[j]] || 0) + 1;
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
 * Compute portfolio summary statistics.
 */
function computePortfolioSummary(projects) {
    var items = projects || PROJECTS;
    var categories = Object.create(null);
    var uniqueTags = Object.create(null);
    var totalLinks = 0;
    var totalTags = 0;

    for (var i = 0; i < items.length; i++) {
        var p = items[i];
        categories[p.category] = true;
        totalLinks += (p.links || []).length;
        var tags = p.tags || [];
        totalTags += tags.length;
        for (var j = 0; j < tags.length; j++) {
            uniqueTags[tags[j]] = true;
        }
    }

    var catCount = 0;
    for (var c in categories) { if (categories[c]) catCount++; }
    var tagCount = 0;
    for (var t in uniqueTags) { if (uniqueTags[t]) tagCount++; }

    return {
        totalProjects: items.length,
        totalCategories: catCount,
        totalTags: tagCount,
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
    var catDist = computeCategoryDistribution(projects);
    var tagDist = computeTagDistribution(projects);
    var summary = computePortfolioSummary(projects);

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

// ── Spotlight Carousel ──────────────────────────────────────────────

/**
 * Spotlight state — tracks current index, auto-rotation timer, and pause.
 * @type {{ index: number, paused: boolean, timerId: number|null, intervalMs: number }}
 */
var _spotlightState = { index: 0, paused: false, timerId: null, intervalMs: 6000 };

/**
 * Build the HTML for a single spotlight card.
 * @param {Object} project - A PROJECTS entry.
 * @param {number} index - Current index (0-based).
 * @param {number} total - Total project count.
 * @returns {string} HTML string.
 */
function buildSpotlightCard(project, index, total) {
    if (!project) return "";

    var tagsHtml = buildTagList(project.tags, { clickable: false, wrapperClass: "spotlight-tags" });
    var linksHtml = buildLinkList(project.links, { wrapperClass: "spotlight-links" });

    var dotsHtml = "";
    for (var d = 0; d < total; d++) {
        dotsHtml += '<button type="button" class="spotlight-dot' +
            (d === index ? ' active' : '') +
            '" data-spotlight-index="' + d +
            '" aria-label="Go to project ' + (d + 1) + '"' +
            ' title="' + escapeHTML(PROJECTS[d].title) + '"></button>';
    }

    var pauseLabel = _spotlightState.paused ? "Resume" : "Pause";

    return '<div class="spotlight">' +
        '<button type="button" class="spotlight-nav spotlight-prev" aria-label="Previous project" title="Previous">' +
            '&#8249;' +
        '</button>' +
        '<div class="spotlight-inner">' +
            '<div class="spotlight-icon">' + escapeHTML(project.icon) + '</div>' +
            '<div class="spotlight-content">' +
                '<div class="spotlight-label">Featured Project ' + (index + 1) + ' of ' + total + '</div>' +
                '<div class="spotlight-title">' + escapeHTML(project.title) + '</div>' +
                '<div class="spotlight-desc">' + escapeHTML(project.desc) + '</div>' +
                tagsHtml +
                linksHtml +
            '</div>' +
        '</div>' +
        '<button type="button" class="spotlight-nav spotlight-next" aria-label="Next project" title="Next">' +
            '&#8250;' +
        '</button>' +
        '<button type="button" class="spotlight-pause" aria-label="' + pauseLabel + ' auto-rotation" title="' + pauseLabel + '">' +
            pauseLabel +
        '</button>' +
        '<div class="spotlight-dots">' + dotsHtml + '</div>' +
    '</div>';
}

/**
 * Render the spotlight at the current index.
 */
function renderSpotlight() {
    if (typeof document === "undefined") return;
    var container = document.getElementById("spotlight-container");
    if (!container) return;
    if (PROJECTS.length === 0) return;

    var idx = _spotlightState.index % PROJECTS.length;
    container.innerHTML = buildSpotlightCard(PROJECTS[idx], idx, PROJECTS.length);
    wireSpotlightEvents();
}

/**
 * Advance to the next spotlight project.
 * @returns {number} The new index.
 */
function nextSpotlight() {
    if (PROJECTS.length === 0) return 0;
    _spotlightState.index = (_spotlightState.index + 1) % PROJECTS.length;
    renderSpotlight();
    return _spotlightState.index;
}

/**
 * Go to the previous spotlight project.
 * @returns {number} The new index.
 */
function prevSpotlight() {
    if (PROJECTS.length === 0) return 0;
    _spotlightState.index = (_spotlightState.index - 1 + PROJECTS.length) % PROJECTS.length;
    renderSpotlight();
    return _spotlightState.index;
}

/**
 * Go to a specific spotlight index.
 * @param {number} idx
 * @returns {number} The new index.
 */
function goToSpotlight(idx) {
    if (PROJECTS.length === 0) return 0;
    _spotlightState.index = ((idx % PROJECTS.length) + PROJECTS.length) % PROJECTS.length;
    renderSpotlight();
    return _spotlightState.index;
}

/**
 * Toggle auto-rotation pause/resume.
 * @returns {boolean} True if now paused, false if resumed.
 */
function toggleSpotlightPause() {
    _spotlightState.paused = !_spotlightState.paused;
    if (_spotlightState.paused) {
        stopSpotlightTimer();
    } else {
        startSpotlightTimer();
    }
    renderSpotlight();
    return _spotlightState.paused;
}

/**
 * Start the auto-rotation timer.
 */
function startSpotlightTimer() {
    stopSpotlightTimer();
    if (typeof setInterval === "undefined") return;
    _spotlightState.timerId = setInterval(function() {
        if (!_spotlightState.paused) {
            nextSpotlight();
        }
    }, _spotlightState.intervalMs);
}

/**
 * Stop the auto-rotation timer.
 */
function stopSpotlightTimer() {
    if (_spotlightState.timerId !== null && typeof clearInterval !== "undefined") {
        clearInterval(_spotlightState.timerId);
        _spotlightState.timerId = null;
    }
}

/**
 * Wire click events for spotlight navigation buttons.
 */
function wireSpotlightEvents() {
    if (typeof document === "undefined") return;
    var container = document.getElementById("spotlight-container");
    if (!container) return;

    var prevBtn = container.querySelector(".spotlight-prev");
    var nextBtn = container.querySelector(".spotlight-next");
    var pauseBtn = container.querySelector(".spotlight-pause");
    var dots = container.querySelectorAll(".spotlight-dot");

    if (prevBtn) {
        prevBtn.addEventListener("click", function() {
            prevSpotlight();
            if (!_spotlightState.paused) startSpotlightTimer();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", function() {
            nextSpotlight();
            if (!_spotlightState.paused) startSpotlightTimer();
        });
    }
    if (pauseBtn) {
        pauseBtn.addEventListener("click", function() {
            toggleSpotlightPause();
        });
    }
    for (var i = 0; i < dots.length; i++) {
        (function(dot) {
            dot.addEventListener("click", function() {
                var idx = parseInt(dot.getAttribute("data-spotlight-index"), 10);
                goToSpotlight(idx);
                if (!_spotlightState.paused) startSpotlightTimer();
            });
        })(dots[i]);
    }
}

/**
 * Initialize the spotlight carousel: render first card and start timer.
 */
function initSpotlight() {
    if (typeof document === "undefined") return;
    _spotlightState.index = 0;
    _spotlightState.paused = false;
    renderSpotlight();
    startSpotlightTimer();
}

// ── Tech Stack Radar ────────────────────────────────────────────────

/**
 * Classification map: tag name → category type.
 * Tags not listed default to "Domain".
 */
var TECH_CATEGORIES = {
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

/**
 * Compute tag usage across all projects.
 * @returns {Array<{tag:string, count:number, type:string, projects:string[]}>}
 *   Sorted by count descending, then alphabetically.
 */
function computeTechStack() {
    var map = {};
    for (var i = 0; i < PROJECTS.length; i++) {
        var p = PROJECTS[i];
        for (var j = 0; j < p.tags.length; j++) {
            var t = p.tags[j];
            if (!map[t]) {
                map[t] = { tag: t, count: 0, type: TECH_CATEGORIES[t] || "Domain", projects: [] };
            }
            map[t].count++;
            map[t].projects.push(p.title);
        }
    }
    var arr = [];
    for (var key in map) {
        if (map.hasOwnProperty(key)) arr.push(map[key]);
    }
    arr.sort(function(a, b) {
        if (b.count !== a.count) return b.count - a.count;
        return a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0;
    });
    return arr;
}

/**
 * Group tech stack items by type.
 * @param {Array} stack - Output of computeTechStack.
 * @returns {Object<string, Array>} Grouped by type.
 */
function groupTechByType(stack) {
    var groups = {};
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
 * Build HTML for the tech stack radar panel.
 * @param {string|null} activeType - Currently active type filter, or null.
 * @returns {string} HTML string.
 */
function buildTechRadar(activeType) {
    var stack = computeTechStack();
    var groups = groupTechByType(stack);
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
            var projectList = "";
            for (var m = 0; m < item.projects.length; m++) {
                if (m > 0) projectList += ", ";
                projectList += item.projects[m];
            }
            itemsHtml += '<button type="button" class="techradar-item" ' +
                'data-techradar-tag="' + escapeHTML(item.tag) + '" ' +
                'title="' + escapeHTML(item.tag) + ' — used in: ' + escapeHTML(projectList) + '">' +
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
    var toolCount = (groups.Tool || []).length;
    var domainCount = (groups.Domain || []).length;
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

/** Tech radar state */
var _techRadarState = { expanded: false, activeType: null };

/**
 * Render the tech radar into its container.
 */
function renderTechRadar() {
    if (typeof document === "undefined") return;
    var panel = document.getElementById("techradar-panel");
    if (!panel) return;
    if (!_techRadarState.expanded) {
        panel.innerHTML = "";
        return;
    }
    panel.innerHTML = buildTechRadar(_techRadarState.activeType);
    wireTechRadarEvents();
}

/**
 * Toggle the tech radar panel visibility.
 * @returns {boolean} True if now expanded.
 */
function toggleTechRadar() {
    _techRadarState.expanded = !_techRadarState.expanded;
    if (typeof document !== "undefined") {
        var btn = document.getElementById("techradar-toggle");
        if (btn) {
            btn.setAttribute("aria-expanded", _techRadarState.expanded ? "true" : "false");
        }
    }
    renderTechRadar();
    return _techRadarState.expanded;
}

/**
 * Set the active type filter.
 * @param {string|null} type - "Language", "Framework", "Tool", "Domain", or null for all.
 */
function setTechRadarFilter(type) {
    _techRadarState.activeType = type;
    renderTechRadar();
}

/**
 * Wire click events for type pills and tag items.
 */
function wireTechRadarEvents() {
    if (typeof document === "undefined") return;
    var panel = document.getElementById("techradar-panel");
    if (!panel) return;

    var pills = panel.querySelectorAll(".techradar-pill");
    for (var i = 0; i < pills.length; i++) {
        (function(pill) {
            pill.addEventListener("click", function() {
                var type = pill.getAttribute("data-techradar-type");
                if (type === "all") {
                    setTechRadarFilter(null);
                } else {
                    setTechRadarFilter(_techRadarState.activeType === type ? null : type);
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

/**
 * Initialize the tech radar toggle button.
 */
function initTechRadar() {
    if (typeof document === "undefined") return;
    var btn = document.getElementById("techradar-toggle");
    if (btn) {
        btn.addEventListener("click", function() {
            toggleTechRadar();
        });
    }
}

// Auto-initialize on DOM ready
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
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
        });
    } else {
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
        initTechRadar: initTechRadar
    };
}
