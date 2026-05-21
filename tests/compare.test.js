/**
 * tests/compare.test.js — Tests for Project Comparison + Modal utilities
 */

const { JSDOM } = require("jsdom");
const { loadAllModules } = require("./helpers/load-app");
const path = require("path");
const fs = require("fs");

/**
 * Bootstrap a JSDOM environment with comparison/modal DOM elements
 * and evaluate docs/app.js within it.
 *
 * @returns {JSDOM} Configured JSDOM instance with app.js globals.
 */
function loadApp() {
    const dom = new JSDOM(
        '<!DOCTYPE html><html><body>' +
        '<div id="projects-container"></div>' +
        '<input id="project-search">' +
        '<div id="category-filters"></div>' +
        '<div id="active-tag-indicator" class="active-tag-indicator hidden"></div>' +
        '<div id="no-results" class="hidden"></div>' +
        '<button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel">📊</button>' +
        '<div id="analytics-panel" role="region" aria-label="Portfolio analytics"></div>' +
        '<div id="spotlight-container"></div>' +
        '<button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel">🛠️</button>' +
        '<div id="techradar-panel" role="region" aria-label="Tech stack radar"></div>' +
        '</body></html>',
        { runScripts: "dangerously", resources: "usable" }
    );
    const code = loadAllModules();
    dom.window.eval(code);
    return dom;
}

let dom, win;

beforeAll(() => {
    dom = loadApp();
    win = dom.window;
    // jsdom doesn't implement scrollIntoView
    win.HTMLElement.prototype.scrollIntoView = function() {};
});

afterAll(() => { dom.window.close(); });

beforeEach(() => {
    // Reset compare state
    win.clearCompare();
    // Remove any compare panel
    const panel = win.document.getElementById("compare-panel");
    if (panel) panel.remove();
    // Reset modal state
    win._modalState.activeModal = null;
    win._modalState.triggerEl = null;
});

// ── toggleCompare ────────────────────────────────────────────────────

describe("toggleCompare", () => {
    test("adds a project to comparison set", () => {
        win.toggleCompare("repo-a");
        expect(win._compareSet.has("repo-a")).toBe(true);
    });

    test("removes a project on second toggle", () => {
        win.toggleCompare("repo-a");
        win.toggleCompare("repo-a");
        expect(win._compareSet.has("repo-a")).toBe(false);
    });

    test("caps at 5 projects", () => {
        for (let i = 0; i < 6; i++) win.toggleCompare("r" + i);
        expect(win._compareSet.size).toBe(5);
        expect(win._compareSet.has("r5")).toBe(false);
    });

    test("removing one allows adding another past cap", () => {
        for (let i = 0; i < 5; i++) win.toggleCompare("r" + i);
        win.toggleCompare("r0"); // remove
        win.toggleCompare("r5"); // add new
        expect(win._compareSet.has("r5")).toBe(true);
        expect(win._compareSet.size).toBe(5);
    });
});

// ── clearCompare ─────────────────────────────────────────────────────

describe("clearCompare", () => {
    test("clears all selections", () => {
        win.toggleCompare("a");
        win.toggleCompare("b");
        win.clearCompare();
        expect(win._compareSet.size).toBe(0);
    });

    test("is safe when already empty", () => {
        win.clearCompare();
        expect(win._compareSet.size).toBe(0);
    });
});

// ── syncCompareUI ────────────────────────────────────────────────────

describe("syncCompareUI", () => {
    test("does not throw when no DOM elements present", () => {
        expect(() => win.syncCompareUI()).not.toThrow();
    });

    test("shows compare bar when projects selected", () => {
        // Remove any pre-existing bar from initCompare
        const old = win.document.getElementById("compare-bar");
        if (old) old.remove();

        const bar = win.document.createElement("div");
        bar.id = "compare-bar";
        bar.innerHTML = '<span class="compare-count">0</span><button class="compare-open" disabled>Compare</button>';
        bar.style.display = "none";
        win.document.body.appendChild(bar);

        win.toggleCompare("x");
        expect(bar.style.display).toBe("flex");
        expect(bar.querySelector(".compare-count").textContent).toBe("1");
        expect(bar.querySelector(".compare-open").disabled).toBe(true); // need 2+

        win.toggleCompare("y");
        expect(bar.querySelector(".compare-count").textContent).toBe("2");
        expect(bar.querySelector(".compare-open").disabled).toBe(false);

        bar.remove();
    });

    test("hides compare bar when empty", () => {
        // Remove any pre-existing bar from initCompare
        const old = win.document.getElementById("compare-bar");
        if (old) old.remove();

        const bar = win.document.createElement("div");
        bar.id = "compare-bar";
        bar.innerHTML = '<span class="compare-count">0</span>';
        bar.style.display = "flex";
        win.document.body.appendChild(bar);

        win.syncCompareUI();
        expect(bar.style.display).toBe("none");

        bar.remove();
    });

    test("syncs checkbox checked state", () => {
        const cb = win.document.createElement("input");
        cb.type = "checkbox";
        cb.className = "compare-cb";
        cb.dataset.repo = "test-repo";
        win.document.body.appendChild(cb);

        win.toggleCompare("test-repo");
        expect(cb.checked).toBe(true);

        win.toggleCompare("test-repo");
        expect(cb.checked).toBe(false);

        cb.remove();
    });

    test("disables unchecked checkboxes at cap", () => {
        const cb = win.document.createElement("input");
        cb.type = "checkbox";
        cb.className = "compare-cb";
        cb.dataset.repo = "not-selected";
        win.document.body.appendChild(cb);

        for (let i = 0; i < 5; i++) win.toggleCompare("r" + i);
        expect(cb.disabled).toBe(true);

        win.toggleCompare("r0"); // remove one, now 4
        expect(cb.disabled).toBe(false);

        cb.remove();
    });
});

// ── _buildCompareRow ─────────────────────────────────────────────────

describe("_buildCompareRow", () => {
    test("builds a TR with label and cells", () => {
        const items = [{ name: "A" }, { name: "B" }];
        const html = win._buildCompareRow("Label", items, (p) => p.name);
        expect(html).toContain("<tr>");
        expect(html).toContain("Label");
        expect(html).toContain("<td>A</td>");
        expect(html).toContain("<td>B</td>");
    });

    test("applies cellClass when provided", () => {
        const html = win._buildCompareRow("X", [{ v: 1 }], () => "cell", "my-class");
        expect(html).toContain('class="my-class"');
    });

    test("escapes label HTML", () => {
        const html = win._buildCompareRow("<script>", [{ v: 1 }], () => "safe");
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });

    test("calls cellFn with item and index", () => {
        const indices = [];
        win._buildCompareRow("L", [{ a: 1 }, { b: 2 }], (item, idx) => {
            indices.push(idx);
            return "ok";
        });
        expect(indices).toEqual([0, 1]);
    });
});

// ── buildCompareBar ──────────────────────────────────────────────────

describe("buildCompareBar", () => {
    test("returns HTML string with compare-bar id", () => {
        const html = win.buildCompareBar();
        expect(html).toContain('id="compare-bar"');
        expect(html).toContain("compare-count");
        expect(html).toContain("compare-open");
        expect(html).toContain("compare-clear");
    });

    test("starts hidden", () => {
        const html = win.buildCompareBar();
        expect(html).toContain('display:none');
    });

    test("open button starts disabled", () => {
        const html = win.buildCompareBar();
        expect(html).toContain("disabled");
    });
});

// ── buildCompareCheckbox ─────────────────────────────────────────────

describe("buildCompareCheckbox", () => {
    test("returns checkbox HTML with data-repo", () => {
        const html = win.buildCompareCheckbox("my-repo");
        expect(html).toContain('data-repo="my-repo"');
        expect(html).toContain('type="checkbox"');
    });

    test("marks checked if already in compare set", () => {
        win.toggleCompare("active");
        const html = win.buildCompareCheckbox("active");
        expect(html).toContain("checked");
    });

    test("not checked if not in compare set", () => {
        const html = win.buildCompareCheckbox("inactive");
        expect(html).not.toContain("checked");
    });

    test("escapes repo name in attribute", () => {
        const html = win.buildCompareCheckbox('"><script>');
        expect(html).not.toContain("<script>");
    });
});

// ── renderComparePanel ───────────────────────────────────────────────

describe("renderComparePanel", () => {
    test("does nothing with fewer than 2 projects", () => {
        win.toggleCompare("one");
        win.renderComparePanel();
        const panel = win.document.getElementById("compare-panel");
        expect(panel).toBeNull();
    });

    test("creates panel with 2+ real projects", () => {
        // Use actual project repos
        const repos = win.PROJECTS.slice(0, 2).map(p => p.repo);
        repos.forEach(r => win.toggleCompare(r));
        win.renderComparePanel();

        const panel = win.document.getElementById("compare-panel");
        expect(panel).not.toBeNull();
        expect(panel.style.display).toBe("block");
    });

    test("panel contains comparison table", () => {
        const repos = win.PROJECTS.slice(0, 3).map(p => p.repo);
        repos.forEach(r => win.toggleCompare(r));
        win.renderComparePanel();

        const panel = win.document.getElementById("compare-panel");
        expect(panel.querySelector(".compare-table")).not.toBeNull();
    });

    test("panel shows category, description, tags, links rows", () => {
        const repos = win.PROJECTS.slice(0, 2).map(p => p.repo);
        repos.forEach(r => win.toggleCompare(r));
        win.renderComparePanel();

        const panel = win.document.getElementById("compare-panel");
        const labels = Array.from(panel.querySelectorAll(".compare-label")).map(el => el.textContent);
        expect(labels).toContain("Category");
        expect(labels).toContain("Description");
        expect(labels).toContain("Tags");
        expect(labels).toContain("Links");
    });

    test("panel has close button", () => {
        const repos = win.PROJECTS.slice(0, 2).map(p => p.repo);
        repos.forEach(r => win.toggleCompare(r));
        win.renderComparePanel();

        const panel = win.document.getElementById("compare-panel");
        expect(panel.querySelector('[data-action="close-compare"]')).not.toBeNull();
    });

    test("activates modal on the panel", () => {
        const repos = win.PROJECTS.slice(0, 2).map(p => p.repo);
        repos.forEach(r => win.toggleCompare(r));
        win.renderComparePanel();

        expect(win._modalState.activeModal).not.toBeNull();
        expect(win._modalState.activeModal.getAttribute("role")).toBe("dialog");
    });
});

// ── closeCompare ─────────────────────────────────────────────────────

describe("closeCompare", () => {
    test("hides panel and deactivates modal", () => {
        const repos = win.PROJECTS.slice(0, 2).map(p => p.repo);
        repos.forEach(r => win.toggleCompare(r));
        win.renderComparePanel();

        win.closeCompare();
        const panel = win.document.getElementById("compare-panel");
        expect(panel.style.display).toBe("none");
        expect(win._modalState.activeModal).toBeNull();
    });

    test("safe when no panel exists", () => {
        expect(() => win.closeCompare()).not.toThrow();
    });
});

// ── Modal Utilities ──────────────────────────────────────────────────

describe("_activateModal", () => {
    test("sets role=dialog and aria-modal=true", () => {
        const el = win.document.createElement("div");
        el.innerHTML = '<button>OK</button>';
        win.document.body.appendChild(el);

        win._activateModal(el);
        expect(el.getAttribute("role")).toBe("dialog");
        expect(el.getAttribute("aria-modal")).toBe("true");

        el.remove();
    });

    test("focuses first focusable element", () => {
        const el = win.document.createElement("div");
        const btn = win.document.createElement("button");
        btn.textContent = "Click";
        el.appendChild(btn);
        win.document.body.appendChild(el);

        win._activateModal(el);
        expect(win.document.activeElement).toBe(btn);

        el.remove();
    });

    test("sets tabindex=-1 and focuses container when no focusable children", () => {
        const el = win.document.createElement("div");
        el.textContent = "No buttons here";
        win.document.body.appendChild(el);

        win._activateModal(el);
        expect(el.getAttribute("tabindex")).toBe("-1");

        el.remove();
    });

    test("stores trigger element", () => {
        const trigger = win.document.createElement("button");
        trigger.textContent = "Trigger";
        win.document.body.appendChild(trigger);
        trigger.focus();

        const modal = win.document.createElement("div");
        modal.innerHTML = '<button>Inside</button>';
        win.document.body.appendChild(modal);

        win._activateModal(modal);
        expect(win._modalState.triggerEl).toBe(trigger);

        trigger.remove();
        modal.remove();
    });
});

describe("_deactivateModal", () => {
    test("clears modal state", () => {
        const el = win.document.createElement("div");
        el.innerHTML = '<button>OK</button>';
        win.document.body.appendChild(el);

        win._activateModal(el);
        win._deactivateModal();

        expect(win._modalState.activeModal).toBeNull();
        expect(win._modalState.triggerEl).toBeNull();

        el.remove();
    });

    test("restores focus to trigger element", () => {
        const trigger = win.document.createElement("button");
        trigger.textContent = "Trigger";
        win.document.body.appendChild(trigger);
        trigger.focus();

        const modal = win.document.createElement("div");
        modal.innerHTML = '<button>Inside</button>';
        win.document.body.appendChild(modal);

        win._activateModal(modal);
        win._deactivateModal();

        expect(win.document.activeElement).toBe(trigger);

        trigger.remove();
        modal.remove();
    });
});

describe("_handleModalTab", () => {
    test("does nothing when no active modal", () => {
        const event = new win.KeyboardEvent("keydown", { key: "Tab" });
        expect(() => win._handleModalTab(event)).not.toThrow();
    });

    test("does nothing for non-Tab key", () => {
        const modal = win.document.createElement("div");
        modal.innerHTML = '<button id="m1">A</button><button id="m2">B</button>';
        win.document.body.appendChild(modal);
        win._activateModal(modal);

        const event = new win.KeyboardEvent("keydown", { key: "Enter" });
        const prevented = { value: false };
        event.preventDefault = () => { prevented.value = true; };
        win._handleModalTab(event);
        expect(prevented.value).toBe(false);

        modal.remove();
        win._deactivateModal();
    });

    test("wraps focus forward from last to first", () => {
        const modal = win.document.createElement("div");
        const btn1 = win.document.createElement("button");
        btn1.textContent = "First";
        const btn2 = win.document.createElement("button");
        btn2.textContent = "Last";
        modal.appendChild(btn1);
        modal.appendChild(btn2);
        win.document.body.appendChild(modal);

        win._activateModal(modal);
        btn2.focus(); // focus last

        let prevented = false;
        const event = new win.KeyboardEvent("keydown", {
            key: "Tab", shiftKey: false, bubbles: true
        });
        Object.defineProperty(event, 'preventDefault', { value: () => { prevented = true; } });
        win._handleModalTab(event);

        expect(prevented).toBe(true);
        expect(win.document.activeElement).toBe(btn1);

        modal.remove();
        win._deactivateModal();
    });

    test("wraps focus backward from first to last", () => {
        const modal = win.document.createElement("div");
        const btn1 = win.document.createElement("button");
        btn1.textContent = "First";
        const btn2 = win.document.createElement("button");
        btn2.textContent = "Last";
        modal.appendChild(btn1);
        modal.appendChild(btn2);
        win.document.body.appendChild(modal);

        win._activateModal(modal);
        btn1.focus(); // focus first

        let prevented = false;
        const event = new win.KeyboardEvent("keydown", {
            key: "Tab", shiftKey: true, bubbles: true
        });
        Object.defineProperty(event, 'preventDefault', { value: () => { prevented = true; } });
        win._handleModalTab(event);

        expect(prevented).toBe(true);
        expect(win.document.activeElement).toBe(btn2);

        modal.remove();
        win._deactivateModal();
    });
});

// ── Shared tag highlighting ──────────────────────────────────────────

describe("compare panel shared tags", () => {
    test("highlights shared tags between projects", () => {
        // Pick 2 projects that share at least one tag
        const projects = win.PROJECTS;
        let pair = null;
        outer: for (let i = 0; i < projects.length; i++) {
            for (let j = i + 1; j < projects.length; j++) {
                const shared = projects[i].tags.filter(t => projects[j].tags.includes(t));
                if (shared.length > 0) {
                    pair = [projects[i], projects[j], shared];
                    break outer;
                }
            }
        }

        if (!pair) return; // skip if no shared tags exist

        win.toggleCompare(pair[0].repo);
        win.toggleCompare(pair[1].repo);
        win.renderComparePanel();

        const panel = win.document.getElementById("compare-panel");
        const sharedBadges = panel.querySelectorAll(".compare-tag-shared");
        expect(sharedBadges.length).toBeGreaterThan(0);
    });
});

// ── initCompare ──────────────────────────────────────────────────────

describe("initCompare", () => {
    test("injects floating compare bar", () => {
        // Remove any existing bar
        const existing = win.document.getElementById("compare-bar");
        if (existing) existing.remove();

        win.initCompare();
        expect(win.document.getElementById("compare-bar")).not.toBeNull();
    });
});

// ── compareToMarkdown ───────────────────────────────────────────────

describe("compareToMarkdown", () => {
    test("returns empty string with fewer than 2 projects", () => {
        expect(win.compareToMarkdown()).toBe("");
        win.toggleCompare(win.PROJECTS[0].repo);
        expect(win.compareToMarkdown()).toBe("");
    });

    test("produces a GitHub-flavored Markdown table for 2 projects", () => {
        const p0 = win.PROJECTS[0];
        const p1 = win.PROJECTS[1];
        win.toggleCompare(p0.repo);
        win.toggleCompare(p1.repo);

        const md = win.compareToMarkdown();
        const lines = md.split("\n");

        // Header + separator + 4 standard rows (Category, Description, Tags, Links)
        expect(lines[0]).toContain("Field");
        expect(lines[0]).toContain(p0.title);
        expect(lines[0]).toContain(p1.title);
        expect(lines[1]).toMatch(/^\|( --- \|)+$/);
        expect(md).toMatch(/\| Category \|/);
        expect(md).toMatch(/\| Description \|/);
        expect(md).toMatch(/\| Tags \|/);
        expect(md).toMatch(/\| Links \|/);
    });

    test("bolds shared tags and lists them in a footer", () => {
        // Find a real pair that shares at least one tag.
        const projects = win.PROJECTS;
        let pair = null;
        outer: for (let i = 0; i < projects.length; i++) {
            for (let j = i + 1; j < projects.length; j++) {
                const shared = projects[i].tags.filter(t => projects[j].tags.includes(t));
                if (shared.length > 0) {
                    pair = [projects[i], projects[j], shared[0]];
                    break outer;
                }
            }
        }
        if (!pair) return; // no shared-tag pair in the dataset; bail.

        win.toggleCompare(pair[0].repo);
        win.toggleCompare(pair[1].repo);

        const md = win.compareToMarkdown();
        // Shared tag is bolded in the Tags row.
        expect(md).toContain("**" + pair[2] + "**");
        // And appears in the Shared tags footer with the 2/2 ratio.
        expect(md).toMatch(/\*\*Shared tags:\*\*/);
        expect(md).toContain(pair[2] + " (2/2)");
    });

    test("escapes pipe characters and flattens newlines inside fields", () => {
        // Inject a synthetic project with hostile field values.
        const ugly1 = {
            repo: "ugly-1", title: "U|gly", icon: "x",
            category: "a|b", desc: "line1\nline2|piped",
            tags: ["t|ag"], links: []
        };
        const ugly2 = {
            repo: "ugly-2", title: "Plain", icon: "y",
            category: "c", desc: "d", tags: ["t|ag"], links: []
        };
        win.PROJECTS.push(ugly1, ugly2);
        try {
            win.toggleCompare("ugly-1");
            win.toggleCompare("ugly-2");
            const md = win.compareToMarkdown();
            // Pipes inside cells must be backslash-escaped, not raw.
            expect(md).toContain("U\\|gly");
            expect(md).toContain("a\\|b");
            expect(md).toContain("line1 line2\\|piped");
            expect(md).toContain("t\\|ag");
        } finally {
            win.PROJECTS.pop();
            win.PROJECTS.pop();
        }
    });
});

describe("copyCompareMarkdown", () => {
    test("returns empty string when nothing to compare", () => {
        expect(win.copyCompareMarkdown()).toBe("");
    });

    test("falls back to returning the markdown when clipboard API is absent", () => {
        const originalClipboard = win.navigator.clipboard;
        // jsdom does not implement navigator.clipboard - assert that
        // the function gracefully returns the markdown string instead
        // of throwing.
        if (originalClipboard) {
            // Force the fallback path.
            Object.defineProperty(win.navigator, "clipboard", {
                value: undefined, configurable: true
            });
        }
        try {
            win.toggleCompare(win.PROJECTS[0].repo);
            win.toggleCompare(win.PROJECTS[1].repo);
            const result = win.copyCompareMarkdown();
            expect(typeof result).toBe("string");
            expect(result).toContain("| Category |");
        } finally {
            if (originalClipboard) {
                Object.defineProperty(win.navigator, "clipboard", {
                    value: originalClipboard, configurable: true
                });
            }
        }
    });

    test("uses navigator.clipboard.writeText when available", async () => {
        const calls = [];
        const fakeClipboard = {
            writeText: (s) => { calls.push(s); return Promise.resolve(); }
        };
        const originalClipboard = Object.getOwnPropertyDescriptor(win.navigator, "clipboard");
        Object.defineProperty(win.navigator, "clipboard", {
            value: fakeClipboard, configurable: true
        });
        try {
            win.toggleCompare(win.PROJECTS[0].repo);
            win.toggleCompare(win.PROJECTS[1].repo);
            const result = win.copyCompareMarkdown();
            expect(typeof result.then).toBe("function");
            const md = await result;
            expect(calls.length).toBe(1);
            expect(calls[0]).toBe(md);
            expect(md).toContain("| Category |");
        } finally {
            if (originalClipboard) {
                Object.defineProperty(win.navigator, "clipboard", originalClipboard);
            } else {
                delete win.navigator.clipboard;
            }
        }
    });
});

describe("compare panel Copy MD button", () => {
    test("renderPanel includes a copy-compare-md action button", () => {
        win.toggleCompare(win.PROJECTS[0].repo);
        win.toggleCompare(win.PROJECTS[1].repo);
        win.renderComparePanel();

        const panel = win.document.getElementById("compare-panel");
        const btn = panel.querySelector('[data-action="copy-compare-md"]');
        expect(btn).not.toBeNull();
    });
});
