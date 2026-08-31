import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('alternating home series rows keep the image in the wider column', async () => {
  const source = await readFile('app/page.tsx', 'utf8');

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
