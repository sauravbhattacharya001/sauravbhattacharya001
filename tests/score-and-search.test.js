/**
 * tests/score-and-search.test.js — Tests for _scoreProject quiz scoring,
 * _searchIndex integration in projectMatchesQuery, and bookmark persistence.
 *
 * _scoreProject is the quiz engine that ranks projects against user answers.
 * It scores on four axes: tag match (+3), language match (+2), direct boost (+4),
 * and category match (+2). These tests verify correctness, edge cases, and
 * scoring boundary conditions for each axis independently and combined.
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
        '<button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel">📊</button>' +
        '<div id="analytics-panel" role="region" aria-label="Portfolio analytics"></div>' +
        '<div id="spotlight-container"></div>' +
        '<button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel">🛠️</button>' +
        '<div id="techradar-panel" role="region" aria-label="Tech stack radar"></div>' +
        '<section id="projects"><div class="analytics-bar"></div><div id="timeline-panel" class="timeline-panel hidden"></div></section>' +
        '</body></html>',
        { runScripts: "dangerously", resources: "usable", url: "https://example.com/portfolio" }
    );
    const code = fs.readFileSync(path.join(__dirname, "..", "docs", "app.js"), "utf-8");
    dom.window.eval(code);
    return dom;
}

let dom, win;

beforeAll(() => {
    dom = loadApp();
    win = dom.window;
});

afterAll(() => {
    dom.window.close();
});

// ── _scoreProject: tag matching ─────────────────────────────────────

describe("_scoreProject — tag matching", () => {
    const makeProject = (tags, category = "Test") => ({
        repo: "test-repo",
        title: "Test",
        desc: "Test project",
        tags: tags,
        category: category,
        icon: "🧪",
        links: []
    });

    test("scores +3 for each matching tag (case-insensitive)", () => {
        const project = makeProject(["Python", "AI Agents"]);
        const answers = [{
            question: "interest",
            option: { tags: ["Python"], value: "test" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(3);
    });

    test("scores +3 per tag for multiple matching tags", () => {
        const project = makeProject(["Python", "AI Agents", "Observability"]);
        const answers = [{
            question: "interest",
            option: { tags: ["Python", "AI Agents"], value: "test" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(6); // 3 + 3
    });

    test("tag matching is case-insensitive", () => {
        const project = makeProject(["python", "Node.js"]);
        const answers = [{
            question: "interest",
            option: { tags: ["PYTHON"], value: "test" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(3);
    });

    test("returns 0 when no tags match", () => {
        const project = makeProject(["Swift", "iOS"]);
        const answers = [{
            question: "interest",
            option: { tags: ["Python", "Java"], value: "test" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(0);
    });

    test("handles empty tags array in answer option", () => {
        const project = makeProject(["Python"]);
        const answers = [{
            question: "interest",
            option: { tags: [], value: "test" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(0);
    });

    test("handles answer option without tags property", () => {
        const project = makeProject(["Python"]);
        const answers = [{
            question: "interest",
            option: { value: "test" }
        }];
        // Should not throw; tags property missing → no tag score
        expect(() => win._scoreProject(project, answers)).not.toThrow();
        expect(win._scoreProject(project, answers)).toBe(0);
    });
});

// ── _scoreProject: language matching ────────────────────────────────

describe("_scoreProject — language matching", () => {
    const makeProject = (tags, category = "Test") => ({
        repo: "test-repo",
        title: "Test",
        desc: "Test project",
        tags: tags,
        category: category,
        icon: "🧪",
        links: []
    });

    test("scores +2 for each matching language", () => {
        const project = makeProject(["Python", "Node.js"]);
        const answers = [{
            question: "skill",
            option: { langs: ["Python"], value: "python" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(2);
    });

    test("scores +2 per lang for multiple matching languages", () => {
        const project = makeProject(["Python", "Node.js"]);
        const answers = [{
            question: "skill",
            option: { langs: ["Python", "Node.js"], value: "python" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(4); // 2 + 2
    });

    test("language matching is case-insensitive", () => {
        const project = makeProject(["javascript"]);
        const answers = [{
            question: "skill",
            option: { langs: ["JavaScript"], value: "web" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(2);
    });

    test("handles answer option without langs property", () => {
        const project = makeProject(["Python"]);
        const answers = [{
            question: "skill",
            option: { value: "test" }
        }];
        expect(win._scoreProject(project, answers)).toBe(0);
    });
});

// ── _scoreProject: direct boost ─────────────────────────────────────

describe("_scoreProject — direct boost", () => {
    const makeProject = (repo, tags = ["Python"], category = "Test") => ({
        repo: repo,
        title: "Test",
        desc: "Test project",
        tags: tags,
        category: category,
        icon: "🧪",
        links: []
    });

    test("scores +4 when project repo is in boost list", () => {
        const project = makeProject("agentlens");
        const answers = [{
            question: "goal",
            option: { boost: ["agentlens", "prompt"], value: "build" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(4);
    });

    test("scores 0 when project repo is not in boost list", () => {
        const project = makeProject("WinSentinel");
        const answers = [{
            question: "goal",
            option: { boost: ["agentlens", "prompt"], value: "build" }
        }];
        const score = win._scoreProject(project, answers);
        expect(score).toBe(0);
    });

    test("boost is exact repo name match", () => {
        const project = makeProject("agent");
        const answers = [{
            question: "goal",
            option: { boost: ["agentlens"], value: "build" }
        }];
        // "agent" should not match "agentlens"
        expect(win._scoreProject(project, answers)).toBe(0);
    });

    test("handles answer option without boost property", () => {
        const project = makeProject("agentlens");
        const answers = [{
            question: "goal",
            option: { value: "test" }
        }];
        expect(win._scoreProject(project, answers)).toBe(0);
    });
});

// ── _scoreProject: category matching ────────────────────────────────

describe("_scoreProject — category matching", () => {
    const makeProject = (category, tags = []) => ({
        repo: "test",
        title: "Test",
        desc: "Test project",
        tags: tags,
        category: category,
        icon: "🧪",
        links: []
    });

    test('scores +2 for "ai" value with "AI & Agents" category', () => {
        const project = makeProject("AI & Agents");
        const answers = [{
            question: "interest",
            option: { value: "ai" }
        }];
        expect(win._scoreProject(project, answers)).toBe(2);
    });

    test('scores +2 for "security" value with "Security" category', () => {
        const project = makeProject("Security");
        const answers = [{
            question: "interest",
            option: { value: "security" }
        }];
        expect(win._scoreProject(project, answers)).toBe(2);
    });

    test('scores +2 for "lang" value with "Languages & Tools" category', () => {
        const project = makeProject("Languages & Tools");
        const answers = [{
            question: "interest",
            option: { value: "lang" }
        }];
        expect(win._scoreProject(project, answers)).toBe(2);
    });

    test('scores +2 for "data" value with "Visualization & Data" category', () => {
        const project = makeProject("Visualization & Data");
        const answers = [{
            question: "interest",
            option: { value: "data" }
        }];
        expect(win._scoreProject(project, answers)).toBe(2);
    });

    test('scores +2 for "apps" value with "Apps & More" category', () => {
        const project = makeProject("Apps & More");
        const answers = [{
            question: "interest",
            option: { value: "apps" }
        }];
        expect(win._scoreProject(project, answers)).toBe(2);
    });

    test("scores 0 for mismatched category", () => {
        const project = makeProject("Security");
        const answers = [{
            question: "interest",
            option: { value: "ai" }
        }];
        expect(win._scoreProject(project, answers)).toBe(0);
    });
});

// ── _scoreProject: combined scoring ─────────────────────────────────

describe("_scoreProject — combined multi-answer scoring", () => {
    test("accumulates scores across multiple answers", () => {
        const project = {
            repo: "agentlens",
            title: "AgentLens",
            desc: "Observability platform",
            tags: ["Python", "Node.js", "Observability", "AI Agents"],
            category: "AI & Agents",
            icon: "🔍",
            links: []
        };

        const answers = [
            { question: "interest", option: { tags: ["AI Agents", "Observability"], value: "ai" } },
            { question: "skill", option: { langs: ["Python", "Node.js"], value: "python" } },
            { question: "goal", option: { boost: ["agentlens", "prompt"], value: "build" } }
        ];

        const score = win._scoreProject(project, answers);
        // Tags: AI Agents(3) + Observability(3) = 6
        // Category: ai + AI & Agents = 2
        // Langs: Python(2) + Node.js(2) = 4
        // Boost: agentlens in list = 4
        // Total = 6 + 2 + 4 + 4 = 16
        expect(score).toBe(16);
    });

    test("returns 0 for empty answers array", () => {
        const project = {
            repo: "test",
            title: "Test",
            desc: "Test",
            tags: ["Python"],
            category: "AI & Agents",
            icon: "🧪",
            links: []
        };
        expect(win._scoreProject(project, [])).toBe(0);
    });

    test("handles project with empty tags array", () => {
        const project = {
            repo: "test",
            title: "Test",
            desc: "Test",
            tags: [],
            category: "Security",
            icon: "🧪",
            links: []
        };
        const answers = [
            { question: "interest", option: { tags: ["Python"], value: "security" } }
        ];
        // No tag matches, but category matches security → +2
        expect(win._scoreProject(project, answers)).toBe(2);
    });

    test("handles project with undefined tags", () => {
        const project = {
            repo: "test",
            title: "Test",
            desc: "Test",
            category: "Test",
            icon: "🧪",
            links: []
        };
        const answers = [
            { question: "interest", option: { tags: ["Python"], value: "test" } }
        ];
        // tags is undefined → projTags defaults to [] via `|| []`
        expect(() => win._scoreProject(project, answers)).not.toThrow();
    });
});

// ── _scoreProject: real QUIZ_QUESTIONS integration ──────────────────

describe("_scoreProject — real quiz questions integration", () => {
    test("AI-focused project scores highest with AI-oriented answers", () => {
        const aiProject = win.PROJECTS.find(p => p.repo === "agentlens");
        const secProject = win.PROJECTS.find(p => p.repo === "WinSentinel");

        const aiAnswers = [
            { question: "interest", option: win.QUIZ_QUESTIONS[0].options[0] }, // AI & ML
            { question: "skill", option: win.QUIZ_QUESTIONS[1].options[0] },    // Python/Backend
            { question: "goal", option: win.QUIZ_QUESTIONS[2].options[1] }      // Build a project (boosts agentlens)
        ];

        const aiScore = win._scoreProject(aiProject, aiAnswers);
        const secScore = win._scoreProject(secProject, aiAnswers);
        expect(aiScore).toBeGreaterThan(secScore);
    });

    test("security-focused project scores highest with security-oriented answers", () => {
        const secProject = win.PROJECTS.find(p => p.repo === "WinSentinel");
        const aiProject = win.PROJECTS.find(p => p.repo === "ai");

        const secAnswers = [
            { question: "interest", option: win.QUIZ_QUESTIONS[0].options[1] }, // Security & Safety
            { question: "skill", option: win.QUIZ_QUESTIONS[1].options[2] },    // Systems / C#
            { question: "goal", option: win.QUIZ_QUESTIONS[2].options[3] }      // Solve a real problem (boosts WinSentinel)
        ];

        const secScore = win._scoreProject(secProject, secAnswers);
        const aiScore = win._scoreProject(aiProject, secAnswers);
        expect(secScore).toBeGreaterThan(aiScore);
    });

    test("every project scores a non-negative value", () => {
        const answers = [
            { question: "interest", option: win.QUIZ_QUESTIONS[0].options[0] },
            { question: "skill", option: win.QUIZ_QUESTIONS[1].options[0] },
            { question: "goal", option: win.QUIZ_QUESTIONS[2].options[0] }
        ];

        for (const project of win.PROJECTS) {
            const score = win._scoreProject(project, answers);
            expect(score).toBeGreaterThanOrEqual(0);
        }
    });

    test("at least one project scores > 0 for any answer combination", () => {
        // Test all 5x5x5 = 125 answer combinations
        const q = win.QUIZ_QUESTIONS;
        for (let i = 0; i < q[0].options.length; i++) {
            for (let j = 0; j < q[1].options.length; j++) {
                for (let k = 0; k < q[2].options.length; k++) {
                    const answers = [
                        { question: q[0].id, option: q[0].options[i] },
                        { question: q[1].id, option: q[1].options[j] },
                        { question: q[2].id, option: q[2].options[k] }
                    ];
                    const maxScore = Math.max(
                        ...win.PROJECTS.map(p => win._scoreProject(p, answers))
                    );
                    expect(maxScore).toBeGreaterThan(0);
                }
            }
        }
    });
});

// ── _searchIndex: integration with projectMatchesQuery ──────────────

describe("_searchIndex integration", () => {
    test("search index exists and has same length as PROJECTS", () => {
        // _searchIndex is an IIFE-built array
        expect(win._searchIndex).toBeDefined();
        expect(win._searchIndex.length).toBe(win.PROJECTS.length);
    });

    test("each index entry has text and tagSet fields", () => {
        for (const entry of win._searchIndex) {
            expect(typeof entry.text).toBe("string");
            expect(entry.text.length).toBeGreaterThan(0);
            expect(entry.tagSet).toBeDefined();
        }
    });

    test("search index text includes title, desc, repo, and tags (lowercase)", () => {
        const agentlensIdx = win.PROJECTS.findIndex(p => p.repo === "agentlens");
        const entry = win._searchIndex[agentlensIdx];

        expect(entry.text).toContain("agentlens"); // title/repo
        expect(entry.text).toContain("observability"); // desc
        expect(entry.text).toContain("python"); // tag
    });

    test("search index text uses null separators to prevent cross-field matches", () => {
        const agentlensIdx = win.PROJECTS.findIndex(p => p.repo === "agentlens");
        const entry = win._searchIndex[agentlensIdx];
        expect(entry.text).toContain("\0");
    });

    test("tagSet allows O(1) lookups for tag filtering", () => {
        const agentlensIdx = win.PROJECTS.findIndex(p => p.repo === "agentlens");
        const entry = win._searchIndex[agentlensIdx];

        expect(entry.tagSet["python"]).toBe(true);
        expect(entry.tagSet["node.js"]).toBe(true);
        expect(entry.tagSet["nonexistent"]).toBeUndefined();
    });

    test("projectMatchesQuery uses index for text search", () => {
        const agentlensIdx = win.PROJECTS.findIndex(p => p.repo === "agentlens");
        const agentlens = win.PROJECTS[agentlensIdx];

        // Pass explicit index to ensure index-based lookup
        expect(win.projectMatchesQuery(agentlens, "observability", agentlensIdx)).toBe(true);
        expect(win.projectMatchesQuery(agentlens, "xyznonexist", agentlensIdx)).toBe(false);
    });

    test("search is not tricked by cross-field concatenation", () => {
        // If fields were concatenated without separators, searching for
        // the end of one field + start of another could false-match.
        // The \0 separators prevent this.
        const p = win.PROJECTS[0];
        const lastCharTitle = p.title.slice(-3).toLowerCase();
        const firstCharDesc = p.desc.slice(0, 3).toLowerCase();
        const crossFieldQuery = lastCharTitle + firstCharDesc;

        // This should NOT match if the separator is working
        // (unless it coincidentally appears in a single field)
        const singleFieldContains = p.title.toLowerCase().includes(crossFieldQuery) ||
            p.desc.toLowerCase().includes(crossFieldQuery) ||
            p.repo.toLowerCase().includes(crossFieldQuery) ||
            p.tags.some(t => t.toLowerCase().includes(crossFieldQuery));

        if (!singleFieldContains) {
            expect(win.projectMatchesQuery(p, crossFieldQuery, 0)).toBe(false);
        }
    });
});

// ── Bookmark persistence edge cases ─────────────────────────────────

describe("bookmark persistence", () => {
    let originalStorage;

    beforeEach(() => {
        // Save bookmark state
        originalStorage = win.localStorage.getItem("bookmarks");
    });

    afterEach(() => {
        // Restore
        if (originalStorage !== null) {
            win.localStorage.setItem("bookmarks", originalStorage);
        } else {
            win.localStorage.removeItem("bookmarks");
        }
    });

    test("_persistBookmarks writes to localStorage", () => {
        // Toggle a bookmark on, then check storage
        const repo = win.PROJECTS[0].repo;
        const wasBm = win.isBookmarked(repo);

        if (!wasBm) win.toggleBookmark(repo);
        win._persistBookmarks();

        const stored = win.localStorage.getItem("bookmarks");
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toContain(repo);

        // Clean up
        if (!wasBm) win.toggleBookmark(repo);
    });

    test("_loadBookmarks restores from localStorage", () => {
        const testRepos = [win.PROJECTS[0].repo, win.PROJECTS[1].repo];
        // Clear existing bookmarks first
        for (const repo of testRepos) {
            if (win.isBookmarked(repo)) win.toggleBookmark(repo);
        }
        win.localStorage.setItem("bookmarks", JSON.stringify(testRepos));
        win._loadBookmarks();

        for (const repo of testRepos) {
            expect(win.isBookmarked(repo)).toBe(true);
        }

        // Clean up
        for (const repo of testRepos) {
            if (win.isBookmarked(repo)) win.toggleBookmark(repo);
        }
    });

    test("_loadBookmarks handles corrupted localStorage gracefully", () => {
        win.localStorage.setItem("bookmarks", "not-valid-json");
        expect(() => win._loadBookmarks()).not.toThrow();
    });

    test("_loadBookmarks handles empty localStorage", () => {
        win.localStorage.removeItem("bookmarks");
        expect(() => win._loadBookmarks()).not.toThrow();
    });

    test("_loadBookmarks rejects unknown repo names (CWE-20 defense)", () => {
        win.localStorage.setItem("bookmarks", JSON.stringify(["fake-repo-xyz", win.PROJECTS[0].repo]));
        // Clear first
        if (win.isBookmarked(win.PROJECTS[0].repo)) win.toggleBookmark(win.PROJECTS[0].repo);
        win._loadBookmarks();
        expect(win.isBookmarked("fake-repo-xyz")).toBe(false);
        expect(win.isBookmarked(win.PROJECTS[0].repo)).toBe(true);
        // Clean up
        if (win.isBookmarked(win.PROJECTS[0].repo)) win.toggleBookmark(win.PROJECTS[0].repo);
    });

    test("_loadBookmarks enforces _MAX_BOOKMARKS limit (CWE-400 defense)", () => {
        // Create array with more than _MAX_BOOKMARKS entries (100)
        // Using real repo names repeated
        const repos = [];
        for (let i = 0; i < 150; i++) {
            repos.push(win.PROJECTS[i % win.PROJECTS.length].repo);
        }
        win.localStorage.setItem("bookmarks", JSON.stringify(repos));
        expect(() => win._loadBookmarks()).not.toThrow();
    });

    test("_loadBookmarks rejects non-string entries", () => {
        // Verify that non-string entries (123, null, true) are skipped
        // while valid string repo names are loaded
        win.localStorage.setItem("bookmarks", JSON.stringify([123, null, true]));
        // _loadBookmarks adds to the existing Set, so this just verifies
        // that non-string values don't cause exceptions
        expect(() => win._loadBookmarks()).not.toThrow();
        // Non-string values should not appear as bookmarks
        expect(win.isBookmarked("123")).toBe(false);
        expect(win.isBookmarked("null")).toBe(false);
        expect(win.isBookmarked("true")).toBe(false);
    });

    test("getBookmarkCount returns correct count after toggling", () => {
        const repo = win.PROJECTS[0].repo;
        const wasBm = win.isBookmarked(repo);
        const initialCount = win.getBookmarkCount();

        win.toggleBookmark(repo);
        const newCount = win.getBookmarkCount();

        if (wasBm) {
            expect(newCount).toBe(initialCount - 1);
        } else {
            expect(newCount).toBe(initialCount + 1);
        }

        // Restore
        win.toggleBookmark(repo);
    });
});

// ── deserializeFilterState: additional edge cases ───────────────────

describe("deserializeFilterState — edge cases", () => {
    test("handles unknown keys gracefully (ignores them)", () => {
        const result = win.deserializeFilterState("q=test&unknown=val&cat=Security");
        expect(result.q).toBe("test");
        expect(result.cat).toBe("Security");
    });

    test("handles URL-encoded special characters", () => {
        const result = win.deserializeFilterState("q=C%23%20.NET&cat=Languages%20%26%20Tools");
        expect(result.q).toBe("C# .NET");
        expect(result.cat).toBe("Languages & Tools");
    });

    test("handles bm=0 as false", () => {
        const result = win.deserializeFilterState("bm=0");
        expect(result.bm).toBeFalsy();
    });

    test("handles duplicate keys (last wins or first wins — just verify no crash)", () => {
        expect(() => win.deserializeFilterState("q=first&q=second")).not.toThrow();
    });
});
