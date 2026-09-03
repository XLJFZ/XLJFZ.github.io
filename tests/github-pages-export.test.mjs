import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('site metadata can target the GitHub Pages domain at build time', async () => {
  const layout = await readFile('src/app/layout.tsx', 'utf8');
  assert.match(layout, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(layout, /https:\/\/xljfz\.github\.io/);
});

test('exports every public route as GitHub Pages HTML', async () => {
  const { exportPages, routes } =
    await import('../scripts/export-github-pages.mjs');
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-pages-'));

  await exportPages({
    clientDir: 'dist/client',
    outputDir,
    copyClient: false,
    fetchPage: async (route) => `<!doctype html><title>${route}</title>`,
  });

  assert.deepEqual(routes, [
    '/',
    '/about',
    '/tools/image-compressor',
    '/series',
    '/series/urban-pulse',
    '/series/distant-weather',
    '/series/textures-of-time',
    '/series/nearby-moments',
    '/404',
  ]);

  for (const route of routes) {
    const relativePath =
      route === '/404'
        ? '404.html'
        : route === '/'
          ? 'index.html'
          : `${route.slice(1)}/index.html`;
    assert.match(
      await readFile(path.join(outputDir, relativePath), 'utf8'),
      /<!doctype html>/,
    );
  }

  await stat(path.join(outputDir, '.nojekyll'));
});
