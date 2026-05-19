/**
 * tests/set-active-pill.test.js — Unit tests for _setActivePillByAttr
 *
 * Covers the shared helper that toggles `.active` on pill groups based on
 * matching a data-attribute against a current value.  This helper backs
 * sort pills, view-mode toggles, and deep-link category-pill sync, so its
 * behaviour is load-bearing across the filter UI.
 */

const { loadApp } = require("./helpers/load-app");

let dom;
let win;

beforeEach(() => {
    dom = loadApp(
        '<!DOCTYPE html><html><body>' +
        '<div id="pill-group">' +
        '  <button class="pill" data-key="a">A</button>' +
        '  <button class="pill" data-key="b">B</button>' +
        '  <button class="pill" data-key="">All</button>' +
        '  <button class="not-pill" data-key="a">Not a pill</button>' +
        '</div>' +
        '<div id="empty-group"></div>' +
        '</body></html>'
    );
    win = dom.window;
});

afterEach(() => {
    dom.window.close();
});

function activeKeys() {
    const active = win.document.querySelectorAll("#pill-group .pill.active");
    return Array.from(active).map(el => el.getAttribute("data-key"));
}

describe("_setActivePillByAttr", () => {
    test("is exported on the window", () => {
        expect(typeof win._setActivePillByAttr).toBe("function");
    });

    test("activates exactly the matching pill", () => {
        const n = win._setActivePillByAttr("pill-group", ".pill", "data-key", "a");
        expect(n).toBe(1);
        expect(activeKeys()).toEqual(["a"]);
    });

    test("switching value moves the active class", () => {
        win._setActivePillByAttr("pill-group", ".pill", "data-key", "a");
        win._setActivePillByAttr("pill-group", ".pill", "data-key", "b");
        expect(activeKeys()).toEqual(["b"]);
    });

    test("does not touch elements that don't match the selector", () => {
        win._setActivePillByAttr("pill-group", ".pill", "data-key", "a");
        const notPill = win.document.querySelector(".not-pill");
        expect(notPill.classList.contains("active")).toBe(false);
    });

    test("null activeValue activates the empty-attribute pill (the 'All' case)", () => {
        const n = win._setActivePillByAttr("pill-group", ".pill", "data-key", null);
        expect(n).toBe(1);
        expect(activeKeys()).toEqual([""]);
    });

    test("undefined activeValue also activates the empty-attribute pill", () => {
        const n = win._setActivePillByAttr("pill-group", ".pill", "data-key", undefined);
        expect(n).toBe(1);
        expect(activeKeys()).toEqual([""]);
    });

    test("non-matching value clears all active classes", () => {
        win._setActivePillByAttr("pill-group", ".pill", "data-key", "a");
        const n = win._setActivePillByAttr("pill-group", ".pill", "data-key", "zzz");
        expect(n).toBe(0);
        expect(activeKeys()).toEqual([]);
    });

    test("accepts an element directly, not just an id string", () => {
        const container = win.document.getElementById("pill-group");
        win._setActivePillByAttr(container, ".pill", "data-key", "b");
        expect(activeKeys()).toEqual(["b"]);
    });

    test("returns 0 silently when container id does not exist", () => {
        expect(() => {
            const n = win._setActivePillByAttr("nope", ".pill", "data-key", "a");
            expect(n).toBe(0);
        }).not.toThrow();
    });

    test("returns 0 silently when container has no matching pills", () => {
        expect(() => {
            const n = win._setActivePillByAttr("empty-group", ".pill", "data-key", "a");
            expect(n).toBe(0);
        }).not.toThrow();
    });

    test("returns 0 silently when passed null container", () => {
        expect(() => {
            const n = win._setActivePillByAttr(null, ".pill", "data-key", "a");
            expect(n).toBe(0);
        }).not.toThrow();
    });

    test("idempotent: applying the same value twice yields the same DOM", () => {
        win._setActivePillByAttr("pill-group", ".pill", "data-key", "a");
        const before = win.document.getElementById("pill-group").innerHTML;
        win._setActivePillByAttr("pill-group", ".pill", "data-key", "a");
        const after = win.document.getElementById("pill-group").innerHTML;
        expect(after).toBe(before);
    });
});

describe("_setActivePillByAttr — integration with sort & view helpers", () => {
    test("setSortOrder activates the matching sort pill via the shared helper", () => {
        // Inject a sort-controls container with pills the way buildSortControls would.
        const doc = win.document;
        const sort = doc.createElement("div");
        sort.id = "sort-controls";
        sort.innerHTML =
            '<button class="sort-pill" data-sort="default">D</button>' +
            '<button class="sort-pill" data-sort="a-z">A</button>' +
            '<button class="sort-pill" data-sort="z-a">Z</button>';
        doc.body.appendChild(sort);

        win.setSortOrder("a-z");

        const actives = sort.querySelectorAll(".sort-pill.active");
        expect(actives.length).toBe(1);
        expect(actives[0].getAttribute("data-sort")).toBe("a-z");

        sort.remove();
    });

    test("setViewMode activates the matching view button via the shared helper", () => {
        const doc = win.document;
        const view = doc.createElement("div");
        view.id = "view-toggle";
        view.innerHTML =
            '<button class="view-btn" data-view="grid">G</button>' +
            '<button class="view-btn" data-view="list">L</button>';
        doc.body.appendChild(view);

        win.setViewMode("list");

        const actives = view.querySelectorAll(".view-btn.active");
        expect(actives.length).toBe(1);
        expect(actives[0].getAttribute("data-view")).toBe("list");

        view.remove();
    });
});
