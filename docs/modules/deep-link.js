// ── Deep Link Filter State ──────────────────────────────────────────

/**
 * Whether deep link URL updates are enabled.
 * Disabled during deserialization to prevent re-entrant hash updates.
 * @type {boolean}
 */
var _deepLinkEnabled = false;

/**
 * Serialize current _filterState to a URL hash string.
 * Only includes non-default values to keep the URL clean.
 *
 * Format: #q=search&cat=Category&tag=Tag&sort=a-z&view=list&bm=1
 *
 * @returns {string} Hash string without leading '#', or "" if all defaults.
 */
function serializeFilterState() {
    var parts = [];
    if (_filterState.query) {
        parts.push("q=" + encodeURIComponent(_filterState.query));
    }
    if (_filterState.category) {
        parts.push("cat=" + encodeURIComponent(_filterState.category));
    }
    if (_filterState.tag) {
        parts.push("tag=" + encodeURIComponent(_filterState.tag));
    }
    if (_filterState.sort && _filterState.sort !== "default") {
        parts.push("sort=" + encodeURIComponent(_filterState.sort));
    }
    if (_filterState.view && _filterState.view !== "grid") {
        parts.push("view=" + encodeURIComponent(_filterState.view));
    }
    if (_filterState.bookmarked) {
        parts.push("bm=1");
    }
    return parts.join("&");
}

/**
 * Deserialize a URL hash string into filter state values.
 * Returns an object with only the keys present in the hash.
 *
 * @param {string} hash - Hash string (with or without leading '#').
 * @returns {{ q?: string, cat?: string, tag?: string, sort?: string, view?: string, bm?: boolean }}
 */
function deserializeFilterState(hash) {
    var str = hash || "";
    if (str.charAt(0) === "#") str = str.substring(1);
    if (!str) return {};

    var result = {};
    var pairs = str.split("&");
    for (var i = 0; i < pairs.length; i++) {
        var eqIdx = pairs[i].indexOf("=");
        if (eqIdx < 0) continue;
        var key = pairs[i].substring(0, eqIdx);
        var val;
        try {
            val = decodeURIComponent(pairs[i].substring(eqIdx + 1));
        } catch (e) {
            // Malformed percent-encoding (e.g. %zz) — skip this parameter
            // rather than crashing the entire page (CWE-20).
            continue;
        }
        if (key === "q") result.q = val;
        else if (key === "cat") result.cat = val;
        else if (key === "tag") result.tag = val;
        else if (key === "sort") result.sort = val;
        else if (key === "view") result.view = val;
        else if (key === "bm") result.bm = val === "1";
    }
    return result;
}

/**
 * Push current filter state to the URL hash.
 * Only updates if deep linking is enabled (prevents loops during init).
 */
function pushFilterState() {
    if (!_deepLinkEnabled) return;
    if (typeof history === "undefined" || typeof location === "undefined") return;
    var hash = serializeFilterState();
    try {
        var newUrl = hash ? "#" + hash : location.pathname + location.search;
        if (location.hash.substring(1) !== hash) {
            history.replaceState(null, "", newUrl);
        }
    } catch (e) {
        // JSDOM or older browsers may not support replaceState fully
    }
}

/**
 * Apply a deserialized state object to _filterState and update UI.
 *
 * @param {{ q?: string, cat?: string, tag?: string, sort?: string, view?: string, bm?: boolean }} state
 */
function _applyDeepLinkState(state) {
    var changed = false;
    if (typeof state.q === "string" && state.q !== _filterState.query) {
        _filterState.query = state.q;
        var searchInput = document.getElementById("project-search");
        if (searchInput) searchInput.value = state.q;
        changed = true;
    }
    if (typeof state.cat === "string") {
        _filterState.category = state.cat || null;
        var pills = document.querySelectorAll("#category-filters .filter-pill");
        for (var i = 0; i < pills.length; i++) {
            var pillCat = pills[i].getAttribute("data-category");
            if (pillCat === state.cat || (pillCat === "" && !state.cat)) {
                pills[i].classList.add("active");
            } else {
                pills[i].classList.remove("active");
            }
        }
        changed = true;
    }
    if (typeof state.tag === "string") {
        _filterState.tag = state.tag || null;
        changed = true;
    }
    if (typeof state.sort === "string" && SORT_ORDERS[state.sort]) {
        _filterState.sort = state.sort;
        _updateSortPillActive();
        changed = true;
    }
    if (typeof state.view === "string" && (state.view === "grid" || state.view === "list")) {
        _filterState.view = state.view;
        _updateViewToggleActive();
        changed = true;
    }
    if (typeof state.bm === "boolean") {
        _filterState.bookmarked = state.bm;
        changed = true;
    }
    if (changed) {
        _lastRenderedIds = null;
        _applyFilters();
        updateTagIndicator();
    }
}

/**
 * Initialize deep link support.
 * Reads the URL hash on load, applies filter state, and listens
 * for hashchange events (browser back/forward).
 */
function initDeepLink() {
    if (typeof location === "undefined") {
        _deepLinkEnabled = true;
        return;
    }
    var initial = deserializeFilterState(location.hash);
    if (Object.keys(initial).length > 0) {
        _applyDeepLinkState(initial);
    }
    _deepLinkEnabled = true;

    if (typeof window !== "undefined") {
        window.addEventListener("hashchange", function() {
            _deepLinkEnabled = false;
            var state = deserializeFilterState(location.hash);
            _filterState.query = "";
            _filterState.category = null;
            _filterState.tag = null;
            _filterState.sort = "default";
            _filterState.view = "grid";
            _filterState.bookmarked = false;
            _applyDeepLinkState(state);
            _deepLinkEnabled = true;
        });
    }
}