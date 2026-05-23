// ── Deep Link Filter State ──────────────────────────────────────────

/**
 * Whether deep link URL updates are enabled.
 * Disabled during deserialization to prevent re-entrant hash updates.
 * @type {boolean}
 */
var _deepLinkEnabled = false;

/**
 * Cap untrusted hash-derived strings to a sane length to prevent
 * attacker-controlled URLs from forcing megabytes of DOM work or
 * freezing the renderer (CWE-400 / CWE-1284). Real values are tiny —
 * the longest legitimate tag is well under 64 chars.
 * @type {number}
 */
var _MAX_DEEPLINK_LEN = 200;

/**
 * Cap the number of `&`-separated pairs we'll bother to parse. A
 * pathological URL of the form `#a=1&a=1&a=1...` repeated thousands of
 * times would otherwise spin the parse loop and trigger pointless
 * decodeURIComponent calls (CWE-400). The legitimate hash carries at
 * most six recognised keys, so 32 is comfortably above the real ceiling.
 * @type {number}
 */
var _MAX_DEEPLINK_PAIRS = 32;

/**
 * Truncate a deep-link value to the configured maximum length.
 * Hoisted out of `_applyDeepLinkState` so it isn't re-created on every
 * hashchange (was inside the function, costing a fresh closure per call).
 * @param {string} v
 * @returns {string}
 */
function _capDeepLink(v) {
    return v.length > _MAX_DEEPLINK_LEN ? v.substring(0, _MAX_DEEPLINK_LEN) : v;
}

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
 * Hardened against:
 *   - prototype-pollution via whitelisted keys (no dynamic property writes)
 *   - malformed `%xx` escapes via `try`/`continue`
 *   - oversized hashes via `_MAX_DEEPLINK_PAIRS` cap
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
    var limit = pairs.length > _MAX_DEEPLINK_PAIRS ? _MAX_DEEPLINK_PAIRS : pairs.length;
    for (var i = 0; i < limit; i++) {
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
    if (typeof state.q === "string") {
        var cappedQ = _capDeepLink(state.q);
        if (cappedQ !== _filterState.query) {
            _filterState.query = cappedQ;
            var searchInput = document.getElementById("project-search");
            if (searchInput) searchInput.value = cappedQ;
            changed = true;
        }
    }
    if (typeof state.cat === "string") {
        state.cat = _capDeepLink(state.cat);
        _filterState.category = state.cat || null;
        // `""` is the "All" pill — pass null so the helper's empty-string
        // fallback activates it.
        _setActivePillByAttr(
            "category-filters", ".filter-pill", "data-category",
            state.cat || null);
        changed = true;
    }
    if (typeof state.tag === "string") {
        _filterState.tag = _capDeepLink(state.tag) || null;
        changed = true;
    }
    // Use the same prototype-aware whitelist as setSortOrder so a hash
    // like #sort=__proto__ cannot poison _filterState.sort (CWE-1321).
    if (typeof state.sort === "string" &&
        typeof _isKnownSortKey === "function" && _isKnownSortKey(state.sort)) {
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
 * Reset both `_filterState` and the affordances rendered into the DOM
 * (search input value, category/sort/view pill active states) back to
 * their defaults. Called by the `hashchange` handler so that when the
 * user navigates back to a hash that *omits* a key (e.g. removes a
 * category from the URL), the corresponding UI control is also cleared
 * — previously only fields present in the new hash were synced, which
 * left stale "active" pills behind. See tests/deep-link-hashchange.test.js.
 */
function _resetDeepLinkUIToDefaults() {
    _filterState.query = "";
    _filterState.category = null;
    _filterState.tag = null;
    _filterState.sort = "default";
    _filterState.view = "grid";
    _filterState.bookmarked = false;
    if (typeof document === "undefined") return;
    var searchInput = document.getElementById("project-search");
    if (searchInput) searchInput.value = "";
    if (typeof _setActivePillByAttr === "function") {
        _setActivePillByAttr("category-filters", ".filter-pill", "data-category", null);
    }
    if (typeof _updateSortPillActive === "function") _updateSortPillActive();
    if (typeof _updateViewToggleActive === "function") _updateViewToggleActive();
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
            _resetDeepLinkUIToDefaults();
            _applyDeepLinkState(state);
            _deepLinkEnabled = true;
        });
    }
}
