/**
 * app.js — Portfolio project data and card rendering.
 *
 * To add/update a project, edit the PROJECTS array below.
 * The HTML template is generated automatically.
 */

/* exported PROJECTS, _filterState, renderProjects, filterProjects, initFilters, buildCardHeader, buildCardTags, buildCardLinks, buildCategoryHTML, projectMatchesQuery, groupByCategory, extractCategories, createFilterPills, wireFilterEvents, updateTagIndicator, clearTagFilter, setTagFilter, extractTags, wireTagClicks, getPreferredTheme, applyTheme, toggleTheme, initTheme */

/**
 * Active filter state.
 * @type {{ query: string, category: string|null, tag: string|null }}
 */
var _filterState = { query: "", category: null, tag: null };

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
 * characters (U+200B-U+200F, U+FEFF, U+00AD), and Unicode line/paragraph
 * separators before checking the scheme.  Browsers silently ignore
 * embedded tabs, newlines, null bytes, and zero-width chars when parsing
 * href values, so "ja\u200Bvascript:alert(1)" would execute without this
 * defence.  See CWE-116 (Improper Encoding or Escaping of Output).
 *
 * @param {string} url
 * @returns {string}
 */
function sanitizeURL(url) {
    // Strip control chars (0x00-0x1F, 0x7F), zero-width Unicode (200B-200F,
    // FEFF, 00AD), and Unicode line/paragraph separators (2028-2029)
    // eslint-disable-next-line no-control-regex
    var cleaned = url.replace(/[\x00-\x1F\x7F\u00AD\u200B-\u200F\u2028\u2029\uFEFF]/g, "");
    var trimmed = cleaned.replace(/^\s+/, "").toLowerCase();
    if (trimmed.indexOf("http:") === 0 ||
        trimmed.indexOf("https:") === 0 ||
        trimmed.indexOf("mailto:") === 0) {
        return escapeHTML(cleaned);
    }
    return "#";
}

/**
 * Build a single project card HTML string.
 * @param {Object} p - Project from PROJECTS array.
 * @returns {string}
 */
function buildCardHeader(p) {
    return '<div class="card-header">' +
        '<span class="card-icon">' + escapeHTML(p.icon) + '</span>' +
        '<h3><a href="https://github.com/sauravbhattacharya001/' +
            escapeHTML(p.repo) + '" target="_blank" rel="noopener">' +
            escapeHTML(p.title) + '</a></h3>' +
        '</div>';
}

/**
 * Build tag pills for a project card.
 * Tags are clickable buttons that filter to show all projects with that tag.
 * @param {string[]} tags
 * @returns {string}
 */
function buildCardTags(tags) {
    return '<div class="card-tags">' +
        tags.map(function(t) {
            return '<button type="button" class="tag tag-clickable" data-tag="' +
                escapeHTML(t) + '">' + escapeHTML(t) + '</button>';
        }).join("") +
        '</div>';
}

/**
 * Build link buttons for a project card.
 * @param {Object[]} links - Array of {label, url} objects.
 * @returns {string}
 */
function buildCardLinks(links) {
    return '<div class="card-links">' +
        links.map(function(l) {
            return '<a href="' + sanitizeURL(l.url) +
                '" target="_blank" rel="noopener">' +
                escapeHTML(l.label) + '</a>';
        }).join("") +
        '</div>';
}

/**
 * Assemble a full project card from its constituent parts.
 * @param {Object} p - Project from PROJECTS array.
 * @returns {string}
 */
function buildCard(p) {
    return '<div class="card">' +
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
 * @param {Object} p - Project from PROJECTS array.
 * @param {string} query - Lowercase search query.
 * @returns {boolean}
 */
function projectMatchesQuery(p, query) {
    if (!query) return true;
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
 * (case-insensitive).  Category filter matches the category field
 * exactly.  Tag filter matches any tag case-insensitively.
 * All filters are AND-combined.
 *
 * @returns {Object[]}
 */
function filterProjects() {
    var q = _filterState.query.toLowerCase();
    var cat = _filterState.category;
    var tag = _filterState.tag;

    return PROJECTS.filter(function(p) {
        if (cat && p.category !== cat) return false;
        if (tag) {
            var tagLower = tag.toLowerCase();
            var hasTag = false;
            for (var i = 0; i < p.tags.length; i++) {
                if (p.tags[i].toLowerCase() === tagLower) {
                    hasTag = true;
                    break;
                }
            }
            if (!hasTag) return false;
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

    var groups = groupByCategory(items);
    container.innerHTML = groups.map(buildCategoryHTML).join("");

    // Update active tag indicator
    updateTagIndicator();
}

/**
 * Extract unique categories from the PROJECTS array, preserving
 * insertion order.
 *
 * @param {Object[]} [projects] - Optional project list. Defaults to PROJECTS.
 * @returns {string[]}
 */
function extractCategories(projects) {
    var items = projects || PROJECTS;
    var categories = [];
    var seen = Object.create(null);
    items.forEach(function(p) {
        if (!seen[p.category]) {
            seen[p.category] = true;
            categories.push(p.category);
        }
    });
    return categories;
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
    var ids = filtered.map(function(p) { return p.repo; }).join(",");
    if (ids === _lastRenderedIds) return;
    _lastRenderedIds = ids;
    renderProjects(filtered);
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
    var items = projects || PROJECTS;
    var tags = [];
    var seen = Object.create(null);
    items.forEach(function(p) {
        (p.tags || []).forEach(function(t) {
            var lower = t.toLowerCase();
            if (!seen[lower]) {
                seen[lower] = true;
                tags.push(t);
            }
        });
    });
    return tags.sort();
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

// Auto-initialize on DOM ready
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            renderProjects();
            initFilters();
            initTheme();
        });
    } else {
        renderProjects();
        initFilters();
        initTheme();
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
        initTheme: initTheme
    };
}
