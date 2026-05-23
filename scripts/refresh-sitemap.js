#!/usr/bin/env node
/**
 * scripts/refresh-sitemap.js
 *
 * Regenerates `docs/sitemap.xml` so the `<lastmod>` for each URL
 * reflects the most recent git commit that touched the corresponding
 * HTML file. Run manually before a release, or wire it into CI to keep
 * the sitemap honest without hand-editing it.
 *
 * Usage:
 *   node scripts/refresh-sitemap.js
 *   node scripts/refresh-sitemap.js --check   # exit 1 if stale, no write
 *
 * Why a script instead of a date-in-CI? GitHub Pages doesn't run the
 * sitemap through a build, and stale `<lastmod>` values actively hurt
 * crawl behaviour. A small node script with zero deps keeps the repo
 * free of bundlers (see docs/modules/README.md "Why no bundler?").
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const SITEMAP_PATH = path.join(REPO_ROOT, "docs", "sitemap.xml");
const BASE_URL = "https://sauravbhattacharya001.github.io/sauravbhattacharya001/";

/**
 * Each entry maps a sitemap URL suffix to the docs-relative HTML file
 * whose git mtime should drive its `<lastmod>`.
 */
const URLS = [
    { suffix: "",              file: "docs/index.html",    changefreq: "weekly",  priority: "1.0" },
    { suffix: "rheology.html", file: "docs/rheology.html", changefreq: "monthly", priority: "0.7" },
];

/**
 * Return the ISO date (YYYY-MM-DD) of the last commit that touched
 * `relPath`. Falls back to the filesystem mtime when the file has no
 * git history (e.g. brand-new uncommitted file).
 */
function lastCommitDate(relPath) {
    try {
        const out = execFileSync(
            "git",
            ["log", "-1", "--format=%ad", "--date=short", "--", relPath],
            { cwd: REPO_ROOT, encoding: "utf-8" }
        ).trim();
        if (out) return out;
    } catch (_) {
        // git not available or file missing from history — fall through.
    }
    const stat = fs.statSync(path.join(REPO_ROOT, relPath));
    return stat.mtime.toISOString().slice(0, 10);
}

function buildSitemap() {
    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const u of URLS) {
        lines.push("  <url>");
        lines.push("    <loc>" + BASE_URL + u.suffix + "</loc>");
        lines.push("    <lastmod>" + lastCommitDate(u.file) + "</lastmod>");
        lines.push("    <changefreq>" + u.changefreq + "</changefreq>");
        lines.push("    <priority>" + u.priority + "</priority>");
        lines.push("  </url>");
    }
    lines.push("</urlset>");
    return lines.join("\n") + "\n";
}

function main() {
    const check = process.argv.includes("--check");
    const next = buildSitemap();
    const current = fs.existsSync(SITEMAP_PATH)
        ? fs.readFileSync(SITEMAP_PATH, "utf-8")
        : "";
    if (next === current) {
        process.stdout.write("sitemap.xml: up to date\n");
        return 0;
    }
    if (check) {
        process.stderr.write(
            "sitemap.xml is stale. Run `node scripts/refresh-sitemap.js`.\n"
        );
        return 1;
    }
    fs.writeFileSync(SITEMAP_PATH, next);
    process.stdout.write("sitemap.xml: updated\n");
    return 0;
}

if (require.main === module) {
    process.exit(main());
}

module.exports = { buildSitemap, lastCommitDate, URLS };
