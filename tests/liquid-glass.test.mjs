import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

async function harness({ reduced = false, precise = true } = {}) {
  const source = await readFile(
    'src/components/liquid-glass-surface.tsx',
    'utf8',
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const listeners = new Map();
  const timers = new Map();
  const props = new Map();
  const media = [reduced, precise].map((matches) => ({
    matches,
    addEventListener(_, fn) {
      this.listener = fn;
    },
    removeEventListener() {
      this.listener = null;
    },
  }));
  const target = {
    getBoundingClientRect: () => ({ left: 100, top: 10 }),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const layer = {
    parentElement: target,
    dataset: {},
    style: { setProperty: (key, value) => props.set(key, value) },
  };
  let cleanup;
  let id = 0;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react')
        return {
          useRef: () => ({ current: layer }),
          useEffect: (fn) => {
            cleanup = fn();
          },
        };
      if (name === 'react/jsx-runtime')
        return { jsx: () => null, jsxs: () => null };
      throw new Error(`Unexpected import ${name}`);
    },
    matchMedia: (query) => media[query.includes('reduced') ? 0 : 1],
    requestAnimationFrame: (fn) => {
      timers.set(++id, fn);
      return id;
    },
    cancelAnimationFrame: (key) => timers.delete(key),
  });
  exports.LiquidGlassSurface();
  return {
    layer,
    props,
    listeners,
    timers,
    media,
    cleanup,
    move: (x, y, pointerType = 'mouse') =>
      listeners.get('pointermove')({ clientX: x, clientY: y, pointerType }),
    flush: () => {
      for (const [key, fn] of timers) {
        timers.delete(key);
        fn();
      }
    },
  };
}

test('glass light coalesces input per frame and uses latest local horizontal and vertical position', async () => {
  const h = await harness();
  h.move(125, 15);
  h.move(300, 60);
  assert.equal(h.timers.size, 1);
  h.flush();
  assert.equal(h.props.get('--glass-x'), '200px');
  assert.equal(h.props.get('--glass-y'), '50px');
  assert.equal(h.layer.dataset.lit, 'true');
  h.listeners.get('pointerleave')();
  assert.equal(h.layer.dataset.lit, undefined);
});

test('glass light stays static for touch, reduced motion and coarse pointers', async () => {
  for (const options of [{ reduced: true }, { precise: false }, {}]) {
    const h = await harness(options);
    h.move(
      200,
      30,
      options.reduced || options.precise === false ? 'mouse' : 'touch',
    );
    assert.equal(h.timers.size, 0);
    assert.equal(h.layer.dataset.lit, undefined);
  }
});

test('glass unmount removes local listeners and cancels pending work', async () => {
  const h = await harness();
  h.move(200, 40);
  h.cleanup();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
  assert.ok(h.media.every((entry) => entry.listener === null));
});
