/**
 * tests/modal.test.js — Unit tests for modal focus management
 *
 * Tests _modalState, _activateModal, _deactivateModal, and _handleModalTab.
 */

const { JSDOM } = require("jsdom");
const path = require("path");
const fs = require("fs");

/**
 * Bootstrap a JSDOM environment with custom HTML and evaluate docs/app.js.
 *
 * @param {string} html - HTML string to use as the document body.
 * @returns {JSDOM} Configured JSDOM instance with app.js globals.
 */
function loadApp(html) {
    const dom = new JSDOM(html, {
        runScripts: "dangerously",
        resources: "usable",
        pretendToBeVisual: true
    });
    const code = fs.readFileSync(path.join(__dirname, "..", "docs", "app.js"), "utf-8");
    dom.window.eval(code);
    return dom;
}

const BASE_HTML = `<!DOCTYPE html><html><body>
    <button id="trigger">Open Modal</button>
    <div id="projects-container"></div>
    <input id="project-search">
    <div id="category-filters"></div>
    <div id="active-tag-indicator" class="active-tag-indicator hidden"></div>
    <div id="no-results" class="hidden"></div>
    <button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel"></button>
    <div id="analytics-panel" role="region" aria-label="Portfolio analytics"></div>
    <div id="spotlight-container"></div>
    <button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel"></button>
    <div id="techradar-panel" role="region" aria-label="Tech stack radar"></div>
    <section id="projects"><div class="analytics-bar"></div><div id="timeline-panel" class="timeline-panel hidden"></div></section>
    <div id="modal">
        <button id="btn-first">First</button>
        <input id="input-mid" type="text">
        <a href="#" id="link-last">Last</a>
    </div>
    <div id="empty-modal"></div>
    <div id="single-focus-modal">
        <button id="only-btn">Only</button>
    </div>
</body></html>`;

let dom, win;

beforeAll(() => {
    dom = loadApp(BASE_HTML);
    win = dom.window;
});

afterAll(() => {
    dom.window.close();
});

beforeEach(() => {
    // Reset modal state between tests
    win._modalState.triggerEl = null;
    win._modalState.activeModal = null;
});

describe("Modal Focus Management", () => {
    describe("_modalState", () => {
        test("initial state has null triggerEl and activeModal", () => {
            expect(win._modalState.triggerEl).toBeNull();
            expect(win._modalState.activeModal).toBeNull();
        });
    });

    describe("_activateModal", () => {
        test("sets activeModal to the given container", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);
            expect(win._modalState.activeModal).toBe(modal);
        });

        test("saves the currently focused element as triggerEl", () => {
            const trigger = win.document.getElementById("trigger");
            trigger.focus();
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);
            expect(win._modalState.triggerEl).toBe(trigger);
        });

        test("sets role=dialog and aria-modal=true on container", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);
            expect(modal.getAttribute("role")).toBe("dialog");
            expect(modal.getAttribute("aria-modal")).toBe("true");
        });

        test("focuses the first focusable element inside the modal", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);
            expect(win.document.activeElement.id).toBe("btn-first");
        });

        test("focuses the container itself when no focusable children exist", () => {
            const modal = win.document.getElementById("empty-modal");
            win._activateModal(modal);
            expect(win.document.activeElement).toBe(modal);
            expect(modal.getAttribute("tabindex")).toBe("-1");
        });
    });

    describe("_deactivateModal", () => {
        test("clears activeModal and triggerEl", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);
            win._deactivateModal();
            expect(win._modalState.activeModal).toBeNull();
            expect(win._modalState.triggerEl).toBeNull();
        });

        test("restores focus to the trigger element", () => {
            const trigger = win.document.getElementById("trigger");
            trigger.focus();
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);
            expect(win.document.activeElement.id).toBe("btn-first");
            win._deactivateModal();
            expect(win.document.activeElement).toBe(trigger);
        });

        test("handles missing trigger gracefully", () => {
            win._modalState.triggerEl = null;
            win._modalState.activeModal = win.document.getElementById("modal");
            expect(() => win._deactivateModal()).not.toThrow();
        });
    });

    describe("_handleModalTab", () => {
        /**
         * Create a synthetic Tab keydown event for modal focus-trap testing.
         *
         * @param {boolean} [shiftKey=false] - Whether Shift is held (reverse tab).
         * @returns {KeyboardEvent} The constructed event.
         */
        function makeTabEvent(shiftKey) {
            const event = new win.KeyboardEvent("keydown", {
                key: "Tab",
                shiftKey: shiftKey || false,
                bubbles: true,
                cancelable: true
            });
            let prevented = false;
            event.preventDefault = () => { prevented = true; };
            return { event, wasPrevented: () => prevented };
        }

        test("wraps forward tab from last to first element", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);

            const lastLink = win.document.getElementById("link-last");
            lastLink.focus();

            const { event, wasPrevented } = makeTabEvent(false);
            win._handleModalTab(event);

            expect(wasPrevented()).toBe(true);
            expect(win.document.activeElement.id).toBe("btn-first");
        });

        test("wraps backward tab from first to last element", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);

            const firstBtn = win.document.getElementById("btn-first");
            firstBtn.focus();

            const { event, wasPrevented } = makeTabEvent(true);
            win._handleModalTab(event);

            expect(wasPrevented()).toBe(true);
            expect(win.document.activeElement.id).toBe("link-last");
        });

        test("does not prevent default when focus is in the middle", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);

            const midInput = win.document.getElementById("input-mid");
            midInput.focus();

            const { event, wasPrevented } = makeTabEvent(false);
            win._handleModalTab(event);

            expect(wasPrevented()).toBe(false);
        });

        test("ignores non-Tab keys", () => {
            const modal = win.document.getElementById("modal");
            win._activateModal(modal);

            const event = new win.KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            });
            let prevented = false;
            event.preventDefault = () => { prevented = true; };
            win._handleModalTab(event);
            expect(prevented).toBe(false);
        });

        test("does nothing when no modal is active", () => {
            win._modalState.activeModal = null;
            const { event, wasPrevented } = makeTabEvent(false);
            expect(() => win._handleModalTab(event)).not.toThrow();
            expect(wasPrevented()).toBe(false);
        });

        test("handles modal with no focusable elements", () => {
            const modal = win.document.getElementById("empty-modal");
            win._activateModal(modal);

            const { event, wasPrevented } = makeTabEvent(false);
            win._handleModalTab(event);
            expect(wasPrevented()).toBe(false);
        });

        test("handles modal with single focusable element", () => {
            const modal = win.document.getElementById("single-focus-modal");
            win._activateModal(modal);

            const btn = win.document.getElementById("only-btn");
            btn.focus();

            const { event, wasPrevented } = makeTabEvent(false);
            win._handleModalTab(event);

            expect(wasPrevented()).toBe(true);
            expect(win.document.activeElement.id).toBe("only-btn");
        });
    });

    describe("activate/deactivate lifecycle", () => {
        test("multiple cycles work correctly", () => {
            const trigger = win.document.getElementById("trigger");
            const modal = win.document.getElementById("modal");

            trigger.focus();
            win._activateModal(modal);
            expect(win._modalState.activeModal).toBe(modal);
            win._deactivateModal();
            expect(win.document.activeElement).toBe(trigger);

            trigger.focus();
            win._activateModal(modal);
            expect(win.document.activeElement.id).toBe("btn-first");
            win._deactivateModal();
            expect(win.document.activeElement).toBe(trigger);
        });

        test("activating a new modal replaces the current one", () => {
            const modal1 = win.document.getElementById("modal");
            const modal2 = win.document.getElementById("single-focus-modal");

            win._activateModal(modal1);
            expect(win._modalState.activeModal).toBe(modal1);

            win._activateModal(modal2);
            expect(win._modalState.activeModal).toBe(modal2);
            expect(win.document.activeElement.id).toBe("only-btn");
        });
    });
});
