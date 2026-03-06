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
        '<!DOCTYPE html><html><body><div id="projects-container"></div></body></html>',
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

    test("escapes single quotes (via textContent)", () => {
        // textContent doesn't escape single quotes, but they're safe in innerHTML context
        const result = win.escapeHTML("it's");
        expect(result).toBe("it's");
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
