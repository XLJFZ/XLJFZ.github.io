import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Execute the production callbacks with controlled decode promises. This is a
// navigation unit test, not browser rendering or real-network emulation.
async function harness() {
  const source = (
    await readFile('src/components/lightbox-gallery.tsx', 'utf8')
  ).replaceAll('\r\n', '\n');
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
    setShowOverview: () => {},
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

// Run the actual loading effects with controlled timers and pending neighbor requests.
async function loadingHarness({
  active = 0,
  visible = 0,
  count = 3,
  loadedDetail = null,
} = {}) {
  const source = (
    await readFile('src/components/lightbox-gallery.tsx', 'utf8')
  ).replaceAll('\r\n', '\n');
  const begin = source.indexOf('  // Current detail never waits');
  const end = source.indexOf(
    '  useEffect(() => {\n    if (active === null) return;\n    const src = displayedItems[active].image.src;\n    let idleId',
    begin,
  );
  assert.ok(begin >= 0 && end > begin);
  const timers = new Map();
  const cleanups = [];
  const calls = [];
  const state = { detail: null };
  const context = {
    active,
    visible,
    loadedDetail,
    failedDetail: null,
    displayedItems: Array.from({ length: count }, (_, i) => ({
      image: { src: `photo-${i}` },
    })),
    useEffect: (fn) => {
      const cleanup = fn();
      if (cleanup) cleanups.push(cleanup);
    },
    setDetailRequest: (src) => {
      state.detail = src;
    },
    preloadLightboxPreview: (image, priority) => {
      calls.push({ src: image.src, priority });
      return new Promise(() => {});
    },
    window: {
      setTimeout: (fn, ms) => {
        timers.set(fn, ms);
        return fn;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  };
  vm.createContext(context);
  vm.runInContext(
    ts.transpileModule(source.slice(begin, end), {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
  );
  return {
    calls,
    state,
    timers,
    cleanup: () => cleanups.forEach((fn) => fn()),
  };
}

test('current detail starts without waiting for neighbors, including single-photo galleries', async () => {
  for (const count of [1, 2, 35]) {
    const h = await loadingHarness({ count });
    assert.equal(h.calls.length, 0);
    assert.deepEqual([...h.timers.values()], [180]);
    for (const fn of h.timers.keys()) fn();
    assert.equal(h.state.detail, 'photo-0');
  }
});

test('neighbor decodes can remain pending while current detail advances', async () => {
  const h = await loadingHarness({ loadedDetail: 'photo-0' });
  assert.deepEqual(
    h.calls.map((c) => [c.src, c.priority]),
    [
      ['photo-2', 'low'],
      ['photo-1', 'low'],
    ],
  );
  for (const fn of h.timers.keys()) fn();
  assert.equal(h.state.detail, 'photo-0');
});

test('switching and closing cancel a pending detail request', async () => {
  const h = await loadingHarness();
  h.cleanup();
  assert.equal(h.timers.size, 0);
  assert.equal(
    (await loadingHarness({ active: null, visible: null })).timers.size,
    0,
  );
  assert.equal(
    (await loadingHarness({ active: 1, visible: 0 })).timers.size,
    0,
  );
});

test('small galleries do not preload the current image or duplicate neighbors', async () => {
  assert.equal(
    (await loadingHarness({ count: 1, loadedDetail: 'photo-0' })).calls.length,
    0,
  );
  const h = await loadingHarness({ count: 2, loadedDetail: 'photo-0' });
  assert.deepEqual(
    h.calls.map((c) => c.src),
    ['photo-1'],
  );
});
