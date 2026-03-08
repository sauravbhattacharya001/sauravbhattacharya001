/**
 * tests/app.test.js — Unit tests for docs/app.js
 *
 * Validates escapeHTML, buildCard, renderProjects, and PROJECTS data integrity.
 * Uses JSDOM for DOM simulation — no browser required.
 */

const { JSDOM } = require("jsdom");
const path = require("path");
const fs = require("fs");

// Load app.js in a JSDOM environment
function loadApp() {
    const dom = new JSDOM(
        '<!DOCTYPE html><html><body><div id="projects-container"></div><input id="project-search"><div id="category-filters"></div><div id="active-tag-indicator" class="active-tag-indicator hidden"></div><div id="no-results" class="hidden"></div></body></html>',
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
