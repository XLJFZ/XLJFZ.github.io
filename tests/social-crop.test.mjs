import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('social crop tool supports requested ratios, custom crops, local positioning and export', async () => {
  const [source, page, index, sitemap, exporter] = await Promise.all([
    readFile('src/components/social-crop-previewer.tsx', 'utf8'),
    readFile('src/app/tools/social-crop/page.tsx', 'utf8'),
    readFile('src/app/tools/page.tsx', 'utf8'),
    readFile('public/sitemap.xml', 'utf8'),
    readFile('scripts/export-github-pages.mjs', 'utf8'),
  ]);
  for (const ratio of [
    '1:1',
    '4:5',
    '5:7',
    '3:2',
    '16:9',
    '16:10',
    '65:24',
    '2.35:1',
  ])
    assert.ok(source.includes(ratio));
  assert.match(source, /9:16/);
  assert.match(source, /customWidth/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /canvas\.toBlob/);
  assert.match(source, /createZip/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /selectedRatios/);
  assert.match(source, /导出已选/);
  assert.match(source, /全选/);
  assert.match(source, /清空/);
  assert.match(page, /canonical: '\/tools\/social-crop\/'/);
  for (const value of [index, sitemap, exporter])
    assert.match(value, /tools\/social-crop/);
});
