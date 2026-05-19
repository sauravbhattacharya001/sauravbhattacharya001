// ── Sort & View Toggle ──────────────────────────────────────────────

/**
 * Available sort orders.
 * Each entry has a label (for UI) and a comparator function.
 * "default" preserves the original PROJECTS array order (by category).
 */
var SORT_ORDERS = {
    "default": {
        label: "Default",
        compare: function() { return 0; }
    },
    "a-z": {
        label: "A → Z",
        compare: function(a, b) {
            return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        }
    },
    "z-a": {
        label: "Z → A",
        compare: function(a, b) {
            return b.title.toLowerCase().localeCompare(a.title.toLowerCase());
        }
    },
    "most-tags": {
        label: "Most Tags",
        compare: function(a, b) {
            return b.tags.length - a.tags.length;
        }
    },
    "most-links": {
        label: "Most Links",
        compare: function(a, b) {
            return b.links.length - a.links.length;
        }
    }
};

/**
 * Sort a project array according to the given sort key.
 * Returns a new array (does not mutate the input).
 *
 * "default" returns the array in its original insertion order.
 * Other keys use stable sort via the comparator in SORT_ORDERS.
 *
 * For alphabetic sorts (a-z, z-a) we use a Schwartzian transform:
 * pre-compute the lowercase title once per item (O(N)), then compare
 * using the cached key.  This avoids calling .toLowerCase() on every
 * comparison — O(N log N) repeated calls → O(N) pre-computation.
 *
 * @param {Object[]} projects - Array of projects to sort.
 * @param {string} sortKey - Key from SORT_ORDERS.
 * @returns {Object[]}
 */
var _hasOwn = Object.prototype.hasOwnProperty;
/** Whitelist check that ignores inherited Object.prototype keys (CWE-1321). */
function _isKnownSortKey(key) {
    return typeof key === "string" && _hasOwn.call(SORT_ORDERS, key);
}
function sortProjects(projects, sortKey) {
    if (!sortKey || sortKey === "default" || !_isKnownSortKey(sortKey)) {
        return projects.slice();
    }
    // Schwartzian transform for string sorts: decorate → sort → undecorate
    if (sortKey === "a-z" || sortKey === "z-a") {
        var dir = sortKey === "a-z" ? 1 : -1;
        var decorated = projects.map(function(p) {
            return { p: p, key: p.title.toLowerCase() };
        });
        decorated.sort(function(a, b) {
            return dir * a.key.localeCompare(b.key);
        });
        return decorated.map(function(d) { return d.p; });
    }
    return projects.slice().sort(SORT_ORDERS[sortKey].compare);
}

/**
 * Set the active sort order and re-render.
 * Persists choice in localStorage.
 *
 * @param {string} sortKey - Sort key (must be a key in SORT_ORDERS).
 */
function setSortOrder(sortKey) {
    // Reject inherited Object.prototype keys like "__proto__" or "toString"
    // that would otherwise pass the bracket-access truthiness check and
    // poison _filterState.sort (CWE-1321 / CWE-20).
    if (!_isKnownSortKey(sortKey)) return;
    _filterState.sort = sortKey;
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("sort-order", sortKey);
    }
    _updateSortPillActive();
    _applyFilters();
}

/**
 * Set the view mode (grid or list) and update the DOM.
 * Persists choice in localStorage.
 *
 * @param {"grid"|"list"} mode - View mode.
 */
function setViewMode(mode) {
    if (mode !== "grid" && mode !== "list") return;
    _filterState.view = mode;
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("view-mode", mode);
    }
    _applyViewMode();
    _updateViewToggleActive();
}

/**
 * Apply the current view mode class to the projects container.
 */
function _applyViewMode() {
    if (typeof document === "undefined") return;
    var container = document.getElementById("projects-container");
    if (!container) return;
    if (_filterState.view === "list") {
        container.classList.add("view-list");
    } else {
        container.classList.remove("view-list");
    }
}

/**
 * Toggle the `.active` class on a group of pill/button elements based on
 * matching a data-attribute value.  Centralises the duplicate "loop over
 * pills, add/remove .active" pattern that previously lived in
 * `_updateSortPillActive`, `_updateViewToggleActive`, and the category-pill
 * sync in `_applyDeepLinkState`.
 *
 * Safe to call in non-DOM environments (returns silently when `document` is
 * undefined or the container can't be found / has no matching pills).
 *
 * Matching rules:
 *  - The active value is compared by `===` against `getAttribute(attr)`.
 *  - To activate an "all / no filter" pill that has an empty attribute
 *    value (`data-category=""`), pass `activeValue` as `null` /
 *    `undefined` and the matcher will also activate pills whose attribute
 *    is `""`.
 *
 * @param {HTMLElement|string} containerOrId - Container element or its id.
 * @param {string} selector - CSS selector for the pills inside the container.
 * @param {string} attr - Attribute name (e.g. `"data-sort"`) to read on each pill.
 * @param {string|null|undefined} activeValue - The attribute value that should be active.
 * @returns {number} The number of pills that ended up active (0 or 1 in practice).
 */
function _setActivePillByAttr(containerOrId, selector, attr, activeValue) {
    if (typeof document === "undefined") return 0;
    var container = (typeof containerOrId === "string")
        ? document.getElementById(containerOrId)
        : containerOrId;
    if (!container || typeof container.querySelectorAll !== "function") return 0;
    var pills = container.querySelectorAll(selector);
    var matchEmpty = (activeValue === null || typeof activeValue === "undefined");
    var activated = 0;
    for (var i = 0; i < pills.length; i++) {
        var val = pills[i].getAttribute(attr);
        var isActive = (val === activeValue) || (matchEmpty && val === "");
        if (isActive) {
            pills[i].classList.add("active");
            activated++;
        } else {
            pills[i].classList.remove("active");
        }
    }
    return activated;
}

/**
 * Update sort pill active states in the DOM.
 */
function _updateSortPillActive() {
    _setActivePillByAttr("sort-controls", ".sort-pill", "data-sort", _filterState.sort);
}

/**
 * Update view toggle button active states in the DOM.
 */
function _updateViewToggleActive() {
    _setActivePillByAttr("view-toggle", ".view-btn", "data-view", _filterState.view);
}

/**
 * Build sort control pills into a container element.
 *
 * @param {HTMLElement} container - DOM element for sort pills.
 */
function buildSortControls(container) {
    var label = document.createElement("span");
    label.className = "sort-label";
    label.textContent = "Sort:";
    container.appendChild(label);

    var keys = Object.keys(SORT_ORDERS);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var pill = document.createElement("button");
        pill.type = "button";
        pill.className = "sort-pill" + (key === _filterState.sort ? " active" : "");
        pill.textContent = SORT_ORDERS[key].label;
        pill.setAttribute("data-sort", key);
        container.appendChild(pill);
    }

    container.addEventListener("click", function(e) {
        var pill = e.target;
        if (!pill.classList.contains("sort-pill")) return;
        var sortKey = pill.getAttribute("data-sort");
        if (sortKey) setSortOrder(sortKey);
    });
}

/**
 * Build view mode toggle buttons into a container element.
 *
 * @param {HTMLElement} container - DOM element for view toggle.
 */
function buildViewToggle(container) {
    var gridBtn = document.createElement("button");
    gridBtn.type = "button";
    gridBtn.className = "view-btn" + (_filterState.view === "grid" ? " active" : "");
    gridBtn.setAttribute("data-view", "grid");
    gridBtn.setAttribute("aria-label", "Grid view");
    gridBtn.setAttribute("title", "Grid view");
    gridBtn.innerHTML = "&#9638;&#9638;"; // ▦▦ grid icon
    container.appendChild(gridBtn);

    var listBtn = document.createElement("button");
    listBtn.type = "button";
    listBtn.className = "view-btn" + (_filterState.view === "list" ? " active" : "");
    listBtn.setAttribute("data-view", "list");
    listBtn.setAttribute("aria-label", "List view");
    listBtn.setAttribute("title", "List view");
    listBtn.innerHTML = "&#9776;"; // ☰ list icon
    container.appendChild(listBtn);

    container.addEventListener("click", function(e) {
        var btn = e.target.closest ? e.target.closest(".view-btn") : e.target;
        if (!btn || !btn.classList.contains("view-btn")) return;
        var mode = btn.getAttribute("data-view");
        if (mode) setViewMode(mode);
    });
}

/**
 * Initialize sort controls and view toggle.
 * Restores persisted preferences from localStorage.
 */
function initSortAndView() {
    // Restore persisted preferences
    if (typeof localStorage !== "undefined") {
        var storedSort = localStorage.getItem("sort-order");
        if (storedSort && _isKnownSortKey(storedSort)) {
            _filterState.sort = storedSort;
        }
        var storedView = localStorage.getItem("view-mode");
        if (storedView === "grid" || storedView === "list") {
            _filterState.view = storedView;
        }
    }

    var sortContainer = document.getElementById("sort-controls");
    if (sortContainer) {
        buildSortControls(sortContainer);
    }

    var viewContainer = document.getElementById("view-toggle");
    if (viewContainer) {
        buildViewToggle(viewContainer);
    }

    _applyViewMode();
}
