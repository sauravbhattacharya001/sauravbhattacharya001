// ── Theme toggle ────────────────────────────────────────────────────

/**
 * Get the resolved theme: explicit localStorage choice, or system preference,
 * or "dark" as the default.
 * @returns {"dark"|"light"}
 */
function getPreferredTheme() {
    if (typeof localStorage !== "undefined") {
        var stored = localStorage.getItem("theme");
        if (stored === "dark" || stored === "light") return stored;
    }
    if (typeof window !== "undefined" && window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
    }
    return "dark";
}

/**
 * Apply a theme by setting the data-theme attribute on <html> and
 * updating the toggle button icon.
 * @param {"dark"|"light"} theme
 */
function applyTheme(theme) {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.textContent = theme === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F"; // 🌙 or ☀️
        btn.setAttribute("aria-label",
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
}

/**
 * Toggle between dark and light themes.  Persists the choice in localStorage.
 * @returns {"dark"|"light"} The new theme.
 */
function toggleTheme() {
    var current = (typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-theme")) || "dark";
    var next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("theme", next);
    }
    return next;
}

/**
 * Wire up the theme toggle button and apply the initial theme.
 * Also listens for OS-level theme changes when no explicit preference is stored.
 */
function initTheme() {
    applyTheme(getPreferredTheme());

    var btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.addEventListener("click", toggleTheme);
    }

    // Listen for OS-level changes (only when user hasn't set an explicit preference)
    if (typeof window !== "undefined" && window.matchMedia) {
        var mql = window.matchMedia("(prefers-color-scheme: light)");
        if (mql.addEventListener) {
            mql.addEventListener("change", function() {
                if (typeof localStorage !== "undefined" &&
                    localStorage.getItem("theme") !== null) return;
                applyTheme(getPreferredTheme());
            });
        }
    }
}