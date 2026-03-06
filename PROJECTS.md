# Projects Portfolio

Detailed technical overview of all public repositories. For a quick summary, see the [profile README](./README.md).

---

## 🤖 AI & Agents

### [AgentLens](https://github.com/sauravbhattacharya001/agentlens)

> Observability and explainability for AI agents — the "Datadog for AI agents."

| | |
|---|---|
| **Language** | JavaScript (Node.js backend) + Python (SDK) |
| **Architecture** | Python SDK → Node.js API → SQLite → React Dashboard |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/agentlens/releases/tag/v1.0.0) |
| **Docs** | [sauravbhattacharya001.github.io/agentlens](https://sauravbhattacharya001.github.io/agentlens/) |

**What it does:**
- **Python SDK** with decorators (`@trace_agent`, `@trace_tool`) for zero-config instrumentation
- **Session tracking** with hierarchical agent → tool → sub-agent spans
- **Explainability engine** — understands *why* an agent made a decision, not just *what* it did
- **Real-time dashboard** with session timeline, event stream, and token usage analytics
- **Session comparison** — side-by-side diff of two agent runs with visual charts
- **Export** — JSON/CSV session export for offline analysis
- **LangChain integration** as first target

**Infrastructure:** CI (Node 18/20/22 + Python 3.9-3.13), CodeQL, Dependabot, branch protection, Docker workflow.

---

### [AI Safety Research](https://github.com/sauravbhattacharya001/ai)

> Contract-enforced sandbox for studying AI agent self-replication safety.

| | |
|---|---|
| **Language** | Python |
| **Architecture** | Controller → Workers (sandboxed agents) with HMAC-signed manifests |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/ai/releases/tag/v1.0.0) |
| **Docs** | [sauravbhattacharya001.github.io/ai](https://sauravbhattacharya001.github.io/ai/) |

**What it does:**
- Studies how AI agents attempt self-replication under various containment strategies
- **5 base replication strategies** (greedy, conservative, random, chain, burst) plus 34 analysis modules for safety policy, chaos testing, forensics, game theory, alignment drift, and incident response
- **ManifestSigner** with HMAC-SHA256 for cryptographic spawn authorization
- **Controller** enforces depth limits, resource caps, and kill switches
- **Simulation Runner CLI** with ASCII worker tree visualization and JSON export
- **Comparison Runner** for side-by-side strategy analysis with rankings

**Infrastructure:** CI (Python 3.10-3.12, mypy + flake8), CodeQL, Docker (multi-arch amd64+arm64), PyPI publishing, branch protection, MkDocs docs site.

---

### [AgenticChat](https://github.com/sauravbhattacharya001/agenticchat)

> Agentic conversation framework with multi-agent collaboration.

| | |
|---|---|
| **Language** | JavaScript (vanilla, no frameworks) |
| **Architecture** | Modular ES6 (ChatConfig, ConversationManager, ApiKeyManager, UIController, SandboxRunner) |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/agenticchat/releases/tag/v1.0.0) |
| **Demo** | [sauravbhattacharya001.github.io/agenticchat](https://sauravbhattacharya001.github.io/agenticchat/) |

**What it does:**
- Client-side agentic chat with GPT-4o integration
- **30+ modular features** built as revealing-module-pattern IIFEs
- **Sandboxed code execution** via postMessage-based iframe isolation
- **Session management** with auto-save, import/export, and conversation tags
- **Slash commands** for quick actions (/focus, /tags, /timing, etc.)
- **Message search** with highlight navigation and match counting
- **Bookmarks & pinning** for important messages
- **Message annotations** and **conversation chapters** for organization
- **Conversation timeline**, **summarizer**, and **fork** support
- **Voice input**, **read aloud**, and **message diff** comparison
- **Prompt templates** across 4 categories (Data & Charts, Web & APIs, Utilities, Fun & Creative)
- **Conversation history** panel with Markdown/JSON export
- **Token usage tracking** with cost estimation
- **Focus/zen mode** for distraction-free writing
- **Persona presets** and **model selector** for different AI configurations
- **Scratchpad**, **quick replies**, **input history**, and **response time badges**

**Infrastructure:** CI (HTMLHint + ESLint + secret scanning), CodeQL, 100+ Jest tests, Docker workflow, npm publishing, branch protection, documentation site.

---

### [AgentBox](https://github.com/sauravbhattacharya001/getagentbox)

> AI agents as a service — personal AI assistants accessible via messaging.

| | |
|---|---|
| **Language** | HTML/JavaScript |
| **Status** | Live — open access, 20 msg/day free tier |
| **Site** | [sauravbhattacharya001.github.io/getagentbox](https://sauravbhattacharya001.github.io/getagentbox/) |

**What it does:**
- Landing page and documentation for the AgentBox platform
- Interactive chat demo with 4 animated conversation scenarios
- Telegram-style message bubbles with typing indicators

---

## 🔤 Languages & Tools

### [sauravcode](https://github.com/sauravbhattacharya001/sauravcode)

> A programming language with zero noise — no parentheses, no commas, no semicolons.

| | |
|---|---|
| **Language** | Python (interpreter + compiler) |
| **Architecture** | Lexer → Parser → AST → Tree-walk Interpreter *or* C code generator → GCC → native binary |
| **Release** | [v2.0.0](https://github.com/sauravbhattacharya001/sauravcode/releases/tag/v2.0.0) |
| **Docs** | [sauravbhattacharya001.github.io/sauravcode](https://sauravbhattacharya001.github.io/sauravcode/) |

**What it does:**
- **Dual execution**: `saurav.py` (tree-walk interpreter) and `sauravcc.py` (compiler: `.srv` → C → GCC → native `.exe`)
- **27 built-in functions**: string ops, math, utilities — all user-overridable
- **Module imports**: `import` statement for `.srv` files with circular dependency detection and diamond dependency handling
- **Interactive REPL** with persistent state, multi-line blocks, command history
- **Standard library**: upper/lower/trim/replace/split/join/contains, abs/round/floor/ceil/sqrt/power, type_of/to_string/range/sort
- **600+ tests** covering interpreter, compiler, REPL, and module imports

**Full language specification:** [docs/LANGUAGE.md](https://github.com/sauravbhattacharya001/sauravcode/blob/master/docs/LANGUAGE.md) with EBNF grammar.

**Infrastructure:** CI, CodeQL, code coverage, auto-labeler, GitHub Pages, comprehensive docs (language spec, architecture, examples, learning path).

---

### [prompt](https://github.com/sauravbhattacharya001/prompt)

> Prompt engineering toolkit for reliable LLM interactions in .NET.

| | |
|---|---|
| **Language** | C# / .NET 8 |
| **Architecture** | `AzureLLM` client → Azure OpenAI → retry/streaming/conversation management |
| **Release** | [v2.0.0](https://github.com/sauravbhattacharya001/prompt/releases/tag/v2.0.0) |
| **Docs** | [sauravbhattacharya001.github.io/prompt](https://sauravbhattacharya001.github.io/prompt/) |

**What it does:**
- **AzureLLM** wrapper with env-based config, cached client (thread-safe double-checked locking)
- **Multi-turn Conversation** class with per-conversation parameters (Temperature, MaxTokens, TopP, penalties)
- **PromptTemplate** with `{{variable}}` placeholders, defaults, strict/non-strict rendering, composition
- **Conversation serialization** — full SaveToJson/LoadFromJson round-trip
- **Retry logic** with configurable maxRetries (validated, cached)

**Infrastructure:** CI, CodeQL, code coverage (Codecov), Docker workflow, NuGet publishing, branch protection, auto-labeler, stale bot.

---

## 📊 Visualization & Data

### [VoronoiMap](https://github.com/sauravbhattacharya001/VoronoiMap) ⭐ 3

> Voronoi diagram generation and spatial partitioning toolkit.

| | |
|---|---|
| **Language** | Python |
| **Architecture** | KDTree spatial index → iterative nearest-neighbor estimation → SVG/HTML/GeoJSON output |
| **Demo** | [sauravbhattacharya001.github.io/VoronoiMap](https://sauravbhattacharya001.github.io/VoronoiMap/) |

**What it does:**
- **6 color schemes** for Voronoi region rendering
- **SVG visualization** with scipy-backed region computation
- **Interactive HTML** with Canvas pan/zoom, hover tooltips, theme toggle
- **GeoJSON export** for GIS tool integration (FeatureCollection with CRS support)
- **CLI**: `--visualize`, `--interactive`, `--geojson`, `--color-scheme`, `--show-labels`
- **PyPI publishable** with `pyproject.toml` (hatchling)
- **143 tests** covering geometry, statistics, visualization, CLI, edge cases

**Infrastructure:** CI (Python 3.9-3.12 + lint), CodeQL, code coverage (Codecov), Docker workflow (multi-arch), branch protection, MkDocs docs site, PyPI publishing.

---

### [GraphVisual](https://github.com/sauravbhattacharya001/GraphVisual)

> Graph application to study community evolution in student communities.

| | |
|---|---|
| **Language** | Java (Swing GUI) |
| **Architecture** | PostgreSQL → Java data pipeline → graph model → Swing visualization |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/GraphVisual/releases/tag/v1.0.0) |

**What it does:**
- **Network statistics panel**: node/edge counts, density, degree distribution, hub detection
- **Shortest path finder**: BFS (hop-optimal) and Dijkstra (weight-optimal) with visual path highlighting
- **Meeting extraction algorithm** from PostgreSQL communication data
- **Relationship classification** with configurable thresholds
- **Timeline visualization** for community evolution
- **Minimum spanning tree** — Kruskal and Prim algorithms with visual highlighting
- **Graph coloring** — greedy coloring with chromatic number analysis
- **Community detection** — modularity-based community identification
- **GraphML export** — standard graph format for interoperability with Gephi, NetworkX, etc.
- **Degree distribution analyzer** — statistical analysis of node degree distributions
- **Graph diameter & eccentricity** — computes diameter, radius, center, and periphery vertices
- **Link prediction** — Jaccard coefficient, Adamic-Adar, common neighbours for predicting future edges
- **Graph generator** — 10 topologies (complete, cycle, star, grid, tree, path, bipartite, Petersen, wheel, random)
- **Topological sort** — Kahn's algorithm with cycle detection for DAGs
- **Influence spread simulation** — Independent Cascade (IC), Linear Threshold (LT), and SIR models with cached neighbor lookups
- **Graph similarity** — spectral comparison via Jacobi eigenvalue decomposition

**Infrastructure:** CI (Java 11/17), CodeQL, Dependabot, auto-labeler, branch protection. 2400+ tests.

---

## 📱 Apps

### [everything](https://github.com/sauravbhattacharya001/everything)

> Full-stack Flutter/Dart application with event management.

| | |
|---|---|
| **Language** | Dart / Flutter |
| **Architecture** | BLoC pattern → SQLite → Material Design 3 |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/everything/releases/tag/v1.0.0) |
| **App** | [sauravbhattacharya001.github.io/everything](https://sauravbhattacharya001.github.io/everything/) |

**What it does:**
- **Event CRUD** with date/time picker and 4 priority levels
- **Recurring events** with flexible recurrence rules (daily, weekly, monthly)
- **Event templates** for quick creation from saved configurations
- **Smart conflict detection** — scheduling proximity analysis with resolution suggestions
- **Search, filter & sort** with combinable criteria
- **Activity heatmap** — year-at-a-glance event density visualization
- **Weekly agenda digest** — formatted event summaries for upcoming days
- **Streak tracker** — consecutive-day activity analysis with motivational messages
- **Time budget analysis** — time allocation across tags, priorities, and weekdays with budget targets
- **Event location** support with venue tracking
- **SQLite persistence** with proper BLoC state management
- **Docker-ready** with multi-stage Dockerfile

**Infrastructure:** CI (analyze + test + build), CodeQL (Dart static analysis), Dependabot, Docker workflow, branch protection, auto-labeler.

---

### [FeedReader](https://github.com/sauravbhattacharya001/FeedReader)

> RSS feed reader for BBC World News (Swift/iOS).

| | |
|---|---|
| **Language** | Swift 5 |
| **Architecture** | MVC with XMLParser, URLSession, NSCache, NSCoding persistence |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/FeedReader/releases/tag/v1.0.0) |

**What it does:**
- **Async image loading** with NSCache and cell-reuse guards
- **Bookmarks** — swipe-to-bookmark, persistent storage, dedicated bookmarks view
- **Pull-to-refresh** and **search/filter** (real-time title + description matching)
- **Share** via UIActivityViewController
- **Network reachability** monitoring (SCNetworkReachability)
- **Hardened ATS** with URL scheme allowlist and HTML sanitization

**Infrastructure:** CI, CodeQL (Swift), Dependabot, Docker workflow, 20+ security tests.

---

### [Vidly](https://github.com/sauravbhattacharya001/Vidly)

> Video rental management app (C# / ASP.NET MVC).

| | |
|---|---|
| **Language** | C# / .NET Framework 4.8 |
| **Architecture** | MVC → Repository Pattern (thread-safe, in-memory) → Razor Views |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/Vidly/releases/tag/v1.0.0) |
| **Docs** | [sauravbhattacharya001.github.io/Vidly](https://sauravbhattacharya001.github.io/Vidly/) |

**What it does:**
- **Movie management**: CRUD, genres (10 types), 5-star ratings, search/filter/sort
- **Customer management**: CRUD, 4-tier membership, search, statistics dashboard
- **Rental system**: checkout/return workflow, $1.50/day late fees, overdue tracking
- **Security**: CSP headers, httpOnly cookies, debug disabled, custom errors

**Infrastructure:** CI (MSBuild), CodeQL, code coverage (coverlet), Docker (Windows container), NuGet publishing, branch protection, auto-labeler, 11-section docs site.

---

### [BioBots](https://github.com/sauravbhattacharya001/BioBots)

> 3D printer run statistics and monitoring tool.

| | |
|---|---|
| **Language** | C# (backend) + JavaScript (frontend) |
| **Architecture** | ASP.NET Web API → JSON file cache (Lazy\<T\>) → Chart.js dashboard |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/BioBots/releases/tag/v1.0.0) |
| **Site** | [sauravbhattacharya001.github.io/BioBots](https://sauravbhattacharya001.github.io/BioBots/) |

**What it does:**
- **11 bioprint metrics** with RESTful query API (int + double aggregation)
- **MetricDescriptor registry** — unified, boilerplate-free endpoint routing
- **Interactive data explorer** with histograms, scatter plots, regression analysis
- **Interactive data table** with sorting, search, numeric filtering, CSV export

**Infrastructure:** CI (MSBuild + JSON/whitespace lint), Dependabot, Docker workflow, NuGet publishing, GitHub Pages analytics demo.

---

### [gif-captcha](https://github.com/sauravbhattacharya001/gif-captcha)

> GIF-based CAPTCHA research — animated visual puzzles for human verification.

| | |
|---|---|
| **Language** | HTML/JavaScript |
| **Architecture** | Static site with research data + interactive demos |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/gif-captcha/releases/tag/v1.0.0) |
| **Demo** | [sauravbhattacharya001.github.io/gif-captcha](https://sauravbhattacharya001.github.io/gif-captcha/) |

**What it does:**
- **7 interactive research tools**: visual puzzle demo, research analysis dashboard, AI response simulator, temporal challenge explorer, benchmark suite, cognitive load analyzer (6-dimension complexity scoring), CAPTCHA generator
- **Research analysis** — 6-category CAPTCHA taxonomy, human vs AI radar chart, multi-model comparison
- **Cognitive load analysis** — visual processing, temporal reasoning, cultural context, humor/irony, spatial awareness, narrative comprehension scoring
- **Security**: CSP headers, noopener/noreferrer, nginx hardened config, non-root Docker container

**Infrastructure:** CI (HTML validation + security audit), Docker workflow (nginx:alpine), Dependabot, branch protection.

---

## 📚 Learning & Reference

### [OCaml Samples](https://github.com/sauravbhattacharya001/Ocaml-sample-code)

> Progressive functional programming examples in OCaml.

| | |
|---|---|
| **Language** | OCaml 5.2 |
| **Release** | [v1.0.0](https://github.com/sauravbhattacharya001/Ocaml-sample-code/releases/tag/v1.0.0) |
| **Docs** | [sauravbhattacharya001.github.io/Ocaml-sample-code](https://sauravbhattacharya001.github.io/Ocaml-sample-code/) |

**What it does:**
- **17 modules** covering the full spectrum of functional programming
- **Data structures**: BST, trie, functional hashmap (persistent/immutable), bloom filter (probabilistic set membership), red-black trees (balanced BST), union-find (disjoint sets), leftist heap (priority queue)
- **Algorithms**: graph algorithms (BFS, DFS, shortest path, components, cycle detection, topological sort), merge sort (tail-recursive), sorting algorithms, regex engine (Thompson's NFA construction)
- **Functional patterns**: lazy streams, parser combinators, higher-order functions
- **Learning path**: basics → recursion → pattern matching → modules/functors → advanced data structures → graph algorithms

**Infrastructure:** CodeQL, Docker (multi-stage, native binaries), docs site with syntax-highlighted code.

---

## 📈 Cross-Repository Infrastructure

All repositories follow consistent DevOps practices:

| Capability | Coverage |
|---|---|
| **CI/CD** | GitHub Actions across all active repos |
| **Security Scanning** | CodeQL (language-appropriate queries) |
| **Dependency Management** | Dependabot with ecosystem-specific config |
| **Branch Protection** | Required reviews, status checks, no force push |
| **Copilot Agent Support** | `copilot-setup-steps.yml` for autonomous coding |
| **Container Support** | Multi-stage Dockerfiles, GHCR workflows |
| **Documentation** | GitHub Pages sites, MkDocs, or static docs |
| **Releases** | Semantic versioning with changelogs |

---

*Last updated: March 2026*
