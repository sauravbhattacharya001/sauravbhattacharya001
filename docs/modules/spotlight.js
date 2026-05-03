// ── Spotlight Carousel ──────────────────────────────────────────────

/**
 * Spotlight Carousel — rotates through featured projects with auto-play,
 * navigation controls, and dot indicators.
 *
 * @namespace Spotlight
 */
var Spotlight = (function () {
    var _state = { index: 0, paused: false, timerId: null, intervalMs: 6000 };

    /**
     * Build the HTML for a single spotlight card.
     * @param {Object} project - A PROJECTS entry.
     * @param {number} index - Current index (0-based).
     * @param {number} total - Total project count.
     * @returns {string} HTML string.
     */
    function buildCard(project, index, total) {
        if (!project) return "";

        var tagsHtml = buildTagList(project.tags, { clickable: false, wrapperClass: "spotlight-tags" });
        var linksHtml = buildLinkList(project.links, { wrapperClass: "spotlight-links" });

        var dotsHtml = "";
        for (var d = 0; d < total; d++) {
            dotsHtml += '<button type="button" class="spotlight-dot' +
                (d === index ? ' active' : '') +
                '" data-spotlight-index="' + d +
                '" aria-label="Go to project ' + (d + 1) + '"' +
                ' title="' + escapeHTML(PROJECTS[d].title) + '"></button>';
        }

        var pauseLabel = _state.paused ? "Resume" : "Pause";

        return '<div class="spotlight">' +
            '<button type="button" class="spotlight-nav spotlight-prev" aria-label="Previous project" title="Previous">' +
                '&#8249;' +
            '</button>' +
            '<div class="spotlight-inner">' +
                '<div class="spotlight-icon">' + escapeHTML(project.icon) + '</div>' +
                '<div class="spotlight-content">' +
                    '<div class="spotlight-label">Featured Project ' + (index + 1) + ' of ' + total + '</div>' +
                    '<div class="spotlight-title">' + escapeHTML(project.title) + '</div>' +
                    '<div class="spotlight-desc">' + escapeHTML(project.desc) + '</div>' +
                    tagsHtml +
                    linksHtml +
                '</div>' +
            '</div>' +
            '<button type="button" class="spotlight-nav spotlight-next" aria-label="Next project" title="Next">' +
                '&#8250;' +
            '</button>' +
            '<button type="button" class="spotlight-pause" aria-label="' + pauseLabel + ' auto-rotation" title="' + pauseLabel + '">' +
                pauseLabel +
            '</button>' +
            '<div class="spotlight-dots">' + dotsHtml + '</div>' +
        '</div>';
    }

    /** Render the spotlight at the current index. */
    function render() {
        if (typeof document === "undefined") return;
        var container = document.getElementById("spotlight-container");
        if (!container) return;
        if (PROJECTS.length === 0) return;

        var idx = _state.index % PROJECTS.length;
        container.innerHTML = buildCard(PROJECTS[idx], idx, PROJECTS.length);
        wireEvents();
    }

    /** Advance to the next spotlight project. @returns {number} New index. */
    function next() {
        if (PROJECTS.length === 0) return 0;
        _state.index = (_state.index + 1) % PROJECTS.length;
        render();
        return _state.index;
    }

    /** Go to the previous spotlight project. @returns {number} New index. */
    function prev() {
        if (PROJECTS.length === 0) return 0;
        _state.index = (_state.index - 1 + PROJECTS.length) % PROJECTS.length;
        render();
        return _state.index;
    }

    /** Go to a specific spotlight index. @returns {number} New index. */
    function goTo(idx) {
        if (PROJECTS.length === 0) return 0;
        _state.index = ((idx % PROJECTS.length) + PROJECTS.length) % PROJECTS.length;
        render();
        return _state.index;
    }

    /** Toggle auto-rotation pause/resume. @returns {boolean} True if now paused. */
    function togglePause() {
        _state.paused = !_state.paused;
        if (_state.paused) {
            stopTimer();
        } else {
            startTimer();
        }
        render();
        return _state.paused;
    }

    /** Start the auto-rotation timer. */
    function startTimer() {
        stopTimer();
        if (typeof setInterval === "undefined") return;
        _state.timerId = setInterval(function() {
            if (!_state.paused) {
                next();
            }
        }, _state.intervalMs);
    }

    /** Stop the auto-rotation timer. */
    function stopTimer() {
        if (_state.timerId !== null && typeof clearInterval !== "undefined") {
            clearInterval(_state.timerId);
            _state.timerId = null;
        }
    }

    /** Wire click events for spotlight navigation buttons. */
    function wireEvents() {
        if (typeof document === "undefined") return;
        var container = document.getElementById("spotlight-container");
        if (!container) return;

        var prevBtn = container.querySelector(".spotlight-prev");
        var nextBtn = container.querySelector(".spotlight-next");
        var pauseBtn = container.querySelector(".spotlight-pause");
        var dots = container.querySelectorAll(".spotlight-dot");

        if (prevBtn) {
            prevBtn.addEventListener("click", function() {
                prev();
                if (!_state.paused) startTimer();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", function() {
                next();
                if (!_state.paused) startTimer();
            });
        }
        if (pauseBtn) {
            pauseBtn.addEventListener("click", function() {
                togglePause();
            });
        }
        for (var i = 0; i < dots.length; i++) {
            (function(dot) {
                dot.addEventListener("click", function() {
                    var idx = parseInt(dot.getAttribute("data-spotlight-index"), 10);
                    goTo(idx);
                    if (!_state.paused) startTimer();
                });
            })(dots[i]);
        }
    }

    /** Initialize the spotlight carousel: render first card and start timer. */
    function init() {
        if (typeof document === "undefined") return;
        _state.index = 0;
        _state.paused = false;
        render();
        startTimer();
    }

    return {
        _state: _state,
        buildCard: buildCard,
        render: render,
        next: next,
        prev: prev,
        goTo: goTo,
        togglePause: togglePause,
        startTimer: startTimer,
        stopTimer: stopTimer,
        wireEvents: wireEvents,
        init: init
    };
})();

// Legacy aliases for backward compatibility with tests
var _spotlightState = Spotlight._state;
/** @see Spotlight.buildCard */
function buildSpotlightCard(p, i, t) { return Spotlight.buildCard(p, i, t); }
/** @see Spotlight.render */
function renderSpotlight() { Spotlight.render(); }
/** @see Spotlight.next */
function nextSpotlight() { return Spotlight.next(); }
/** @see Spotlight.prev */
function prevSpotlight() { return Spotlight.prev(); }
/** @see Spotlight.goTo */
function goToSpotlight(idx) { return Spotlight.goTo(idx); }
/** @see Spotlight.togglePause */
function toggleSpotlightPause() { return Spotlight.togglePause(); }
/** @see Spotlight.startTimer */
function startSpotlightTimer() { Spotlight.startTimer(); }
/** @see Spotlight.stopTimer */
function stopSpotlightTimer() { Spotlight.stopTimer(); }
/** @see Spotlight.wireEvents */
function wireSpotlightEvents() { Spotlight.wireEvents(); }
/** @see Spotlight.init */
function initSpotlight() { Spotlight.init(); }