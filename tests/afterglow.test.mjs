import test from 'node:test';
import assert from 'node:assert/strict';
import E from '../src/lib/afterglow-engine.mjs';
const row = {
  cloud_cover_low: 10,
  cloud_cover_mid: 40,
  cloud_cover_high: 60,
  visibility: 20000,
  precipitation: 0,
};
function result(id, score, weight, extra = {}) {
  return {
    id,
    name: id,
    score,
    requestedWeight: weight,
    dimensions: E.score(row, [row], 0).dimensions,
    weather: row,
    samples: [
      { distance: 0, row },
      { distance: 30, row },
    ],
    timeline: [{ ...row, time: '2026-10-17T10:00:00Z' }],
    complete: 1,
    spatialCoverage: 1,
    ...extra,
  };
}
test('weighted scores normalize arbitrary totals', () => {
  const d = E.aggregate([result('a', 20, 2), result('b', 80, 1)], 3);
  assert.equal(d.score, 40);
  assert.equal(d.spread, 60);
  assert.equal(d.members[0].effectiveWeight, (2 / 3) * 100);
});
test('failed member gets zero effective weight and lowers coverage', () => {
  const d = E.aggregate(
    [
      result('a', 80, 40),
      { id: 'b', name: 'b', error: 'offline', requestedWeight: 60 },
    ],
    100,
  );
  assert.equal(d.score, 80);
  assert.equal(d.coverage, 0.4);
  assert.equal(d.members[1].effectiveWeight, 0);
  assert.equal(d.spread, null);
});
test('all failed or zero weights cannot fabricate a result', () => {
  assert.throws(() =>
    E.aggregate(
      [{ name: 'offline', error: 'offline', requestedWeight: 100 }],
      100,
    ),
  );
  assert.equal(E.weighted([{ value: 10, weight: 0 }]), null);
});
test('missing visibility excludes only that field and reports its coverage', () => {
  const a = result('a', 80, 40);
  const b = result('b', 60, 60, { weather: { ...row, visibility: null } });
  b.dimensions[3] = { ...b.dimensions[3], value: null };
  const d = E.aggregate([a, b], 100);
  assert.equal(d.weather.visibility, 20000);
  assert.equal(d.dimensions[3].coverage, 0.4);
  assert.equal(d.score, 68);
});
test('cloud obstruction reduces potential', () => {
  assert.ok(
    E.score(row, [row], 0).score >
      E.score(row, [{ ...row, cloud_cover_low: 100 }], 0).score,
  );
});
test('solar equinox and polar day', () => {
  const a = E.astronomy('2026-03-20', 0, 0, 0);
  assert.ok(Math.abs(a.azimuth - 270) < 2);
  assert.match(a.sunset, /T18:/);
  assert.equal(E.astronomy('2026-06-21', 89, 0, 0).sunset, undefined);
});
test('date-zone output includes proper fractional offset', () => {
  const a = E.astronomy('2026-10-17', 27.7, 85.3, 5.75);
  assert.ok(a.sunset.endsWith('+05:45'));
});
test('old or sparse weather is rejected', () => {
  assert.throws(() =>
    E.nearest([{ time: '2026-10-17T00:00Z' }], Date.parse('2026-10-20T00:00Z')),
  );
});
test('zero and invalid fusion weights fail before network request', async () => {
  const base = {
    lat: 24.48,
    lon: 118.08,
    date: '2026-10-17',
    offset: 8,
    provider: 'blend',
  };
  await assert.rejects(
    E.forecast({ ...base, weights: { gfs: 0, icon: 0, met: 0 } }),
    /权重/,
  );
  await assert.rejects(
    E.forecast({ ...base, weights: { gfs: -1, icon: 30, met: 30 } }),
    /权重/,
  );
});
test('missing layers fail rather than counting as clear sky', () => {
  assert.throws(
    () => E.score({ ...row, cloud_cover_high: null }, [row], 0),
    /分层云量/,
  );
});
test('visual potential: clear sky cannot masquerade as spectacular fiery clouds', () => {
  const clear = {
    ...row,
    cloud_cover_low: 0,
    cloud_cover_mid: 0,
    cloud_cover_high: 0,
  };
  assert.equal(E.beauty(clear, [clear], 0).score, 0);
});
test('visual potential: moderate layered clouds beat empty sky and blocked sky', () => {
  const layered = {
    ...row,
    cloud_cover_low: 5,
    cloud_cover_mid: 50,
    cloud_cover_high: 55,
  };
  const clear = { ...layered, cloud_cover_mid: 0, cloud_cover_high: 0 };
  assert.ok(
    E.beauty(layered, [layered], 0).score > E.beauty(clear, [clear], 0).score,
  );
  assert.ok(
    E.beauty(layered, [layered], 0).score >
      E.beauty(layered, [{ ...layered, cloud_cover_low: 95 }], 0).score,
  );
});
test('visual potential rejects missing cloud layers and preserves missing stability', () => {
  assert.throws(() => E.beauty({ ...row, cloud_cover_high: null }, [row], 0));
  assert.equal(E.beauty(row, [row], null).dimensions[3].value, null);
});
test('visual scores use source weights independently of occurrence potential', () => {
  const a = result('a', 80, 40, { beauty: E.beauty(row, [row], 0) });
  const b = result('b', 40, 60, {
    beauty: { ...E.beauty(row, [row], 0), score: 0 },
  });
  const d = E.aggregate([a, b], 100);
  assert.equal(d.beauty.score, Math.round(a.beauty.score * 0.4));
  assert.equal(d.score, 56);
});
test('sunrise uses eastern sun and distinct local event times across longitudes', () => {
  const a = E.astronomy('2026-10-18', 30, 100, 8, 'sunrise'),
    b = E.astronomy('2026-10-18', 30, 120, 8, 'sunrise');
  assert.ok(a.azimuth > 45 && a.azimuth < 135);
  assert.ok(Date.parse(a.sunrise) > Date.parse(b.sunrise));
  assert.ok(Date.parse(a.blue_start) < Date.parse(a.sunrise));
});
test('one blocked ray does not erase two open sightlines', () => {
  const s = [
    { cloud_cover_low: 100, _bearing: 240, _distance: 30 },
    { cloud_cover_low: 0, _bearing: 270, _distance: 30 },
    { cloud_cover_low: 0, _bearing: 300, _distance: 30 },
  ];
  assert.ok(E.corridorClarity(s) > 60);
  assert.equal(E.corridorClarity([{ cloud_cover_low: null }]), null);
});
test('grid covers bounds exactly, while oversized requests are refused', async () => {
  const grid = E.makeGrid([20, 100, 30, 110], 3, 2);
  assert.equal(grid.length, 6);
  assert.deepEqual(grid[0].bounds[0], [20, 100]);
  assert.deepEqual(grid[5].bounds[1], [30, 110]);
  assert.throws(() => E.makeGrid([20, 110, 30, 100]));
  await assert.rejects(
    E.regional({
      bounds: [20, 100, 30, 110],
      cols: 20,
      rows: 20,
      date: '2026-10-18',
      offset: 8,
    }),
    /63格/,
  );
});
test('regional evaluates actual grid rows at each own event, never demo data', async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async (url) => {
    calls++;
    const q = new URL(String(url)).searchParams,
      count = q.get('latitude').split(',').length;
    const day = q.get('start_date');
    const times = Array.from(
      { length: 24 },
      (_, i) => day + 'T' + String(i).padStart(2, '0') + ':00',
    );
    return {
      ok: true,
      headers: { get: () => null },
      json: async () =>
        Array.from({ length: count }, () => ({
          hourly: {
            time: times,
            cloud_cover_low: times.map(() => 10),
            cloud_cover_mid: times.map(() => 40),
            cloud_cover_high: times.map(() => 55),
            relative_humidity_2m: times.map(() => 50),
            visibility: times.map(() => 20000),
            precipitation: times.map(() => 0),
            wind_speed_10m: times.map(() => 10),
          },
        })),
    };
  };
  try {
    const d = await E.regional({
      bounds: [25, 110, 27, 112],
      cols: 2,
      rows: 2,
      date: '2026-10-18',
      offset: 8,
    });
    assert.equal(d.cells.length, 4);
    assert.equal(d.sampleCount, 28);
    assert.equal(calls, 1);
    assert.ok(
      d.cells.every(
        (c) => !c.error && Number.isFinite(c.beauty) && c.coverage === 1,
      ),
    );
    assert.notEqual(d.cells[0].time, d.cells[1].time);
  } finally {
    global.fetch = original;
  }
});
