/**
 * tests/bookmarks-theme-tags.test.js
 *
 * Coverage for previously-untested portfolio modules:
 *   - docs/modules/bookmarks.js (toggleBookmark, isBookmarked,
 *     getBookmarkCount, setBookmarkFilter, _loadBookmarks via
 *     localStorage hygiene, initBookmarks DOM wiring, and the new
 *     getBookmarksVersion / O(1) bookmark cache-key contract).
 *   - docs/modules/theme.js (applyTheme button label + aria-label,
 *     toggleTheme persistence, initTheme idempotency).
 *   - docs/modules/tag-clicks.js (wireTagClicks delegation: setting,
 *     toggling, and ignoring non-tag clicks).
 *
 * These functions were exported but had little or no direct test
 * coverage in the existing suite (731+ tests focused on rendering,
 * filtering, timeline, and rheology). This file fills that gap.
 */

const { loadAllModules } = require("./helpers/load-app");
const { JSDOM } = require("jsdom");

function freshDom() {
    // Custom HTML adds the bookmark filter container, theme toggle, and
    // a tag-aware projects container so we can exercise tag-click
    // delegation against real PROJECTS data. URL is set so JSDOM
    // exposes a working `localStorage` (needed by theme/bookmark tests).
    const html = '<!DOCTYPE html><html><body>' +
        '<button id="theme-toggle"></button>' +
        '<div class="filter-bar-right"></div>' +
        '<div id="projects-container"></div>' +
        '<input id="project-search">' +
        '<div id="category-filters"></div>' +
        '<div id="active-tag-indicator" class="active-tag-indicator hidden"></div>' +
        '<div id="no-results" class="hidden"></div>' +
        '<button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel"></button>' +
        '<div id="analytics-panel"></div>' +
        '<div id="spotlight-container"></div>' +
        '<button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel"></button>' +
        '<div id="techradar-panel"></div>' +
        '<section id="projects"><div class="analytics-bar"></div>' +
        '<div id="timeline-panel" class="timeline-panel hidden"></div></section>' +
        '</body></html>';
    const dom = new JSDOM(html, {
        runScripts: "dangerously",
        resources: "usable",
        url: "https://example.com/portfolio"
    });
    dom.window.eval(loadAllModules());
    return dom;
}

// ── bookmarks ──────────────────────────────────────────────────────

describe("bookmarks module", () => {
    let dom, win;

    beforeEach(() => {
        dom = freshDom();
        win = dom.window;
        // Reset bookmark set between tests
        try { win.localStorage.removeItem("bookmarks"); } catch (e) {}
        win._bookmarks.forEach(function (k) { win._bookmarks.delete(k); });
    });

    afterEach(() => {
        dom.window.close();
    });

    test("toggleBookmark adds, removes, and reports correct state", () => {
        const repo = win.PROJECTS[0].repo;
        expect(win.isBookmarked(repo)).toBe(false);
        expect(win.toggleBookmark(repo)).toBe(true);
        expect(win.isBookmarked(repo)).toBe(true);
        expect(win.getBookmarkCount()).toBe(1);
        expect(win.toggleBookmark(repo)).toBe(false);
        expect(win.isBookmarked(repo)).toBe(false);
        expect(win.getBookmarkCount()).toBe(0);
    });

    test("toggleBookmark persists to localStorage", () => {
        const repo = win.PROJECTS[0].repo;
        win.toggleBookmark(repo);
        const raw = win.localStorage.getItem("bookmarks");
        expect(raw).toBeTruthy();
        const arr = JSON.parse(raw);
        expect(arr).toContain(repo);
    });

    test("getBookmarksVersion bumps monotonically on every mutation", () => {
        const r1 = win.PROJECTS[0].repo;
        const r2 = win.PROJECTS[1].repo;
        const v0 = win.getBookmarksVersion();
        win.toggleBookmark(r1);
        const v1 = win.getBookmarksVersion();
        expect(v1).toBeGreaterThan(v0);
        win.toggleBookmark(r2);
        const v2 = win.getBookmarksVersion();
        expect(v2).toBeGreaterThan(v1);
        win.toggleBookmark(r1); // remove
        const v3 = win.getBookmarksVersion();
        expect(v3).toBeGreaterThan(v2);
    });

    test("getBookmarksVersion stable when no mutation occurs", () => {
        const v0 = win.getBookmarksVersion();
        // Pure reads should not change the version.
        win.isBookmarked("nope");
        win.getBookmarkCount();
        expect(win.getBookmarksVersion()).toBe(v0);
    });

    test("setBookmarkFilter toggles _filterState.bookmarked", () => {
        expect(win._filterState.bookmarked).toBeFalsy();
        win.setBookmarkFilter();
        expect(win._filterState.bookmarked).toBe(true);
        win.setBookmarkFilter();
        expect(win._filterState.bookmarked).toBe(false);
        win.setBookmarkFilter(true);
        expect(win._filterState.bookmarked).toBe(true);
        win.setBookmarkFilter(false);
        expect(win._filterState.bookmarked).toBe(false);
    });

    test("initBookmarks rejects non-string and unknown-repo entries", () => {
        // Poison localStorage with a mix of valid, invalid types,
        // and a fake repo name. Only the valid known repo should load.
        const goodRepo = win.PROJECTS[0].repo;
        win.localStorage.setItem(
            "bookmarks",
            JSON.stringify([goodRepo, "definitely-not-a-real-repo", 42, null, { x: 1 }])
        );
        // Clear in-memory state then re-init from storage
        win._bookmarks.forEach(function (k) { win._bookmarks.delete(k); });
        win.initBookmarks();
        expect(win.isBookmarked(goodRepo)).toBe(true);
        expect(win.isBookmarked("definitely-not-a-real-repo")).toBe(false);
        expect(win.getBookmarkCount()).toBe(1);
    });

    test("initBookmarks caps loaded bookmarks (_MAX_BOOKMARKS guard)", () => {
        // Build an array of 200 valid repo names by repeating known ones.
        const repos = win.PROJECTS.map(function (p) { return p.repo; });
        const flood = [];
        for (let i = 0; i < 200; i++) flood.push(repos[i % repos.length]);
        win.localStorage.setItem("bookmarks", JSON.stringify(flood));
        win._bookmarks.forEach(function (k) { win._bookmarks.delete(k); });
        win.initBookmarks();
        // Even after flood, distinct count is at most number of unique
        // known repos AND at most the documented cap of 100.
        expect(win.getBookmarkCount()).toBeLessThanOrEqual(100);
        expect(win.getBookmarkCount()).toBeLessThanOrEqual(repos.length);
    });

    test("initBookmarks survives corrupted JSON without throwing", () => {
        win.localStorage.setItem("bookmarks", "{not valid json");
        win._bookmarks.forEach(function (k) { win._bookmarks.delete(k); });
        expect(function () { win.initBookmarks(); }).not.toThrow();
        expect(win.getBookmarkCount()).toBe(0);
    });

    test("initBookmarks inserts a filter pill into .filter-bar-right", () => {
        // After a fresh init the pill exists with the bookmark icon area
        win.initBookmarks();
        const pill = win.document.getElementById("bookmark-filter");
        expect(pill).not.toBeNull();
        expect(pill.classList.contains("bookmark-filter-pill")).toBe(true);
    });
});

// ── theme ──────────────────────────────────────────────────────────

describe("theme module", () => {
    let dom, win;

    beforeEach(() => {
        dom = freshDom();
        win = dom.window;
        try { win.localStorage.removeItem("theme"); } catch (e) {}
        win.document.documentElement.removeAttribute("data-theme");
    });

    afterEach(() => { dom.window.close(); });

    test("applyTheme sets data-theme attribute", () => {
        win.applyTheme("light");
        expect(win.document.documentElement.getAttribute("data-theme")).toBe("light");
        win.applyTheme("dark");
        expect(win.document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    test("applyTheme updates the toggle button aria-label", () => {
        win.applyTheme("dark");
        const btn = win.document.getElementById("theme-toggle");
        expect(btn.getAttribute("aria-label")).toBe("Switch to light theme");
        win.applyTheme("light");
        expect(btn.getAttribute("aria-label")).toBe("Switch to dark theme");
    });

    test("toggleTheme flips between dark and light and persists", () => {
        win.applyTheme("dark");
        const next = win.toggleTheme();
        expect(next).toBe("light");
        expect(win.localStorage.getItem("theme")).toBe("light");
        const back = win.toggleTheme();
        expect(back).toBe("dark");
        expect(win.localStorage.getItem("theme")).toBe("dark");
    });

    test("getPreferredTheme honours explicit localStorage choice over default", () => {
        win.localStorage.setItem("theme", "light");
        expect(win.getPreferredTheme()).toBe("light");
        win.localStorage.setItem("theme", "dark");
        expect(win.getPreferredTheme()).toBe("dark");
    });

    test("initTheme is idempotent (multiple calls don't break the button)", () => {
        expect(function () {
            win.initTheme();
            win.initTheme();
            win.initTheme();
        }).not.toThrow();
        const btn = win.document.getElementById("theme-toggle");
        expect(btn).not.toBeNull();
    });
});

// ── tag clicks ─────────────────────────────────────────────────────

describe("tag click delegation", () => {
    let dom, win;

    beforeEach(() => {
        dom = freshDom();
        win = dom.window;
        win._filterState.tag = null;
        // Render projects so cards (and thus tag pills) exist.
        // wireTagClicks is wired up automatically by initApp via the
        // module load above, so we don't re-call it here (doing so
        // would attach a second listener and the same click would set
        // then immediately toggle-clear the filter).
        win.renderProjects(win.PROJECTS);
    });

    afterEach(() => { dom.window.close(); });

    test("clicking a tag-clickable element sets the filter to that tag", () => {
        const tagEl = win.document.querySelector(".tag-clickable");
        expect(tagEl).not.toBeNull();
        const tagName = tagEl.getAttribute("data-tag");
        expect(tagName).toBeTruthy();
        tagEl.click();
        expect(win._filterState.tag).toBeTruthy();
        expect(win._filterState.tag.toLowerCase()).toBe(tagName.toLowerCase());
    });

    test("clicking the same tag twice clears the filter (toggle)", () => {
        let tagEl = win.document.querySelector(".tag-clickable");
        const tagName = tagEl.getAttribute("data-tag");
        tagEl.click();
        expect(win._filterState.tag).toBeTruthy();
        // renderProjects re-builds the DOM, so the original element
        // reference may be detached. Re-query by the same tag name.
        tagEl = win.document.querySelector('.tag-clickable[data-tag="' + tagName + '"]');
        expect(tagEl).not.toBeNull();
        tagEl.click();
        expect(win._filterState.tag).toBeFalsy();
    });

    test("clicking a non-tag element does not change the filter", () => {
        const before = win._filterState.tag;
        const container = win.document.getElementById("projects-container");
        // Fire a click on the container itself (no tag-clickable class)
        const evt = new win.MouseEvent("click", { bubbles: true });
        container.dispatchEvent(evt);
        expect(win._filterState.tag).toBe(before);
    });
});

// ── _applyFilters cache key contract ───────────────────────────────

describe("_applyFilters cache key uses bookmark version", () => {
    let dom, win;

    beforeEach(() => {
        dom = freshDom();
        win = dom.window;
        try { win.localStorage.removeItem("bookmarks"); } catch (e) {}
        win._bookmarks.forEach(function (k) { win._bookmarks.delete(k); });
    });

    afterEach(() => { dom.window.close(); });

    test("toggling a bookmark forces a re-render (cache invalidates)", () => {
        // Render once to seed the cache, then toggle a bookmark. If the
        // cache key didn't include the bookmark version, the second
        // render would be skipped. We verify that the version counter
        // advances and that renderProjects can be called again without
        // throwing (which is the contract _applyFilters relies on).
        const repo = win.PROJECTS[0].repo;
        win.renderProjects(win.PROJECTS);
        const v0 = win.getBookmarksVersion();
        win.toggleBookmark(repo);
        expect(win.getBookmarksVersion()).toBeGreaterThan(v0);
        // Re-rendering after the toggle must not throw and must reflect
        // the still-present projects (toggleBookmark already triggers
        // _applyFilters internally).
        expect(function () { win.renderProjects(win.PROJECTS); }).not.toThrow();
    });
});
