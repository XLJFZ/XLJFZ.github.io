import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {
  checkAssets,
  inspectImage,
} from '../scripts/check-published-assets.mjs';

test('asset gate rejects portrait oversize, metadata and undecodable images', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-gate-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const plain = sharp({
    create: { width: 8, height: 8, channels: 3, background: '#777' },
  });
  const clean = path.join(root, 'clean.jpg');
  await plain.clone().jpeg().toFile(clean);
  assert.deepEqual(await inspectImage(clean), []);
  const tall = path.join(root, 'tall.jpg');
  await sharp({
    create: { width: 8, height: 4097, channels: 3, background: '#777' },
  })
    .jpeg()
    .toFile(tall);
  assert.ok((await inspectImage(tall)).some((x) => x.includes('long edge')));
  const privateFile = path.join(root, 'private.jpg');
  await plain
    .clone()
    .withExif({ IFD0: { Artist: 'synthetic-test-owner' } })
    .jpeg()
    .toFile(privateFile);
  const findings = await inspectImage(privateFile);
  assert.ok(findings.some((x) => x.includes('metadata')));
  assert.ok(!findings.join().includes('synthetic-test-owner'));
  const broken = path.join(root, 'broken.jpg');
  await writeFile(broken, 'not an image');
  assert.ok((await inspectImage(broken)).some((x) => x.includes('decoded')));
});

test('source and export gates fail on original paths and legacy references', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-gate-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src/lib'), { recursive: true });
  await writeFile(
    path.join(root, 'src/lib/portfolio.ts'),
    "src: '/portfolio-previews/test-8.jpg', width: 8, height: 8",
  );
  for (const folder of ['public', '_site']) {
    await mkdir(path.join(root, folder, 'portfolio-previews'), {
      recursive: true,
    });
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#777' },
    })
      .jpeg()
      .toFile(path.join(root, folder, 'portfolio-previews/test-8.jpg'));
  }
  assert.deepEqual(await checkAssets({ root, tracked: false }), []);
  assert.deepEqual(
    await checkAssets({ root, tracked: false, exported: true }),
    [],
  );
  await writeFile(path.join(root, 'public', 'secret.dng'), 'synthetic');
  await writeFile(
    path.join(root, '_site', 'index.html'),
    '<img src="/portfolio/old.jpg">',
  );
  assert.ok(
    (await checkAssets({ root, tracked: false })).some((x) =>
      x.includes('original asset'),
    ),
  );
  assert.ok(
    (await checkAssets({ root, tracked: false, exported: true })).some((x) =>
      x.includes('legacy'),
    ),
  );
  await writeFile(
    path.join(root, 'src/lib/old.ts'),
    "const image = '/hero-zbz-2714.jpg';",
  );
  assert.ok(
    (await checkAssets({ root, tracked: false })).some((x) =>
      x.includes('legacy'),
    ),
  );
});
