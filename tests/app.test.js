/**
 * tests/app.test.js — Unit tests for docs/app.js
 *
 * Validates escapeHTML, buildCard, renderProjects, and PROJECTS data integrity.
 * Uses JSDOM for DOM simulation — no browser required.
 */

const { JSDOM } = require("jsdom");
const path = require("path");
const fs = require("fs");

/**
 * Bootstrap a JSDOM environment with the full portfolio DOM structure
 * and evaluate docs/app.js within it.
 *
 * @returns {JSDOM} Configured JSDOM instance with app.js globals available on `dom.window`.
 */
function loadApp() {
    const dom = new JSDOM(
        '<!DOCTYPE html><html><body><div id="projects-container"></div><input id="project-search"><div id="category-filters"></div><div id="active-tag-indicator" class="active-tag-indicator hidden"></div><div id="no-results" class="hidden"></div><button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel">📊 Portfolio Analytics <span class="toggle-arrow">▾</span></button><div id="analytics-panel" role="region" aria-label="Portfolio analytics"></div><div id="spotlight-container"></div><button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel">🛠️ Tech Stack <span class="toggle-arrow">▾</span></button><div id="techradar-panel" role="region" aria-label="Tech stack radar"></div><section id="projects"><div class="analytics-bar"></div><div id="timeline-panel" class="timeline-panel hidden"></div></section></body></html>',
        { runScripts: "dangerously", resources: "usable" }
    );
    const code = fs.readFileSync(path.join(__dirname, "..", "docs", "app.js"), "utf-8");
    dom.window.eval(code);
    return dom;
}

let dom;
let win;

beforeAll(() => {
    dom = loadApp();
    win = dom.window;
});

afterAll(() => {
    dom.window.close();
});

// ── escapeHTML ───────────────────────────────────────────────────────

describe("escapeHTML", () => {
    test("escapes & to &amp;", () => {
        expect(win.escapeHTML("A & B")).toBe("A &amp; B");
    });

    test("escapes < and >", () => {
        expect(win.escapeHTML("<script>alert(1)</script>")).toBe(
            "&lt;script&gt;alert(1)&lt;/script&gt;"
        );
    });

    test("escapes double quotes", () => {
        expect(win.escapeHTML('"hello"')).toBe("&quot;hello&quot;");
    });

    test("returns empty string for empty input", () => {
        expect(win.escapeHTML("")).toBe("");
    });

    test("passes through safe strings unchanged", () => {
        expect(win.escapeHTML("Hello World 123")).toBe("Hello World 123");
    });

    test("handles multiple special characters", () => {
        const result = win.escapeHTML('<img src="x" onerror="alert(1)">');
        expect(result).not.toContain("<img");
        expect(result).toContain("&quot;");
        // onerror text is still present but safely escaped as text content
        expect(result).toContain("&lt;img");
    });

    test("escapes single quotes for defense-in-depth", () => {
        // Single quotes are now escaped to &#39; for defense-in-depth
        // against attribute injection in single-quoted contexts (CWE-79)
        const result = win.escapeHTML("it's");
        expect(result).toBe("it&#39;s");
    });

    test("reuses cached DOM element (_escapeEl)", () => {
        // Call twice and verify consistent output (proves caching doesn't corrupt state)
        const first = win.escapeHTML("<a>&\"test\"</a>");
        const second = win.escapeHTML("clean");
        const third = win.escapeHTML("<a>&\"test\"</a>");
        expect(first).toBe(third);
        expect(second).toBe("clean");
    });

    test("handles string with only special characters", () => {
        expect(win.escapeHTML('<>&"')).toBe("&lt;&gt;&amp;&quot;");
    });

    test("handles unicode characters", () => {
        expect(win.escapeHTML("🚀 <test> 🔒")).toContain("🚀");
        expect(win.escapeHTML("🚀 <test> 🔒")).toContain("&lt;test&gt;");
    });
});

// ── PROJECTS data integrity ─────────────────────────────────────────

describe("PROJECTS data", () => {
    test("PROJECTS is a non-empty array", () => {
        expect(Array.isArray(win.PROJECTS)).toBe(true);
        expect(win.PROJECTS.length).toBeGreaterThan(0);
    });

    test("every project has required fields", () => {
        for (const p of win.PROJECTS) {
            expect(p).toHaveProperty("category");
            expect(p).toHaveProperty("icon");
            expect(p).toHaveProperty("repo");
            expect(p).toHaveProperty("title");
            expect(p).toHaveProperty("desc");
            expect(p).toHaveProperty("tags");
            expect(p).toHaveProperty("links");
            expect(typeof p.category).toBe("string");
            expect(typeof p.icon).toBe("string");
            expect(typeof p.repo).toBe("string");
            expect(typeof p.title).toBe("string");
            expect(typeof p.desc).toBe("string");
            expect(Array.isArray(p.tags)).toBe(true);
            expect(Array.isArray(p.links)).toBe(true);
        }
    });

    test("no duplicate repo names", () => {
        const repos = win.PROJECTS.map(p => p.repo);
        const unique = new Set(repos);
        expect(unique.size).toBe(repos.length);
    });

    test("every link has label and url", () => {
        for (const p of win.PROJECTS) {
            for (const link of p.links) {
                expect(link).toHaveProperty("label");
                expect(link).toHaveProperty("url");
                expect(typeof link.label).toBe("string");
                expect(typeof link.url).toBe("string");
                expect(link.url).toMatch(/^https?:\/\//);
            }
        }
    });

    test("every project has at least one tag", () => {
        for (const p of win.PROJECTS) {
            expect(p.tags.length).toBeGreaterThan(0);
        }
    });

    test("repo names match GitHub URL pattern", () => {
        for (const p of win.PROJECTS) {
            expect(p.repo).toMatch(/^[a-zA-Z0-9_-]+$/);
        }
    });

    test("categories are non-empty strings", () => {
        for (const p of win.PROJECTS) {
            expect(p.category.length).toBeGreaterThan(0);
        }
    });

    test("every project has at least one link", () => {
        for (const p of win.PROJECTS) {
            expect(p.links.length).toBeGreaterThan(0);
        }
    });
});

// ── buildCard ───────────────────────────────────────────────────────

describe("buildCard", () => {
    test("returns HTML string with card class", () => {
        const card = win.buildCard(win.PROJECTS[0]);
        expect(card).toContain('class="card"');
    });

    test("escapes project title in output", () => {
        const malicious = {
            category: "Test",
            icon: "🧪",
            repo: "test-repo",
            title: '<script>alert("xss")</script>',
            desc: "A test project",
            tags: ["Test"],
            links: [{ label: "Code", url: "https://example.com" }]
        };
        const card = win.buildCard(malicious);
        expect(card).not.toContain("<script>");
        expect(card).toContain("&lt;script&gt;");
    });

    test("escapes icon field (XSS prevention)", () => {
        const malicious = {
            category: "Test",
            icon: '<img src=x onerror=alert(1)>',
            repo: "safe-repo",
            title: "Safe",
            desc: "Safe project",
            tags: ["Safe"],
            links: [{ label: "Code", url: "https://example.com" }]
        };
        const card = win.buildCard(malicious);
        expect(card).not.toContain("<img");
        // The text 'onerror' appears but as escaped text, not as an attribute
        expect(card).toContain("&lt;img");
    });

    test("includes all tags", () => {
        const p = win.PROJECTS[0];
        const card = win.buildCard(p);
        for (const tag of p.tags) {
            expect(card).toContain(tag);
        }
    });

    test("includes all link labels", () => {
        const p = win.PROJECTS[0];
        const card = win.buildCard(p);
        for (const link of p.links) {
            expect(card).toContain(link.label);
        }
    });

    test("links have target=_blank and rel=noopener", () => {
        const card = win.buildCard(win.PROJECTS[0]);
        expect(card).toContain('target="_blank"');
        expect(card).toContain('rel="noopener"');
    });

    test("card links point to correct GitHub repo", () => {
        const p = win.PROJECTS[0];
        const card = win.buildCard(p);
        expect(card).toContain("github.com/sauravbhattacharya001/" + p.repo);
    });

    test("builds card with empty tags array", () => {
        const p = {
            category: "Test", icon: "🧪", repo: "test",
            title: "No Tags", desc: "Project with no tags",
            tags: [],
            links: [{ label: "Code", url: "https://example.com" }]
        };
        const card = win.buildCard(p);
        expect(card).toContain('class="card-tags">');
        expect(card).toContain('class="card"');
    });

    test("builds card with multiple links", () => {
        const p = {
            category: "Test", icon: "🧪", repo: "test",
            title: "Multi Links", desc: "Test",
            tags: ["Test"],
            links: [
                { label: "Code", url: "https://github.com/test" },
                { label: "Demo", url: "https://demo.test.com" },
                { label: "Docs", url: "https://docs.test.com" },
            ]
        };
        const card = win.buildCard(p);
        expect(card).toContain("Code");
        expect(card).toContain("Demo");
        expect(card).toContain("Docs");
        expect((card.match(/href=/g) || []).length).toBe(4); // 3 links + 1 repo title link
    });

    test("escapes description with special chars", () => {
        const p = {
            category: "Test",
            icon: "🧪",
            repo: "test",
            title: "Test",
            desc: "Uses <b>bold</b> & \"quotes\"",
            tags: ["Test"],
            links: [{ label: "Code", url: "https://example.com" }]
        };
        const card = win.buildCard(p);
        expect(card).not.toContain("<b>");
        expect(card).toContain("&amp;");
    });
});

// ── renderProjects ──────────────────────────────────────────────────

describe("renderProjects", () => {
    test("renders cards into #projects-container", () => {
        // renderProjects already ran on DOMContentLoaded
        const container = dom.window.document.getElementById("projects-container");
        expect(container).not.toBeNull();
        expect(container.innerHTML).not.toBe("");
    });

    test("renders correct number of cards", () => {
        const container = dom.window.document.getElementById("projects-container");
        const cards = container.querySelectorAll(".card");
        expect(cards.length).toBe(win.PROJECTS.length);
    });

    test("groups projects by category", () => {
        const container = dom.window.document.getElementById("projects-container");
        const categories = container.querySelectorAll(".category");
        const uniqueCategories = new Set(win.PROJECTS.map(p => p.category));
        expect(categories.length).toBe(uniqueCategories.size);
    });

    test("category labels match PROJECTS data", () => {
        const container = dom.window.document.getElementById("projects-container");
        const labels = Array.from(container.querySelectorAll(".category-label"))
            .map(el => el.textContent);
        const expected = [...new Set(win.PROJECTS.map(p => p.category))];
        expect(labels).toEqual(expected);
    });

    test("handles missing container gracefully", () => {
        // Remove container, call renderProjects — should not throw
        const container = dom.window.document.getElementById("projects-container");
        const parent = container.parentNode;
        parent.removeChild(container);

        expect(() => win.renderProjects()).not.toThrow();

        // Restore container
        const newContainer = dom.window.document.createElement("div");
        newContainer.id = "projects-container";
        parent.appendChild(newContainer);
        win.renderProjects();
    });

    test("re-render is idempotent (same card count)", () => {
        // Render again into the existing container
        win.renderProjects();
        const container = dom.window.document.getElementById("projects-container");
        const cards = container.querySelectorAll(".card");
        expect(cards.length).toBe(win.PROJECTS.length);
    });

    test("category named constructor does not collide with Object.prototype", () => {
        // Temporarily add a project with category "constructor"
        const saved = win.PROJECTS.slice();
        win.PROJECTS.push({
            category: "constructor",
            icon: "🧪", repo: "test-proto", title: "ProtoTest",
            desc: "Test", tags: ["Test"],
            links: [{ label: "Code", url: "https://example.com" }]
        });

        const container = dom.window.document.getElementById("projects-container");
        expect(() => win.renderProjects()).not.toThrow();

        // Check that a category label "constructor" exists
        const labels = Array.from(container.querySelectorAll(".category-label"))
            .map(el => el.textContent);
        expect(labels).toContain("constructor");

        // Cleanup
        win.PROJECTS.length = 0;
        saved.forEach(p => win.PROJECTS.push(p));
        win.renderProjects();
    });
});

// ── sanitizeURL ─────────────────────────────────────────────────────

describe("sanitizeURL", () => {
    test("allows https URLs", () => {
        expect(win.sanitizeURL("https://example.com")).toBe("https://example.com");
    });

    test("allows http URLs", () => {
        expect(win.sanitizeURL("http://example.com")).toBe("http://example.com");
    });

    test("allows mailto URLs", () => {
        expect(win.sanitizeURL("mailto:test@example.com")).toBe("mailto:test@example.com");
    });

    test("rejects javascript: protocol", () => {
        expect(win.sanitizeURL("javascript:alert(1)")).toBe("#");
    });

    test("rejects javascript: with leading spaces", () => {
        expect(win.sanitizeURL("  javascript:alert(1)")).toBe("#");
    });

    test("rejects data: protocol", () => {
        expect(win.sanitizeURL("data:text/html,<script>alert(1)</script>")).toBe("#");
    });

    test("rejects vbscript: protocol", () => {
        expect(win.sanitizeURL("vbscript:alert(1)")).toBe("#");
    });

    test("rejects javascript: with embedded tabs (control char bypass)", () => {
        expect(win.sanitizeURL("java\tscript:alert(1)")).toBe("#");
    });

    test("rejects javascript: with embedded newlines", () => {
        expect(win.sanitizeURL("java\nscript:alert(1)")).toBe("#");
    });

    test("rejects javascript: with embedded carriage returns", () => {
        expect(win.sanitizeURL("java\rscript:alert(1)")).toBe("#");
    });

    test("rejects javascript: with null bytes", () => {
        expect(win.sanitizeURL("java\0script:alert(1)")).toBe("#");
    });

    test("rejects javascript: with mixed control chars", () => {
        expect(win.sanitizeURL("\x01j\x02a\x03v\x04ascript:alert(1)")).toBe("#");
    });

    test("strips control chars from allowed URLs", () => {
        const result = win.sanitizeURL("https://exam\tple.com");
        expect(result).toBe("https://example.com");
        expect(result).not.toContain("\t");
    });

    test("rejects empty string", () => {
        expect(win.sanitizeURL("")).toBe("#");
    });

    test("rejects whitespace-only string", () => {
        expect(win.sanitizeURL("   ")).toBe("#");
    });

    test("rejects file: protocol", () => {
        expect(win.sanitizeURL("file:///etc/passwd")).toBe("#");
    });

    test("rejects ftp: protocol", () => {
        expect(win.sanitizeURL("ftp://example.com")).toBe("#");
    });

    test("escapes special characters in allowed URLs", () => {
        expect(win.sanitizeURL('https://example.com/a"b')).toBe("https://example.com/a&quot;b");
    });

    test("strips Unicode bidirectional override characters (CWE-1007)", () => {
        // RTL override U+202E can disguise malicious URLs visually
        expect(win.sanitizeURL("https://exa\u202Emple.com")).toBe("https://example.com");
    });

    test("strips RTL embedding (U+202B) from URLs", () => {
        expect(win.sanitizeURL("https://\u202Bexample.com")).toBe("https://example.com");
    });

    test("strips LRE/RLE/PDF/LRO/RLO bidi chars from URLs", () => {
        // U+202A (LRE), U+202B (RLE), U+202C (PDF), U+202D (LRO), U+202E (RLO)
        const bidi = "\u202A\u202B\u202C\u202D\u202E";
        expect(win.sanitizeURL("https://" + bidi + "example.com")).toBe("https://example.com");
    });

    test("strips isolate bidi chars U+2066-U+2069 from URLs", () => {
        // U+2066 (LRI), U+2067 (RLI), U+2068 (FSI), U+2069 (PDI)
        expect(win.sanitizeURL("https://ex\u2066\u2067\u2068\u2069ample.com"))
            .toBe("https://example.com");
    });

    test("rejects bare http: without // authority", () => {
        expect(win.sanitizeURL("http:evil.com")).toBe("#");
    });

    test("rejects bare https: without // authority", () => {
        expect(win.sanitizeURL("https:evil.com")).toBe("#");
    });

    test("rejects http:// with no host", () => {
        expect(win.sanitizeURL("http://")).toBe("#");
    });

    test("rejects https:// with no host", () => {
        expect(win.sanitizeURL("https://")).toBe("#");
    });

    test("strips leading whitespace from returned URL", () => {
        expect(win.sanitizeURL("  https://example.com")).toBe("https://example.com");
    });
});

// ── Security-focused tests ──────────────────────────────────────────

describe("XSS prevention", () => {
    test("malicious repo name is escaped in GitHub URL", () => {
        const p = {
            category: "Test",
            icon: "🧪",
            repo: '"><script>alert(1)</script>',
            title: "Safe",
            desc: "Test",
            tags: ["Test"],
            links: [{ label: "Code", url: "https://example.com" }]
        };
        const card = win.buildCard(p);
        expect(card).not.toContain("<script>");
    });

    test("malicious link URL is sanitized", () => {
        const p = {
            category: "Test",
            icon: "🧪",
            repo: "test",
            title: "Safe",
            desc: "Test",
            tags: ["Test"],
            links: [{ label: "Click", url: 'javascript:alert(1)" onmouseover="alert(2)' }]
        };
        const card = win.buildCard(p);
        // sanitizeURL should reject javascript: URLs entirely
        expect(card).not.toContain("javascript:");
        expect(card).not.toContain('onmouseover');
        expect(card).toContain('href="#"');
    });

    test("malicious tag content is escaped", () => {
        const p = {
            category: "Test",
            icon: "🧪",
            repo: "test",
            title: "Safe",
            desc: "Test",
            tags: ['<img src=x onerror=alert(1)>'],
            links: [{ label: "Code", url: "https://example.com" }]
        };
        const card = win.buildCard(p);
        expect(card).not.toContain("<img");
    });

    test("all real PROJECTS render without raw HTML injection", () => {
        for (const p of win.PROJECTS) {
            const card = win.buildCard(p);
            // Should not contain unescaped angle brackets from data
            // (only from the template HTML structure itself)
            expect(card).not.toMatch(/<script/i);
            expect(card).not.toMatch(/onerror\s*=/i);
            expect(card).not.toMatch(/onload\s*=/i);
        }
    });
});

// ── CSP & Security Headers ──────────────────────────────────────────

describe("Security headers", () => {
    test("index.html contains CSP meta tag", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toContain('http-equiv="Content-Security-Policy"');
    });

    test("CSP blocks inline scripts (script-src 'self')", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toMatch(/script-src\s+'self'/);
    });

    test("CSP blocks object/embed (object-src 'none')", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toMatch(/object-src\s+'none'/);
    });

    test("CSP blocks iframes (frame-src 'none')", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toMatch(/frame-src\s+'none'/);
    });

    test("CSP restricts base-uri to prevent base tag hijacking", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toMatch(/base-uri\s+'self'/);
    });

    test("CSP restricts form-action", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toMatch(/form-action\s+'self'/);
    });

    test("X-Content-Type-Options meta tag present", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toContain('http-equiv="X-Content-Type-Options"');
        expect(html).toContain('content="nosniff"');
    });

    test("referrer policy meta tag present", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        expect(html).toContain('name="referrer"');
        expect(html).toContain('strict-origin-when-cross-origin');
    });

    test("no inline scripts in index.html (CSP compliance)", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        // JSON-LD is safe (type="application/ld+json" is not executed)
        // Only check for <script> tags without type or with type="text/javascript"
        const inlineScripts = html.match(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi) || [];
        for (const tag of inlineScripts) {
            // JSON-LD is fine
            if (tag.includes('application/ld+json')) continue;
            // External src scripts are fine
            if (tag.match(/\bsrc\s*=/i)) continue;
            // Anything else with inline content is a violation
            const content = tag.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
            expect(content).toBe('');
        }
    });

    test("all external links have rel=noopener", () => {
        const html = fs.readFileSync(
            path.join(__dirname, "..", "docs", "index.html"),
            "utf-8"
        );
        const extLinks = html.match(/<a\s[^>]*target="_blank"[^>]*>/gi) || [];
        for (const link of extLinks) {
            expect(link).toContain('rel="noopener"');
        }
    });

    test("Dockerfile security headers include Permissions-Policy", () => {
        const dockerfile = fs.readFileSync(
            path.join(__dirname, "..", "Dockerfile"),
            "utf-8"
        );
        expect(dockerfile).toContain("Permissions-Policy");
    });

    test("Dockerfile static asset location repeats security headers", () => {
        const dockerfile = fs.readFileSync(
            path.join(__dirname, "..", "Dockerfile"),
            "utf-8"
        );
        // The static asset location block should contain security headers
        // to avoid the nginx add_header inheritance bug
        const lines = dockerfile.split('\n');
        let inStaticBlock = false;
        let blockContent = '';
        let braceDepth = 0;
        for (const line of lines) {
            if (line.match(/location ~\*.*\.\(css\|js/)) {
                inStaticBlock = true;
            }
            if (inStaticBlock) {
                blockContent += line + '\n';
                braceDepth += (line.match(/\{/g) || []).length;
                braceDepth -= (line.match(/\}/g) || []).length;
                if (braceDepth === 0 && blockContent.length > 0) break;
            }
        }
        expect(blockContent).toContain("X-Content-Type-Options");
        expect(blockContent).toContain("Content-Security-Policy");
        expect(blockContent).toContain("Permissions-Policy");
    });
});

// ── filterProjects tests ──────────────────────────────────────────────

describe("filterProjects", () => {
    afterEach(() => {
        // Reset filter state after each test
        win._filterState.query = "";
        win._filterState.category = null;
    });

    test("returns all projects with no filters", () => {
        const results = win.filterProjects();
        expect(results.length).toBe(win.PROJECTS.length);
    });

    test("filters by category", () => {
        win._filterState.category = "AI & Agents";
        const results = win.filterProjects();
        expect(results.length).toBeGreaterThan(0);
        results.forEach(p => expect(p.category).toBe("AI & Agents"));
    });

    test("filters by text query matching title", () => {
        win._filterState.query = "voronoi";
        const results = win.filterProjects();
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(p => p.repo === "VoronoiMap")).toBe(true);
    });

    test("filters by text query matching tag", () => {
        win._filterState.query = "python";
        const results = win.filterProjects();
        expect(results.length).toBeGreaterThan(0);
        results.forEach(p => {
            const hasPython = p.tags.some(t => t.toLowerCase().includes("python"));
            const titleMatch = p.title.toLowerCase().includes("python");
            const descMatch = p.desc.toLowerCase().includes("python");
            const repoMatch = p.repo.toLowerCase().includes("python");
            expect(hasPython || titleMatch || descMatch || repoMatch).toBe(true);
        });
    });

    test("filters by text query matching repo name", () => {
        win._filterState.query = "agentlens";
        const results = win.filterProjects();
        expect(results.length).toBe(1);
        expect(results[0].repo).toBe("agentlens");
    });

    test("filters by text query matching description", () => {
        win._filterState.query = "bioprinter";
        const results = win.filterProjects();
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(p => p.repo === "BioBots")).toBe(true);
    });

    test("combines category and text filters (AND)", () => {
        win._filterState.category = "AI & Agents";
        win._filterState.query = "safety";
        const results = win.filterProjects();
        expect(results.length).toBeGreaterThan(0);
        results.forEach(p => expect(p.category).toBe("AI & Agents"));
        results.forEach(p => {
            const match = p.title.toLowerCase().includes("safety") ||
                          p.desc.toLowerCase().includes("safety") ||
                          p.repo.toLowerCase().includes("safety") ||
                          p.tags.some(t => t.toLowerCase().includes("safety"));
            expect(match).toBe(true);
        });
    });

    test("returns empty array when nothing matches", () => {
        win._filterState.query = "xyznonexistent123";
        const results = win.filterProjects();
        expect(results).toEqual([]);
    });

    test("text search is case-insensitive", () => {
        win._filterState.query = "VORONOI";
        const upper = win.filterProjects();
        win._filterState.query = "voronoi";
        const lower = win.filterProjects();
        expect(upper.length).toBe(lower.length);
        expect(upper.length).toBeGreaterThan(0);
    });

    test("empty query string returns all projects", () => {
        win._filterState.query = "";
        win._filterState.category = null;
        expect(win.filterProjects().length).toBe(win.PROJECTS.length);
    });

    test("wrong category returns empty", () => {
        win._filterState.category = "Nonexistent Category";
        expect(win.filterProjects()).toEqual([]);
    });
});

describe("renderProjects with filtered input", () => {
    test("renders only filtered projects", () => {
        const aiProjects = win.PROJECTS.filter(p => p.category === "AI & Agents");
        win.renderProjects(aiProjects);
        const container = win.document.getElementById("projects-container");
        // Should only have AI & Agents category
        const labels = container.querySelectorAll(".category-label");
        expect(labels.length).toBe(1);
        expect(labels[0].textContent).toBe("AI & Agents");
        // Card count should match
        const cards = container.querySelectorAll(".card");
        expect(cards.length).toBe(aiProjects.length);
    });

    test("shows no-results message when empty", () => {
        win.renderProjects([]);
        const noResults = win.document.getElementById("no-results");
        expect(noResults.classList.contains("hidden")).toBe(false);
    });

    test("hides no-results message when projects exist", () => {
        win.renderProjects(win.PROJECTS);
        const noResults = win.document.getElementById("no-results");
        expect(noResults.classList.contains("hidden")).toBe(true);
    });

    test("re-renders correctly after filter change", () => {
        // First render all
        win.renderProjects(win.PROJECTS);
        let cards = win.document.querySelectorAll(".card");
        expect(cards.length).toBe(win.PROJECTS.length);

        // Then filter to Security
        const secProjects = win.PROJECTS.filter(p => p.category === "Security");
        win.renderProjects(secProjects);
        cards = win.document.querySelectorAll(".card");
        expect(cards.length).toBe(secProjects.length);

        // Render all again
        win.renderProjects(win.PROJECTS);
        cards = win.document.querySelectorAll(".card");
        expect(cards.length).toBe(win.PROJECTS.length);
    });
});

describe("initFilters", () => {
    test("creates filter pills for each category plus All", () => {
        // initFilters was already called during auto-init, so pills exist.
        // Count unique categories from PROJECTS.
        const pills = win.document.querySelectorAll(".filter-pill");
        const categories = new Set(win.PROJECTS.map(p => p.category));
        // May have been called multiple times; just verify at least the right count exists
        // and first pill is "All"
        expect(pills.length).toBeGreaterThanOrEqual(categories.size + 1);
        expect(pills[0].textContent).toBe("All");
    });

    test("All pill starts as active", () => {
        const pills = win.document.querySelectorAll(".filter-pill");
        expect(pills[0].classList.contains("active")).toBe(true);
    });

    test("clicking a category pill makes it active and deactivates others", () => {
        const pills = win.document.querySelectorAll(".filter-pill");
        // Click second pill (first category)
        pills[1].click();
        expect(pills[1].classList.contains("active")).toBe(true);
        expect(pills[0].classList.contains("active")).toBe(false);
    });
});

// ── Theme toggle ────────────────────────────────────────────────────

describe("theme toggle", () => {
    /** Load app in a DOM that includes the theme-toggle button. */
    function loadAppWithTheme() {
        const dom = new JSDOM(
            '<!DOCTYPE html><html><body>' +
            '<button class="theme-toggle" id="theme-toggle" type="button">🌙</button>' +
            '<div id="projects-container"></div>' +
            '<input id="project-search">' +
            '<div id="category-filters"></div>' +
            '<div id="no-results" class="hidden"></div>' +
            '</body></html>',
            { runScripts: "dangerously", resources: "usable", url: "http://localhost" }
        );
        const code = fs.readFileSync(path.join(__dirname, "..", "docs", "app.js"), "utf-8");
        dom.window.eval(code);
        return dom;
    }

    let tdom, twin;

    beforeEach(() => {
        tdom = loadAppWithTheme();
        twin = tdom.window;
        // Clear localStorage before each test
        twin.localStorage.clear();
    });

    afterEach(() => {
        tdom.window.close();
    });

    test("getPreferredTheme returns 'dark' by default", () => {
        expect(twin.getPreferredTheme()).toBe("dark");
    });

    test("getPreferredTheme reads from localStorage", () => {
        twin.localStorage.setItem("theme", "light");
        expect(twin.getPreferredTheme()).toBe("light");
    });

    test("getPreferredTheme ignores invalid localStorage values", () => {
        twin.localStorage.setItem("theme", "blue");
        expect(twin.getPreferredTheme()).toBe("dark");
    });

    test("applyTheme sets data-theme attribute on html element", () => {
        twin.applyTheme("light");
        expect(twin.document.documentElement.getAttribute("data-theme")).toBe("light");
        twin.applyTheme("dark");
        expect(twin.document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    test("applyTheme updates button icon for dark theme", () => {
        twin.applyTheme("dark");
        const btn = twin.document.getElementById("theme-toggle");
        expect(btn.textContent).toBe("🌙");
    });

    test("applyTheme updates button icon for light theme", () => {
        twin.applyTheme("light");
        const btn = twin.document.getElementById("theme-toggle");
        expect(btn.textContent).toBe("☀️");
    });

    test("applyTheme updates aria-label for dark", () => {
        twin.applyTheme("dark");
        const btn = twin.document.getElementById("theme-toggle");
        expect(btn.getAttribute("aria-label")).toBe("Switch to light theme");
    });

    test("applyTheme updates aria-label for light", () => {
        twin.applyTheme("light");
        const btn = twin.document.getElementById("theme-toggle");
        expect(btn.getAttribute("aria-label")).toBe("Switch to dark theme");
    });

    test("toggleTheme switches from dark to light", () => {
        twin.applyTheme("dark");
        const result = twin.toggleTheme();
        expect(result).toBe("light");
        expect(twin.document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    test("toggleTheme switches from light to dark", () => {
        twin.applyTheme("light");
        const result = twin.toggleTheme();
        expect(result).toBe("dark");
        expect(twin.document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    test("toggleTheme persists choice in localStorage", () => {
        twin.applyTheme("dark");
        twin.toggleTheme();
        expect(twin.localStorage.getItem("theme")).toBe("light");
        twin.toggleTheme();
        expect(twin.localStorage.getItem("theme")).toBe("dark");
    });

    test("initTheme applies stored preference", () => {
        twin.localStorage.setItem("theme", "light");
        twin.initTheme();
        expect(twin.document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    test("initTheme wires button click handler", () => {
        twin.localStorage.setItem("theme", "dark");
        twin.initTheme();
        const btn = twin.document.getElementById("theme-toggle");
        btn.click();
        expect(twin.document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    test("theme toggle roundtrip preserves state", () => {
        twin.applyTheme("dark");
        twin.toggleTheme(); // -> light
        twin.toggleTheme(); // -> dark
        twin.toggleTheme(); // -> light
        expect(twin.document.documentElement.getAttribute("data-theme")).toBe("light");
        expect(twin.localStorage.getItem("theme")).toBe("light");
    });
});

// ── Tag filtering ───────────────────────────────────────────────────

describe("extractTags", () => {
    test("returns sorted unique tags from all projects", () => {
        const tags = win.extractTags();
        expect(tags.length).toBeGreaterThan(0);
        // Check sorted (lexicographic, matching Array.sort() default)
        for (let i = 1; i < tags.length; i++) {
            expect(tags[i] >= tags[i - 1]).toBe(true);
        }
        // Check unique (case-insensitive)
        const seen = new Set();
        tags.forEach(t => {
            const lower = t.toLowerCase();
            expect(seen.has(lower)).toBe(false);
            seen.add(lower);
        });
    });

    test("includes known tags", () => {
        const tags = win.extractTags();
        const lowerTags = tags.map(t => t.toLowerCase());
        expect(lowerTags).toContain("python");
        expect(lowerTags).toContain("javascript");
    });

    test("works with custom project list", () => {
        const custom = [
            { tags: ["A", "B"] },
            { tags: ["B", "C"] }
        ];
        const tags = win.extractTags(custom);
        expect(tags).toEqual(["A", "B", "C"]);
    });

    test("handles projects with no tags", () => {
        const custom = [{ tags: [] }, { tags: ["X"] }];
        const tags = win.extractTags(custom);
        expect(tags).toEqual(["X"]);
    });
});

describe("tag filtering via _filterState", () => {
    beforeEach(() => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
    });

    test("no tag filter returns all projects", () => {
        const results = win.filterProjects();
        expect(results.length).toBe(win.PROJECTS.length);
    });

    test("tag filter returns only matching projects", () => {
        win._filterState.tag = "Python";
        const results = win.filterProjects();
        expect(results.length).toBeGreaterThan(0);
        results.forEach(p => {
            const hasPython = p.tags.some(t => t.toLowerCase() === "python");
            expect(hasPython).toBe(true);
        });
    });

    test("tag filter is case-insensitive", () => {
        win._filterState.tag = "python";
        const lower = win.filterProjects();
        win._filterState.tag = "PYTHON";
        const upper = win.filterProjects();
        expect(lower.length).toBe(upper.length);
    });

    test("tag filter combines with category filter", () => {
        win._filterState.category = "AI & Agents";
        win._filterState.tag = "Python";
        const results = win.filterProjects();
        results.forEach(p => {
            expect(p.category).toBe("AI & Agents");
            expect(p.tags.some(t => t.toLowerCase() === "python")).toBe(true);
        });
    });

    test("tag filter combines with search query", () => {
        win._filterState.query = "safety";
        win._filterState.tag = "Python";
        const results = win.filterProjects();
        results.forEach(p => {
            expect(p.tags.some(t => t.toLowerCase() === "python")).toBe(true);
        });
        expect(results.length).toBeGreaterThan(0);
    });

    test("non-existent tag returns empty", () => {
        win._filterState.tag = "NonExistentTag12345";
        const results = win.filterProjects();
        expect(results.length).toBe(0);
    });
});

describe("setTagFilter / clearTagFilter", () => {
    beforeEach(() => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
    });

    test("setTagFilter updates state and re-renders", () => {
        win.setTagFilter("Python");
        expect(win._filterState.tag).toBe("Python");
        const container = win.document.getElementById("projects-container");
        expect(container.innerHTML).not.toBe("");
    });

    test("clearTagFilter clears state and re-renders all", () => {
        win.setTagFilter("Python");
        const filteredCards = win.document.querySelectorAll(".card").length;
        win.clearTagFilter();
        expect(win._filterState.tag).toBeNull();
        const allCards = win.document.querySelectorAll(".card").length;
        expect(allCards).toBeGreaterThanOrEqual(filteredCards);
    });
});

describe("buildCardTags with clickable tags", () => {
    test("tags are buttons with data-tag attributes", () => {
        const html = win.buildCardTags(["Python", "AI"]);
        expect(html).toContain('data-tag="Python"');
        expect(html).toContain('data-tag="AI"');
        expect(html).toContain("tag-clickable");
        expect(html).toContain("<button");
    });

    test("tag values are HTML-escaped in data-tag", () => {
        const html = win.buildCardTags(['<script>']);
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });
});

describe("updateTagIndicator", () => {
    beforeEach(() => {
        win._filterState.tag = null;
    });

    test("hides indicator when no tag is active", () => {
        win.updateTagIndicator();
        const indicator = win.document.getElementById("active-tag-indicator");
        expect(indicator.classList.contains("hidden")).toBe(true);
        expect(indicator.innerHTML).toBe("");
    });

    test("shows indicator with tag name and clear button when tag is active", () => {
        win._filterState.tag = "Python";
        win.updateTagIndicator();
        const indicator = win.document.getElementById("active-tag-indicator");
        expect(indicator.classList.contains("hidden")).toBe(false);
        expect(indicator.innerHTML).toContain("Python");
        expect(indicator.querySelector(".tag-clear")).not.toBeNull();
    });

    test("clear button clears the tag filter", () => {
        win._filterState.tag = "Python";
        win.renderProjects(win.filterProjects());
        const indicator = win.document.getElementById("active-tag-indicator");
        const clearBtn = indicator.querySelector(".tag-clear");
        expect(clearBtn).not.toBeNull();
        clearBtn.click();
        expect(win._filterState.tag).toBeNull();
    });
});

// ── Keyboard navigation ─────────────────────────────────────────────

describe("keyboard navigation state", () => {
    test("_kbState has expected initial values", () => {
        expect(win._kbState).toBeDefined();
        expect(win._kbState.focusIndex).toBe(-1);
        expect(typeof win._kbState.helpVisible).toBe("boolean");
    });
});

describe("getVisibleCards", () => {
    test("returns all rendered cards", () => {
        win.renderProjects();
        const cards = win.getVisibleCards();
        expect(cards.length).toBe(win.PROJECTS.length);
    });

    test("returns only filtered cards after filter", () => {
        const aiProjects = win.PROJECTS.filter(p => p.category === "AI & Agents");
        win.renderProjects(aiProjects);
        const cards = win.getVisibleCards();
        expect(cards.length).toBe(aiProjects.length);
        // Restore
        win.renderProjects();
    });

    test("returns empty array when no projects rendered", () => {
        win.renderProjects([]);
        const cards = win.getVisibleCards();
        expect(cards.length).toBe(0);
        win.renderProjects();
    });
});

describe("focusCard", () => {
    beforeEach(() => {
        win.renderProjects();
        win.blurCards();
        win._kbState.focusIndex = -1;
    });

    test("focuses the first card at index 0", () => {
        const result = win.focusCard(0);
        expect(result).toBe(true);
        expect(win._kbState.focusIndex).toBe(0);
        const cards = win.getVisibleCards();
        expect(cards[0].classList.contains("card-focused")).toBe(true);
    });

    test("focuses card at arbitrary index", () => {
        win.focusCard(3);
        expect(win._kbState.focusIndex).toBe(3);
        const cards = win.getVisibleCards();
        expect(cards[3].classList.contains("card-focused")).toBe(true);
    });

    test("clamps negative index to 0", () => {
        win.focusCard(-5);
        expect(win._kbState.focusIndex).toBe(0);
    });

    test("clamps index past end to last card", () => {
        const total = win.getVisibleCards().length;
        win.focusCard(total + 10);
        expect(win._kbState.focusIndex).toBe(total - 1);
    });

    test("removes previous focus when moving", () => {
        win.focusCard(0);
        win.focusCard(2);
        const cards = win.getVisibleCards();
        expect(cards[0].classList.contains("card-focused")).toBe(false);
        expect(cards[2].classList.contains("card-focused")).toBe(true);
    });

    test("returns false with no visible cards", () => {
        win.renderProjects([]);
        const result = win.focusCard(0);
        expect(result).toBe(false);
        win.renderProjects();
    });

    test("sets tabindex on focused card", () => {
        win.focusCard(1);
        const cards = win.getVisibleCards();
        expect(cards[1].getAttribute("tabindex")).toBe("-1");
    });
});

describe("blurCards", () => {
    test("removes card-focused class from all cards", () => {
        win.renderProjects();
        win.focusCard(0);
        win.focusCard(3);
        win.blurCards();
        const focused = win.document.querySelectorAll(".card-focused");
        expect(focused.length).toBe(0);
    });

    test("removes tabindex from unfocused cards", () => {
        win.renderProjects();
        win.focusCard(2);
        win.blurCards();
        const cards = win.getVisibleCards();
        expect(cards[2].getAttribute("tabindex")).toBeNull();
    });
});

describe("openFocusedCard", () => {
    let openedUrl;

    beforeEach(() => {
        win.renderProjects();
        win.blurCards();
        win._kbState.focusIndex = -1;
        openedUrl = null;
        // Mock window.open
        win.open = function(url) { openedUrl = url; };
    });

    test("opens the GitHub link of the focused card", () => {
        win.focusCard(0);
        const result = win.openFocusedCard();
        expect(result).toBe(true);
        expect(openedUrl).toContain("github.com/sauravbhattacharya001/");
    });

    test("returns false when no card is focused", () => {
        win._kbState.focusIndex = -1;
        expect(win.openFocusedCard()).toBe(false);
    });

    test("returns false when focusIndex is out of range", () => {
        win._kbState.focusIndex = 999;
        expect(win.openFocusedCard()).toBe(false);
    });
});

describe("buildHelpOverlay", () => {
    test("returns HTML string with overlay structure", () => {
        const html = win.buildHelpOverlay();
        expect(html).toContain("kb-help-overlay");
        expect(html).toContain("Keyboard Shortcuts");
        expect(html).toContain("<kbd>");
    });

    test("includes all shortcut keys", () => {
        const html = win.buildHelpOverlay();
        expect(html).toContain("j / ↓");
        expect(html).toContain("k / ↑");
        expect(html).toContain("Enter");
        expect(html).toContain("/");
        expect(html).toContain("Escape");
        expect(html).toContain("?");
    });

    test("includes descriptions for all shortcuts", () => {
        const html = win.buildHelpOverlay();
        expect(html).toContain("Next project card");
        expect(html).toContain("Previous project card");
        expect(html).toContain("Open focused project");
        expect(html).toContain("Focus search input");
        expect(html).toContain("Clear search");
        expect(html).toContain("Toggle this help");
    });

    test("has aria-label for accessibility", () => {
        const html = win.buildHelpOverlay();
        expect(html).toContain('role="dialog"');
        expect(html).toContain('aria-label="Keyboard shortcuts"');
    });
});

describe("showKeyboardHelp / hideKeyboardHelp", () => {
    afterEach(() => {
        win.hideKeyboardHelp();
        const overlay = win.document.getElementById("kb-help-overlay");
        if (overlay) overlay.parentNode.removeChild(overlay);
        win._kbState.helpVisible = false;
    });

    test("showKeyboardHelp creates overlay in DOM", () => {
        win.showKeyboardHelp();
        const overlay = win.document.getElementById("kb-help-overlay");
        expect(overlay).not.toBeNull();
        expect(win._kbState.helpVisible).toBe(true);
    });

    test("hideKeyboardHelp adds hidden class", () => {
        win.showKeyboardHelp();
        win.hideKeyboardHelp();
        const overlay = win.document.getElementById("kb-help-overlay");
        expect(overlay.classList.contains("hidden")).toBe(true);
        expect(win._kbState.helpVisible).toBe(false);
    });

    test("showKeyboardHelp is idempotent (no duplicate overlays)", () => {
        win.showKeyboardHelp();
        win.showKeyboardHelp();
        const overlays = win.document.querySelectorAll("#kb-help-overlay");
        expect(overlays.length).toBe(1);
    });

    test("show then hide then show unhides existing overlay", () => {
        win.showKeyboardHelp();
        win.hideKeyboardHelp();
        win.showKeyboardHelp();
        const overlay = win.document.getElementById("kb-help-overlay");
        expect(overlay.classList.contains("hidden")).toBe(false);
    });
});

describe("toggleKeyboardHelp", () => {
    afterEach(() => {
        win.hideKeyboardHelp();
        const overlay = win.document.getElementById("kb-help-overlay");
        if (overlay) overlay.parentNode.removeChild(overlay);
        win._kbState.helpVisible = false;
    });

    test("toggles from hidden to visible", () => {
        win._kbState.helpVisible = false;
        win.toggleKeyboardHelp();
        expect(win._kbState.helpVisible).toBe(true);
    });

    test("toggles from visible to hidden", () => {
        win.showKeyboardHelp();
        win.toggleKeyboardHelp();
        expect(win._kbState.helpVisible).toBe(false);
    });
});

describe("keyboard event handling", () => {
    /**
     * Dispatch a synthetic keyboard event on the document.
     *
     * @param {string} key - Key value (e.g. "ArrowDown", "?", "Escape").
     * @param {Object} [opts] - Additional KeyboardEvent init properties (shiftKey, ctrlKey, etc.).
     * @returns {KeyboardEvent} The dispatched event (check `defaultPrevented` for assertion).
     */
    function fireKey(key, opts) {
        const event = new win.KeyboardEvent("keydown", Object.assign({
            key: key, bubbles: true, cancelable: true
        }, opts || {}));
        win.document.dispatchEvent(event);
        return event;
    }

    beforeEach(() => {
        win.renderProjects();
        win.blurCards();
        win._kbState.focusIndex = -1;
        win._kbState.helpVisible = false;
        // Remove any help overlay
        const overlay = win.document.getElementById("kb-help-overlay");
        if (overlay) overlay.parentNode.removeChild(overlay);
    });

    test("j key moves focus to next card", () => {
        fireKey("j");
        expect(win._kbState.focusIndex).toBe(0);
        fireKey("j");
        expect(win._kbState.focusIndex).toBe(1);
    });

    test("k key moves focus to previous card", () => {
        win.focusCard(3);
        fireKey("k");
        expect(win._kbState.focusIndex).toBe(2);
    });

    test("ArrowDown key moves focus forward", () => {
        fireKey("ArrowDown");
        expect(win._kbState.focusIndex).toBe(0);
    });

    test("ArrowUp key moves focus backward", () => {
        win.focusCard(2);
        fireKey("ArrowUp");
        expect(win._kbState.focusIndex).toBe(1);
    });

    test("/ key focuses search input", () => {
        const search = win.document.getElementById("project-search");
        search.blur();
        fireKey("/");
        expect(win.document.activeElement).toBe(search);
    });

    test("? key toggles help overlay", () => {
        fireKey("?");
        expect(win._kbState.helpVisible).toBe(true);
        fireKey("?");
        expect(win._kbState.helpVisible).toBe(false);
    });

    test("Escape clears search input content", () => {
        const search = win.document.getElementById("project-search");
        search.value = "test query";
        win._filterState.query = "test query";
        fireKey("Escape");
        expect(search.value).toBe("");
        expect(win._filterState.query).toBe("");
    });

    test("Escape closes help overlay when visible", () => {
        win.showKeyboardHelp();
        expect(win._kbState.helpVisible).toBe(true);
        fireKey("Escape");
        expect(win._kbState.helpVisible).toBe(false);
    });

    test("Escape clears tag filter", () => {
        win._filterState.tag = "Python";
        fireKey("Escape");
        expect(win._filterState.tag).toBeNull();
    });

    test("Escape blurs focused card when nothing else to clear", () => {
        win.focusCard(2);
        expect(win._kbState.focusIndex).toBe(2);
        fireKey("Escape");
        expect(win._kbState.focusIndex).toBe(-1);
        const focused = win.document.querySelectorAll(".card-focused");
        expect(focused.length).toBe(0);
    });

    test("shortcuts are suppressed when typing in input", () => {
        const search = win.document.getElementById("project-search");
        search.focus();
        // Dispatch keydown on the input element (not document)
        const event = new win.KeyboardEvent("keydown", {
            key: "j", bubbles: true, cancelable: true
        });
        search.dispatchEvent(event);
        // focusIndex should NOT change because target is an input
        expect(win._kbState.focusIndex).toBe(-1);
    });

    test("modifier keys are ignored (Ctrl+J does not navigate)", () => {
        fireKey("j", { ctrlKey: true });
        expect(win._kbState.focusIndex).toBe(-1);
    });

    test("Escape works even from input", () => {
        const search = win.document.getElementById("project-search");
        search.value = "test";
        win._filterState.query = "test";
        search.focus();
        const event = new win.KeyboardEvent("keydown", {
            key: "Escape", bubbles: true, cancelable: true
        });
        search.dispatchEvent(event);
        expect(search.value).toBe("");
    });
});

// ── Sort & View Toggle ──────────────────────────────────────────────

describe("SORT_ORDERS", () => {
    test("has default, a-z, z-a, most-tags, most-links", () => {
        expect(win.SORT_ORDERS).toBeDefined();
        expect(Object.keys(win.SORT_ORDERS)).toEqual(
            expect.arrayContaining(["default", "a-z", "z-a", "most-tags", "most-links"])
        );
    });

    test("each sort order has label and compare function", () => {
        for (const key of Object.keys(win.SORT_ORDERS)) {
            expect(typeof win.SORT_ORDERS[key].label).toBe("string");
            expect(typeof win.SORT_ORDERS[key].compare).toBe("function");
        }
    });
});

describe("sortProjects", () => {
    test("returns copy of array (does not mutate)", () => {
        const original = win.PROJECTS.slice();
        const sorted = win.sortProjects(win.PROJECTS, "a-z");
        expect(sorted).not.toBe(win.PROJECTS);
        expect(win.PROJECTS.map(p => p.repo)).toEqual(original.map(p => p.repo));
    });

    test("default sort preserves original order", () => {
        const sorted = win.sortProjects(win.PROJECTS, "default");
        expect(sorted.map(p => p.repo)).toEqual(win.PROJECTS.map(p => p.repo));
    });

    test("a-z sorts alphabetically by title", () => {
        const sorted = win.sortProjects(win.PROJECTS, "a-z");
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].title.toLowerCase().localeCompare(
                sorted[i - 1].title.toLowerCase()
            )).toBeGreaterThanOrEqual(0);
        }
    });

    test("z-a sorts reverse alphabetically by title", () => {
        const sorted = win.sortProjects(win.PROJECTS, "z-a");
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].title.toLowerCase().localeCompare(
                sorted[i].title.toLowerCase()
            )).toBeGreaterThanOrEqual(0);
        }
    });

    test("most-tags sorts by descending tag count", () => {
        const sorted = win.sortProjects(win.PROJECTS, "most-tags");
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].tags.length).toBeGreaterThanOrEqual(sorted[i].tags.length);
        }
    });

    test("most-links sorts by descending link count", () => {
        const sorted = win.sortProjects(win.PROJECTS, "most-links");
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].links.length).toBeGreaterThanOrEqual(sorted[i].links.length);
        }
    });

    test("null sort key returns unsorted copy", () => {
        const sorted = win.sortProjects(win.PROJECTS, null);
        expect(sorted.map(p => p.repo)).toEqual(win.PROJECTS.map(p => p.repo));
    });

    test("unknown sort key returns unsorted copy", () => {
        const sorted = win.sortProjects(win.PROJECTS, "nonexistent");
        expect(sorted.map(p => p.repo)).toEqual(win.PROJECTS.map(p => p.repo));
    });

    test("empty array returns empty array", () => {
        expect(win.sortProjects([], "a-z")).toEqual([]);
    });
});

describe("setSortOrder", () => {
    beforeEach(() => {
        win._filterState.sort = "default";
    });

    afterEach(() => {
        win._filterState.sort = "default";
    });

    test("updates _filterState.sort", () => {
        win.setSortOrder("a-z");
        expect(win._filterState.sort).toBe("a-z");
        // Reset immediately to avoid polluting renderProjects state
        win.setSortOrder("default");
    });

    test("ignores unknown sort keys", () => {
        win.setSortOrder("bogus");
        expect(win._filterState.sort).toBe("default");
    });
});

describe("setViewMode", () => {
    beforeEach(() => {
        win._filterState.view = "grid";
    });

    test("updates _filterState.view to list", () => {
        win.setViewMode("list");
        expect(win._filterState.view).toBe("list");
    });

    test("updates _filterState.view to grid", () => {
        win._filterState.view = "list";
        win.setViewMode("grid");
        expect(win._filterState.view).toBe("grid");
    });

    test("ignores invalid modes", () => {
        win.setViewMode("table");
        expect(win._filterState.view).toBe("grid");
    });
});

describe("sort & view integration", () => {
    let sortDom, sortWin;

    beforeAll(() => {
        sortDom = new JSDOM(
            '<!DOCTYPE html><html><body>' +
            '<div id="projects-container"></div>' +
            '<input id="project-search">' +
            '<div id="category-filters"></div>' +
            '<div id="sort-controls"></div>' +
            '<div id="view-toggle"></div>' +
            '<div id="active-tag-indicator" class="hidden"></div>' +
            '<div id="no-results" class="hidden"></div>' +
            '</body></html>',
            { runScripts: "dangerously", resources: "usable" }
        );
        const code = fs.readFileSync(path.join(__dirname, "..", "docs", "app.js"), "utf-8");
        sortDom.window.eval(code);
        sortWin = sortDom.window;
    });

    afterAll(() => {
        sortDom.window.close();
    });

    test("buildSortControls creates pills for each sort order", () => {
        const container = sortDom.window.document.getElementById("sort-controls");
        expect(container.querySelectorAll(".sort-pill").length).toBe(
            Object.keys(sortWin.SORT_ORDERS).length
        );
    });

    test("buildSortControls includes sort label", () => {
        const container = sortDom.window.document.getElementById("sort-controls");
        const label = container.querySelector(".sort-label");
        expect(label).not.toBeNull();
        expect(label.textContent).toBe("Sort:");
    });

    test("sort pill click changes sort order", () => {
        const container = sortDom.window.document.getElementById("sort-controls");
        const azPill = container.querySelector('[data-sort="a-z"]');
        azPill.click();
        expect(sortWin._filterState.sort).toBe("a-z");
        expect(azPill.classList.contains("active")).toBe(true);
    });

    test("buildViewToggle creates grid and list buttons", () => {
        const container = sortDom.window.document.getElementById("view-toggle");
        expect(container.querySelector('[data-view="grid"]')).not.toBeNull();
        expect(container.querySelector('[data-view="list"]')).not.toBeNull();
    });

    test("view toggle click changes to list mode", () => {
        const container = sortDom.window.document.getElementById("view-toggle");
        const listBtn = container.querySelector('[data-view="list"]');
        listBtn.click();
        expect(sortWin._filterState.view).toBe("list");
        const projContainer = sortDom.window.document.getElementById("projects-container");
        expect(projContainer.classList.contains("view-list")).toBe(true);
    });

    test("view toggle click changes back to grid mode", () => {
        const container = sortDom.window.document.getElementById("view-toggle");
        const gridBtn = container.querySelector('[data-view="grid"]');
        gridBtn.click();
        expect(sortWin._filterState.view).toBe("grid");
        const projContainer = sortDom.window.document.getElementById("projects-container");
        expect(projContainer.classList.contains("view-list")).toBe(false);
    });

    test("a-z sort renders cards in alphabetical order", () => {
        sortWin.setSortOrder("a-z");
        const projContainer = sortDom.window.document.getElementById("projects-container");
        const titles = Array.from(projContainer.querySelectorAll(".card h3 a"))
            .map(a => a.textContent);
        for (let i = 1; i < titles.length; i++) {
            expect(titles[i].toLowerCase().localeCompare(
                titles[i - 1].toLowerCase()
            )).toBeGreaterThanOrEqual(0);
        }
    });

    test("default sort restores original order", () => {
        sortWin.setSortOrder("default");
        const projContainer = sortDom.window.document.getElementById("projects-container");
        const titles = Array.from(projContainer.querySelectorAll(".card h3 a"))
            .map(a => a.textContent);
        const expected = sortWin.PROJECTS.map(p => p.title);
        expect(titles).toEqual(expected);
    });
});

// ── Bookmarks ───────────────────────────────────────────────────────

describe("isBookmarked", () => {
    afterEach(() => {
        // Clear bookmarks between tests
        win._bookmarks.clear();
    });

    test("returns false for unbookmarked repo", () => {
        expect(win.isBookmarked("nonexistent")).toBe(false);
    });

    test("returns true after adding to _bookmarks", () => {
        win._bookmarks.add("sauravcode");
        expect(win.isBookmarked("sauravcode")).toBe(true);
    });
});

describe("toggleBookmark", () => {
    afterEach(() => {
        win._bookmarks.clear();
        win._filterState.bookmarked = false;
    });

    test("bookmarks an unbookmarked repo", () => {
        const result = win.toggleBookmark("sauravcode");
        expect(result).toBe(true);
        expect(win.isBookmarked("sauravcode")).toBe(true);
    });

    test("unbookmarks a bookmarked repo", () => {
        win._bookmarks.add("sauravcode");
        const result = win.toggleBookmark("sauravcode");
        expect(result).toBe(false);
        expect(win.isBookmarked("sauravcode")).toBe(false);
    });

    test("toggle twice returns to original state", () => {
        win.toggleBookmark("sauravcode");
        win.toggleBookmark("sauravcode");
        expect(win.isBookmarked("sauravcode")).toBe(false);
    });
});

describe("getBookmarkCount", () => {
    afterEach(() => {
        win._bookmarks.clear();
    });

    test("returns 0 when no bookmarks", () => {
        expect(win.getBookmarkCount()).toBe(0);
    });

    test("returns correct count", () => {
        win._bookmarks.add("sauravcode");
        win._bookmarks.add("ai");
        expect(win.getBookmarkCount()).toBe(2);
    });
});

describe("setBookmarkFilter", () => {
    afterEach(() => {
        win._filterState.bookmarked = false;
        win._bookmarks.clear();
    });

    test("toggles bookmark filter on", () => {
        win.setBookmarkFilter(true);
        expect(win._filterState.bookmarked).toBe(true);
    });

    test("toggles bookmark filter off", () => {
        win._filterState.bookmarked = true;
        win.setBookmarkFilter(false);
        expect(win._filterState.bookmarked).toBe(false);
    });

    test("toggle without argument flips state", () => {
        win.setBookmarkFilter();
        expect(win._filterState.bookmarked).toBe(true);
        win.setBookmarkFilter();
        expect(win._filterState.bookmarked).toBe(false);
    });
});

describe("bookmark filtering", () => {
    afterEach(() => {
        win._filterState.bookmarked = false;
        win._filterState.category = null;
        win._filterState.query = "";
        win._bookmarks.clear();
    });

    test("bookmark filter returns only bookmarked projects", () => {
        win._bookmarks.add("sauravcode");
        win._filterState.bookmarked = true;
        const filtered = win.filterProjects();
        expect(filtered.length).toBe(1);
        expect(filtered[0].repo).toBe("sauravcode");
    });

    test("bookmark filter with no bookmarks returns empty", () => {
        win._filterState.bookmarked = true;
        const filtered = win.filterProjects();
        expect(filtered.length).toBe(0);
    });

    test("bookmark filter combines with search query", () => {
        win._bookmarks.add("sauravcode");
        win._bookmarks.add("ai");
        win._filterState.bookmarked = true;
        win._filterState.query = "saurav";
        const filtered = win.filterProjects();
        expect(filtered.length).toBe(1);
        expect(filtered[0].repo).toBe("sauravcode");
    });

    test("no bookmark filter returns all projects", () => {
        win._filterState.bookmarked = false;
        const filtered = win.filterProjects();
        expect(filtered.length).toBe(win.PROJECTS.length);
    });
});

describe("buildCardHeader with bookmarks", () => {
    afterEach(() => {
        win._bookmarks.clear();
    });

    test("includes bookmark button", () => {
        const p = win.PROJECTS[0];
        const html = win.buildCardHeader(p);
        expect(html).toContain("bookmark-btn");
        expect(html).toContain("data-repo");
    });

    test("unbookmarked shows empty star", () => {
        const p = win.PROJECTS[0];
        const html = win.buildCardHeader(p);
        expect(html).toContain("☆");
        expect(html).not.toContain("bookmarked");
    });

    test("bookmarked shows filled star", () => {
        const p = win.PROJECTS[0];
        win._bookmarks.add(p.repo);
        const html = win.buildCardHeader(p);
        expect(html).toContain("★");
        expect(html).toContain("bookmarked");
    });
});

describe("bookmark integration", () => {
    let bmDom, bmWin;

    beforeAll(() => {
        bmDom = new JSDOM(
            '<!DOCTYPE html><html><body>' +
            '<div id="projects-container"></div>' +
            '<input id="project-search">' +
            '<div id="category-filters"></div>' +
            '<div class="filter-bar-right">' +
            '<div id="sort-controls"></div>' +
            '<div id="view-toggle"></div>' +
            '</div>' +
            '<div id="active-tag-indicator" class="hidden"></div>' +
            '<div id="no-results" class="hidden"></div>' +
            '</body></html>',
            { runScripts: "dangerously", resources: "usable" }
        );
        const code = fs.readFileSync(path.join(__dirname, "..", "docs", "app.js"), "utf-8");
        bmDom.window.eval(code);
        bmWin = bmDom.window;
    });

    afterAll(() => {
        bmDom.window.close();
    });

    test("bookmark filter pill is created", () => {
        const pill = bmDom.window.document.getElementById("bookmark-filter");
        expect(pill).not.toBeNull();
        expect(pill.textContent).toContain("Bookmarks");
    });

    test("cards have bookmark buttons", () => {
        const container = bmDom.window.document.getElementById("projects-container");
        const btns = container.querySelectorAll(".bookmark-btn");
        expect(btns.length).toBeGreaterThan(0);
    });

    test("clicking bookmark button toggles star", () => {
        const container = bmDom.window.document.getElementById("projects-container");
        const btn = container.querySelector(".bookmark-btn");
        const repo = btn.getAttribute("data-repo");

        expect(btn.textContent.trim()).toBe("☆");
        btn.click();
        // After re-render, find the button again
        const updatedBtn = container.querySelector('[data-repo="' + repo + '"]');
        expect(updatedBtn.textContent.trim()).toBe("★");
        expect(updatedBtn.classList.contains("bookmarked")).toBe(true);
    });

    test("bookmark filter pill click toggles filter", () => {
        const pill = bmDom.window.document.getElementById("bookmark-filter");
        pill.click();
        expect(bmWin._filterState.bookmarked).toBe(true);
        expect(pill.classList.contains("active")).toBe(true);

        pill.click();
        expect(bmWin._filterState.bookmarked).toBe(false);
        expect(pill.classList.contains("active")).toBe(false);
    });

    test("bookmark filter shows only bookmarked projects", () => {
        // Ensure at least one bookmark exists from earlier test
        const container = bmDom.window.document.getElementById("projects-container");
        const pill = bmDom.window.document.getElementById("bookmark-filter");

        // Activate filter
        bmWin.setBookmarkFilter(true);
        const cards = container.querySelectorAll(".card");
        // Should show only bookmarked cards (at least 1 from the click test)
        expect(cards.length).toBeLessThan(bmWin.PROJECTS.length);
        expect(cards.length).toBeGreaterThan(0);

        // Deactivate
        bmWin.setBookmarkFilter(false);
        const allCards = container.querySelectorAll(".card");
        expect(allCards.length).toBe(bmWin.PROJECTS.length);
    });
});

// ── Deep Link Filter State ──────────────────────────────────────────

describe("serializeFilterState", () => {
    afterEach(() => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
        win._filterState.sort = "default";
        win._filterState.view = "grid";
        win._filterState.bookmarked = false;
    });

    test("returns empty string for default state", () => {
        expect(win.serializeFilterState()).toBe("");
    });

    test("serializes query", () => {
        win._filterState.query = "hello";
        expect(win.serializeFilterState()).toBe("q=hello");
    });

    test("serializes category", () => {
        win._filterState.category = "AI & Safety";
        const result = win.serializeFilterState();
        expect(result).toContain("cat=AI%20%26%20Safety");
    });

    test("serializes tag", () => {
        win._filterState.tag = "Python";
        expect(win.serializeFilterState()).toContain("tag=Python");
    });

    test("serializes non-default sort", () => {
        win._filterState.sort = "a-z";
        expect(win.serializeFilterState()).toContain("sort=a-z");
    });

    test("does not serialize default sort", () => {
        win._filterState.sort = "default";
        expect(win.serializeFilterState()).toBe("");
    });

    test("serializes non-grid view", () => {
        win._filterState.view = "list";
        expect(win.serializeFilterState()).toContain("view=list");
    });

    test("does not serialize grid view (default)", () => {
        win._filterState.view = "grid";
        expect(win.serializeFilterState()).toBe("");
    });

    test("serializes bookmarked filter", () => {
        win._filterState.bookmarked = true;
        expect(win.serializeFilterState()).toContain("bm=1");
    });

    test("combines multiple filters", () => {
        win._filterState.query = "test";
        win._filterState.sort = "z-a";
        win._filterState.bookmarked = true;
        const result = win.serializeFilterState();
        expect(result).toContain("q=test");
        expect(result).toContain("sort=z-a");
        expect(result).toContain("bm=1");
    });
});

describe("deserializeFilterState", () => {
    test("returns empty object for empty string", () => {
        expect(win.deserializeFilterState("")).toEqual({});
    });

    test("returns empty object for null", () => {
        expect(win.deserializeFilterState(null)).toEqual({});
    });

    test("strips leading # from hash", () => {
        const result = win.deserializeFilterState("#q=hello");
        expect(result.q).toBe("hello");
    });

    test("parses query", () => {
        const result = win.deserializeFilterState("q=hello%20world");
        expect(result.q).toBe("hello world");
    });

    test("parses category", () => {
        const result = win.deserializeFilterState("cat=AI%20%26%20Safety");
        expect(result.cat).toBe("AI & Safety");
    });

    test("parses tag", () => {
        const result = win.deserializeFilterState("tag=Python");
        expect(result.tag).toBe("Python");
    });

    test("parses sort", () => {
        const result = win.deserializeFilterState("sort=a-z");
        expect(result.sort).toBe("a-z");
    });

    test("parses view", () => {
        const result = win.deserializeFilterState("view=list");
        expect(result.view).toBe("list");
    });

    test("parses bookmark flag", () => {
        const result = win.deserializeFilterState("bm=1");
        expect(result.bm).toBe(true);
    });

    test("bm=0 is false", () => {
        const result = win.deserializeFilterState("bm=0");
        expect(result.bm).toBe(false);
    });

    test("parses multiple params", () => {
        const result = win.deserializeFilterState("q=test&sort=z-a&bm=1");
        expect(result.q).toBe("test");
        expect(result.sort).toBe("z-a");
        expect(result.bm).toBe(true);
    });

    test("ignores unknown keys", () => {
        const result = win.deserializeFilterState("foo=bar&q=hello");
        expect(result.q).toBe("hello");
        expect(result).not.toHaveProperty("foo");
    });

    test("ignores entries without =", () => {
        const result = win.deserializeFilterState("q=hello&badentry&tag=AI");
        expect(result.q).toBe("hello");
        expect(result.tag).toBe("AI");
    });
});

describe("serialize/deserialize roundtrip", () => {
    afterEach(() => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
        win._filterState.sort = "default";
        win._filterState.view = "grid";
        win._filterState.bookmarked = false;
    });

    test("roundtrip preserves query", () => {
        win._filterState.query = "hello world";
        const hash = win.serializeFilterState();
        const parsed = win.deserializeFilterState(hash);
        expect(parsed.q).toBe("hello world");
    });

    test("roundtrip preserves category with special chars", () => {
        win._filterState.category = "AI & Safety";
        const hash = win.serializeFilterState();
        const parsed = win.deserializeFilterState(hash);
        expect(parsed.cat).toBe("AI & Safety");
    });

    test("roundtrip preserves all fields", () => {
        win._filterState.query = "test";
        win._filterState.category = "Tools";
        win._filterState.tag = "Python";
        win._filterState.sort = "most-tags";
        win._filterState.view = "list";
        win._filterState.bookmarked = true;
        const hash = win.serializeFilterState();
        const parsed = win.deserializeFilterState(hash);
        expect(parsed.q).toBe("test");
        expect(parsed.cat).toBe("Tools");
        expect(parsed.tag).toBe("Python");
        expect(parsed.sort).toBe("most-tags");
        expect(parsed.view).toBe("list");
        expect(parsed.bm).toBe(true);
    });
});

// ── Portfolio Analytics ─────────────────────────────────────────────

describe("computeCategoryDistribution", () => {
    test("returns all categories with correct counts", () => {
        const dist = win.computeCategoryDistribution();
        expect(dist.length).toBeGreaterThan(0);
        const total = dist.reduce((sum, d) => sum + d.count, 0);
        expect(total).toBe(win.PROJECTS.length);
    });

    test("sorted descending by count", () => {
        const dist = win.computeCategoryDistribution();
        for (let i = 1; i < dist.length; i++) {
            expect(dist[i].count).toBeLessThanOrEqual(dist[i - 1].count);
        }
    });

    test("each entry has name and count", () => {
        const dist = win.computeCategoryDistribution();
        dist.forEach(d => {
            expect(typeof d.name).toBe("string");
            expect(d.name.length).toBeGreaterThan(0);
            expect(typeof d.count).toBe("number");
            expect(d.count).toBeGreaterThan(0);
        });
    });

    test("works with custom project list", () => {
        const custom = [
            { category: "A", tags: [], links: [] },
            { category: "A", tags: [], links: [] },
            { category: "B", tags: [], links: [] }
        ];
        const dist = win.computeCategoryDistribution(custom);
        expect(dist.length).toBe(2);
        expect(dist[0].name).toBe("A");
        expect(dist[0].count).toBe(2);
        expect(dist[1].name).toBe("B");
        expect(dist[1].count).toBe(1);
    });

    test("returns empty array for empty input", () => {
        const dist = win.computeCategoryDistribution([]);
        expect(dist).toEqual([]);
    });
});

describe("computeTagDistribution", () => {
    test("returns all unique tags", () => {
        const dist = win.computeTagDistribution();
        expect(dist.length).toBeGreaterThan(0);
        const names = dist.map(d => d.name);
        expect(new Set(names).size).toBe(names.length);
    });

    test("sorted descending by count", () => {
        const dist = win.computeTagDistribution();
        for (let i = 1; i < dist.length; i++) {
            expect(dist[i].count).toBeLessThanOrEqual(dist[i - 1].count);
        }
    });

    test("counts multiple occurrences", () => {
        const custom = [
            { category: "A", tags: ["Python", "AI"], links: [] },
            { category: "B", tags: ["Python", "Go"], links: [] }
        ];
        const dist = win.computeTagDistribution(custom);
        const python = dist.find(d => d.name === "Python");
        expect(python.count).toBe(2);
    });

    test("handles projects with no tags", () => {
        const custom = [{ category: "A", tags: [], links: [] }];
        const dist = win.computeTagDistribution(custom);
        expect(dist).toEqual([]);
    });
});

describe("computePortfolioSummary", () => {
    test("returns correct project count", () => {
        const summary = win.computePortfolioSummary();
        expect(summary.totalProjects).toBe(win.PROJECTS.length);
    });

    test("totalCategories matches extractCategories", () => {
        const summary = win.computePortfolioSummary();
        const categories = win.extractCategories();
        expect(summary.totalCategories).toBe(categories.length);
    });

    test("totalTags matches extractTags", () => {
        const summary = win.computePortfolioSummary();
        const tags = win.extractTags();
        expect(summary.totalTags).toBe(tags.length);
    });

    test("totalLinks counts all links", () => {
        const summary = win.computePortfolioSummary();
        const expected = win.PROJECTS.reduce((sum, p) => sum + (p.links || []).length, 0);
        expect(summary.totalLinks).toBe(expected);
    });

    test("avgTagsPerProject is reasonable", () => {
        const summary = win.computePortfolioSummary();
        expect(summary.avgTagsPerProject).toBeGreaterThan(0);
        expect(summary.avgTagsPerProject).toBeLessThan(20);
    });

    test("handles empty input", () => {
        const summary = win.computePortfolioSummary([]);
        expect(summary.totalProjects).toBe(0);
        expect(summary.totalCategories).toBe(0);
        expect(summary.totalTags).toBe(0);
        expect(summary.totalLinks).toBe(0);
        expect(summary.avgTagsPerProject).toBe(0);
    });
});

describe("buildBarChart", () => {
    test("returns bar HTML with correct structure", () => {
        const data = [
            { name: "AI", count: 5 },
            { name: "Tools", count: 3 }
        ];
        const html = win.buildBarChart(data);
        expect(html).toContain("bar-row");
        expect(html).toContain("bar-label");
        expect(html).toContain("bar-fill");
        expect(html).toContain("AI");
        expect(html).toContain("Tools");
        expect(html).toContain("5");
        expect(html).toContain("3");
    });

    test("respects maxBars limit", () => {
        const data = Array.from({ length: 20 }, (_, i) => ({ name: "Cat" + i, count: 20 - i }));
        const html = win.buildBarChart(data, 5);
        const matches = html.match(/bar-row/g);
        expect(matches.length).toBe(5);
    });

    test("handles empty data", () => {
        const html = win.buildBarChart([]);
        expect(html).toContain("No data");
    });

    test("handles null data", () => {
        const html = win.buildBarChart(null);
        expect(html).toContain("No data");
    });

    test("first bar is 100% width", () => {
        const data = [{ name: "A", count: 10 }, { name: "B", count: 5 }];
        const html = win.buildBarChart(data);
        expect(html).toContain("width:100%");
        expect(html).toContain("width:50%");
    });

    test("escapes HTML in names", () => {
        const data = [{ name: "<script>alert(1)</script>", count: 1 }];
        const html = win.buildBarChart(data);
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });
});

describe("buildTagCloud", () => {
    test("returns tag cloud HTML", () => {
        const tags = [
            { name: "Python", count: 5 },
            { name: "JavaScript", count: 3 },
            { name: "Go", count: 1 }
        ];
        const html = win.buildTagCloud(tags);
        expect(html).toContain("tag-cloud");
        expect(html).toContain("tag-cloud-item");
        expect(html).toContain("Python");
        expect(html).toContain("JavaScript");
        expect(html).toContain("Go");
    });

    test("assigns size classes based on frequency", () => {
        const tags = [
            { name: "A", count: 10 },
            { name: "B", count: 1 }
        ];
        const html = win.buildTagCloud(tags);
        expect(html).toContain("size-5");
        expect(html).toContain("size-1");
    });

    test("all same count gets size-3", () => {
        const tags = [
            { name: "A", count: 5 },
            { name: "B", count: 5 },
            { name: "C", count: 5 }
        ];
        const html = win.buildTagCloud(tags);
        const matches = html.match(/size-3/g);
        expect(matches.length).toBe(3);
    });

    test("respects maxTags limit", () => {
        const tags = Array.from({ length: 30 }, (_, i) => ({ name: "Tag" + i, count: 30 - i }));
        const html = win.buildTagCloud(tags, 10);
        const matches = html.match(/tag-cloud-item/g);
        expect(matches.length).toBe(10);
    });

    test("sorts alphabetically for display", () => {
        const tags = [
            { name: "Zebra", count: 5 },
            { name: "Apple", count: 3 },
            { name: "Mango", count: 1 }
        ];
        const html = win.buildTagCloud(tags);
        const appleIdx = html.indexOf("Apple");
        const mangoIdx = html.indexOf("Mango");
        const zebraIdx = html.indexOf("Zebra");
        expect(appleIdx).toBeLessThan(mangoIdx);
        expect(mangoIdx).toBeLessThan(zebraIdx);
    });

    test("includes title with count", () => {
        const tags = [{ name: "Python", count: 3 }];
        const html = win.buildTagCloud(tags);
        expect(html).toContain("Python: 3 projects");
    });

    test("handles singular count", () => {
        const tags = [{ name: "Go", count: 1 }];
        const html = win.buildTagCloud(tags);
        expect(html).toContain("Go: 1 project\"");
    });

    test("handles empty tags", () => {
        expect(win.buildTagCloud([])).toContain("No tags");
        expect(win.buildTagCloud(null)).toContain("No tags");
    });
});

describe("buildAnalyticsPanel", () => {
    test("returns complete panel HTML", () => {
        const html = win.buildAnalyticsPanel();
        expect(html).toContain("analytics-grid");
        expect(html).toContain("analytics-card");
        expect(html).toContain("analytics-summary");
        expect(html).toContain("Projects by Category");
        expect(html).toContain("Technology Tags");
    });

    test("summary matches PROJECTS data", () => {
        const html = win.buildAnalyticsPanel();
        expect(html).toContain(">" + win.PROJECTS.length + "<");
    });

    test("works with empty projects", () => {
        const html = win.buildAnalyticsPanel([]);
        expect(html).toContain("analytics-grid");
        expect(html).toContain(">0<");
    });
});

describe("toggleAnalytics", () => {
    test("opens panel on first call", () => {
        const panel = win.document.getElementById("analytics-panel");
        expect(panel).not.toBeNull();
        const result = win.toggleAnalytics();
        expect(result).toBe(true);
        expect(panel.classList.contains("visible")).toBe(true);
    });

    test("closes panel on second call", () => {
        const result = win.toggleAnalytics();
        expect(result).toBe(false);
        const panel = win.document.getElementById("analytics-panel");
        expect(panel.classList.contains("visible")).toBe(false);
    });

    test("renders content lazily", () => {
        const panel = win.document.getElementById("analytics-panel");
        expect(panel.innerHTML).toContain("analytics-grid");
    });

    test("toggle button updates aria-expanded", () => {
        const btn = win.document.getElementById("analytics-toggle");
        expect(btn).not.toBeNull();
        win.toggleAnalytics();
        expect(btn.getAttribute("aria-expanded")).toBe("true");
        win.toggleAnalytics();
        expect(btn.getAttribute("aria-expanded")).toBe("false");
    });
});

// ── Spotlight Carousel ──────────────────────────────────────────────

describe("Spotlight Carousel", () => {
    beforeEach(() => {
        // Reset spotlight state before each test
        win._spotlightState.index = 0;
        win._spotlightState.paused = false;
        win.stopSpotlightTimer();
    });

    describe("buildSpotlightCard", () => {
        test("returns empty string for null project", () => {
            expect(win.buildSpotlightCard(null, 0, 1)).toBe("");
        });

        test("returns empty string for undefined project", () => {
            expect(win.buildSpotlightCard(undefined, 0, 1)).toBe("");
        });

        test("renders project title", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, win.PROJECTS.length);
            expect(html).toContain("spotlight-title");
            expect(html).toContain(win.PROJECTS[0].title);
        });

        test("renders project description", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, win.PROJECTS.length);
            expect(html).toContain("spotlight-desc");
        });

        test("renders project icon", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, win.PROJECTS.length);
            expect(html).toContain("spotlight-icon");
        });

        test("renders project tags", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, win.PROJECTS.length);
            expect(html).toContain("spotlight-tags");
            for (const tag of win.PROJECTS[0].tags) {
                expect(html).toContain(tag);
            }
        });

        test("renders project links with sanitized URLs", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, win.PROJECTS.length);
            expect(html).toContain("spotlight-links");
            expect(html).toContain('target="_blank"');
            expect(html).toContain('rel="noopener"');
        });

        test("renders navigation dots for all projects", () => {
            const total = win.PROJECTS.length;
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, total);
            const dotCount = (html.match(/spotlight-dot/g) || []).length;
            // Each dot has 'spotlight-dot' once in class
            expect(dotCount).toBeGreaterThanOrEqual(total);
        });

        test("marks active dot for current index", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[2], 2, win.PROJECTS.length);
            expect(html).toContain('data-spotlight-index="2"');
            // The dot at index 2 should have 'active'
            const dotMatch = html.match(/spotlight-dot active[^"]*" data-spotlight-index="2"/);
            expect(dotMatch).not.toBeNull();
        });

        test("shows 'Featured Project X of Y'", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[3], 3, 15);
            expect(html).toContain("Featured Project 4 of 15");
        });

        test("renders prev and next buttons", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, 5);
            expect(html).toContain("spotlight-prev");
            expect(html).toContain("spotlight-next");
        });

        test("renders pause button", () => {
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, 5);
            expect(html).toContain("spotlight-pause");
        });

        test("shows 'Pause' when not paused", () => {
            win._spotlightState.paused = false;
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, 5);
            expect(html).toContain(">Pause<");
        });

        test("shows 'Resume' when paused", () => {
            win._spotlightState.paused = true;
            const html = win.buildSpotlightCard(win.PROJECTS[0], 0, 5);
            expect(html).toContain(">Resume<");
        });

        test("escapes special characters in title", () => {
            const fakeProject = {
                title: '<script>alert("xss")</script>',
                desc: "test",
                icon: "X",
                tags: [],
                links: [],
                repo: "test",
                category: "Test"
            };
            const html = win.buildSpotlightCard(fakeProject, 0, 1);
            expect(html).not.toContain("<script>");
            expect(html).toContain("&lt;script&gt;");
        });

        test("sanitizes URLs in links", () => {
            const fakeProject = {
                title: "Test",
                desc: "test",
                icon: "X",
                tags: [],
                links: [{ label: "Evil", url: "javascript:alert(1)" }],
                repo: "test",
                category: "Test"
            };
            const html = win.buildSpotlightCard(fakeProject, 0, 1);
            expect(html).not.toContain("javascript:");
        });
    });

    describe("nextSpotlight", () => {
        test("advances index by 1", () => {
            win._spotlightState.index = 0;
            const result = win.nextSpotlight();
            expect(result).toBe(1);
            expect(win._spotlightState.index).toBe(1);
        });

        test("wraps around to 0 at end", () => {
            win._spotlightState.index = win.PROJECTS.length - 1;
            const result = win.nextSpotlight();
            expect(result).toBe(0);
        });

        test("renders the new spotlight", () => {
            win._spotlightState.index = 0;
            win.nextSpotlight();
            const container = win.document.getElementById("spotlight-container");
            expect(container.innerHTML).toContain(win.PROJECTS[1].title);
        });
    });

    describe("prevSpotlight", () => {
        test("decreases index by 1", () => {
            win._spotlightState.index = 3;
            const result = win.prevSpotlight();
            expect(result).toBe(2);
        });

        test("wraps around to last at index 0", () => {
            win._spotlightState.index = 0;
            const result = win.prevSpotlight();
            expect(result).toBe(win.PROJECTS.length - 1);
        });

        test("renders the new spotlight", () => {
            win._spotlightState.index = 2;
            win.prevSpotlight();
            const container = win.document.getElementById("spotlight-container");
            expect(container.innerHTML).toContain(win.PROJECTS[1].title);
        });
    });

    describe("goToSpotlight", () => {
        test("goes to specific index", () => {
            const result = win.goToSpotlight(5);
            expect(result).toBe(5);
            expect(win._spotlightState.index).toBe(5);
        });

        test("wraps negative index", () => {
            const result = win.goToSpotlight(-1);
            expect(result).toBe(win.PROJECTS.length - 1);
        });

        test("wraps index beyond length", () => {
            const result = win.goToSpotlight(win.PROJECTS.length + 3);
            expect(result).toBe(3);
        });

        test("goes to index 0", () => {
            win._spotlightState.index = 5;
            const result = win.goToSpotlight(0);
            expect(result).toBe(0);
        });
    });

    describe("toggleSpotlightPause", () => {
        test("pauses when running", () => {
            win._spotlightState.paused = false;
            const result = win.toggleSpotlightPause();
            expect(result).toBe(true);
            expect(win._spotlightState.paused).toBe(true);
        });

        test("resumes when paused", () => {
            win._spotlightState.paused = true;
            const result = win.toggleSpotlightPause();
            expect(result).toBe(false);
            expect(win._spotlightState.paused).toBe(false);
        });

        test("stops timer when pausing", () => {
            win._spotlightState.paused = false;
            win.startSpotlightTimer();
            win.toggleSpotlightPause();
            expect(win._spotlightState.timerId).toBeNull();
        });
    });

    describe("startSpotlightTimer / stopSpotlightTimer", () => {
        test("sets timerId on start", () => {
            win.startSpotlightTimer();
            expect(win._spotlightState.timerId).not.toBeNull();
            win.stopSpotlightTimer();
        });

        test("clears timerId on stop", () => {
            win.startSpotlightTimer();
            win.stopSpotlightTimer();
            expect(win._spotlightState.timerId).toBeNull();
        });

        test("stop is idempotent", () => {
            win.stopSpotlightTimer();
            win.stopSpotlightTimer();
            expect(win._spotlightState.timerId).toBeNull();
        });

        test("start clears previous timer", () => {
            win.startSpotlightTimer();
            const id1 = win._spotlightState.timerId;
            win.startSpotlightTimer();
            const id2 = win._spotlightState.timerId;
            // Should be a different timer ID
            expect(id2).not.toBe(id1);
            win.stopSpotlightTimer();
        });
    });

    describe("renderSpotlight", () => {
        test("renders first project on init", () => {
            win._spotlightState.index = 0;
            win.renderSpotlight();
            const container = win.document.getElementById("spotlight-container");
            expect(container.innerHTML).toContain(win.PROJECTS[0].title);
        });

        test("renders spotlight-inner structure", () => {
            win.renderSpotlight();
            const container = win.document.getElementById("spotlight-container");
            expect(container.innerHTML).toContain("spotlight-inner");
            expect(container.innerHTML).toContain("spotlight-content");
            expect(container.innerHTML).toContain("spotlight-dots");
        });

        test("renders correct project at index", () => {
            win._spotlightState.index = 3;
            win.renderSpotlight();
            const container = win.document.getElementById("spotlight-container");
            expect(container.innerHTML).toContain(win.PROJECTS[3].title);
        });
    });

    describe("initSpotlight", () => {
        test("resets index to 0", () => {
            win._spotlightState.index = 5;
            win.initSpotlight();
            expect(win._spotlightState.index).toBe(0);
            win.stopSpotlightTimer();
        });

        test("resets paused to false", () => {
            win._spotlightState.paused = true;
            win.initSpotlight();
            expect(win._spotlightState.paused).toBe(false);
            win.stopSpotlightTimer();
        });

        test("starts the auto-rotation timer", () => {
            win.initSpotlight();
            expect(win._spotlightState.timerId).not.toBeNull();
            win.stopSpotlightTimer();
        });

        test("renders the spotlight container", () => {
            win.initSpotlight();
            const container = win.document.getElementById("spotlight-container");
            expect(container.innerHTML.length).toBeGreaterThan(0);
            win.stopSpotlightTimer();
        });
    });

    describe("wireSpotlightEvents", () => {
        test("prev button click goes to previous project", () => {
            win._spotlightState.index = 3;
            win.renderSpotlight();
            const container = win.document.getElementById("spotlight-container");
            const prevBtn = container.querySelector(".spotlight-prev");
            prevBtn.click();
            expect(win._spotlightState.index).toBe(2);
        });

        test("next button click goes to next project", () => {
            win._spotlightState.index = 3;
            win.renderSpotlight();
            const container = win.document.getElementById("spotlight-container");
            const nextBtn = container.querySelector(".spotlight-next");
            nextBtn.click();
            expect(win._spotlightState.index).toBe(4);
        });

        test("dot click navigates to specific project", () => {
            win._spotlightState.index = 0;
            win.renderSpotlight();
            const container = win.document.getElementById("spotlight-container");
            const dots = container.querySelectorAll(".spotlight-dot");
            if (dots.length > 5) {
                dots[5].click();
                expect(win._spotlightState.index).toBe(5);
            }
        });

        test("pause button toggles pause state", () => {
            win._spotlightState.paused = false;
            win.renderSpotlight();
            const container = win.document.getElementById("spotlight-container");
            const pauseBtn = container.querySelector(".spotlight-pause");
            pauseBtn.click();
            expect(win._spotlightState.paused).toBe(true);
        });
    });

    describe("spotlight state", () => {
        test("default intervalMs is 6000", () => {
            expect(win._spotlightState.intervalMs).toBe(6000);
        });

        test("state tracks index correctly through navigation", () => {
            win._spotlightState.index = 0;
            win.nextSpotlight();
            win.nextSpotlight();
            win.nextSpotlight();
            expect(win._spotlightState.index).toBe(3);
            win.prevSpotlight();
            expect(win._spotlightState.index).toBe(2);
        });

        test("full cycle returns to 0", () => {
            win._spotlightState.index = 0;
            for (let i = 0; i < win.PROJECTS.length; i++) {
                win.nextSpotlight();
            }
            expect(win._spotlightState.index).toBe(0);
        });
    });
});

// ── Tech Stack Radar ────────────────────────────────────────────────

describe("Tech Stack Radar", () => {
    beforeEach(() => {
        win._techRadarState.expanded = false;
        win._techRadarState.activeType = null;
    });

    describe("computeTechStack", () => {
        test("returns an array of tech items", () => {
            const stack = win.computeTechStack();
            expect(Array.isArray(stack)).toBe(true);
            expect(stack.length).toBeGreaterThan(0);
        });

        test("each item has tag, count, type, and projects", () => {
            const stack = win.computeTechStack();
            for (const item of stack) {
                expect(item).toHaveProperty("tag");
                expect(item).toHaveProperty("count");
                expect(item).toHaveProperty("type");
                expect(item).toHaveProperty("projects");
                expect(typeof item.tag).toBe("string");
                expect(typeof item.count).toBe("number");
                expect(item.count).toBeGreaterThan(0);
                expect(Array.isArray(item.projects)).toBe(true);
            }
        });

        test("sorted by count descending", () => {
            const stack = win.computeTechStack();
            for (let i = 1; i < stack.length; i++) {
                expect(stack[i].count).toBeLessThanOrEqual(stack[i - 1].count);
            }
        });

        test("Python appears with count >= 4", () => {
            const stack = win.computeTechStack();
            const python = stack.find(s => s.tag === "Python");
            expect(python).toBeDefined();
            expect(python.count).toBeGreaterThanOrEqual(4);
        });

        test("assigns correct type from TECH_CATEGORIES", () => {
            const stack = win.computeTechStack();
            const python = stack.find(s => s.tag === "Python");
            expect(python.type).toBe("Language");
            const flutter = stack.find(s => s.tag === "Flutter");
            if (flutter) expect(flutter.type).toBe("Framework");
        });

        test("unrecognized tags default to Domain", () => {
            const stack = win.computeTechStack();
            const safety = stack.find(s => s.tag === "AI Safety");
            if (safety) expect(safety.type).toBe("Domain");
        });

        test("projects list matches count", () => {
            const stack = win.computeTechStack();
            for (const item of stack) {
                expect(item.projects.length).toBe(item.count);
            }
        });
    });

    describe("groupTechByType", () => {
        test("groups by type categories", () => {
            const stack = win.computeTechStack();
            const groups = win.groupTechByType(stack);
            expect(groups).toHaveProperty("Language");
            expect(groups).toHaveProperty("Framework");
            expect(groups).toHaveProperty("Tool");
            expect(groups).toHaveProperty("Domain");
        });

        test("Language group contains Python", () => {
            const stack = win.computeTechStack();
            const groups = win.groupTechByType(stack);
            const langTags = groups.Language.map(i => i.tag);
            expect(langTags).toContain("Python");
        });

        test("all items are accounted for", () => {
            const stack = win.computeTechStack();
            const groups = win.groupTechByType(stack);
            let total = 0;
            for (const key in groups) {
                total += groups[key].length;
            }
            expect(total).toBe(stack.length);
        });
    });

    describe("buildTechRadar", () => {
        test("returns HTML with techradar class", () => {
            const html = win.buildTechRadar(null);
            expect(html).toContain('class="techradar"');
        });

        test("includes type filter pills", () => {
            const html = win.buildTechRadar(null);
            expect(html).toContain("techradar-pill");
            expect(html).toContain("Language");
        });

        test("includes tech items", () => {
            const html = win.buildTechRadar(null);
            expect(html).toContain("techradar-item");
            expect(html).toContain("Python");
        });

        test("includes summary stats", () => {
            const html = win.buildTechRadar(null);
            expect(html).toContain("technologies");
            expect(html).toContain("languages");
            expect(html).toContain("projects");
        });

        test("filters by type when activeType set", () => {
            const htmlAll = win.buildTechRadar(null);
            const htmlLang = win.buildTechRadar("Language");
            // Language-only should be shorter (fewer items)
            expect(htmlLang.length).toBeLessThan(htmlAll.length);
            // Should still contain Python
            expect(htmlLang).toContain("Python");
        });

        test("escapes tag names", () => {
            // All real tags are safe, but the function uses escapeHTML
            const html = win.buildTechRadar(null);
            expect(html).not.toContain("<script>");
        });

        test("active pill gets active class", () => {
            const html = win.buildTechRadar("Language");
            // The Language pill should be active
            expect(html).toMatch(/techradar-pill active.*Language/);
        });
    });

    describe("toggleTechRadar", () => {
        test("toggles expanded state", () => {
            expect(win._techRadarState.expanded).toBe(false);
            win.toggleTechRadar();
            expect(win._techRadarState.expanded).toBe(true);
            win.toggleTechRadar();
            expect(win._techRadarState.expanded).toBe(false);
        });

        test("renders panel when expanded", () => {
            win.toggleTechRadar();
            const panel = win.document.getElementById("techradar-panel");
            expect(panel.innerHTML.length).toBeGreaterThan(0);
        });

        test("clears panel when collapsed", () => {
            win.toggleTechRadar(); // expand
            win.toggleTechRadar(); // collapse
            const panel = win.document.getElementById("techradar-panel");
            expect(panel.innerHTML).toBe("");
        });

        test("updates aria-expanded on toggle button", () => {
            const btn = win.document.getElementById("techradar-toggle");
            expect(btn.getAttribute("aria-expanded")).toBe("false");
            win.toggleTechRadar();
            expect(btn.getAttribute("aria-expanded")).toBe("true");
            win.toggleTechRadar();
            expect(btn.getAttribute("aria-expanded")).toBe("false");
        });
    });

    describe("setTechRadarFilter", () => {
        test("sets activeType and re-renders", () => {
            win._techRadarState.expanded = true;
            win.renderTechRadar();
            win.setTechRadarFilter("Framework");
            expect(win._techRadarState.activeType).toBe("Framework");
        });

        test("null clears filter", () => {
            win._techRadarState.expanded = true;
            win._techRadarState.activeType = "Language";
            win.setTechRadarFilter(null);
            expect(win._techRadarState.activeType).toBeNull();
        });
    });

    describe("wireTechRadarEvents", () => {
        test("type pill click toggles filter", () => {
            win._techRadarState.expanded = true;
            win.renderTechRadar();
            const panel = win.document.getElementById("techradar-panel");
            const langPill = Array.from(panel.querySelectorAll(".techradar-pill"))
                .find(p => p.getAttribute("data-techradar-type") === "Language");
            if (langPill) {
                langPill.click();
                expect(win._techRadarState.activeType).toBe("Language");
                // Re-render triggers; click same pill to toggle off
                const langPill2 = Array.from(
                    win.document.getElementById("techradar-panel")
                        .querySelectorAll(".techradar-pill")
                ).find(p => p.getAttribute("data-techradar-type") === "Language");
                if (langPill2) {
                    langPill2.click();
                    expect(win._techRadarState.activeType).toBeNull();
                }
            }
        });

        test("All pill resets filter", () => {
            win._techRadarState.expanded = true;
            win._techRadarState.activeType = "Language";
            win.renderTechRadar();
            const panel = win.document.getElementById("techradar-panel");
            const allPill = Array.from(panel.querySelectorAll(".techradar-pill"))
                .find(p => p.getAttribute("data-techradar-type") === "all");
            if (allPill) {
                allPill.click();
                expect(win._techRadarState.activeType).toBeNull();
            }
        });

        test("tech item click triggers tag filter", () => {
            win._techRadarState.expanded = true;
            win.renderTechRadar();
            const panel = win.document.getElementById("techradar-panel");
            const item = panel.querySelector(".techradar-item");
            if (item) {
                const tag = item.getAttribute("data-techradar-tag");
                item.click();
                // Should have set the tag filter
                expect(win._filterState.tag).toBe(tag);
            }
        });
    });

    describe("TECH_CATEGORIES", () => {
        test("maps known tags to types", () => {
            expect(win.TECH_CATEGORIES["Python"]).toBe("Language");
            expect(win.TECH_CATEGORIES["Node.js"]).toBe("Framework");
            expect(win.TECH_CATEGORIES["Compiler"]).toBe("Tool");
        });

        test("all Language entries are strings", () => {
            for (const key in win.TECH_CATEGORIES) {
                expect(typeof win.TECH_CATEGORIES[key]).toBe("string");
            }
        });
    });

    describe("initTechRadar", () => {
        test("wires toggle button", () => {
            // initTechRadar already called during loadApp
            const btn = win.document.getElementById("techradar-toggle");
            expect(btn).not.toBeNull();
            // Clicking should toggle
            btn.click();
            expect(win._techRadarState.expanded).toBe(true);
            btn.click();
            expect(win._techRadarState.expanded).toBe(false);
        });
    });
});


// ── Timeline Tests ──────────────────────────────────────────────
// Tests for the project timeline feature.

describe("Timeline", function() {

    describe("TIMELINE_DATA", function() {
        it("should have data for every win.PROJECTS entry", function() {
            for (var i = 0; i < win.PROJECTS.length; i++) {
                var repo = win.PROJECTS[i].repo;
                expect(win.TIMELINE_DATA[repo]).toBeDefined();
                expect(typeof win.TIMELINE_DATA[repo].created).toBe("string");
                expect(Array.isArray(win.TIMELINE_DATA[repo].releases)).toBe(true);
            }
        });

        it("should have valid ISO date strings for created", function() {
            for (var repo in win.TIMELINE_DATA) {
                if (!win.TIMELINE_DATA.hasOwnProperty(repo)) continue;
                var d = win.TIMELINE_DATA[repo].created;
                expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/,
                    "Bad created date for " + repo + ": " + d);
                expect(isNaN(win.parseTimelineDate(d))).toBe(false);
            }
        });

        it("should have valid release entries", function() {
            for (var repo in win.TIMELINE_DATA) {
                if (!win.TIMELINE_DATA.hasOwnProperty(repo)) continue;
                var releases = win.TIMELINE_DATA[repo].releases;
                for (var j = 0; j < releases.length; j++) {
                    expect(releases[j].tag).toBeDefined();
                    expect(releases[j].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                }
            }
        });

        it("should have at least one release per project", function() {
            for (var repo in win.TIMELINE_DATA) {
                if (!win.TIMELINE_DATA.hasOwnProperty(repo)) continue;
                expect(win.TIMELINE_DATA[repo].releases.length).toBeGreaterThan(0,
                    repo + " should have releases");
            }
        });
    });

    describe("parseTimelineDate", function() {
        it("should parse valid ISO date strings", function() {
            var ts = win.parseTimelineDate("2026-02-14");
            expect(ts).toBeGreaterThan(0);
            var d = new Date(ts);
            expect(d.getUTCFullYear()).toBe(2026);
            expect(d.getUTCMonth()).toBe(1); // February = 1
            expect(d.getUTCDate()).toBe(14);
        });

        it("should return NaN for invalid dates", function() {
            var ts = win.parseTimelineDate("not-a-date");
            expect(isNaN(ts)).toBe(true);
        });
    });

    describe("formatTimelineDate", function() {
        it("should format short dates as 'Mon YYYY'", function() {
            expect(win.formatTimelineDate("2026-02-14")).toBe("Feb 2026");
            expect(win.formatTimelineDate("2015-01-23")).toBe("Jan 2015");
            expect(win.formatTimelineDate("2026-12-01")).toBe("Dec 2026");
        });

        it("should format full dates as 'Mon DD, YYYY'", function() {
            expect(win.formatTimelineDate("2026-02-14", true)).toBe("Feb 14, 2026");
            expect(win.formatTimelineDate("2026-03-07", true)).toBe("Mar 7, 2026");
        });
    });

    describe("buildTimelineEntries", function() {
        it("should return entries sorted by creation date", function() {
            var entries = win.buildTimelineEntries(null);
            expect(entries.length).toBeGreaterThan(0);
            for (var i = 1; i < entries.length; i++) {
                expect(entries[i].createdTs).toBeGreaterThanOrEqual(
                    entries[i - 1].createdTs);
            }
        });

        it("should include all projects when no filter", function() {
            var entries = win.buildTimelineEntries(null);
            expect(entries.length).toBe(win.PROJECTS.length);
        });

        it("should filter by category", function() {
            var entries = win.buildTimelineEntries("AI & Agents");
            expect(entries.length).toBeGreaterThan(0);
            for (var i = 0; i < entries.length; i++) {
                expect(entries[i].project.category).toBe("AI & Agents");
            }
        });

        it("should return empty for non-existent category", function() {
            var entries = win.buildTimelineEntries("Nonexistent Category");
            expect(entries.length).toBe(0);
        });

        it("should attach project object to each entry", function() {
            var entries = win.buildTimelineEntries(null);
            for (var i = 0; i < entries.length; i++) {
                expect(entries[i].project).toBeDefined();
                expect(entries[i].project.repo).toBeDefined();
                expect(entries[i].project.title).toBeDefined();
            }
        });
    });

    describe("computeTimelineRange", function() {
        it("should compute range spanning all entries", function() {
            var entries = win.buildTimelineEntries(null);
            var range = win.computeTimelineRange(entries);
            expect(range.min).toBeLessThan(range.max);
            // Min should be before or at the earliest created date
            for (var i = 0; i < entries.length; i++) {
                expect(range.min).toBeLessThanOrEqual(entries[i].createdTs);
            }
        });

        it("should include release dates in range", function() {
            var entries = win.buildTimelineEntries(null);
            var range = win.computeTimelineRange(entries);
            for (var i = 0; i < entries.length; i++) {
                for (var j = 0; j < entries[i].releases.length; j++) {
                    var rts = win.parseTimelineDate(entries[i].releases[j].date);
                    expect(rts).toBeGreaterThanOrEqual(range.min);
                    expect(rts).toBeLessThanOrEqual(range.max);
                }
            }
        });

        it("should handle single-entry case", function() {
            var entries = [{ createdTs: 1000, releases: [{ date: "2026-01-01" }] }];
            var range = win.computeTimelineRange(entries);
            expect(range.min).toBeLessThan(range.max);
        });
    });

    describe("timelinePosition", function() {
        it("should return 0 for min value", function() {
            expect(win.timelinePosition(0, 0, 100)).toBe(0);
        });

        it("should return 100 for max value", function() {
            expect(win.timelinePosition(100, 0, 100)).toBe(100);
        });

        it("should return 50 for midpoint", function() {
            expect(win.timelinePosition(50, 0, 100)).toBe(50);
        });

        it("should return 50 for equal min/max", function() {
            expect(win.timelinePosition(50, 50, 50)).toBe(50);
        });
    });

    describe("buildTimelineMarkers", function() {
        it("should return markers for multi-year range", function() {
            var range = {
                min: new Date("2015-01-01T00:00:00Z").getTime(),
                max: new Date("2026-12-31T00:00:00Z").getTime()
            };
            var markers = win.buildTimelineMarkers(range);
            expect(markers.length).toBeGreaterThan(0);
            // Should have year labels
            var hasYear = false;
            for (var i = 0; i < markers.length; i++) {
                if (/^\d{4}$/.test(markers[i].label)) hasYear = true;
            }
            expect(hasYear).toBe(true);
        });

        it("should return month markers for short range", function() {
            var range = {
                min: new Date("2026-01-01T00:00:00Z").getTime(),
                max: new Date("2026-06-01T00:00:00Z").getTime()
            };
            var markers = win.buildTimelineMarkers(range);
            expect(markers.length).toBeGreaterThan(0);
            // Should have month labels
            var hasMonth = false;
            for (var i = 0; i < markers.length; i++) {
                if (/^[A-Z][a-z]+ \d{4}$/.test(markers[i].label)) hasMonth = true;
            }
            expect(hasMonth).toBe(true);
        });

        it("should have positions between 0 and 100", function() {
            var entries = win.buildTimelineEntries(null);
            var range = win.computeTimelineRange(entries);
            var markers = win.buildTimelineMarkers(range);
            for (var i = 0; i < markers.length; i++) {
                expect(markers[i].pct).toBeGreaterThanOrEqual(0);
                expect(markers[i].pct).toBeLessThanOrEqual(100);
            }
        });
    });

    describe("TIMELINE_COLORS", function() {
        it("should have colors for every category", function() {
            var cats = {};
            for (var i = 0; i < win.PROJECTS.length; i++) {
                cats[win.PROJECTS[i].category] = true;
            }
            for (var cat in cats) {
                expect(win.TIMELINE_COLORS[cat]).toBeDefined();
                expect(win.TIMELINE_COLORS[cat].bg).toBeDefined();
                expect(win.TIMELINE_COLORS[cat].accent).toBeDefined();
            }
        });

        it("should have light theme colors for every category", function() {
            for (var cat in win.TIMELINE_COLORS) {
                expect(win.TIMELINE_COLORS_LIGHT[cat]).toBeDefined();
            }
        });
    });

    describe("_timelineState", function() {
        it("should start hidden", function() {
            expect(win._timelineState.visible).toBe(false);
        });

        it("should start with no filter", function() {
            expect(win._timelineState.filter).toBeNull();
        });

        it("should default to 'all' zoom", function() {
            expect(win._timelineState.zoom).toBe("all");
        });
    });

    describe("renderTimeline", function() {
        it("should return HTML string", function() {
            var html = win.renderTimeline();
            expect(typeof html).toBe("string");
            expect(html.length).toBeGreaterThan(100);
        });

        it("should contain timeline-container", function() {
            var html = win.renderTimeline();
            expect(html).toContain("timeline-container");
        });

        it("should contain all project names", function() {
            var html = win.renderTimeline();
            for (var i = 0; i < win.PROJECTS.length; i++) {
                expect(html).toContain(win.PROJECTS[i].title);
            }
        });

        it("should contain zoom buttons", function() {
            var html = win.renderTimeline();
            expect(html).toContain("All Time");
            expect(html).toContain("Past Year");
            expect(html).toContain("6 Months");
        });

        it("should contain category filter buttons", function() {
            var html = win.renderTimeline();
            expect(html).toContain("AI &amp; Agents");
            expect(html).toContain("Security");
        });

        it("should contain stats summary", function() {
            var html = win.renderTimeline();
            expect(html).toContain("projects");
            expect(html).toContain("releases");
            expect(html).toContain("years");
        });

        it("should contain legend", function() {
            var html = win.renderTimeline();
            expect(html).toContain("timeline-legend");
            expect(html).toContain("Created");
            expect(html).toContain("Release");
        });

        it("should show dots for releases", function() {
            var html = win.renderTimeline();
            expect(html).toContain("timeline-dot-release");
            expect(html).toContain("timeline-dot-created");
        });

        it("should show span lines", function() {
            var html = win.renderTimeline();
            expect(html).toContain("timeline-span");
        });

        it("should respect category filter", function() {
            win._timelineState.filter = "Security";
            var html = win.renderTimeline();
            expect(html).toContain("WinSentinel");
            expect(html).not.toContain("AgentLens");
            win._timelineState.filter = null; // reset
        });

        it("should show empty message for no-match filter", function() {
            win._timelineState.filter = "Nonexistent";
            var html = win.renderTimeline();
            expect(html).toContain("timeline-empty");
            win._timelineState.filter = null;
        });

        it("should contain repo data attributes on rows", function() {
            var html = win.renderTimeline();
            expect(html).toContain('data-repo="agentlens"');
            expect(html).toContain('data-repo="VoronoiMap"');
        });

        it("should show created date tooltips", function() {
            var html = win.renderTimeline();
            expect(html).toContain("Created:");
        });

        it("should show release tag in tooltips", function() {
            var html = win.renderTimeline();
            expect(html).toContain("v1.0.0");
        });
    });

    describe("setTimelineZoom", function() {
        it("should update zoom state", function() {
            var original = win._timelineState.zoom;
            win.setTimelineZoom("recent");
            expect(win._timelineState.zoom).toBe("recent");
            win.setTimelineZoom("year");
            expect(win._timelineState.zoom).toBe("year");
            win._timelineState.zoom = original;
        });
    });

    describe("setTimelineFilter", function() {
        it("should update filter state", function() {
            var original = win._timelineState.filter;
            win.setTimelineFilter("Security");
            expect(win._timelineState.filter).toBe("Security");
            win.setTimelineFilter("");
            expect(win._timelineState.filter).toBeNull();
            win._timelineState.filter = original;
        });
    });

    describe("getTimelineColors", function() {
        it("should return dark colors by default (no document)", function() {
            var colors = win.getTimelineColors();
            expect(colors).toBeDefined();
            expect(colors["AI & Agents"]).toBeDefined();
        });
    });

    describe("timeline rendering with zoom", function() {
        it("should render with 'recent' zoom", function() {
            win._timelineState.zoom = "recent";
            var html = win.renderTimeline();
            expect(html).toContain("timeline-container");
            // Recent zoom should still have some projects visible
            expect(html).toContain("timeline-row");
            win._timelineState.zoom = "all";
        });

        it("should render with 'year' zoom", function() {
            win._timelineState.zoom = "year";
            var html = win.renderTimeline();
            expect(html).toContain("timeline-container");
            win._timelineState.zoom = "all";
        });
    });

    describe("edge cases", function() {
        it("should handle project with only one release", function() {
            // VoronoiMap has only 1 release
            var entries = win.buildTimelineEntries(null);
            var voronoi = null;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].project.repo === "VoronoiMap") {
                    voronoi = entries[i];
                    break;
                }
            }
            expect(voronoi).toBeDefined();
            expect(voronoi.releases.length).toBe(1);
        });

        it("should handle project with many releases", function() {
            var entries = win.buildTimelineEntries(null);
            var ocaml = null;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].project.repo === "Ocaml-sample-code") {
                    ocaml = entries[i];
                    break;
                }
            }
            expect(ocaml).toBeDefined();
            expect(ocaml.releases.length).toBeGreaterThan(3);
        });

        it("should handle oldest project (Ocaml-sample-code, 2015)", function() {
            var entries = win.buildTimelineEntries(null);
            expect(entries[0].created).toBe("2015-01-23");
        });

        it("should handle newest project (WinSentinel, 2026-02-16)", function() {
            var entries = win.buildTimelineEntries(null);
            var hasWinSentinel = false;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].project.repo === "WinSentinel") {
                    hasWinSentinel = true;
                    expect(entries[i].created).toBe("2026-02-16");
                }
            }
            expect(hasWinSentinel).toBe(true);
        });
    });
});
