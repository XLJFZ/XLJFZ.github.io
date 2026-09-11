import { readdir, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
// 原图不随仓库发布，本地生成预览图时通过 PORTFOLIO_ORIGINALS_DIR 指向仓库外的原始目录。
const sourceRoot = process.env.PORTFOLIO_ORIGINALS_DIR
  ? path.resolve(projectRoot, process.env.PORTFOLIO_ORIGINALS_DIR)
  : path.join(projectRoot, 'public', 'portfolio');
const outputRoot = path.join(projectRoot, 'public', 'portfolio-previews');
const widths = [1200, 1800];
// 站点对外提供的最高宽度，与 src/lib/portfolio.ts 的 MAX_GALLERY_WIDTH 保持一致。
// 原图不再随站点发布，因此这里必须为每张图产出「最大档」预览。
const maxWidth = 4096;
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
      'distant-weather',
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
  try {
    await stat(sourceRoot);
  } catch {
    throw new Error(
      `Missing originals at ${sourceRoot}. They are not committed; set PORTFOLIO_ORIGINALS_DIR to the local originals directory.`,
    );
  }
  const images = await findImages(sourceRoot);
  let sourceBytes = 0;
  let previewBytes = 0;
  let generated = 0;

  for (const imagePath of images) {
    sourceBytes += (await stat(imagePath)).size;
    const relativePath = path.relative(sourceRoot, imagePath);
    const relativeBase = relativePath.replace(/\.[^.]+$/, '');

    // 最大档 = min(原图宽度, maxWidth)。原图宽度不足时不生成，避免出现
    // 「文件名写着 4096、实际只有 2800」的冗余文件。
    const metadata = await sharp(imagePath).metadata();
    const fullWidth = Math.min(metadata.width, maxWidth);
    const widthsForImage = fullWidth > 1800 ? [...widths, fullWidth] : widths;
    generated += widthsForImage.length;

    for (const width of widthsForImage) {
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
    `Generated ${generated} gallery previews, ${heroWidths.length} hero previews, ` +
      `and ${responsiveCovers.length} responsive covers ` +
      `(${(sourceBytes / 1024 / 1024).toFixed(1)} MB originals, ${(previewBytes / 1024 / 1024).toFixed(1)} MB previews).`,
  );
}

await main();
