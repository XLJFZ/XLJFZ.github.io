import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function listImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return listImages(target);
      return /\.(jpe?g|png|webp)$/i.test(entry.name) ? [target] : [];
    }),
  );
  return nested.flat();
}

function portfolioRecord(source, filename) {
  const start = source.indexOf(`src: '${filename}'`);
  if (start < 0) return '';
  const end = source.indexOf('}', start);
  return source.slice(start, end);
}

test('series gallery is two-column on desktop and one-column on mobile', async () => {
  const gallery = await readFile('src/components/lightbox-gallery.tsx', 'utf8');
  const page = await readFile('src/app/series/[slug]/page.tsx', 'utf8');

  assert.match(gallery, /grid-cols-1/);
  assert.match(gallery, /md:grid-cols-2/);
  assert.match(gallery, /function buildGalleryRows/);
  assert.match(gallery, /imageOrientation\(image\) === orientation/);
  assert.match(gallery, /image\.height >= image\.width/);
  assert.doesNotMatch(
    gallery,
    /md:mt-\[/,
    'images sharing a desktop row should align at the top',
  );
  assert.match(page, /max-w-\[1480px\]/);
});

test('every portfolio record includes its real pixel dimensions', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const references = [...source.matchAll(/\bsrc: '([^']+)'/g)].map(
    (match) => match[1],
  );

  assert.ok(references.length > 0);
  for (const reference of references) {
    const record = portfolioRecord(source, reference);
    assert.match(
      record,
      /width:\s*\d+,\s*height:\s*\d+/,
      `missing dimensions: ${reference}`,
    );
  }
});

test('every portfolio asset is referenced once and no photographs are duplicated', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const references = [...source.matchAll(/\bsrc: '([^']+)'/g)].map(
    (match) => match[1],
  );
  const files = await listImages('public/portfolio');
  const publicPaths = files.map(
    (file) => `/${file.replaceAll('\\', '/').replace(/^public\//, '')}`,
  );

  assert.equal(
    new Set(references).size,
    references.length,
    'duplicate entries in src/lib/portfolio.ts',
  );
  assert.deepEqual(
    [...references].sort((left, right) => left.localeCompare(right)),
    [...publicPaths].sort((left, right) => left.localeCompare(right)),
  );

  const hashes = await Promise.all(
    files.map(async (file) => {
      const contents = await readFile(file);
      return createHash('sha256').update(contents).digest('hex');
    }),
  );
  assert.equal(
    new Set(hashes).size,
    hashes.length,
    'duplicate image files in public/portfolio',
  );
});

test('user-confirmed dates are retained for the identified photographs', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const confirmedCaptions = [
    [
      '/portfolio/urban-pulse/shanghai-img-173301.jpg',
      "caption: '上海 · 2022'",
    ],
    ['/portfolio/urban-pulse/shanghai-zbz-0216.jpg', "caption: '上海 · 2025'"],
    ['/portfolio/urban-pulse/shanghai-zbz-9081.jpg', "caption: '上海 · 2024'"],
    ['/portfolio/urban-pulse/nanchang-zbz-1447.jpg', "caption: '南昌 · 2024'"],
    ['/portfolio/urban-pulse/nanchang-zbz-1370.jpg', "caption: '南昌 · 2024'"],
    [
      '/portfolio/distant-weather/ninghai-zbz-6273.jpg',
      "caption: '宁海 · 2024'",
    ],
    [
      '/portfolio/distant-weather/ninghai-zbz-6289.jpg',
      "caption: '宁海 · 2024'",
    ],
  ];

  for (const [reference, caption] of confirmedCaptions) {
    const record = portfolioRecord(source, reference);
    assert.ok(record.includes(caption), `${reference} must keep ${caption}`);
  }
});

test('the Meili photograph uses Deqin as its location label', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const record = portfolioRecord(source, '/portfolio/zbz-1242-meili.jpg');

  assert.ok(record.includes("caption: '德钦 · 2025'"));
  assert.match(source, /location: '香格里拉 · 德钦 · 甘南 · 平潭 · 宁海'/);
});

test('series year labels cover the confirmed years of their photographs', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');

  assert.match(source, /slug: 'urban-pulse',[\s\S]*?year: '2022—2026'/);
  assert.match(source, /slug: 'distant-weather',[\s\S]*?year: '2024—2025'/);
  assert.match(source, /slug: 'textures-of-time',[\s\S]*?year: '2025'/);
});

test('series photographs retain the editorial sequence', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const assertOrdered = (filenames) => {
    const positions = filenames.map((filename) =>
      source.indexOf(`src: '${filename}'`),
    );
    assert.ok(positions.every((position) => position >= 0));
    assert.deepEqual(
      positions,
      [...positions].sort((left, right) => left - right),
    );
  };

  assertOrdered([
    '/portfolio/urban-pulse/chongqing-zbz-9292.jpg',
    '/portfolio/urban-pulse/tokyo-zbz-8136.jpg',
    '/portfolio/urban-pulse/shanghai-zbz-8199.jpg',
    '/portfolio/urban-pulse/guangzhou-zbz-6789.jpg',
    '/portfolio/urban-pulse/shenzhen-zbz-7358.jpg',
    '/portfolio/urban-pulse/nanchang-zbz-1447.jpg',
    '/portfolio/urban-pulse/hong-kong-zbz-7859.jpg',
  ]);
  assertOrdered([
    '/portfolio/dsc-2989-shangri-la.jpg',
    '/portfolio/zbz-1242-meili.jpg',
    '/portfolio/distant-weather/gannan-dji-0934.jpg',
    '/portfolio/distant-weather/pingtan-dsc-5082.jpg',
    '/portfolio/distant-weather/ninghai-zbz-6273.jpg',
  ]);
  assertOrdered([
    '/portfolio/textures-of-time/datong-zbz-3752.jpg',
    '/portfolio/textures-of-time/yingxian-zbz-4640.jpg',
    '/portfolio/textures-of-time/jingdezhen-zbz-9983.jpg',
    '/portfolio/textures-of-time/xian-zbz-0868.jpg',
    '/portfolio/textures-of-time/xian-zbz-0861.jpg',
  ]);
});
