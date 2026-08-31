import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
