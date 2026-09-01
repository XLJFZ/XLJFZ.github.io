import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

test('alternating home series rows keep the image in the wider column', async () => {
  const source = await readFile('src/app/page.tsx', 'utf8');

  assert.match(
    source,
    /index % 2 \? 'md:grid-cols-\[\.55fr_1\.45fr\]' : 'md:grid-cols-\[1\.45fr_\.55fr\]'/,
  );
  assert.doesNotMatch(
    source,
    /md:grid-cols-\[1\.45fr_\.55fr\][^\n]+index % 2/,
    'the base and alternating desktop grids must not conflict',
  );
});

test('the homepage hero uses the user-confirmed Deqin location label', async () => {
  const source = await readFile('src/app/page.tsx', 'utf8');

  assert.match(source, /德钦 · 雪达湖 · 2025/);
  assert.doesNotMatch(source, /梅里雪山（雪达湖）/);
});

test('series listing pages use dedicated lightweight cover previews', async () => {
  const [home, index, detail, portfolio] = await Promise.all([
    readFile('src/app/page.tsx', 'utf8'),
    readFile('src/app/series/page.tsx', 'utf8'),
    readFile('src/app/series/[slug]/page.tsx', 'utf8'),
    readFile('src/lib/portfolio.ts', 'utf8'),
  ]);

  assert.match(home, /item\.preview\.path/);
  assert.match(index, /item\.preview\.path/);
  assert.match(detail, /next\.preview/);
  assert.match(portfolio, /path: '\/covers\/urban-pulse\.jpg'/);
  assert.match(portfolio, /path: '\/covers\/textures-of-time\.jpg'/);
  assert.match(portfolio, /path: '\/covers\/nearby-moments\.jpg'/);

  for (const filename of [
    'urban-pulse.jpg',
    'textures-of-time.jpg',
    'nearby-moments.jpg',
  ]) {
    const asset = await stat(`public/covers/${filename}`);
    assert.ok(asset.size < 1_000_000, `${filename} should stay below 1 MB`);
  }
});
