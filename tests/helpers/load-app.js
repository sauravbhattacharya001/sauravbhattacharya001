/**
 * tests/helpers/load-app.js — Test bootstrap for modular app.js
 *
 * Concatenates all module files in dependency order and evaluates them
 * in a JSDOM environment, reproducing the browser's <script> load order.
 *
 * Used by all test files via: const { loadApp } = require("./helpers/load-app");
 */

const { JSDOM } = require("jsdom");
const path = require("path");
const fs = require("fs");

/**
 * Module load order — must match the <script> tags in index.html.
 * @type {string[]}
 */
const MODULE_ORDER = [
    "modules/projects.js",
    "modules/search-index.js",
    "modules/html-helpers.js",
    "modules/render.js",
    "modules/sort-view.js",
    "modules/bookmarks.js",
    "modules/deep-link.js",
    "modules/theme.js",
    "modules/tag-clicks.js",
    "modules/keyboard.js",
    "modules/analytics.js",
    "modules/spotlight.js",
    "modules/tech-radar.js",
    "modules/compare.js",
    "modules/modal.js",
    "modules/quiz.js",
    "modules/timeline.js",
    "app.js"
];

const DOCS_DIR = path.join(__dirname, "..", "..", "docs");

/**
 * Read and concatenate all module files in dependency order.
 * @returns {string} Combined JavaScript source.
 */
function loadAllModules() {
    return MODULE_ORDER.map(function (relPath) {
        return fs.readFileSync(path.join(DOCS_DIR, relPath), "utf-8");
    }).join("\n;\n");
}

/**
 * Default DOM HTML that provides all expected container elements.
 */
const DEFAULT_HTML = '<!DOCTYPE html><html><body>' +
    '<div id="projects-container"></div>' +
    '<input id="project-search">' +
    '<div id="category-filters"></div>' +
    '<div id="active-tag-indicator" class="active-tag-indicator hidden"></div>' +
    '<div id="no-results" class="hidden"></div>' +
    '<button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel">' +
    '\uD83D\uDCCA Portfolio Analytics <span class="toggle-arrow">\u25BE</span></button>' +
    '<div id="analytics-panel" role="region" aria-label="Portfolio analytics"></div>' +
    '<div id="spotlight-container"></div>' +
    '<button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel">' +
    '\uD83D\uDEE0\uFE0F Tech Stack <span class="toggle-arrow">\u25BE</span></button>' +
    '<div id="techradar-panel" role="region" aria-label="Tech stack radar"></div>' +
    '<section id="projects"><div class="analytics-bar"></div>' +
    '<div id="timeline-panel" class="timeline-panel hidden"></div></section>' +
    '</body></html>';

/**
 * Bootstrap a JSDOM environment with all portfolio modules loaded.
 *
 * @param {string} [html] - Optional custom HTML. Defaults to full portfolio DOM.
 * @returns {JSDOM} Configured JSDOM instance with all globals available on `dom.window`.
 */
function loadApp(html) {
    const dom = new JSDOM(html || DEFAULT_HTML, {
        runScripts: "dangerously",
        resources: "usable"
    });
    const code = loadAllModules();
    dom.window.eval(code);
    return dom;
}

module.exports = { loadApp, loadAllModules, MODULE_ORDER, DEFAULT_HTML };
