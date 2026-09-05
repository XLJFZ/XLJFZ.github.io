import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeCrop } from '../src/lib/crop-export.ts';
const image = { naturalWidth: 100, naturalHeight: 100 };
const crop = { x: 0, y: 0, width: 50, height: 50 };

test('crop rejects missing context without encoding and releases canvas', async () => {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => null,
    toBlob: () => assert.fail('must not encode a blank canvas'),
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => canvas },
  });
  try {
    await assert.rejects(encodeCrop(image, crop), /绘图环境/);
    assert.equal(canvas.width, 0);
    assert.equal(canvas.height, 0);
  } finally {
    delete globalThis.document;
  }
});

test('crop rejects unloaded images and zero-sized crops before allocation', async () => {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => assert.fail('must not allocate') },
  });
  try {
    await assert.rejects(
      encodeCrop({ naturalWidth: 0, naturalHeight: 0 }, crop),
      /尺寸无效/,
    );
    await assert.rejects(
      encodeCrop(image, { ...crop, width: 0.01 }),
      /尺寸无效/,
    );
  } finally {
    delete globalThis.document;
  }
});

test('crop encodes drawn pixels and releases canvas on success or encoder failure', async () => {
  let drawn = false;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: () => {
        drawn = true;
      },
    }),
    toBlob: (callback) => {
      assert.ok(drawn);
      callback(new Blob(['image']));
    },
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => canvas },
  });
  try {
    assert.equal((await encodeCrop(image, crop)).size, 5);
    assert.equal(canvas.width, 0);
    canvas.toBlob = (callback) => callback(null);
    await assert.rejects(encodeCrop(image, crop), /无法生成/);
    assert.equal(canvas.height, 0);
  } finally {
    delete globalThis.document;
  }
});
