import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { routes } from './export-github-pages.mjs';

// These are document-size budgets, not claims about user-visible load time.
const budgets = new Map([
  ['/', 65000],
  ['/series/urban-pulse', 125000],
]);
const stylesheets = new Set();
const measurements = [];
for (const route of routes) {
  const relative =
    route === '/404'
      ? '404.html'
      : route === '/'
        ? 'index.html'
        : `${route.slice(1)}/index.html`;
  const html = await readFile(path.join('_site', relative), 'utf8');
  assert.doesNotMatch(
    html,
    /<style\b[^>]*data-vinext-fonts/,
    `${route}: inline fonts returned`,
  );
  const links = [
    ...html.matchAll(
      /<link rel="stylesheet" href="(\/_next\/static\/fonts\/fonts-([a-f0-9]{64})\.css)" data-vinext-fonts>/g,
    ),
  ];
  assert.equal(
    links.length,
    1,
    `${route}: expected one cached font stylesheet`,
  );
  const [, href, hash] = links[0];
  const css = await readFile(path.join('_site', href.slice(1)));
  assert.equal(createHash('sha256').update(css).digest('hex'), hash);
  stylesheets.add(href);
  const bytes = Buffer.byteLength(html);
  if (budgets.has(route))
    assert.ok(
      bytes <= budgets.get(route),
      `${route}: ${bytes} exceeds document budget ${budgets.get(route)}`,
    );
  measurements.push({
    route,
    htmlBytes: bytes,
    htmlGzipBytes: gzipSync(html).length,
  });
}
assert.equal(
  stylesheets.size,
  1,
  'Public pages should reuse the same font CSS',
);
console.table(measurements);
console.log(
  'Performance gate passed: document budgets, shared font CSS, and content hashes.',
);
