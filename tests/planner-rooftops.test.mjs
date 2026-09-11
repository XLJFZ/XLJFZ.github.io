import assert from 'node:assert/strict';
import test from 'node:test';
import {
  projectElevatedPoint,
  roofInteriorPoint,
  roofHeight,
} from '../src/lib/planner-rooftops.ts';
test('elevated projection follows camera matrix height and perspective', () => {
  const m = [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0.5, 0, 0, 0, 1];
  assert.deepEqual(projectElevatedPoint(m, { x: 0, y: 0, z: 0 }, 800, 600), {
    x: 400,
    y: 300,
  });
  const high = projectElevatedPoint(m, { x: 0, y: 0, z: 1 }, 800, 600);
  assert.ok(Math.abs(high.y - 100) < 1e-9);
  assert.equal(projectElevatedPoint(m, { x: 0, y: 0, z: -3 }, 800, 600), null);
});
test('roof reference stays inside a concave footprint and outside courtyard', () => {
  const concave = [
    [
      [0, 0],
      [4, 0],
      [4, 1],
      [1, 1],
      [1, 4],
      [0, 4],
      [0, 0],
    ],
  ];
  const p = roofInteriorPoint(concave);
  assert.ok(p.lng < 1 || p.lat < 1);
  const courtyard = [
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ],
    [
      [1, 1],
      [3, 1],
      [3, 3],
      [1, 3],
      [1, 1],
    ],
  ];
  const q = roofInteriorPoint(courtyard);
  assert.ok(q.lng <= 1 || q.lng >= 3 || q.lat <= 1 || q.lat >= 3);
  assert.equal(roofInteriorPoint([]), null);
});
test('roof heights only use usable map values', () => {
  assert.equal(roofHeight({ render_height: 80 }), 80);
  assert.equal(roofHeight({ height: '120' }), 120);
  for (const value of [null, '', false, -1, 'bad'])
    assert.equal(roofHeight({ render_height: value }), null);
  assert.equal(roofHeight({}), null);
});
