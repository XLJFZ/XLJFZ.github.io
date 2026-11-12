import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Xiamen uses the eleven selected works, verified cameras, and the chosen panorama', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const names = [
    ...source.matchAll(
      /src: '\/portfolio-previews\/urban-pulse\/xiamen-([^']+)-1800.jpg'/g,
    ),
  ].map((m) => m[1]);
  assert.deepEqual(names, [
    'zbz-1460',
    'zbz-1291',
    'zbz-1333-1',
    'zbz-1745',
    'xmn-3351',
    'zbz-1260',
    'zbz-1491',
    'zbz-1188',
    'zbz-1197',
    'zbz-1232',
    'zbz-1589',
  ]);
  assert.match(source, /chapter: '厦门'/);
  assert.match(source, /xiamen-xmn-3351[\s\S]*?camera: 'Nikon Z9'/);
  assert.equal((source.match(/caption: '厦门 · 2026'/g) ?? []).length, 11);
});
