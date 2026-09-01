import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
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
  assert.match(gallery, /function pairedWidth/);
  assert.match(gallery, /--gallery-paired-width/);
  assert.match(gallery, /md:w-\[var\(--gallery-paired-width\)\]/);
  assert.doesNotMatch(
    gallery,
    /md:mt-\[/,
    'images sharing a desktop row should align at the top',
  );
  assert.match(page, /max-w-\[1480px\]/);
});

test('long galleries expose editorial chapters without breaking orientation pairing', async () => {
  const gallery = await readFile('src/components/lightbox-gallery.tsx', 'utf8');
  const portfolio = await readFile('src/lib/portfolio.ts', 'utf8');

  assert.match(gallery, /function buildGallerySections/);
  assert.match(gallery, /section\.label/);
  assert.match(gallery, /aria-label="专题章节"/);
  assert.match(gallery, /href={`#chapter-\${sectionIndex \+ 1}`}/);
  assert.match(gallery, /overflow-x-auto/);
  assert.match(gallery, /getBoundingClientRect\(\)\.top/);
  assert.match(gallery, /requestAnimationFrame/);
  assert.match(gallery, /aria-current=/);
  assert.match(
    gallery,
    /scrollIntoView\({ block: 'nearest', inline: 'center' }\)/,
  );
  for (const chapter of [
    '重庆',
    '东京',
    '上海',
    '广州',
    '深圳',
    '南昌',
    '香港',
  ]) {
    assert.match(portfolio, new RegExp(`chapter: '${chapter}'`));
  }
});

test('the lightbox supports touch navigation and adjacent-image preloading', async () => {
  const gallery = await readFile('src/components/lightbox-gallery.tsx', 'utf8');

  assert.match(gallery, /onTouchStart/);
  assert.match(gallery, /onTouchEnd/);
  assert.match(gallery, /new window\.Image\(\)/);
  assert.match(gallery, /左右滑动/);
});

test('lightbox image URLs are shareable and browser back closes the viewer', async () => {
  const gallery = await readFile('src/components/lightbox-gallery.tsx', 'utf8');

  assert.match(gallery, /url\.searchParams\.set\('image', imageKey/);
  assert.match(gallery, /window\.history\.pushState/);
  assert.match(gallery, /window\.history\.replaceState/);
  assert.match(gallery, /window\.history\.back\(\)/);
  assert.match(gallery, /window\.addEventListener\('popstate', syncFromUrl\)/);
});

test('lightbox caption and sequence share one collision-free footer row', async () => {
  const gallery = await readFile('src/components/lightbox-gallery.tsx', 'utf8');

  assert.match(gallery, /flex items-end justify-between gap-5 md:inset-x-7/);
  assert.match(gallery, /className="shrink-0 text-\[10px\]/);
});

test('gallery captions expose a quiet visual sequence counter', async () => {
  const gallery = await readFile('src/components/lightbox-gallery.tsx', 'utf8');

  assert.match(
    gallery,
    /第 \${displayIndex \+ 1} 幅，共 \${displayedItems\.length} 幅/,
  );
  assert.match(gallery, /String\(displayIndex \+ 1\)\.padStart\(2, '0'\)/);
});

test('only the first gallery image receives eager high-priority loading', async () => {
  const gallery = await readFile('src/components/lightbox-gallery.tsx', 'utf8');

  assert.match(gallery, /loading={displayIndex === 0 \? 'eager' : 'lazy'}/);
  assert.match(
    gallery,
    /fetchPriority={displayIndex === 0 \? 'high' : 'auto'}/,
  );
});

test('series pages show work counts and a visual next-series preview', async () => {
  const page = await readFile('src/app/series/[slug]/page.tsx', 'utf8');

  assert.match(page, /item\.images\.length/);
  assert.match(page, /next\.cover/);
  assert.match(page, /下一组作品/);
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

test('the Chongqing hero uses the high-quality web export', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');
  const record = portfolioRecord(
    source,
    '/portfolio/urban-pulse/chongqing-zbz-9292-hq.jpg',
  );
  const asset = await stat(
    'public/portfolio/urban-pulse/chongqing-zbz-9292-hq.jpg',
  );

  assert.match(record, /width:\s*3600,\s*height:\s*2197/);
  assert.ok(asset.size > 1_000_000, 'the low-quality compressed copy returned');
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
  assert.match(source, /slug: 'textures-of-time',[\s\S]*?year: '2025—2026'/);
  assert.match(source, /slug: 'nearby-moments',[\s\S]*?year: '2023—2024'/);
});

test('nearby moments pairs the two confirmed portrait photographs', async () => {
  const source = await readFile('src/lib/portfolio.ts', 'utf8');

  assert.match(
    source,
    /slug: 'nearby-moments',[\s\S]*?location: '上海 · 西安'[\s\S]*?football-zbz-8440\.jpg[\s\S]*?caption: '上海 · 2023'[\s\S]*?cat-img-20240724\.jpg[\s\S]*?caption: '西安 · 2024'/,
  );
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
    '/portfolio/urban-pulse/chongqing-zbz-9292-hq.jpg',
    '/portfolio/urban-pulse/tokyo-zbz-8136.jpg',
    '/portfolio/urban-pulse/shanghai-zbz-8199.jpg',
    '/portfolio/urban-pulse/shanghai-zbz-7974.jpg',
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
    '/portfolio/textures-of-time/huizhou-zbz-6156.jpg',
    '/portfolio/textures-of-time/xian-zbz-0868.jpg',
    '/portfolio/textures-of-time/xian-zbz-0861.jpg',
    '/portfolio/textures-of-time/huizhou-zbz-5682.jpg',
  ]);
});
