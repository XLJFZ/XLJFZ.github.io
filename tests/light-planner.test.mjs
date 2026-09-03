import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('light planner exposes map, time, lens and export controls', async () => {
  const source = await readFile('src/components/light-planner.tsx', 'utf8');
  assert.match(source, /maplibre-gl/);
  assert.match(source, /SunCalc\.getPosition/);
  assert.match(source, /SunCalc\.getMoonPosition/);
  assert.match(source, /type="range"/);
  assert.match(source, /导出拍摄计划卡/);
  assert.match(source, /canvas\.toDataURL\('image\/png'\)/);
});

test('light planner is included in the tool index, sitemap and static export', async () => {
  const sources = await Promise.all([
    readFile('src/app/tools/page.tsx', 'utf8'),
    readFile('public/sitemap.xml', 'utf8'),
    readFile('scripts/export-github-pages.mjs', 'utf8'),
  ]);
  for (const source of sources) assert.match(source, /tools\/light-planner/);
});
