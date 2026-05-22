/**
 * tests/html-helpers.test.js — Tests for docs/modules/html-helpers.js
 *
 * Covers escapeHTML() and sanitizeURL() — the two security-critical
 * sanitisation primitives used across the portfolio renderer. They had
 * indirect coverage from rendering tests but no direct unit tests for
 * their behaviour against malicious / edge-case inputs.
 *
 * Loaded via the shared loadApp() helper so we exercise the production
 * code path (concatenated modules in load order) rather than a copy.
 */

const { loadApp } = require("./helpers/load-app");

let dom;
let win;

beforeAll(() => {
    dom = loadApp();
    win = dom.window;
});

afterAll(() => {
    dom.window.close();
});

describe("escapeHTML", () => {
    test("escapes all five HTML special characters", () => {
        expect(win.escapeHTML("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&#39;");
    });

    test("escapes ampersand first to avoid double-encoding", () => {
        // If '&' were escaped after '<', the resulting '&lt;' would become '&amp;lt;'.
        expect(win.escapeHTML("<&>")).toBe("&lt;&amp;&gt;");
    });

    test("leaves benign text untouched", () => {
        expect(win.escapeHTML("Hello, world! 123 — café 🚀")).toBe(
            "Hello, world! 123 — café 🚀"
        );
    });

    test("escapes a script-injection payload", () => {
        expect(win.escapeHTML("<script>alert('xss')</script>")).toBe(
            "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
        );
    });

    test("escapes attribute-breakout payloads (both quote styles)", () => {
        expect(win.escapeHTML('" onerror="alert(1)')).toBe(
            "&quot; onerror=&quot;alert(1)"
        );
        expect(win.escapeHTML("' onerror='alert(1)")).toBe(
            "&#39; onerror=&#39;alert(1)"
        );
    });

    test("coerces non-string inputs to string before escaping", () => {
        expect(win.escapeHTML(42)).toBe("42");
        expect(win.escapeHTML(null)).toBe("null");
        expect(win.escapeHTML(undefined)).toBe("undefined");
        expect(win.escapeHTML(true)).toBe("true");
        // Object → "[object Object]" → no special chars → unchanged
        expect(win.escapeHTML({})).toBe("[object Object]");
    });

    test("returns empty string for empty input", () => {
        expect(win.escapeHTML("")).toBe("");
    });

    test("escapes every occurrence, not just the first", () => {
        expect(win.escapeHTML("<<<>>>")).toBe("&lt;&lt;&lt;&gt;&gt;&gt;");
    });
});

describe("sanitizeURL", () => {
    // ── allowed schemes ────────────────────────────────────────────

    test("allows plain https URLs", () => {
        expect(win.sanitizeURL("https://example.com")).toBe(
            "https://example.com"
        );
    });

    test("allows plain http URLs", () => {
        expect(win.sanitizeURL("http://example.com/path?q=1")).toBe(
            "http://example.com/path?q=1"
        );
    });

    test("allows mailto: URLs", () => {
        expect(win.sanitizeURL("mailto:me@example.com")).toBe(
            "mailto:me@example.com"
        );
    });

    test("preserves original character case (scheme check is case-insensitive)", () => {
        // Internal lowercase is for the scheme check only; the returned
        // URL must keep the original case so it can be used verbatim.
        expect(win.sanitizeURL("HTTPS://Example.com/Path")).toBe(
            "HTTPS://Example.com/Path"
        );
    });

    test("trims leading whitespace before scheme detection", () => {
        expect(win.sanitizeURL("   https://example.com")).toBe(
            "https://example.com"
        );
        expect(win.sanitizeURL("\t\nhttps://example.com")).toBe(
            "https://example.com"
        );
    });

    test("escapes HTML special chars in otherwise-valid URLs", () => {
        // Query string with an ampersand must be entity-encoded so the
        // result is safe to drop into an href="…" attribute.
        expect(win.sanitizeURL("https://example.com/?a=1&b=2")).toBe(
            "https://example.com/?a=1&amp;b=2"
        );
        expect(win.sanitizeURL('https://example.com/?x="bad"')).toBe(
            "https://example.com/?x=&quot;bad&quot;"
        );
    });

    // ── blocked schemes ────────────────────────────────────────────

    test("blocks javascript: URLs", () => {
        expect(win.sanitizeURL("javascript:alert(1)")).toBe("#");
        expect(win.sanitizeURL("JavaScript:alert(1)")).toBe("#");
        expect(win.sanitizeURL("  javascript:alert(1)")).toBe("#");
    });

    test("blocks data: URLs", () => {
        expect(
            win.sanitizeURL("data:text/html,<script>alert(1)</script>")
        ).toBe("#");
    });

    test("blocks vbscript:, file:, ftp:, and other unlisted schemes", () => {
        expect(win.sanitizeURL("vbscript:msgbox(1)")).toBe("#");
        expect(win.sanitizeURL("file:///etc/passwd")).toBe("#");
        expect(win.sanitizeURL("ftp://example.com/file")).toBe("#");
        expect(win.sanitizeURL("about:blank")).toBe("#");
    });

    test("rejects http: / https: without an authority", () => {
        // "http:" alone, no "//", no host.
        expect(win.sanitizeURL("http:foo")).toBe("#");
        // "scheme://" with empty host.
        expect(win.sanitizeURL("https://")).toBe("#");
        expect(win.sanitizeURL("http://")).toBe("#");
    });

    test("blocks relative paths and bare strings", () => {
        expect(win.sanitizeURL("/foo/bar")).toBe("#");
        expect(win.sanitizeURL("foo")).toBe("#");
        expect(win.sanitizeURL("")).toBe("#");
    });

    // ── obfuscation strips ─────────────────────────────────────────

    test("strips embedded control characters that browsers ignore", () => {
        // Browsers ignore tabs / newlines / null bytes inside href values,
        // so "jav\tascript:" would still execute without this strip.
        expect(win.sanitizeURL("jav\tascript:alert(1)")).toBe("#");
        expect(win.sanitizeURL("java\nscript:alert(1)")).toBe("#");
        expect(win.sanitizeURL("java\x00script:alert(1)")).toBe("#");
        expect(win.sanitizeURL("java\x7Fscript:alert(1)")).toBe("#");
    });

    test("strips zero-width Unicode characters before scheme check", () => {
        // U+200B ZERO WIDTH SPACE
        expect(win.sanitizeURL("ja\u200Bvascript:alert(1)")).toBe("#");
        // U+FEFF BOM
        expect(win.sanitizeURL("\uFEFFjavascript:alert(1)")).toBe("#");
        // U+200E LRM
        expect(win.sanitizeURL("java\u200Escript:alert(1)")).toBe("#");
        // U+00AD SOFT HYPHEN
        expect(win.sanitizeURL("java\u00ADscript:alert(1)")).toBe("#");
    });

    test("strips bidirectional override characters (CWE-1007)", () => {
        // U+202E RIGHT-TO-LEFT OVERRIDE — classic visual-spoof primitive.
        expect(win.sanitizeURL("\u202Ejavascript:alert(1)")).toBe("#");
        expect(win.sanitizeURL("java\u202Ascript:alert(1)")).toBe("#");
        expect(win.sanitizeURL("java\u2066script:alert(1)")).toBe("#");
    });

    test("strips line/paragraph separators", () => {
        expect(win.sanitizeURL("java\u2028script:alert(1)")).toBe("#");
        expect(win.sanitizeURL("java\u2029script:alert(1)")).toBe("#");
    });

    test("strips zero-width chars from inside an allowed URL without breaking it", () => {
        // The zero-width chars get stripped, so the URL is preserved and
        // still recognised as https.
        expect(win.sanitizeURL("https://exa\u200Bmple.com")).toBe(
            "https://example.com"
        );
        expect(win.sanitizeURL("https://example.com/\u202Apath")).toBe(
            "https://example.com/path"
        );
    });

    test("rejects scheme-only inputs", () => {
        expect(win.sanitizeURL("http:")).toBe("#");
        expect(win.sanitizeURL("https:")).toBe("#");
    });

    test("does not throw on weird-but-string-coercible inputs (string only)", () => {
        // sanitizeURL contractually takes a string; ensure typical defensive
        // call-sites won't crash on empty input.
        expect(() => win.sanitizeURL("")).not.toThrow();
        expect(() => win.sanitizeURL("https://example.com")).not.toThrow();
    });
});
