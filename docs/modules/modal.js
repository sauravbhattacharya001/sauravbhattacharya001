// ── Modal Focus Management (fixes #24) ──────────────────────────────
//
// Shared utilities for trapping focus within modal overlays (compare
// panel, quiz) and restoring focus on close.  Implements:
//   - Escape key dismissal
//   - Tab/Shift+Tab focus trapping
//   - Focus restoration to trigger element
//   - aria-modal + role=dialog attributes

var _modalState = {
    /** @type {HTMLElement|null} Element that opened the modal (restored on close) */
    triggerEl: null,
    /** @type {HTMLElement|null} Currently active modal container */
    activeModal: null
};

/** Selector for keyboard-focusable elements within a container. */
var _FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Activate focus trapping on a modal container.
 * Saves the trigger element, marks the container as a dialog, and
 * moves focus to the first interactive element inside.
 *
 * @param {HTMLElement} container - The modal root element.
 */
function _activateModal(container) {
    _modalState.triggerEl = typeof document !== "undefined" ? document.activeElement : null;
    _modalState.activeModal = container;

    container.setAttribute("role", "dialog");
    container.setAttribute("aria-modal", "true");

    // Focus first interactive child (or the container itself)
    var firstFocusable = container.querySelector(_FOCUSABLE_SELECTOR);
    if (firstFocusable) {
        firstFocusable.focus();
    } else {
        container.setAttribute("tabindex", "-1");
        container.focus();
    }
}

/**
 * Deactivate the current modal and restore focus to the trigger.
 */
function _deactivateModal() {
    var trigger = _modalState.triggerEl;
    _modalState.activeModal = null;
    _modalState.triggerEl = null;
    if (trigger && typeof trigger.focus === "function") {
        trigger.focus();
    }
}

/**
 * Handle Tab key within an active modal to trap focus.
 * @param {KeyboardEvent} e
 */
function _handleModalTab(e) {
    var modal = _modalState.activeModal;
    if (!modal) return;
    if (e.key !== "Tab") return;

    var focusable = modal.querySelectorAll(_FOCUSABLE_SELECTOR);
    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

// Global keydown handler for Escape and Tab trapping
if (typeof document !== "undefined") {
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (_quizState && _quizState.active) {
                resetQuiz();
            } else {
                var comparePanel = document.getElementById("compare-panel");
                if (comparePanel && comparePanel.style.display !== "none") {
                    closeCompare();
                }
            }
        }
        if (e.key === "Tab" && _modalState.activeModal) {
            _handleModalTab(e);
        }
    });
}