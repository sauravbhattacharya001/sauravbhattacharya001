/**
 * Validates .github/labeler.yml is well-formed and only references labels
 * that exist on the repository.
 *
 * We avoid adding js-yaml as a dependency just for this — instead we parse
 * the small, controlled subset of YAML we actually use. This keeps the
 * devDependency surface tiny.
 */

const fs = require('fs');
const path = require('path');

const LABELER_PATH = path.join(__dirname, '..', '.github', 'labeler.yml');

/**
 * Allow-list of labels that must exist on the repository. Keep in sync with
 * the actual GitHub labels (see `gh label list`). New entries here also
 * require a `gh label create` invocation.
 */
const ALLOWED_LABELS = new Set([
  'documentation',
  'profile',
  'ci',
  'config',
  'dependencies',
  'modules',
  'design',
  'tests',
  'docker',
  'security',
  'performance',
  'accessibility',
  'rheology',
  'scripts',
  'seo',
]);

/**
 * Parse the labeler.yml file into a map of:
 *   { labelName: string[] of globs }
 *
 * The file has a strict shape:
 *
 *   <label>:
 *     - changed-files:
 *         - any-glob-to-any-file:
 *             - 'glob1'
 *             - 'glob2'
 */
function parseLabelerYaml(text) {
  const lines = text.split(/\r?\n/);
  const result = {};
  let currentLabel = null;
  let inGlobList = false;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;

    // Top-level label: starts at column 0, ends with ':'
    const labelMatch = line.match(/^([A-Za-z][\w-]*):\s*$/);
    if (labelMatch) {
      currentLabel = labelMatch[1];
      result[currentLabel] = [];
      inGlobList = false;
      continue;
    }

    if (!currentLabel) continue;

    // Enter glob list once we hit `any-glob-to-any-file:`
    if (/any-glob-to-any-file:\s*$/.test(line)) {
      inGlobList = true;
      continue;
    }

    if (inGlobList) {
      const globMatch = line.match(/^\s+-\s*['"]?(.+?)['"]?\s*$/);
      if (globMatch && !globMatch[1].endsWith(':')) {
        result[currentLabel].push(globMatch[1]);
        continue;
      }
      // Any new key resets the glob list (handled by labelMatch above).
      inGlobList = false;
    }
  }

  return result;
}

describe('.github/labeler.yml', () => {
  let labelerText;
  let labels;

  beforeAll(() => {
    labelerText = fs.readFileSync(LABELER_PATH, 'utf8');
    labels = parseLabelerYaml(labelerText);
  });

  test('file exists and is non-empty', () => {
    expect(labelerText.length).toBeGreaterThan(0);
    expect(Object.keys(labels).length).toBeGreaterThan(0);
  });

  test('every label uses the v6 changed-files / any-glob-to-any-file shape', () => {
    // A coarse structural check: every label heading must be followed
    // somewhere later by `any-glob-to-any-file:`.
    for (const label of Object.keys(labels)) {
      const pattern = new RegExp(
        `^${label}:\\s*$[\\s\\S]*?any-glob-to-any-file:`,
        'm'
      );
      expect(labelerText).toMatch(pattern);
    }
  });

  test('every label has at least one glob pattern', () => {
    for (const [label, globs] of Object.entries(labels)) {
      expect(globs.length).toBeGreaterThan(0);
      // Diagnostic-friendly failure message:
      if (globs.length === 0) {
        throw new Error(`Label "${label}" has no globs configured`);
      }
    }
  });

  test('every label exists in the allow-list', () => {
    const unknown = Object.keys(labels).filter((l) => !ALLOWED_LABELS.has(l));
    expect(unknown).toEqual([]);
  });

  test('no glob is empty or whitespace-only', () => {
    for (const [label, globs] of Object.entries(labels)) {
      for (const g of globs) {
        expect(typeof g).toBe('string');
        expect(g.trim().length).toBeGreaterThan(0);
        // Globs must not contain stray quotes left over from parsing.
        expect(g).not.toMatch(/^['"]|['"]$/);
        if (!g.trim().length) {
          throw new Error(`Label "${label}" has an empty glob`);
        }
      }
    }
  });

  test('rheology label scopes to rheology assets only', () => {
    expect(labels.rheology).toEqual(
      expect.arrayContaining(['docs/rheology.html'])
    );
    // It must not accidentally claim every HTML file.
    expect(labels.rheology).not.toContain('docs/**/*.html');
  });

  test('dependencies label covers package manifests and Dependabot config', () => {
    expect(labels.dependencies).toEqual(
      expect.arrayContaining([
        'package.json',
        'package-lock.json',
        '.github/dependabot.yml',
      ])
    );
  });

  test('seo label covers sitemap and robots', () => {
    expect(labels.seo).toEqual(
      expect.arrayContaining(['docs/sitemap.xml', 'docs/robots.txt'])
    );
  });
});
