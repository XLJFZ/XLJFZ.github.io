import { readdir, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const sourceRoot = path.join(projectRoot, 'public', 'portfolio');
const outputRoot = path.join(projectRoot, 'public', 'portfolio-previews');
const widths = [1200, 1800];
const heroSource = path.join(projectRoot, 'public', 'hero-zbz-2714.jpg');
const heroOutputRoot = path.join(projectRoot, 'public', 'hero-previews');
const heroWidths = [1280, 2200];
const responsiveCovers = [
  {
    source: path.join(projectRoot, 'public', 'covers', 'urban-pulse.jpg'),
    output: 'urban-pulse-1200.jpg',
  },
  {
    source: path.join(
      projectRoot,
      'public',
      'portfolio',
      'dsc-2989-shangri-la.jpg',
    ),
    output: 'distant-weather-1200.jpg',
  },
  {
    source: path.join(projectRoot, 'public', 'covers', 'textures-of-time.jpg'),
    output: 'textures-of-time-1200.jpg',
  },
  {
    source: path.join(projectRoot, 'public', 'covers', 'nearby-moments.jpg'),
    output: 'nearby-moments-1200.jpg',
  },
];

async function findImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const images = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) images.push(...(await findImages(entryPath)));
    if (entry.isFile() && /\.(?:jpe?g|png)$/i.test(entry.name)) {
      images.push(entryPath);
    }
  }
  return images;
}

async function main() {
  const expectedOutput = path.join(projectRoot, 'public', 'portfolio-previews');
  const expectedHeroOutput = path.join(projectRoot, 'public', 'hero-previews');
  if (path.resolve(outputRoot) !== path.resolve(expectedOutput)) {
    throw new Error(`Unexpected preview output path: ${outputRoot}`);
  }
  if (path.resolve(heroOutputRoot) !== path.resolve(expectedHeroOutput)) {
    throw new Error(`Unexpected hero output path: ${heroOutputRoot}`);
  }

  await rm(outputRoot, { recursive: true, force: true });
  await rm(heroOutputRoot, { recursive: true, force: true });
  const images = await findImages(sourceRoot);
  let sourceBytes = 0;
  let previewBytes = 0;

  for (const imagePath of images) {
    sourceBytes += (await stat(imagePath)).size;
    const relativePath = path.relative(sourceRoot, imagePath);
    const relativeBase = relativePath.replace(/\.[^.]+$/, '');

    for (const width of widths) {
      const destination = path.join(outputRoot, `${relativeBase}-${width}.jpg`);
      await mkdir(path.dirname(destination), { recursive: true });
      const result = await sharp(imagePath)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .jpeg({
          quality: 90,
          chromaSubsampling: '4:4:4',
          progressive: true,
          mozjpeg: true,
        })
        .toFile(destination);
      previewBytes += result.size;
    }
  }

  for (const width of heroWidths) {
    const destination = path.join(heroOutputRoot, `hero-zbz-2714-${width}.jpg`);
    await mkdir(heroOutputRoot, { recursive: true });
    const result = await sharp(heroSource)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({
        quality: 90,
        chromaSubsampling: '4:4:4',
        progressive: true,
        mozjpeg: true,
      })
      .toFile(destination);
    previewBytes += result.size;
  }

  for (const cover of responsiveCovers) {
    const destination = path.join(
      projectRoot,
      'public',
      'covers',
      cover.output,
    );
    const result = await sharp(cover.source)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({
        quality: 90,
        chromaSubsampling: '4:4:4',
        progressive: true,
        mozjpeg: true,
      })
      .toFile(destination);
    previewBytes += result.size;
  }

  console.log(
    `Generated ${images.length * widths.length} gallery previews, ${heroWidths.length} hero previews, ` +
      `and ${responsiveCovers.length} responsive covers ` +
      `(${(sourceBytes / 1024 / 1024).toFixed(1)} MB originals, ${(previewBytes / 1024 / 1024).toFixed(1)} MB previews).`,
  );
}

await main();
