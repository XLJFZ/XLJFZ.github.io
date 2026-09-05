import test from 'node:test';
import assert from 'node:assert/strict';
import { runPhotoBatch } from '../src/lib/photo-batch.ts';

test('batch isolates failures and never reads files concurrently', async () => {
  let active = 0;
  const successes = [],
    progress = [];
  const result = await runPhotoBatch(
    [1, 2, 3],
    async (item) => {
      assert.equal(++active, 1);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      if (item === 2) throw new Error('bad file');
      successes.push(item);
    },
    new AbortController().signal,
    (value) => progress.push(value.done),
  );
  assert.deepEqual(successes, [1, 3]);
  assert.deepEqual(result.failures, [{ item: 2, message: 'bad file' }]);
  assert.deepEqual(result.pending, []);
  assert.deepEqual(progress, [1, 2, 3]);
});

test('cancel preserves remaining files and resume processes only those files', async () => {
  const controller = new AbortController();
  const seen = [];
  const result = await runPhotoBatch(
    [1, 2, 3],
    async (item) => {
      seen.push(item);
    },
    controller.signal,
    ({ done }) => {
      if (done === 1) controller.abort();
    },
  );
  assert.deepEqual(seen, [1]);
  assert.deepEqual(result.pending, [2, 3]);
  await runPhotoBatch(
    result.pending,
    async (item) => {
      seen.push(item);
    },
    new AbortController().signal,
    () => {},
  );
  assert.deepEqual(seen, [1, 2, 3]);
});

test('cancel while reading leaves current file available for retry', async () => {
  const controller = new AbortController();
  const result = await runPhotoBatch(
    [1, 2],
    async () => controller.abort(),
    controller.signal,
    () => assert.fail('cancelled read counted'),
  );
  assert.deepEqual(result.pending, [1, 2]);
});
