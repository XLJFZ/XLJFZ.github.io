import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('public pages expose canonical metadata and structured site identity', async () => {
  const [layout, about, index, detail] = await Promise.all([
    readFile('src/app/layout.tsx', 'utf8'),
    readFile('src/app/about/page.tsx', 'utf8'),
    readFile('src/app/series/page.tsx', 'utf8'),
    readFile('src/app/series/[slug]/page.tsx', 'utf8'),
  ]);

  assert.match(layout, /alternates: \{ canonical: '\/' \}/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /'@type': 'WebSite'/);
  assert.match(layout, /portfolio\/dsc-2989-shangri-la\.jpg/);
  assert.match(layout, /viewportFit: 'cover'/);
  assert.doesNotMatch(layout, /og\.png/);
  assert.match(about, /canonical: '\/about\/'/);
  assert.match(index, /canonical: '\/series\/'/);
  assert.match(detail, /canonical: `\/series\/\${item\.slug}\/`/);
});

test('the site publishes discovery files for every exported route', async () => {
  const [robots, sitemap] = await Promise.all([
    readFile('public/robots.txt', 'utf8'),
    readFile('public/sitemap.xml', 'utf8'),
  ]);

  assert.match(robots, /Sitemap: https:\/\/xljfz\.github\.io\/sitemap\.xml/);
  for (const route of [
    '/',
    '/about/',
    '/tools/',
    '/tools/photo-habits/',
    '/tools/image-compressor/',
    '/tools/light-planner/',
    '/series/',
    '/series/urban-pulse/',
    '/series/distant-weather/',
    '/series/textures-of-time/',
    '/series/nearby-moments/',
  ]) {
    assert.ok(sitemap.includes(`<loc>https://xljfz.github.io${route}</loc>`));
  }
});

test('keyboard users can skip repeated navigation and reach page content', async () => {
  const files = [
    'src/app/page.tsx',
    'src/app/about/page.tsx',
    'src/app/tools/page.tsx',
    'src/app/series/page.tsx',
    'src/app/series/[slug]/page.tsx',
  ];
  const [layout, ...pages] = await Promise.all([
    readFile('src/app/layout.tsx', 'utf8'),
    ...files.map((file) => readFile(file, 'utf8')),
  ]);

  assert.match(layout, /href="#content"/);
  assert.match(layout, /跳至正文/);
  for (const page of pages) assert.match(page, /id="content"/);
});
