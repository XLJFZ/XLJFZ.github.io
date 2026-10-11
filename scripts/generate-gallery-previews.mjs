import { mkdir, readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { previewWidths } from '../src/lib/preview-policy.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot =
  process.env.PORTFOLIO_ORIGINALS_DIR &&
  path.resolve(process.env.PORTFOLIO_ORIGINALS_DIR);
if (!sourceRoot || !path.relative(root, sourceRoot).startsWith('..'))
  throw new Error(
    'Set PORTFOLIO_ORIGINALS_DIR to the originals directory outside this repository.',
  );
const source = await readFile(path.join(root, 'src/lib/portfolio.ts'), 'utf8');
const records = [
  ...source.matchAll(
    /src: '\/portfolio-previews\/([^']+)-\d+\.jpg',\s*width: (\d+),\s*height: (\d+)/g,
  ),
];
if (
  !records.length ||
  records.length !== [...source.matchAll(/\bsrc:/g)].length
)
  throw new Error(
    'Incomplete portfolio records; review the generation input before proceeding.',
  );
const inputs = [];
// Preflight every original before writing anything. Originals are never modified.
for (const [, base, width, height] of records) {
  const original = path.resolve(sourceRoot, `${base}.jpg`);
  if (path.relative(sourceRoot, original).startsWith('..'))
    throw new Error('Invalid original path');
  const meta = await sharp(original).metadata();
  const profileDescription =
    meta.icc?.toString('latin1').replaceAll('\0', '') ?? '';
  if (!/Display\s*P3|sP3/i.test(profileDescription))
    throw new Error(
      `${base}: expected a verified Display P3 JPEG export with embedded ICC; do not convert an old sRGB export automatically`,
    );
  const oriented = meta.autoOrient ?? meta;
  if (oriented.width !== Number(width) || oriented.height !== Number(height))
    throw new Error(
      `${base}: original dimensions do not match the portfolio record`,
    );
  inputs.push({ base, original, width: Number(width), height: Number(height) });
}
const stage = path.join(root, 'outputs', `preview-generation-${Date.now()}`);
const staged = path.join(stage, 'portfolio-previews');
await mkdir(staged, { recursive: true });
let generated = 0;
for (const input of inputs) {
  for (const width of previewWidths(input)) {
    const destination = path.join(staged, `${input.base}-${width}.jpg`);
    await mkdir(path.dirname(destination), { recursive: true });
    await sharp(input.original)
      .pipelineColourspace('rgb16')
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .withIccProfile('p3')
      .jpeg({
        quality: 90,
        chromaSubsampling: '4:4:4',
        progressive: true,
        mozjpeg: true,
      })
      .toFile(destination);
    const metadata = await sharp(destination).metadata();
    if (!metadata.icc || metadata.exif || metadata.xmp || metadata.iptc)
      throw new Error(
        `${input.base}: missing colour profile or unexpected descriptive metadata`,
      );
    generated++;
  }
}
const target = path.join(root, 'public', 'portfolio-previews');
const previous = path.join(stage, 'previous-previews');
// Fixed repository descendants; previous previews remain available for recovery.
await rename(target, previous);
try {
  await rename(staged, target);
} catch (error) {
  await rename(previous, target);
  throw error;
}
console.log(
  `Generated ${generated} previews. Previous previews retained at ${previous}`,
);
console.log(
  'Hero and editorial covers unchanged; replacements require separately verified originals.',
);
