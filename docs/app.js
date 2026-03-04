/**
 * app.js — Portfolio project data and card rendering.
 *
 * To add/update a project, edit the PROJECTS array below.
 * The HTML template is generated automatically.
 */

/* exported PROJECTS, renderProjects */

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
        icon: "💬", repo: "agenticchat", title: "AgenticChat",
        desc: "Agentic conversation framework — GPT-4o chat with sandboxed code execution, voice input, dark/light themes, keyboard shortcuts.",
        tags: ["JavaScript", "GPT-4o", "Code Execution"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/agenticchat" },
            { label: "Demo", url: "https://sauravbhattacharya001.github.io/agenticchat/" }
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
    {
        category: "Languages & Tools",
        icon: "🎭", repo: "gif-captcha", title: "gif-captcha",
        desc: "GIF-based CAPTCHA research — 8 interactive tools: visual puzzles, temporal challenges, AI simulator, cognitive load analyzer, accessibility audit.",
        tags: ["HTML/JS", "Research", "Security"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/gif-captcha" },
            { label: "Demo", url: "https://sauravbhattacharya001.github.io/gif-captcha/" }
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
    {
        category: "Visualization & Data",
        icon: "🔗", repo: "GraphVisual", title: "GraphVisual",
        desc: "Graph visualization for community evolution — centrality (Brandes'), MST, graph coloring, community detection, shortest path, link prediction, graph generation, topological sort, GraphML export. 900+ tests.",
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
 * Uses both textContent (for &, <, >) and manual replacement
 * for double quotes — which textContent does NOT escape but
 * are critical inside HTML attribute values like href="...".
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML.replace(/"/g, "&quot;");
}

/**
 * Sanitize a URL to prevent javascript: protocol and attribute breakout.
 * Only allows http:, https:, and mailto: schemes.
 * @param {string} url
 * @returns {string}
 */
function sanitizeURL(url) {
    var trimmed = url.replace(/^\s+/, "").toLowerCase();
    if (trimmed.indexOf("http:") === 0 ||
        trimmed.indexOf("https:") === 0 ||
        trimmed.indexOf("mailto:") === 0) {
        return escapeHTML(url);
    }
    return "#";
}

/**
 * Build a single project card HTML string.
 * @param {Object} p - Project from PROJECTS array.
 * @returns {string}
 */
function buildCard(p) {
    var tags = p.tags.map(function(t) {
        return '<span class="tag">' + escapeHTML(t) + '</span>';
    }).join("");

    var links = p.links.map(function(l) {
        return '<a href="' + sanitizeURL(l.url) + '" target="_blank" rel="noopener">' + escapeHTML(l.label) + '</a>';
    }).join("");

    return '<div class="card">' +
        '<div class="card-header">' +
            '<span class="card-icon">' + escapeHTML(p.icon) + '</span>' +
            '<h3><a href="https://github.com/sauravbhattacharya001/' + escapeHTML(p.repo) + '" target="_blank" rel="noopener">' + escapeHTML(p.title) + '</a></h3>' +
        '</div>' +
        '<p>' + escapeHTML(p.desc) + '</p>' +
        '<div class="card-tags">' + tags + '</div>' +
        '<div class="card-links">' + links + '</div>' +
    '</div>';
}

/**
 * Render all project cards into #projects-container, grouped by category.
 */
function renderProjects() {
    var container = document.getElementById("projects-container");
    if (!container) return;

    // Group by category (preserve insertion order)
    var groups = [];
    var groupMap = {};
    PROJECTS.forEach(function(p) {
        if (!groupMap[p.category]) {
            groupMap[p.category] = [];
            groups.push({ name: p.category, items: groupMap[p.category] });
        }
        groupMap[p.category].push(p);
    });

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

// Auto-initialize on DOM ready
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderProjects);
    } else {
        renderProjects();
    }
}

// Exports for testing
if (typeof module !== "undefined" && module.exports) {
    module.exports = { PROJECTS: PROJECTS, escapeHTML: escapeHTML, sanitizeURL: sanitizeURL, buildCard: buildCard, renderProjects: renderProjects };
}
