// ─── Project Comparison ─────────────────────────────────────────────
//
// Lets users select 2-5 projects and compare them side-by-side in a
// table showing icon, title, category, description, tags, and links.
//
// Follows the same revealing-module pattern as Spotlight, TechRadar,
// and Timeline for consistency and encapsulation.

/**
 * Project Comparison — select 2-5 projects for side-by-side comparison
 * in a modal table showing category, description, tags, links, and
 * shared-tag analysis.
 *
 * @namespace Compare
 */
var Compare = (function () {
    /** @type {Set<string>} repos currently selected for comparison */
    var _set = new Set();
    /** Max number of projects allowed in comparison. */
    var MAX = 5;

    /**
     * Toggle a project in/out of the comparison set.
     * @param {string} repo
     */
    function toggle(repo) {
        if (_set.has(repo)) {
            _set.delete(repo);
        } else {
            if (_set.size >= MAX) return;
            _set.add(repo);
        }
        syncUI();
    }

    /** Clear all comparison selections. */
    function clear() {
        _set.clear();
        syncUI();
    }

    /** Sync checkbox state + floating bar + panel. */
    function syncUI() {
        if (typeof document === "undefined") return;
        var boxes = document.querySelectorAll(".compare-cb");
        for (var i = 0; i < boxes.length; i++) {
            boxes[i].checked = _set.has(boxes[i].dataset.repo);
            boxes[i].disabled = !boxes[i].checked && _set.size >= MAX;
        }
        var bar = document.getElementById("compare-bar");
        if (bar) {
            if (_set.size > 0) {
                bar.style.display = "flex";
                var countSpan = bar.querySelector(".compare-count");
                if (countSpan) countSpan.textContent = _set.size;
                var openBtn = bar.querySelector(".compare-open");
                if (openBtn) openBtn.disabled = _set.size < 2;
            } else {
                bar.style.display = "none";
            }
        }
        if (_set.size < 2) {
            var panel = document.getElementById("compare-panel");
            if (panel) panel.style.display = "none";
        }
    }

    /**
     * Build a single <tr> for the comparison table.
     * @param {string} label - Row label.
     * @param {Object[]} selected - Selected projects.
     * @param {function(Object, number): string} cellFn - Returns inner HTML per cell.
     * @param {string} [cellClass] - Optional CSS class for <td> cells.
     * @returns {string}
     */
    function buildRow(label, selected, cellFn, cellClass) {
        var cls = cellClass ? ' class="' + cellClass + '"' : '';
        var html = '<tr><td class="compare-label">' + escapeHTML(label) + '</td>';
        for (var i = 0; i < selected.length; i++) {
            html += '<td' + cls + '>' + cellFn(selected[i], i) + '</td>';
        }
        return html + '</tr>';
    }

    /** Render the comparison panel with selected projects side-by-side. */
    function renderPanel() {
        if (typeof document === "undefined") return;
        if (_set.size < 2) return;

        var panel = document.getElementById("compare-panel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "compare-panel";
            panel.className = "compare-panel";
            document.body.appendChild(panel);
        }

        var selected = PROJECTS.filter(function(p) { return _set.has(p.repo); });

        var html = '<div class="compare-header">' +
            '<h2>Project Comparison</h2>' +
            '<button class="compare-copy-md" data-action="copy-compare-md" title="Copy as Markdown" aria-label="Copy comparison as Markdown">Copy MD</button>' +
            '<button class="compare-close" data-action="close-compare" title="Close">&times;</button>' +
            '</div>';

        html += '<div class="compare-table-wrap"><table class="compare-table">';
        html += '<thead><tr><th></th>';
        for (var i = 0; i < selected.length; i++) {
            html += '<th>' + escapeHTML(selected[i].icon) + ' ' + escapeHTML(selected[i].title) + '</th>';
        }
        html += '</tr></thead><tbody>';

        html += buildRow("Category", selected, function(p) { return escapeHTML(p.category); });
        html += buildRow("Description", selected, function(p) { return escapeHTML(p.desc); }, "compare-desc");

        var allTags = Object.create(null);
        for (i = 0; i < selected.length; i++) {
            for (var t = 0; t < selected[i].tags.length; t++) {
                var tag = selected[i].tags[t];
                allTags[tag] = (allTags[tag] || 0) + 1;
            }
        }

        html += buildRow("Tags", selected, function(p) {
            return p.tags.map(function(tg) {
                var shared = allTags[tg] > 1 ? ' compare-tag-shared' : '';
                return '<span class="compare-tag' + shared + '">' + escapeHTML(tg) + '</span>';
            }).join(' ');
        });

        html += buildRow("Links", selected, function(p) {
            return p.links.map(function(lnk) {
                return '<a href="' + sanitizeURL(lnk.url) + '" target="_blank" rel="noopener noreferrer">' +
                    escapeHTML(lnk.label) + '</a>';
            }).join(' ');
        });

        var sharedTags = Object.keys(allTags).filter(function(k) { return allTags[k] > 1; });
        if (sharedTags.length > 0) {
            html += '<tr><td class="compare-label">Shared Tags</td>';
            html += '<td colspan="' + selected.length + '">';
            for (i = 0; i < sharedTags.length; i++) {
                html += '<span class="compare-tag compare-tag-shared">' + escapeHTML(sharedTags[i]) +
                    ' (' + allTags[sharedTags[i]] + '/' + selected.length + ')</span> ';
            }
            html += '</td></tr>';
        }

        html += '</tbody></table></div>';
        panel.innerHTML = html;
        panel.style.display = "block";
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
        _activateModal(panel);
    }

    /**
     * Export the current comparison set as a GitHub-flavored Markdown
     * table.  Returns an empty string if fewer than 2 projects are
     * selected (matching renderPanel's threshold).
     *
     * The output is plain Markdown - safe to drop into an issue,
     * README, or docs page without any escaping of HTML.  Pipe / newline
     * characters inside project fields are normalised so the table stays
     * well-formed.
     *
     * @returns {string} Markdown table, or "" when nothing to compare.
     */
    function toMarkdown() {
        if (_set.size < 2) return "";
        if (typeof PROJECTS === "undefined" || !PROJECTS) return "";

        var selected = PROJECTS.filter(function(p) { return _set.has(p.repo); });
        if (selected.length < 2) return "";

        // Cells must not contain raw '|' or newlines or the table breaks.
        function cell(s) {
            if (s == null) return "";
            return String(s)
                .replace(/\r?\n+/g, " ")
                .replace(/\|/g, "\\|")
                .trim();
        }

        // Count tag occurrences so we can mark shared ones in bold.
        // Null-prototype map to keep keys like "__proto__" honest.
        var tagCounts = Object.create(null);
        for (var i = 0; i < selected.length; i++) {
            var tags = selected[i].tags || [];
            for (var t = 0; t < tags.length; t++) {
                tagCounts[tags[t]] = (tagCounts[tags[t]] || 0) + 1;
            }
        }

        var headers = ["Field"];
        for (i = 0; i < selected.length; i++) {
            headers.push(cell((selected[i].icon || "") + " " + (selected[i].title || "")));
        }

        var lines = [];
        lines.push("| " + headers.join(" | ") + " |");
        lines.push("| " + headers.map(function() { return "---"; }).join(" | ") + " |");

        function row(label, fn) {
            var parts = [cell(label)];
            for (var k = 0; k < selected.length; k++) {
                parts.push(cell(fn(selected[k])));
            }
            lines.push("| " + parts.join(" | ") + " |");
        }

        row("Category", function(p) { return p.category; });
        row("Description", function(p) { return p.desc; });
        row("Tags", function(p) {
            return (p.tags || []).map(function(tg) {
                // Bold shared tags - same visual intent as compare-tag-shared
                // in the HTML panel.
                return tagCounts[tg] > 1 ? "**" + tg + "**" : tg;
            }).join(", ");
        });
        row("Links", function(p) {
            return (p.links || []).map(function(lnk) {
                var url = (typeof sanitizeURL === "function")
                    ? sanitizeURL(lnk.url)
                    : (lnk.url || "");
                return "[" + (lnk.label || "link") + "](" + url + ")";
            }).join(" · ");
        });

        var shared = Object.keys(tagCounts).filter(function(k) { return tagCounts[k] > 1; });
        if (shared.length > 0) {
            lines.push("");
            lines.push("**Shared tags:** " + shared.map(function(k) {
                return cell(k) + " (" + tagCounts[k] + "/" + selected.length + ")";
            }).join(", "));
        }

        return lines.join("\n");
    }

    /**
     * Copy the Markdown comparison to the clipboard, when available.
     * Falls back to returning the Markdown string so callers can show
     * it in a toast / textarea on browsers without the Clipboard API.
     *
     * @returns {Promise<string>|string} Resolved with the Markdown on
     *   success, rejected on clipboard error, or the raw string when
     *   no clipboard API is available.
     */
    function copyMarkdown() {
        var md = toMarkdown();
        if (!md) return md;
        if (typeof navigator !== "undefined" &&
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function") {
            return navigator.clipboard.writeText(md).then(function() { return md; });
        }
        return md;
    }

    /** Close the comparison panel. */
    function close() {
        var panel = document.getElementById("compare-panel");
        if (panel) panel.style.display = "none";
        _deactivateModal();
    }

    /** Build the floating comparison bar HTML. @returns {string} */
    function buildBar() {
        return '<div id="compare-bar" class="compare-bar" style="display:none">' +
            '<span>Comparing <span class="compare-count">0</span> projects</span>' +
            '<button class="compare-open" data-action="open-compare" disabled>Compare</button>' +
            '<button class="compare-clear" data-action="clear-compare">Clear</button>' +
            '</div>';
    }

    /** Build a compare checkbox for a project card. @param {string} repo @returns {string} */
    function buildCheckbox(repo) {
        var checked = _set.has(repo) ? ' checked' : '';
        return '<label class="compare-label-cb" title="Add to comparison">' +
            '<input type="checkbox" class="compare-cb" data-repo="' + escapeHTML(repo) + '"' + checked + '>' +
            '<span class="compare-cb-text">Compare</span></label>';
    }

    /** Initialize comparison: inject bar, wire checkbox events. */
    function init() {
        if (typeof document === "undefined") return;
        var barContainer = document.getElementById("compare-bar");
        if (!barContainer) {
            var div = document.createElement("div");
            div.innerHTML = buildBar();
            document.body.appendChild(div.firstChild);
        }
        document.addEventListener("change", function(e) {
            if (e.target && e.target.classList.contains("compare-cb")) {
                toggle(e.target.dataset.repo);
            }
        });
        document.addEventListener("click", function(e) {
            var action = e.target && e.target.getAttribute("data-action");
            if (action === "close-compare") close();
            else if (action === "open-compare") renderPanel();
            else if (action === "clear-compare") clear();
            else if (action === "copy-compare-md") {
                var result = copyMarkdown();
                // Best-effort visual ack; ignore errors (e.g. no clipboard).
                if (result && typeof result.then === "function") {
                    result.then(function() {
                        if (e.target && e.target.classList) {
                            e.target.classList.add("copied");
                            setTimeout(function() {
                                e.target.classList.remove("copied");
                            }, 1200);
                        }
                    }, function() { /* swallow - user can re-try */ });
                }
            }
        });
    }

    return {
        _set: _set,
        MAX: MAX,
        toggle: toggle,
        clear: clear,
        syncUI: syncUI,
        buildRow: buildRow,
        renderPanel: renderPanel,
        toMarkdown: toMarkdown,
        copyMarkdown: copyMarkdown,
        close: close,
        buildBar: buildBar,
        buildCheckbox: buildCheckbox,
        init: init
    };
})();

// Legacy aliases for backward compatibility with tests
var _compareSet = Compare._set;
/** @see Compare.buildRow — thin wrapper for backward compatibility. */
function _buildCompareRow(label, selected, cellFn, cellClass) { return Compare.buildRow(label, selected, cellFn, cellClass); }
/** Toggle a repo in/out of the comparison set. @param {string} repo */
function toggleCompare(repo) { Compare.toggle(repo); }
/** Clear all repos from the comparison set. */
function clearCompare() { Compare.clear(); }
/** Synchronize compare checkbox UI state with the internal set. */
function syncCompareUI() { Compare.syncUI(); }
/** Render the side-by-side comparison panel for selected repos. */
function renderComparePanel() { Compare.renderPanel(); }
/** Close the comparison panel overlay. */
function closeCompare() { Compare.close(); }
/** Build the floating compare action bar element. @returns {HTMLElement} */
function buildCompareBar() { return Compare.buildBar(); }
/** Build a compare checkbox element for a project card. @param {string} repo @returns {HTMLElement} */
function buildCompareCheckbox(repo) { return Compare.buildCheckbox(repo); }
/** Export the current comparison set as a Markdown table. @returns {string} */
function compareToMarkdown() { return Compare.toMarkdown(); }
/** Copy the Markdown comparison to the clipboard. @returns {Promise<string>|string} */
function copyCompareMarkdown() { return Compare.copyMarkdown(); }
/** Initialize the comparison feature: bar, event listeners, and initial state. */
function initCompare() { Compare.init(); }
