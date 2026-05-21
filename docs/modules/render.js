function buildCardHeader(p) {
    var bookmarked = isBookmarked(p.repo);
    return '<div class="card-header">' +
        '<span class="card-icon">' + escapeHTML(p.icon) + '</span>' +
        '<h3><a href="https://github.com/sauravbhattacharya001/' +
            escapeHTML(p.repo) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHTML(p.title) + '</a></h3>' +
        '<button type="button" class="bookmark-btn' + (bookmarked ? ' bookmarked' : '') +
            '" data-repo="' + escapeHTML(p.repo) +
            '" aria-label="' + (bookmarked ? 'Remove bookmark' : 'Bookmark') +
            '" title="' + (bookmarked ? 'Remove bookmark' : 'Bookmark') + '">' +
            (bookmarked ? '★' : '☆') +
        '</button>' +
        '</div>';
}

/**
 * Build a list of tag elements as HTML string.
 * Used by both project cards (clickable filter buttons) and spotlight
 * (display-only spans).  Centralises tag rendering to avoid duplication.
 *
 * @param {string[]} tags
 * @param {{ clickable?: boolean, wrapperClass?: string }} [opts]
 * @returns {string}
 */
function buildTagList(tags, opts) {
    var o = opts || {};
    var clickable = o.clickable !== false; // default true
    var cls = o.wrapperClass || "card-tags";
    return '<div class="' + cls + '">' +
        tags.map(function(t) {
            if (clickable) {
                return '<button type="button" class="tag tag-clickable" data-tag="' +
                    escapeHTML(t) + '">' + escapeHTML(t) + '</button>';
            }
            return '<span class="tag">' + escapeHTML(t) + '</span>';
        }).join("") +
        '</div>';
}

/**
 * Build tag pills for a project card.
 * Tags are clickable buttons that filter to show all projects with that tag.
 * @param {string[]} tags
 * @returns {string}
 */
function buildCardTags(tags) {
    return buildTagList(tags, { clickable: true, wrapperClass: "card-tags" });
}

/**
 * Build a list of link anchor elements as HTML string.
 * Used by both project cards and spotlight cards.
 *
 * @param {Object[]} links - Array of {label, url} objects.
 * @param {{ wrapperClass?: string }} [opts]
 * @returns {string}
 */
function buildLinkList(links, opts) {
    var cls = (opts && opts.wrapperClass) || "card-links";
    return '<div class="' + cls + '">' +
        links.map(function(l) {
            return '<a href="' + sanitizeURL(l.url) +
                '" target="_blank" rel="noopener noreferrer">' +
                escapeHTML(l.label) + '</a>';
        }).join("") +
        '</div>';
}

/**
 * Build link buttons for a project card.
 * @param {Object[]} links - Array of {label, url} objects.
 * @returns {string}
 */
function buildCardLinks(links) {
    return buildLinkList(links, { wrapperClass: "card-links" });
}

/**
 * Assemble a full project card from its constituent parts.
 * @param {Object} p - Project from PROJECTS array.
 * @param {{ tabindex?: string }} [opts] - Optional attributes.
 * @returns {string}
 */
function buildCard(p, opts) {
    var extra = (opts && opts.tabindex) ? ' tabindex="' + escapeHTML(opts.tabindex) + '"' : '';
    return '<div class="card"' + extra + '>' +
        buildCardHeader(p) +
        '<p>' + escapeHTML(p.desc) + '</p>' +
        buildCardTags(p.tags) +
        buildCardLinks(p.links) +
        buildCompareCheckbox(p.repo) +
        '</div>';
}

/**
 * Check if a project matches a text query (case-insensitive).
 * Searches across title, description, repo name, and tags.
 *
 * Uses the pre-computed _searchIndex for O(1) lowercase lookups
 * instead of calling .toLowerCase() on every field per call.
 *
 * @param {Object} p - Project from PROJECTS array.
 * @param {string} query - Lowercase search query.
 * @param {number} [idx] - Pre-computed index into PROJECTS / _searchIndex
 *   (avoids an O(n) indexOf scan when the caller already knows the position).
 * @returns {boolean}
 */
function projectMatchesQuery(p, query, idx) {
    if (!query) return true;
    if (typeof idx !== "number" || idx < 0) idx = PROJECTS.indexOf(p);
    if (idx >= 0 && idx < _searchIndex.length) {
        return _searchIndex[idx].text.indexOf(query) !== -1;
    }
    // Fallback for dynamically added projects (shouldn't happen, but safe)
    if (p.title.toLowerCase().indexOf(query) !== -1) return true;
    if (p.desc.toLowerCase().indexOf(query) !== -1) return true;
    if (p.repo.toLowerCase().indexOf(query) !== -1) return true;
    for (var i = 0; i < p.tags.length; i++) {
        if (p.tags[i].toLowerCase().indexOf(query) !== -1) return true;
    }
    return false;
}

/**
 * Filter PROJECTS by current _filterState (query + category + tag).
 * Returns the filtered list without mutating PROJECTS.
 *
 * Text search matches against title, desc, tags, and repo name
 * (case-insensitive) via the pre-computed _searchIndex.  Category
 * filter matches the category field exactly.  Tag filter uses the
 * pre-computed tagSet for O(1) lookups.
 * All filters are AND-combined.
 *
 * @returns {Object[]}
 */
function filterProjects() {
    var q = _filterState.query.toLowerCase();
    var cat = _filterState.category;
    var tag = _filterState.tag;
    var tagLower = tag ? tag.toLowerCase() : null;
    var onlyBookmarked = _filterState.bookmarked;

    return PROJECTS.filter(function(p, idx) {
        if (onlyBookmarked && !isBookmarked(p.repo)) return false;
        if (cat && p.category !== cat) return false;
        if (tagLower) {
            // Use pre-computed tagSet for O(1) lookup
            if (idx < _searchIndex.length && !_searchIndex[idx].tagSet[tagLower]) {
                return false;
            }
        }
        return projectMatchesQuery(p, q, idx);
    });
}

/**
 * Group an array of projects by their category field.
 * Returns an ordered array of { name, items } objects, preserving
 * the insertion order of categories.
 *
 * Uses Object.create(null) for the lookup map so that inherited
 * properties like "constructor", "toString", or "__proto__" can never
 * collide with a category name — preventing prototype-pollution-style
 * bugs (CWE-1321).
 *
 * @param {Object[]} items - Array of projects.
 * @returns {{ name: string, items: Object[] }[]}
 */
function groupByCategory(items) {
    var groups = [];
    var groupMap = Object.create(null);
    items.forEach(function(p) {
        if (!groupMap[p.category]) {
            groupMap[p.category] = [];
            groups.push({ name: p.category, items: groupMap[p.category] });
        }
        groupMap[p.category].push(p);
    });
    return groups;
}

/**
 * Build the HTML for a single category section (label + grid of cards).
 *
 * @param {{ name: string, items: Object[] }} group - Category group.
 * @returns {string}
 */
function buildCategoryHTML(group) {
    return '<div class="category">' +
        '<div class="category-label">' + escapeHTML(group.name) + '</div>' +
        '<div class="projects-grid">' +
        group.items.map(buildCard).join("") +
        '</div></div>';
}

/**
 * Render all project cards into #projects-container, grouped by category.
 * Also updates the active tag indicator if tag filtering is active.
 *
 * @param {Object[]} [projects] - Optional filtered project list.
 *   Defaults to all PROJECTS.
 */
function renderProjects(projects) {
    var container = document.getElementById("projects-container");
    if (!container) return;

    var items = projects || PROJECTS;

    // Show/hide no-results message (uses CSS class instead of inline style)
    var noResults = document.getElementById("no-results");
    if (noResults) {
        if (items.length === 0) {
            noResults.classList.remove("hidden");
        } else {
            noResults.classList.add("hidden");
        }
    }

    // When sorted (non-default), render a flat grid without category headers.
    // Category grouping only makes sense in default order.
    if (_filterState.sort && _filterState.sort !== "default") {
        var html = '<div class="projects-grid">';
        items.forEach(function(p) {
            html += buildCard(p, { tabindex: "-1" });
        });
        html += '</div>';
        container.innerHTML = html;
    } else {
        var groups = groupByCategory(items);
        container.innerHTML = groups.map(buildCategoryHTML).join("");
    }

    // Update active tag indicator
    updateTagIndicator();
}

/**
 * Extract unique values from an array of objects, preserving insertion order.
 * Uses Object.create(null) for the lookup map (prototype-pollution safe).
 *
 * @param {Object[]} items - Array of objects to extract from.
 * @param {function(Object): string|string[]} accessor - Returns the key(s) for each item.
 * @returns {string[]}
 */
function _extractUnique(items, accessor) {
    var result = [];
    var seen = Object.create(null);
    items.forEach(function(item) {
        var keys = accessor(item);
        if (!Array.isArray(keys)) keys = [keys];
        keys.forEach(function(k) {
            var normalized = k.toLowerCase();
            if (!seen[normalized]) {
                seen[normalized] = true;
                result.push(k);
            }
        });
    });
    return result;
}

/**
 * Extract unique categories from the PROJECTS array, preserving
 * insertion order.
 *
 * @param {Object[]} [projects] - Optional project list. Defaults to PROJECTS.
 * @returns {string[]}
 */
function extractCategories(projects) {
    return _extractUnique(projects || PROJECTS, function(p) { return p.category; });
}

/**
 * Create filter pill buttons inside a container element.
 * Prepends an "All" pill, then one pill per category.
 *
 * @param {HTMLElement} container - DOM element to append pills into.
 * @param {string[]} categories - Category names.
 */
function createFilterPills(container, categories) {
    var allPill = document.createElement("button");
    allPill.className = "filter-pill active";
    allPill.textContent = "All";
    allPill.setAttribute("data-category", "");
    allPill.type = "button";
    container.appendChild(allPill);

    categories.forEach(function(cat) {
        var pill = document.createElement("button");
        pill.className = "filter-pill";
        pill.textContent = cat;
        pill.setAttribute("data-category", cat);
        pill.type = "button";
        container.appendChild(pill);
    });
}

/**
 * Wire up event handlers for filter pills and the search input.
 * Pill clicks update the active pill and trigger re-render.
 * Search input is debounced at 200ms.
 *
 * @param {HTMLElement} filtersContainer - Container holding pill buttons.
 * @param {HTMLInputElement|null} searchInput - Search text input (may be null).
 */
function wireFilterEvents(filtersContainer, searchInput) {
    filtersContainer.addEventListener("click", function(e) {
        var pill = e.target;
        if (!pill.classList.contains("filter-pill")) return;

        var pills = filtersContainer.querySelectorAll(".filter-pill");
        for (var i = 0; i < pills.length; i++) {
            pills[i].classList.remove("active");
        }
        pill.classList.add("active");

        var cat = pill.getAttribute("data-category");
        _filterState.category = cat || null;
        _applyFilters();
    });

    var debounceTimer = null;
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                _filterState.query = searchInput.value;
                _applyFilters();
            }, 200);
        });
    }
}

/**
 * Re-render projects using the current filter state.
 * Centralises the common filterProjects() → renderProjects() call
 * pattern that was previously duplicated in pill clicks, search input,
 * setTagFilter, and clearTagFilter.
 *
 * Skips DOM rebuild when the filtered result set hasn't changed (same
 * project IDs in same order), which matters during rapid keystroke
 * sequences where the debounced query yields the same matches.
 */
var _lastRenderedIds = null;
/**
 * Internal: apply current filter/sort state and re-render the project grid.
 * Skips rendering if the visible set hasn't changed (dedup by repo ids).
 */
function _applyFilters() {
    var filtered = filterProjects();
    filtered = sortProjects(filtered, _filterState.sort);
    var ids = filtered.map(function(p) { return p.repo; }).join(",");
    // Include bookmark state in cache key so toggling a bookmark re-renders.
    // Use the monotonic _bookmarksVersion counter (O(1)) instead of
    // re-serialising the entire bookmark Set on every keystroke (O(B log B)).
    var bookmarkKey = (typeof getBookmarksVersion === "function")
        ? getBookmarksVersion()
        : (_bookmarks ? _bookmarks.size : 0);
    var cacheKey = ids + "|" + bookmarkKey;
    if (cacheKey === _lastRenderedIds) return;
    _lastRenderedIds = cacheKey;
    renderProjects(filtered);
    _applyViewMode();
    _updateBookmarkFilterPill();
    pushFilterState();
    _announceFilterResult(filtered.length);
}

/**
 * Announce the filter result to screen readers via an aria-live region.
 * Satisfies WCAG 2.1 SC 4.1.3 (Status Messages) by programmatically
 * communicating filter result counts without moving focus.
 * @param {number} visibleCount - Number of projects currently shown.
 */
function _announceFilterResult(visibleCount) {
    var el = document.getElementById("filter-announcement");
    if (!el) return;
    var total = PROJECTS.length;
    var msg;
    if (visibleCount === 0) {
        msg = "No projects match your current filters.";
    } else if (visibleCount === total) {
        msg = total + " projects shown.";
    } else {
        msg = "Showing " + visibleCount + " of " + total + " projects.";
    }
    // Toggle textContent to ensure the live region fires even if the
    // message text hasn't changed (e.g. re-applying the same filter).
    // Setting to empty first forces the AT to treat the next update as new.
    el.textContent = "";
    // Use requestAnimationFrame to ensure the empty string is flushed
    // to the accessibility tree before the new message arrives.
    requestAnimationFrame(function() {
        el.textContent = msg;
    });
}

/**
 * Update the active tag indicator shown below the filter bar.
 * Creates or updates the indicator element showing which tag is
 * currently filtering, with a clear button.
 */
function updateTagIndicator() {
    var container = document.getElementById("active-tag-indicator");
    if (!container) return;

    if (!_filterState.tag) {
        container.innerHTML = "";
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    container.innerHTML =
        '<span class="tag-indicator-label">Filtered by tag:</span>' +
        '<span class="tag tag-active">' + escapeHTML(_filterState.tag) + '</span>' +
        '<button type="button" class="tag-clear" aria-label="Clear tag filter">&times;</button>';

    var clearBtn = container.querySelector(".tag-clear");
    if (clearBtn) {
        clearBtn.addEventListener("click", function() {
            clearTagFilter();
        });
    }
}

/**
 * Clear the active tag filter and re-render.
 */
function clearTagFilter() {
    _filterState.tag = null;
    _applyFilters();
}

/**
 * Set the active tag filter and re-render.
 * @param {string} tagName - Tag name to filter by.
 */
function setTagFilter(tagName) {
    _filterState.tag = tagName;
    _applyFilters();
}

/**
 * Extract all unique tags from the PROJECTS array.
 * @param {Object[]} [projects] - Optional project list. Defaults to PROJECTS.
 * @returns {string[]}
 */
function extractTags(projects) {
    return _extractUnique(projects || PROJECTS, function(p) { return p.tags || []; }).sort();
}

/**
 * Initialize the category filter pills and search input.
 * Delegates to extractCategories, createFilterPills, and wireFilterEvents.
 */
function initFilters() {
    var filtersContainer = document.getElementById("category-filters");
    var searchInput = document.getElementById("project-search");
    if (!filtersContainer) return;

    var categories = extractCategories();
    createFilterPills(filtersContainer, categories);
    wireFilterEvents(filtersContainer, searchInput);
    wireTagClicks();
}
