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

## 📱 Apps

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

*Last updated: June 2026*
