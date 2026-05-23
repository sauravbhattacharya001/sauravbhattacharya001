/**
 * Walk every markdown file in docs-dev/ and assert that:
 *  - Every relative link target exists on disk.
 *  - No page is orphaned (every page is reachable from README.md or
 *    mkdocs.yml's nav).
 *
 * This is a structural test only; it doesn't validate prose.
 */

const fs = require('fs');
const path = require('path');

const DOCS_DEV = path.join(__dirname, '..', 'docs-dev');
const REPO_ROOT = path.join(__dirname, '..');

function listMarkdownFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .map((f) => path.join(dir, f));
}

function extractRelativeLinks(markdown) {
  // Match `[text](target)` and capture target. Skip auto-links and code spans.
  const out = [];
  const re = /\[(?:[^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function isExternal(link) {
  return (
    /^https?:\/\//i.test(link) ||
    link.startsWith('mailto:') ||
    link.startsWith('#') ||
    link.startsWith('tel:')
  );
}

function resolveTarget(fromFile, link) {
  // Strip fragment.
  const [pathPart] = link.split('#');
  if (!pathPart) return null; // pure anchor — handled by isExternal
  return path.resolve(path.dirname(fromFile), pathPart);
}

describe('docs-dev/ link integrity', () => {
  const files = listMarkdownFiles(DOCS_DEV);

  test('docs-dev/ contains the expected entry points', () => {
    const names = files.map((f) => path.basename(f)).sort();
    expect(names).toEqual(
      expect.arrayContaining([
        'README.md',
        'architecture.md',
        'ci.md',
        'deploy.md',
        'development.md',
        'glossary.md',
        'modules.md',
        'releases.md',
        'security.md',
        'testing.md',
      ])
    );
  });

  test.each(listMarkdownFiles(DOCS_DEV))(
    '%s — every relative link resolves to a real file',
    (file) => {
      const text = fs.readFileSync(file, 'utf8');
      const links = extractRelativeLinks(text).filter((l) => !isExternal(l));

      const broken = [];
      for (const link of links) {
        const target = resolveTarget(file, link);
        if (!target) continue;
        // Allow links into the repo root (e.g. ../CONTRIBUTING.md).
        const resolved = path.resolve(target);
        const inRepo = resolved.startsWith(path.resolve(REPO_ROOT));
        if (!inRepo) continue;
        if (!fs.existsSync(resolved)) {
          broken.push({ link, resolved });
        }
      }

      if (broken.length) {
        const msg = broken
          .map((b) => `  ${b.link}  →  ${b.resolved}`)
          .join('\n');
        throw new Error(`Broken relative links in ${file}:\n${msg}`);
      }
    }
  );

  test('every docs-dev/*.md is referenced from README.md', () => {
    const readme = fs.readFileSync(path.join(DOCS_DEV, 'README.md'), 'utf8');
    const referenced = new Set(
      extractRelativeLinks(readme)
        .filter((l) => !isExternal(l))
        .map((l) => l.split('#')[0])
        .filter((l) => l.endsWith('.md'))
    );

    const orphaned = files
      .map((f) => path.basename(f))
      .filter((name) => name !== 'README.md')
      .filter((name) => !referenced.has(name));

    expect(orphaned).toEqual([]);
  });
});
