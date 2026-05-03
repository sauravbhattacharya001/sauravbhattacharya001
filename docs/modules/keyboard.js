// ── Keyboard navigation ─────────────────────────────────────────────

/**
 * Keyboard navigation state.
 * @type {{ focusIndex: number, helpVisible: boolean }}
 */
var _kbState = { focusIndex: -1, helpVisible: false };

/**
 * Get all currently visible project cards in DOM order.
 * @returns {HTMLElement[]}
 */
function getVisibleCards() {
    if (typeof document === "undefined") return [];
    var container = document.getElementById("projects-container");
    if (!container) return [];
    return Array.prototype.slice.call(container.querySelectorAll(".card"));
}

/**
 * Apply visual focus to a card at the given index.
 * Scrolls the card into view and sets the focus outline.
 *
 * @param {number} index - Index into the visible cards array.
 * @returns {boolean} True if a card was focused.
 */
function focusCard(index) {
    var cards = getVisibleCards();
    if (cards.length === 0) return false;

    // Clamp to valid range
    if (index < 0) index = 0;
    if (index >= cards.length) index = cards.length - 1;

    // Remove previous focus
    blurCards();

    _kbState.focusIndex = index;
    var card = cards[index];
    card.classList.add("card-focused");
    card.setAttribute("tabindex", "-1");
    card.focus({ preventScroll: true });
    if (card.scrollIntoView) {
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    return true;
}

/**
 * Remove focus styling from all cards.
 */
function blurCards() {
    if (typeof document === "undefined") return;
    var focused = document.querySelectorAll(".card-focused");
    for (var i = 0; i < focused.length; i++) {
        focused[i].classList.remove("card-focused");
        focused[i].removeAttribute("tabindex");
    }
}

/**
 * Open the GitHub repo link of the currently focused card.
 * @returns {boolean} True if a link was opened.
 */
function openFocusedCard() {
    var cards = getVisibleCards();
    if (_kbState.focusIndex < 0 || _kbState.focusIndex >= cards.length) return false;
    var card = cards[_kbState.focusIndex];
    var link = card.querySelector(".card-header a");
    if (link && link.href) {
        if (typeof window !== "undefined" && window.open) {
            window.open(link.href, "_blank", "noopener");
        }
        return true;
    }
    return false;
}

/**
 * Build the keyboard shortcuts help overlay HTML.
 * @returns {string}
 */
function buildHelpOverlay() {
    var shortcuts = [
        { key: "j / ↓", desc: "Next project card" },
        { key: "k / ↑", desc: "Previous project card" },
        { key: "Enter", desc: "Open focused project on GitHub" },
        { key: "/", desc: "Focus search input" },
        { key: "Escape", desc: "Clear search / close help" },
        { key: "?", desc: "Toggle this help" }
    ];
    var rows = shortcuts.map(function(s) {
        return '<tr><td class="kb-help-key"><kbd>' + escapeHTML(s.key) + '</kbd></td>' +
               '<td class="kb-help-desc">' + escapeHTML(s.desc) + '</td></tr>';
    }).join("");
    return '<div class="kb-help-overlay" id="kb-help-overlay" role="dialog" aria-label="Keyboard shortcuts">' +
        '<div class="kb-help-panel">' +
        '<div class="kb-help-header">' +
        '<h3>⌨️ Keyboard Shortcuts</h3>' +
        '<button type="button" class="kb-help-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<table class="kb-help-table"><tbody>' + rows + '</tbody></table>' +
        '</div></div>';
}

/**
 * Show the keyboard shortcuts help overlay.
 */
function showKeyboardHelp() {
    if (typeof document === "undefined") return;
    _kbState.helpVisible = true;
    var existing = document.getElementById("kb-help-overlay");
    if (existing) {
        existing.classList.remove("hidden");
        return;
    }
    var wrapper = document.createElement("div");
    wrapper.innerHTML = buildHelpOverlay();
    var overlay = wrapper.firstChild;
    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) hideKeyboardHelp();
    });
    // Close button
    var closeBtn = overlay.querySelector(".kb-help-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", hideKeyboardHelp);
    }
}

/**
 * Hide the keyboard shortcuts help overlay.
 */
function hideKeyboardHelp() {
    _kbState.helpVisible = false;
    if (typeof document === "undefined") return;
    var overlay = document.getElementById("kb-help-overlay");
    if (overlay) overlay.classList.add("hidden");
}

/**
 * Toggle the keyboard shortcuts help overlay.
 */
function toggleKeyboardHelp() {
    if (_kbState.helpVisible) {
        hideKeyboardHelp();
    } else {
        showKeyboardHelp();
    }
}

/**
 * Initialize keyboard navigation.
 * Listens for keydown events on the document and dispatches
 * to the appropriate handler based on the key pressed.
 *
 * Shortcuts are suppressed when the user is typing in an input,
 * textarea, or contenteditable element (except Escape).
 */
function initKeyboardNav() {
    if (typeof document === "undefined") return;

    // Wire keyboard hint button in nav
    var hintBtn = document.getElementById("kb-hint");
    if (hintBtn) {
        hintBtn.addEventListener("click", toggleKeyboardHelp);
    }

    document.addEventListener("keydown", function(e) {
        var tag = e.target.tagName;
        var isInput = (tag === "INPUT" || tag === "TEXTAREA" ||
                       e.target.isContentEditable);

        // Escape always works
        if (e.key === "Escape") {
            e.preventDefault();
            if (_kbState.helpVisible) {
                hideKeyboardHelp();
                return;
            }
            // Clear search input if it has content
            var searchInput = document.getElementById("project-search");
            if (searchInput && searchInput.value) {
                searchInput.value = "";
                _filterState.query = "";
                _applyFilters();
                searchInput.blur();
                return;
            }
            // Clear tag filter
            if (_filterState.tag) {
                clearTagFilter();
                return;
            }
            // Blur focused card
            if (_kbState.focusIndex >= 0) {
                blurCards();
                _kbState.focusIndex = -1;
                return;
            }
            return;
        }

        // Suppress shortcuts when typing in an input
        if (isInput) return;

        // Don't intercept modified keys (Ctrl+C etc.)
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        switch (e.key) {
            case "j":
            case "ArrowDown":
                e.preventDefault();
                focusCard(_kbState.focusIndex + 1);
                break;
            case "k":
            case "ArrowUp":
                e.preventDefault();
                focusCard(_kbState.focusIndex - 1);
                break;
            case "Enter":
                if (_kbState.focusIndex >= 0) {
                    e.preventDefault();
                    openFocusedCard();
                }
                break;
            case "/":
                e.preventDefault();
                var search = document.getElementById("project-search");
                if (search) {
                    search.focus();
                    search.select();
                }
                break;
            case "?":
                e.preventDefault();
                toggleKeyboardHelp();
                break;
        }
    });
}

// ── Portfolio Analytics ──────────────────────────────────────────────
