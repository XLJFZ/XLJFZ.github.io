import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import test from 'node:test';

test('source code is consolidated under src and unused UI scaffolding is absent', async () => {
  for (const legacyDirectory of ['app', 'components', 'hooks', 'lib']) {
    await assert.rejects(stat(legacyDirectory));
  }

  const uiFiles = await readdir('src/components/ui');
  assert.deepEqual(uiFiles.sort(), ['button.tsx', 'dialog.tsx', 'toast.tsx']);
});
