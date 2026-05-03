/**
 * modules/projects.js — Portfolio project data.
 *
 * To add/update a project, edit the PROJECTS array below.
 * This is the most frequently changed file — separated for cacheability.
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
            { label: "v1.39.0", url: "https://github.com/sauravbhattacharya001/agentlens/releases/tag/v1.39.0" }
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
            { label: "v2.3.0", url: "https://github.com/sauravbhattacharya001/getagentbox/releases/tag/v2.3.0" }
        ]
    },
    {
        category: "AI & Agents",
        icon: "💬", repo: "agenticchat", title: "AgenticChat",
        desc: "Agentic conversation framework — GPT-4o chat with sandboxed code execution, 94 modular features including voice chat, ambient soundscapes, session management, command palette, prompt A/B testing, conversation stash, and incognito mode.",
        tags: ["JavaScript", "GPT-4o", "Code Execution"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/agenticchat" },
            { label: "Demo", url: "https://sauravbhattacharya001.github.io/agenticchat/" },
            { label: "v2.28.2", url: "https://github.com/sauravbhattacharya001/agenticchat/releases/tag/v2.28.2" }
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
            { label: "v1.4.4", url: "https://github.com/sauravbhattacharya001/WinSentinel/releases/tag/v1.4.4" }
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
            { label: "v5.5.0", url: "https://github.com/sauravbhattacharya001/prompt/releases/tag/v5.5.0" }
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
            { label: "v1.8.2", url: "https://github.com/sauravbhattacharya001/gif-captcha/releases/tag/v1.8.2" }
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
        desc: "110+ module functional programming collection — BST, trie, hashmap, bloom filter, red-black trees, union-find, graph algorithms, regex engine, type inference, lambda calculus, SAT solver, persistent vectors, symbolic integration, and more.",
        tags: ["OCaml", "Functional", "Data Structures"],
        links: [
            { label: "Code", url: "https://github.com/sauravbhattacharya001/Ocaml-sample-code" },
            { label: "Site", url: "https://sauravbhattacharya001.github.io/Ocaml-sample-code/" }
        ]
    }
];