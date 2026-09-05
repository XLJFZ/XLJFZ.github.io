import assert from 'node:assert/strict';
import test from 'node:test';
import {
  sightlineGeometry,
  sceneWidthAtDistance,
  horizontalFov,
} from '../src/lib/shoot-planner.ts';
test('roof-to-roof geometry uses height differences and slant range', () => {
  assert.deepEqual(sightlineGeometry(100, 80, 80), {
    difference: 0,
    distance: 100,
    angle: 0,
  });
  const up = sightlineGeometry(30, 80, 120);
  assert.equal(up.distance, 50);
  assert.ok(Math.abs(up.angle - 53.130102354) < 1e-8);
  assert.equal(sightlineGeometry(30, 120, 80).angle, -up.angle);
  assert.deepEqual(sightlineGeometry(30, 1080, 1120), up);
  assert.equal(sightlineGeometry(0, 0, 20).angle, 90);
  assert.equal(sightlineGeometry(0, 0, 0).distance, 0);
  assert.ok(
    Math.abs(sceneWidthAtDistance(up.distance, horizontalFov(36, 50)) - 36) <
      1e-10,
  );
});
