/**
 * tests/deep-link-hardening.test.js — Tests for deep-link.js hardening
 * added in run gardener-4401.
 *
 * Covers:
 *   - `_MAX_DEEPLINK_PAIRS` cap (DoS protection)
 *   - `_capDeepLink` value truncation
 *   - `_resetDeepLinkUIToDefaults` clears stale UI state on hashchange
 */

const { loadApp } = require("./helpers/load-app");

describe("deep-link hardening (run 4401)", () => {
    test("_MAX_DEEPLINK_LEN is exported and conservative", () => {
        const win = loadApp().window;
        expect(typeof win._MAX_DEEPLINK_LEN).toBe("number");
        expect(win._MAX_DEEPLINK_LEN).toBeGreaterThanOrEqual(64);
        expect(win._MAX_DEEPLINK_LEN).toBeLessThanOrEqual(1024);
    });

    test("_MAX_DEEPLINK_PAIRS is exported and conservative", () => {
        const win = loadApp().window;
        expect(typeof win._MAX_DEEPLINK_PAIRS).toBe("number");
        expect(win._MAX_DEEPLINK_PAIRS).toBeGreaterThanOrEqual(8);
        expect(win._MAX_DEEPLINK_PAIRS).toBeLessThanOrEqual(256);
    });

    test("_capDeepLink truncates oversized strings", () => {
        const win = loadApp().window;
        const big = "x".repeat(win._MAX_DEEPLINK_LEN + 50);
        const out = win._capDeepLink(big);
        expect(out.length).toBe(win._MAX_DEEPLINK_LEN);
    });

    test("_capDeepLink leaves short strings untouched", () => {
        const win = loadApp().window;
        expect(win._capDeepLink("hello")).toBe("hello");
        expect(win._capDeepLink("")).toBe("");
    });

    test("deserializeFilterState ignores pairs beyond _MAX_DEEPLINK_PAIRS", () => {
        const win = loadApp().window;
        // Build a hash with way more than the cap of recognised keys.
        // Only the first cap pairs are inspected; legitimate keys placed
        // *after* the cap should be dropped.
        const filler = [];
        for (let i = 0; i < win._MAX_DEEPLINK_PAIRS + 10; i++) {
            filler.push("junk" + i + "=v");
        }
        filler.push("q=should-be-dropped");
        const result = win.deserializeFilterState(filler.join("&"));
        expect(result.q).toBeUndefined();
    });

    test("deserializeFilterState still parses legitimate hashes within the cap", () => {
        const win = loadApp().window;
        const result = win.deserializeFilterState(
            "q=hello&cat=AI&tag=Python&sort=a-z&view=list&bm=1"
        );
        expect(result).toEqual({
            q: "hello",
            cat: "AI",
            tag: "Python",
            sort: "a-z",
            view: "list",
            bm: true
        });
    });

    test("deserializeFilterState does not throw on a huge pathological hash", () => {
        const win = loadApp().window;
        const huge = new Array(5000).fill("a=1").join("&");
        expect(() => win.deserializeFilterState(huge)).not.toThrow();
    });

    test("_resetDeepLinkUIToDefaults clears _filterState back to defaults", () => {
        const win = loadApp().window;
        win._filterState.query = "leftover";
        win._filterState.category = "Stale";
        win._filterState.tag = "Stale";
        win._filterState.sort = "a-z";
        win._filterState.view = "list";
        win._filterState.bookmarked = true;

        win._resetDeepLinkUIToDefaults();

        expect(win._filterState.query).toBe("");
        expect(win._filterState.category).toBeNull();
        expect(win._filterState.tag).toBeNull();
        expect(win._filterState.sort).toBe("default");
        expect(win._filterState.view).toBe("grid");
        expect(win._filterState.bookmarked).toBe(false);
    });

    test("_resetDeepLinkUIToDefaults clears the search input value", () => {
        const win = loadApp().window;
        const input = win.document.getElementById("project-search");
        input.value = "stale search";
        win._filterState.query = "stale search";

        win._resetDeepLinkUIToDefaults();

        expect(input.value).toBe("");
    });
});
