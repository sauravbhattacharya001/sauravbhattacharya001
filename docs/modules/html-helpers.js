/**
 * Escape HTML entities to prevent XSS.
 *
 * Pure regex replacement — faster than the previous DOM-based approach
 * (textContent → innerHTML → regex) because it avoids DOM writes, forced
 * serialization, and works identically in non-browser environments
 * (tests, SSR).  The compiled regex and lookup map are allocated once.
 *
 * Escapes &, <, >, double-quote, and single-quote (&#39; — defense-in-depth
 * for single-quoted attribute delimiters, CWE-79).
 *
 * @param {string} str
 * @returns {string}
 */
var _escapeRe = /[&<>"']/g;
var _escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };
/**
 * Escape HTML special characters to prevent XSS in rendered content.
 * @param {string} str - Raw string to escape.
 * @returns {string} HTML-safe string with &, <, >, ", ' replaced by entities.
 */
function escapeHTML(str) {
    return String(str).replace(_escapeRe, function(ch) { return _escapeMap[ch]; });
}

/**
 * Sanitize a URL to prevent javascript: protocol and attribute breakout.
 * Only allows http:, https:, and mailto: schemes.
 *
 * Strips ASCII control characters (0x00-0x1F, 0x7F), zero-width Unicode
 * characters (U+200B-U+200F, U+FEFF, U+00AD), Unicode bidirectional
 * override/embedding characters (U+202A-U+202E, U+2066-U+2069), and
 * Unicode line/paragraph separators before checking the scheme.
 *
 * Browsers silently ignore embedded tabs, newlines, null bytes, and
 * zero-width chars when parsing href values, so "ja\u200Bvascript:alert(1)"
 * would execute without this defence.  Bidirectional overrides (CWE-1007)
 * can visually disguise malicious URLs as legitimate ones by reordering
 * rendered text direction.  See also CWE-116 (Improper Encoding or
 * Escaping of Output).
 *
 * Additionally validates that http:/https: URLs contain a valid authority
 * (at least "scheme://host") and rejects bare "http:" without "//".
 *
 * @param {string} url
 * @returns {string}
 */
var _sanitizeStripRe = /[\x00-\x1F\x7F\u00AD\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g;
/**
 * Sanitize a URL by stripping control characters, zero-width Unicode,
 * and bidi overrides. Only allows http/https schemes.
 * @param {string} url - Raw URL to sanitize.
 * @returns {string} Cleaned URL, or empty string if unsafe.
 */
function sanitizeURL(url) {
    // Strip control chars, zero-width Unicode, bidi overrides, and separators
    var cleaned = url.replace(_sanitizeStripRe, "");
    var trimmed = cleaned.replace(/^\s+/, "").toLowerCase();
    if (trimmed.indexOf("https://") === 0 ||
        trimmed.indexOf("http://") === 0) {
        // Require at least one char after "scheme://" (i.e. a host)
        var slashIdx = trimmed.indexOf("://");
        if (trimmed.length > slashIdx + 3) {
            return escapeHTML(cleaned.replace(/^\s+/, ""));
        }
        return "#";
    }
    if (trimmed.indexOf("mailto:") === 0) {
        return escapeHTML(cleaned.replace(/^\s+/, ""));
    }
    return "#";
}
