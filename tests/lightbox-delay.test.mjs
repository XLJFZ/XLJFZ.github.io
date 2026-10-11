import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Execute the production callbacks with controlled decode promises. This is a
// navigation unit test, not browser rendering or real-network emulation.
async function harness() {
  const source = await readFile('src/components/lightbox-gallery.tsx', 'utf8');
  const begin = source.indexOf('  const preloadLightboxPreview = useCallback(');
  const end = source.indexOf('  const prev = useCallback(', begin);
  assert.ok(begin >= 0 && end > begin);
  const pending = new Map();
  const state = { active: null, visible: null };
  const context = {
    URL,
    useCallback: (fn) => fn,
    startTransition: (fn) => fn(),
    setActive: (value) => {
      state.active = value;
    },
    setVisible: (value) => {
      state.visible = value;
    },
    activeIndex: { current: null },
    requestedIndex: { current: null },
    navigationToken: { current: 0 },
    previewPreloads: { current: new Map() },
    displayedItems: [0, 1, 2].map((index) => ({
      image: { src: `/photo-${index}-1800.jpg` },
    })),
    galleryPreviewSrc: (image) => image.src.replace('1800', '1200'),
    imageKey: (src) => src.replace('-1800.jpg', ''),
    window: {
      location: { href: 'https://example.test/series/test/#chapter-2' },
      history: {
        state: {},
        pushState(value, _, url) {
          this.state = value;
          context.window.location.href = String(url);
        },
        replaceState(value, _, url) {
          this.state = value;
          context.window.location.href = String(url);
        },
        back() {},
      },
      Image: class {
        decode() {
          return new Promise((resolve, reject) =>
            pending.set(this.src, { resolve, reject }),
          );
        }
      },
    },
  };
  vm.createContext(context);
  const code = ts.transpileModule(
    `${source.slice(begin, end)}\nglobalThis.navigation = { showImage, closeLightbox };`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInContext(code, context);
  const settle = async (index, fail = false) => {
    const entry = pending.get(`/photo-${index}-1200.jpg`);
    assert.ok(entry, 'expected a queued preview decode');
    if (fail) entry.reject(new Error('simulated decode failure'));
    else entry.resolve();
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { ...context.navigation, state, settle, context };
}

test('delayed preview keeps previous frame while selection and URL update immediately', async () => {
  const h = await harness();
  h.showImage(0);
  h.showImage(1);
  assert.equal(h.state.active, 1);
  assert.equal(h.state.visible, 0);
  assert.match(h.context.window.location.href, /photo-1/);
  await h.settle(1);
  assert.equal(h.state.visible, 1);
});

test('out-of-order preview completion cannot overwrite the latest selection', async () => {
  const h = await harness();
  h.showImage(0);
  h.showImage(1);
  h.showImage(2);
  await h.settle(2);
  await h.settle(1);
  assert.equal(h.state.active, 2);
  assert.equal(h.state.visible, 2);
});

test('late preview after close cannot reopen the lightbox', async () => {
  const h = await harness();
  h.showImage(0);
  h.showImage(1);
  h.closeLightbox();
  await h.settle(1);
  assert.equal(h.state.visible, null);
  assert.equal(h.state.active, null);
  assert.equal(new URL(h.context.window.location.href).hash, '#chapter-2');
  assert.equal(new URL(h.context.window.location.href).search, '');
});

test('preview decode rejection settles without a stuck pending navigation', async () => {
  const h = await harness();
  h.showImage(0);
  h.showImage(1);
  await h.settle(1, true);
  assert.equal(h.state.active, 1);
  assert.equal(h.state.visible, 1);
});
