import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navigationFiles = [
  'src/components/site-header.tsx',
  'src/app/page.tsx',
  'src/app/series/page.tsx',
  'src/app/series/[slug]/page.tsx',
];

test('internal navigation uses native links in the deployed site', async () => {
  const sources = await Promise.all(
    navigationFiles.map((file) =>
      readFile(new URL(`../${file}`, import.meta.url), 'utf8'),
    ),
  );

  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /from ['"]next\/link['"]/,
      'next/link breaks clicks in the deployed runtime',
    );
  }

  assert.match(sources[0], /<a[^>]+href="\/series\/"[^>]*>\s*作品\s*<\/a>/s);
  assert.match(sources[0], /<a[^>]+href="\/tools\/"[^>]*>\s*工具\s*<\/a>/s);
  assert.match(sources[0], /<a[^>]+href="\/about\/"[^>]*>\s*关于\s*<\/a>/s);
});

test('the shared site header stays fixed above every page without covering content', async () => {
  const header = await readFile('src/components/site-header.tsx', 'utf8');
  assert.match(header, /fixed inset-x-0 top-0 z-40/);
  assert.match(header, /backdrop-blur-md/);
  assert.match(header, /h-\[61px\][\s\S]*md:h-\[81px\]/);
  assert.doesNotMatch(header, /mix-blend-difference/);
});

test('tools navigation opens an index containing every public tool', async () => {
  const source = await readFile(
    new URL('../src/app/tools/page.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /href:\s*'\/tools\/photo-habits\/'/);
  assert.match(source, /href:\s*'\/tools\/image-compressor\/'/);
  assert.match(source, /href:\s*'\/tools\/photo-renamer\/'/);
  assert.match(source, /href:\s*'\/tools\/color-sampler\/'/);
  assert.match(source, /href:\s*'\/tools\/print-size\/'/);
  assert.match(source, /href:\s*'\/tools\/social-crop\/'/);
  assert.match(source, /href:\s*'\/tools\/light-planner\/'/);
  assert.match(source, /摄影习惯分析/);
  assert.match(source, /照片批量压缩/);
  assert.match(source, /智能照片批量命名器/);
  assert.match(source, /色彩样本提取器/);
  assert.match(source, /打印尺寸计算器/);
  assert.match(source, /机位与光线规划器/);
  assert.match(source, /titleLines:\s*\['摄影习惯', '分析'\]/);
  assert.match(source, /titleLines:\s*\['社交平台裁切', '预览器'\]/);
  assert.match(source, /tool\.titleLines\.map/);
});

test('site pages keep their footer at the viewport bottom without an overlay', async () => {
  const [styles, footer] = await Promise.all([
    readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/components/site-footer.tsx', import.meta.url),
      'utf8',
    ),
  ]);

  assert.match(
    styles,
    /main#top\s*{[^}]*display:\s*flex[^}]*min-height:\s*100svh[^}]*flex-direction:\s*column[^}]*}/s,
  );
  assert.match(
    styles,
    /main#top\s*>\s*footer\s*{[^}]*margin-top:\s*auto[^}]*}/s,
  );
  assert.doesNotMatch(footer, /\bfixed\b|\bsticky\b/);
});
