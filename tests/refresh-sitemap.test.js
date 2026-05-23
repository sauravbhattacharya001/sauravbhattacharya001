/**
 * tests/refresh-sitemap.test.js — Unit tests for scripts/refresh-sitemap.js
 *
 * The script regenerates docs/sitemap.xml from git mtimes so the
 * `<lastmod>` values stay honest. We don't want to drift away from the
 * actual deployed file, so these tests assert the shape of the output
 * and that `lastCommitDate` returns an ISO date.
 */

const path = require("path");
const { buildSitemap, lastCommitDate, URLS } = require(
    path.join("..", "scripts", "refresh-sitemap.js")
);

describe("scripts/refresh-sitemap.js", () => {
    test("URLS list contains the two known pages", () => {
        expect(URLS.length).toBe(2);
        expect(URLS[0].file).toBe("docs/index.html");
        expect(URLS[1].file).toBe("docs/rheology.html");
    });

    test("lastCommitDate returns an ISO YYYY-MM-DD string", () => {
        const date = lastCommitDate("docs/index.html");
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("buildSitemap emits a single <urlset> with one <url> per entry", () => {
        const xml = buildSitemap();
        expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
        const urlsetCount = (xml.match(/<urlset/g) || []).length;
        const urlCount = (xml.match(/<url>/g) || []).length;
        expect(urlsetCount).toBe(1);
        expect(urlCount).toBe(URLS.length);
    });

    test("buildSitemap references the production GitHub Pages origin", () => {
        const xml = buildSitemap();
        expect(xml).toMatch(
            /https:\/\/sauravbhattacharya001\.github\.io\/sauravbhattacharya001\//
        );
    });

    test("every <lastmod> is a valid ISO date", () => {
        const xml = buildSitemap();
        const matches = xml.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
        expect(matches.length).toBe(URLS.length);
        matches.forEach((m) => {
            expect(m).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
        });
    });
});
