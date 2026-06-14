/**
 * app.js — Portfolio project data and card rendering.
 *
 * To add/update a project, edit the PROJECTS array below.
 * The HTML template is generated automatically.
 */

/* exported PROJECTS, renderProjects, filterProjects, initFilters, buildCardHeader, buildCardTags, buildCardLinks, projectMatchesQuery, groupByCategory */

/**
 * Active filter state.
 * @type {{ query: string, category: string|null }}
 */
var _filterState = { query: "", category: null };

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
            { label: "Live", url: "https://sauravbhattacharya001.github.io/getagentbox/" }
        ]
    },
    {
        category: "AI & Agents",
        icon: "🛡️", repo: "ai", title: "AI Safety Research",
        desc: "Contract-enforced sandbox for studying AI agent self-replication safety — 34 analysis modules including Monte Carlo simulation, game-theory modeling, alignment drift detection, and interactive reports.",
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
        desc: "A programming language with zero noise — no parens, no commas, no semicolons. Interpreter + compiler (.srv → C → native). 600+ tests.",
        tags: ["Python", "C", "Compiler", "Language Design"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/sauravcode" },
            { label: "Docs", url: "https://sauravbhattacharya001.github.io/sauravcode/" }
        ]
    },
    {
        category: "Languages & Tools",
        icon: "⚡", repo: "prompt", title: "prompt",
        desc: ".NET 8 prompt engineering toolkit — Azure OpenAI client, template engine, prompt chaining, PromptGuard injection detection.",
        tags: ["C#", ".NET 8", "Azure OpenAI"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/prompt" },
            { label: "Docs", url: "https://sauravbhattacharya001.github.io/prompt/" }
        ]
    },

    // --- Visualization & Data ---
    {
        category: "Visualization & Data",
        icon: "📐", repo: "VoronoiMap", title: "VoronoiMap",
        desc: "Voronoi diagram generation & spatial partitioning — Lloyd relaxation, neighbourhood graphs, 6 color schemes, GeoJSON export. 285 tests.",
        tags: ["Python", "Algorithms", "Geometry"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/VoronoiMap" },
            { label: "Demo", url: "https://sauravbhattacharya001.github.io/VoronoiMap/" }
        ]
    },

    // --- Apps & More ---
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
        icon: "🐫", repo: "Ocaml-sample-code", title: "OCaml Samples",
        desc: "45-module functional programming collection — BST, trie, hashmap, bloom filter, red-black trees, union-find, graph algorithms, regex engine, type inference, lambda calculus, SAT solver, and more.",
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
 * Uses a pre-allocated, reusable DOM element instead of creating a new
 * one per call.  The element is lazily created on first use and cached
 * for subsequent calls — avoids ~100+ createElement+GC cycles during
 * renderProjects().
 *
 * The textContent setter handles &, <, > escaping; we manually replace
 * double quotes afterwards because textContent does NOT escape them but
 * they are critical inside HTML attribute values like href="...".
 *
 * @param {string} str
 * @returns {string}
 */
var _escapeEl = null;
function escapeHTML(str) {
    if (!_escapeEl) { _escapeEl = document.createElement("span"); }
    _escapeEl.textContent = str;
    return _escapeEl.innerHTML.replace(/"/g, "&quot;");
}

/**
 * Sanitize a URL to prevent javascript: protocol and attribute breakout.
 * Only allows http:, https:, and mailto: schemes.
 *
 * Strips ASCII control characters (0x00-0x1F, 0x7F) and Unicode
 * whitespace before checking the scheme.  Browsers silently ignore
 * embedded tabs, newlines, and null bytes when parsing href values,
 * so "java\tscript:alert(1)" would execute without this defence.
 * See CWE-116 (Improper Encoding or Escaping of Output).
 *
 * @param {string} url
 * @returns {string}
 */
function sanitizeURL(url) {
    // Strip control chars (0x00-0x1F, 0x7F) and all Unicode whitespace
    // eslint-disable-next-line no-control-regex
    var cleaned = url.replace(/[\x00-\x1F\x7F]/g, "");
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
 * @param {string[]} tags
 * @returns {string}
 */
function buildCardTags(tags) {
    return '<div class="card-tags">' +
        tags.map(function(t) {
            return '<span class="tag">' + escapeHTML(t) + '</span>';
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
 * Filter PROJECTS by current _filterState (query + category).
 * Returns the filtered list without mutating PROJECTS.
 *
 * Text search matches against title, desc, tags, and repo name
 * (case-insensitive).  Category filter matches the category field
 * exactly.  Both filters are AND-combined.
 *
 * @returns {Object[]}
 */
function filterProjects() {
    var q = _filterState.query.toLowerCase();
    var cat = _filterState.category;

    return PROJECTS.filter(function(p) {
        if (cat && p.category !== cat) return false;
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
 * Render all project cards into #projects-container, grouped by category.
 *
 * @param {Object[]} [projects] - Optional filtered project list.
 *   Defaults to all PROJECTS.
 */
function renderProjects(projects) {
    var container = document.getElementById("projects-container");
    if (!container) return;

    var items = projects || PROJECTS;

    // Show/hide no-results message
    var noResults = document.getElementById("no-results");
    if (noResults) {
        noResults.style.display = items.length === 0 ? "block" : "none";
    }

    var groups = groupByCategory(items);

    var html = "";
    groups.forEach(function(g) {
        html += '<div class="category">' +
            '<div class="category-label">' + escapeHTML(g.name) + '</div>' +
            '<div class="projects-grid">' +
            g.items.map(buildCard).join("") +
            '</div></div>';
    });

    container.innerHTML = html;
}

/**
 * Initialize the category filter pills and search input.
 * Extracts unique categories from PROJECTS and creates clickable pills.
 * Wires up debounced search input and pill click handlers.
 */
function initFilters() {
    var filtersContainer = document.getElementById("category-filters");
    var searchInput = document.getElementById("project-search");
    if (!filtersContainer) return;

    // Extract unique categories in insertion order
    var categories = [];
    var seen = Object.create(null);
    PROJECTS.forEach(function(p) {
        if (!seen[p.category]) {
            seen[p.category] = true;
            categories.push(p.category);
        }
    });

    // Create "All" pill + one per category
    var allPill = document.createElement("button");
    allPill.className = "filter-pill active";
    allPill.textContent = "All";
    allPill.setAttribute("data-category", "");
    allPill.type = "button";
    filtersContainer.appendChild(allPill);

    categories.forEach(function(cat) {
        var pill = document.createElement("button");
        pill.className = "filter-pill";
        pill.textContent = cat;
        pill.setAttribute("data-category", cat);
        pill.type = "button";
        filtersContainer.appendChild(pill);
    });

    // Pill click handler
    filtersContainer.addEventListener("click", function(e) {
        var pill = e.target;
        if (!pill.classList.contains("filter-pill")) return;

        // Update active state
        var pills = filtersContainer.querySelectorAll(".filter-pill");
        for (var i = 0; i < pills.length; i++) {
            pills[i].classList.remove("active");
        }
        pill.classList.add("active");

        var cat = pill.getAttribute("data-category");
        _filterState.category = cat || null;
        renderProjects(filterProjects());
    });

    // Debounced search input
    var debounceTimer = null;
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                _filterState.query = searchInput.value;
                renderProjects(filterProjects());
            }, 200);
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
    module.exports = { PROJECTS: PROJECTS, escapeHTML: escapeHTML, sanitizeURL: sanitizeURL, buildCard: buildCard, buildCardHeader: buildCardHeader, buildCardTags: buildCardTags, buildCardLinks: buildCardLinks, projectMatchesQuery: projectMatchesQuery, groupByCategory: groupByCategory, renderProjects: renderProjects, filterProjects: filterProjects, initFilters: initFilters, _filterState: _filterState, getPreferredTheme: getPreferredTheme, applyTheme: applyTheme, toggleTheme: toggleTheme, initTheme: initTheme };
}
