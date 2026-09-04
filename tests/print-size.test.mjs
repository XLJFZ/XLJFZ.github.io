import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('print calculator covers resolution, crop and complete-image output', async () => {
  const [logic, component, page] = await Promise.all([
    readFile('src/lib/print-size.ts', 'utf8'),
    readFile('src/components/print-size-calculator.tsx', 'utf8'),
    readFile('src/app/tools/print-size/page.tsx', 'utf8'),
  ]);
  assert.match(logic, /effectiveDpi/);
  assert.match(logic, /cropPercent/);
  assert.match(logic, /recommendedPrintDpi/);
  assert.match(component, /最大尺寸/);
  assert.match(component, /完整保留画面/);
  assert.match(component, /当前纸张建议/);
  assert.match(page, /canonical: '\/tools\/print-size\/'/);
});

test('print calculator is included in index, sitemap and static export', async () => {
  const sources = await Promise.all([
    readFile('src/app/tools/page.tsx', 'utf8'),
    readFile('public/sitemap.xml', 'utf8'),
    readFile('scripts/export-github-pages.mjs', 'utf8'),
  ]);
  for (const source of sources) assert.match(source, /tools\/print-size/);
});
