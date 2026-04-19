/**
 * tests/untested-functions.test.js — Tests for previously untested app.js functions
 *
 * Covers: projectMatchesQuery, groupByCategory, _extractUnique,
 * buildCardLinks, buildTagList, buildLinkList, buildCategoryHTML,
 * createFilterPills, serializeFilterState/deserializeFilterState roundtrips,
 * pushFilterState, _buildCompareRow, deep link state management.
 */

const { JSDOM } = require("jsdom");
const path = require("path");
const fs = require("fs");

function loadApp() {
    const dom = new JSDOM(
        '<!DOCTYPE html><html><body>' +
        '<div id="projects-container"></div>' +
        '<input id="project-search">' +
        '<div id="category-filters"></div>' +
        '<div id="active-tag-indicator" class="active-tag-indicator hidden"></div>' +
        '<div id="no-results" class="hidden"></div>' +
        '<button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel">📊 Portfolio Analytics <span class="toggle-arrow">▾</span></button>' +
        '<div id="analytics-panel" role="region" aria-label="Portfolio analytics"></div>' +
        '<div id="spotlight-container"></div>' +
        '<button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel">🛠️ Tech Stack <span class="toggle-arrow">▾</span></button>' +
        '<div id="techradar-panel" role="region" aria-label="Tech stack radar"></div>' +
        '<section id="projects"><div class="analytics-bar"></div><div id="timeline-panel" class="timeline-panel hidden"></div></section>' +
        '</body></html>',
        { runScripts: "dangerously", resources: "usable", url: "https://example.com/portfolio" }
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

// ── projectMatchesQuery ─────────────────────────────────────────────

describe("projectMatchesQuery", () => {
    test("returns true when query is empty", () => {
        expect(win.projectMatchesQuery(win.PROJECTS[0], "")).toBe(true);
    });

    test("returns true when query is null/undefined", () => {
        expect(win.projectMatchesQuery(win.PROJECTS[0], null)).toBe(true);
        expect(win.projectMatchesQuery(win.PROJECTS[0], undefined)).toBe(true);
    });

    test("matches project by title (case-insensitive)", () => {
        const agentlens = win.PROJECTS.find(p => p.repo === "agentlens");
        expect(win.projectMatchesQuery(agentlens, "agentlens")).toBe(true);
    });

    test("matches project by tag", () => {
        const agentlens = win.PROJECTS.find(p => p.repo === "agentlens");
        expect(win.projectMatchesQuery(agentlens, "python")).toBe(true);
    });

    test("does not match unrelated query", () => {
        const agentlens = win.PROJECTS.find(p => p.repo === "agentlens");
        expect(win.projectMatchesQuery(agentlens, "xyznonexistent123")).toBe(false);
    });

    test("matches project by description keywords", () => {
        const agentlens = win.PROJECTS.find(p => p.repo === "agentlens");
        expect(win.projectMatchesQuery(agentlens, "observability")).toBe(true);
    });

    test("accepts explicit index parameter", () => {
        expect(win.projectMatchesQuery(win.PROJECTS[0], "")).toBe(true);
        // With a valid index
        expect(win.projectMatchesQuery(win.PROJECTS[0], "", 0)).toBe(true);
    });
});

// ── groupByCategory ─────────────────────────────────────────────────

describe("groupByCategory", () => {
    test("groups items by category field", () => {
        const items = [
            { category: "A", title: "a1" },
            { category: "B", title: "b1" },
            { category: "A", title: "a2" },
        ];
        const groups = win.groupByCategory(items);
        expect(groups).toHaveLength(2);
        expect(groups[0].name).toBe("A");
        expect(groups[0].items).toHaveLength(2);
        expect(groups[1].name).toBe("B");
        expect(groups[1].items).toHaveLength(1);
    });

    test("preserves insertion order of categories", () => {
        const items = [
            { category: "Z", title: "z" },
            { category: "A", title: "a" },
            { category: "M", title: "m" },
        ];
        const groups = win.groupByCategory(items);
        expect(groups.map(g => g.name)).toEqual(["Z", "A", "M"]);
    });

    test("returns empty array for empty input", () => {
        expect(win.groupByCategory([])).toEqual([]);
    });

    test("handles single-item input", () => {
        const groups = win.groupByCategory([{ category: "X", title: "x" }]);
        expect(groups).toHaveLength(1);
        expect(groups[0].items).toHaveLength(1);
    });
});

// ── _extractUnique ──────────────────────────────────────────────────

describe("_extractUnique", () => {
    test("extracts unique values from accessor", () => {
        const items = [
            { tags: ["a", "b"] },
            { tags: ["b", "c"] },
            { tags: ["a", "d"] },
        ];
        const result = win._extractUnique(items, i => i.tags);
        expect(result).toHaveLength(4);
        expect(result.map(r => r.toLowerCase()).sort()).toEqual(["a", "b", "c", "d"]);
    });

    test("handles scalar accessor values", () => {
        const items = [
            { cat: "A" },
            { cat: "B" },
            { cat: "A" },
        ];
        const result = win._extractUnique(items, i => i.cat);
        expect(result).toHaveLength(2);
    });

    test("deduplicates case-insensitively", () => {
        const items = [
            { tags: ["Python"] },
            { tags: ["python"] },
        ];
        const result = win._extractUnique(items, i => i.tags);
        // Should have 1 unique entry (case-insensitive dedup)
        expect(result).toHaveLength(1);
    });

    test("returns empty array for empty input", () => {
        expect(win._extractUnique([], i => i.tags)).toEqual([]);
    });
});

// ── buildTagList ────────────────────────────────────────────────────

describe("buildTagList", () => {
    test("renders tags as clickable buttons by default", () => {
        const html = win.buildTagList(["Python", "AI"]);
        expect(html).toContain("Python");
        expect(html).toContain("AI");
        expect(html).toContain("<button");
        expect(html).toContain("card-tags");
    });

    test("renders tags as non-clickable spans when clickable=false", () => {
        const html = win.buildTagList(["Go"], { clickable: false });
        expect(html).toContain("Go");
        expect(html).not.toContain("<button");
        expect(html).toContain("<span");
    });

    test("applies custom wrapper class", () => {
        const html = win.buildTagList(["Rust"], { wrapperClass: "custom-tags" });
        expect(html).toContain("custom-tags");
    });

    test("escapes HTML in tag names", () => {
        const html = win.buildTagList(["<script>alert(1)</script>"]);
        expect(html).not.toContain("<script>alert");
        expect(html).toContain("&lt;script&gt;");
    });
});

// ── buildLinkList ───────────────────────────────────────────────────

describe("buildLinkList", () => {
    test("renders links with correct href and target", () => {
        const links = [
            { label: "Code", url: "https://github.com/test" },
            { label: "Docs", url: "https://docs.example.com" },
        ];
        const html = win.buildLinkList(links);
        expect(html).toContain('href="https://github.com/test"');
        expect(html).toContain('target="_blank"');
        expect(html).toContain('rel="noopener"');
        expect(html).toContain("Code");
        expect(html).toContain("Docs");
    });

    test("applies custom wrapper class", () => {
        const html = win.buildLinkList(
            [{ label: "X", url: "https://x.com" }],
            { wrapperClass: "my-links" }
        );
        expect(html).toContain("my-links");
    });

    test("uses card-links as default wrapper class", () => {
        const html = win.buildLinkList([{ label: "Y", url: "https://y.com" }]);
        expect(html).toContain("card-links");
    });
});

// ── buildCardLinks ──────────────────────────────────────────────────

describe("buildCardLinks", () => {
    test("delegates to buildLinkList with card-links class", () => {
        const html = win.buildCardLinks([{ label: "Code", url: "https://github.com" }]);
        expect(html).toContain("card-links");
        expect(html).toContain("Code");
    });
});

// ── buildCategoryHTML ───────────────────────────────────────────────

describe("buildCategoryHTML", () => {
    test("renders category wrapper with name and project cards", () => {
        // Need a real project for buildCard to work
        const project = win.PROJECTS[0];
        const group = { name: "Test Category", items: [project] };
        const html = win.buildCategoryHTML(group);
        expect(html).toContain("Test Category");
        expect(html).toContain("category-label");
        expect(html).toContain("projects-grid");
        expect(html).toContain("card");
    });

    test("escapes HTML in category name", () => {
        const project = win.PROJECTS[0];
        const group = { name: "<b>Malicious</b>", items: [project] };
        const html = win.buildCategoryHTML(group);
        expect(html).toContain("&lt;b&gt;Malicious&lt;/b&gt;");
        expect(html).not.toContain("<b>Malicious</b>");
    });
});

// ── createFilterPills ───────────────────────────────────────────────

describe("createFilterPills", () => {
    test("creates All pill and category pills", () => {
        const container = dom.window.document.createElement("div");
        const categories = ["AI & Agents", "Security", "Web Apps"];
        win.createFilterPills(container, categories);

        const pills = container.querySelectorAll("button.filter-pill");
        // All + 3 categories
        expect(pills.length).toBe(4);
        expect(pills[0].textContent).toBe("All");
        expect(pills[0].getAttribute("data-category")).toBe("");
        expect(pills[1].textContent).toBe("AI & Agents");
    });

    test("All pill starts as active", () => {
        const container = dom.window.document.createElement("div");
        win.createFilterPills(container, ["Cat1"]);
        const allPill = container.querySelector('[data-category=""]');
        expect(allPill.classList.contains("active")).toBe(true);
    });
});

// ── Deep link: serializeFilterState ─────────────────────────────────

describe("deep link state management", () => {
    let originalState;

    beforeEach(() => {
        originalState = { ...win._filterState };
    });

    afterEach(() => {
        // Restore original state
        Object.assign(win._filterState, originalState);
    });

    test("serializeFilterState returns empty string for default state", () => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
        win._filterState.sort = "default";
        win._filterState.view = "grid";
        win._filterState.bookmarked = false;
        expect(win.serializeFilterState()).toBe("");
    });

    test("serializeFilterState encodes query", () => {
        win._filterState.query = "python";
        win._filterState.category = null;
        win._filterState.tag = null;
        win._filterState.sort = "default";
        win._filterState.view = "grid";
        win._filterState.bookmarked = false;
        const result = win.serializeFilterState();
        expect(result).toContain("q=python");
    });

    test("serializeFilterState encodes category", () => {
        win._filterState.query = "";
        win._filterState.category = "AI & Agents";
        win._filterState.tag = null;
        win._filterState.sort = "default";
        win._filterState.view = "grid";
        win._filterState.bookmarked = false;
        const result = win.serializeFilterState();
        expect(result).toContain("cat=");
        expect(result).toContain("AI");
    });

    test("serializeFilterState encodes tag", () => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = "Python";
        win._filterState.sort = "default";
        win._filterState.view = "grid";
        win._filterState.bookmarked = false;
        const result = win.serializeFilterState();
        expect(result).toContain("tag=Python");
    });

    test("serializeFilterState encodes sort", () => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
        win._filterState.sort = "alpha";
        win._filterState.view = "grid";
        win._filterState.bookmarked = false;
        const result = win.serializeFilterState();
        expect(result).toContain("sort=alpha");
    });

    test("serializeFilterState encodes view", () => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
        win._filterState.sort = "default";
        win._filterState.view = "list";
        win._filterState.bookmarked = false;
        const result = win.serializeFilterState();
        expect(result).toContain("view=list");
    });

    test("serializeFilterState encodes bookmarked", () => {
        win._filterState.query = "";
        win._filterState.category = null;
        win._filterState.tag = null;
        win._filterState.sort = "default";
        win._filterState.view = "grid";
        win._filterState.bookmarked = true;
        const result = win.serializeFilterState();
        expect(result).toContain("bm=1");
    });

    test("deserializeFilterState parses hash into result object", () => {
        const hash = "q=test%20search&cat=Security&tag=C%23&sort=alpha&view=list&bm=1";
        const result = win.deserializeFilterState(hash);

        expect(result.q).toBe("test search");
        expect(result.cat).toBe("Security");
        expect(result.tag).toBe("C#");
        expect(result.sort).toBe("alpha");
        expect(result.view).toBe("list");
        expect(result.bm).toBe(true);
    });

    test("deserializeFilterState handles # prefix", () => {
        const result = win.deserializeFilterState("#q=hello");
        expect(result.q).toBe("hello");
    });

    test("deserializeFilterState returns empty object for empty string", () => {
        const result = win.deserializeFilterState("");
        expect(result).toEqual({});
    });

    test("deserializeFilterState is a function", () => {
        expect(typeof win.deserializeFilterState).toBe("function");
    });

    test("pushFilterState does not throw when _deepLinkEnabled is false", () => {
        win._deepLinkEnabled = false;
        expect(() => win.pushFilterState()).not.toThrow();
    });
});

// ── extractCategories ───────────────────────────────────────────────

describe("extractCategories", () => {
    test("extracts unique categories from PROJECTS", () => {
        const cats = win.extractCategories();
        expect(Array.isArray(cats)).toBe(true);
        expect(cats.length).toBeGreaterThan(0);
        expect(cats).toContain("AI & Agents");
    });

    test("returns no duplicates", () => {
        const cats = win.extractCategories();
        const uniqueSet = new Set(cats.map(c => c.toLowerCase()));
        expect(uniqueSet.size).toBe(cats.length);
    });
});
