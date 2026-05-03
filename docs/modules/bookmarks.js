// ── Bookmarks ───────────────────────────────────────────────────────

/**
 * Set of bookmarked project repo names.
 * Loaded from localStorage on init, persisted on every toggle.
 * @type {Set<string>}
 */
var _bookmarks = new (typeof Set !== "undefined" ? Set : function() {
    this._items = {};
    this.has = function(k) { return this._items.hasOwnProperty(k); };
    this.add = function(k) { this._items[k] = true; return this; };
    this.delete = function(k) { delete this._items[k]; };
    this.forEach = function(fn) { for (var k in this._items) { if (this._items.hasOwnProperty(k)) fn(k); } };
    this.size = 0;
})();

/**
 * Check if a project is bookmarked.
 * @param {string} repo - Repository name.
 * @returns {boolean}
 */
function isBookmarked(repo) {
    return _bookmarks.has(repo);
}

/**
 * Get the number of bookmarked projects.
 * @returns {number}
 */
function getBookmarkCount() {
    return _bookmarks.size;
}

/**
 * Toggle a project's bookmark status.
 * Persists to localStorage and re-renders.
 *
 * @param {string} repo - Repository name to toggle.
 * @returns {boolean} New bookmark state (true = bookmarked).
 */
function toggleBookmark(repo) {
    var nowBookmarked;
    if (_bookmarks.has(repo)) {
        _bookmarks.delete(repo);
        nowBookmarked = false;
    } else {
        _bookmarks.add(repo);
        nowBookmarked = true;
    }
    _persistBookmarks();
    _lastRenderedIds = null; // force re-render
    _applyFilters();
    return nowBookmarked;
}

/**
 * Toggle the bookmark-only filter on/off.
 * When active, only bookmarked projects are shown.
 *
 * @param {boolean} [active] - Force a specific state. Omit to toggle.
 */
function setBookmarkFilter(active) {
    if (typeof active === "undefined") {
        _filterState.bookmarked = !_filterState.bookmarked;
    } else {
        _filterState.bookmarked = !!active;
    }
    _lastRenderedIds = null;
    _applyFilters();
}

/**
 * Save bookmarks to localStorage.
 */
function _persistBookmarks() {
    if (typeof localStorage === "undefined") return;
    var arr = [];
    _bookmarks.forEach(function(repo) { arr.push(repo); });
    localStorage.setItem("bookmarks", JSON.stringify(arr));
}

/**
 * Load bookmarks from localStorage.
 */
/**
 * Maximum bookmarks to load from localStorage.
 * Prevents resource exhaustion from poisoned storage (CWE-400).
 * @const {number}
 */
var _MAX_BOOKMARKS = 100;

/**
 * Load bookmarked repos from localStorage into the in-memory Set.
 * Validates each entry against known PROJECTS repo names to reject
 * injected or stale entries. Caps at _MAX_BOOKMARKS to prevent
 * resource exhaustion from poisoned storage.
 */
function _loadBookmarks() {
    if (typeof localStorage === "undefined") return;
    try {
        var stored = localStorage.getItem("bookmarks");
        if (stored) {
            var arr = JSON.parse(stored);
            if (Array.isArray(arr)) {
                // Build a Set of known repo names for O(1) validation
                var knownRepos = Object.create(null);
                for (var k = 0; k < PROJECTS.length; k++) {
                    knownRepos[PROJECTS[k].repo] = true;
                }
                var loaded = 0;
                for (var i = 0; i < arr.length && loaded < _MAX_BOOKMARKS; i++) {
                    // Only accept strings that match a known project repo
                    // name.  Rejects non-string types, prototype keys, and
                    // injected entries from same-origin localStorage
                    // poisoning (CWE-400, CWE-20).
                    if (typeof arr[i] === "string" && knownRepos[arr[i]]) {
                        _bookmarks.add(arr[i]);
                        loaded++;
                    }
                }
            }
        }
    } catch (e) {
        // Corrupted data — start fresh
    }
}

/**
 * Update the bookmark filter pill active state and count badge.
 */
function _updateBookmarkFilterPill() {
    if (typeof document === "undefined") return;
    var pill = document.getElementById("bookmark-filter");
    if (!pill) return;
    var count = getBookmarkCount();
    if (_filterState.bookmarked) {
        pill.classList.add("active");
    } else {
        pill.classList.remove("active");
    }
    var badge = pill.querySelector(".bookmark-count");
    if (badge) {
        badge.textContent = count > 0 ? count : "";
    }
}

/**
 * Initialize the bookmark system.
 * Loads persisted bookmarks, creates the filter pill, and wires
 * click handlers for bookmark buttons (delegated on the container).
 */
function initBookmarks() {
    _loadBookmarks();

    // Create bookmark filter pill in the filter bar
    var filterBarRight = document.querySelector(".filter-bar-right");
    if (filterBarRight) {
        var pill = document.createElement("button");
        pill.type = "button";
        pill.id = "bookmark-filter";
        pill.className = "bookmark-filter-pill";
        pill.setAttribute("aria-label", "Show bookmarked projects only");
        pill.setAttribute("title", "Show bookmarked projects only");
        pill.innerHTML = '★ Bookmarks <span class="bookmark-count">' +
            (getBookmarkCount() > 0 ? getBookmarkCount() : "") + '</span>';
        pill.addEventListener("click", function() {
            setBookmarkFilter();
        });
        // Insert at the beginning of the right section
        filterBarRight.insertBefore(pill, filterBarRight.firstChild);
    }

    // Delegate bookmark button clicks on the projects container
    var container = document.getElementById("projects-container");
    if (container) {
        container.addEventListener("click", function(e) {
            var btn = e.target;
            if (!btn.classList.contains("bookmark-btn")) return;
            e.preventDefault();
            e.stopPropagation();
            var repo = btn.getAttribute("data-repo");
            if (repo) toggleBookmark(repo);
        });
    }
}