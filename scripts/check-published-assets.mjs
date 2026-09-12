import { readdir, readFile, lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { MAX_PREVIEW_EDGE, previewWidths } from '../src/lib/preview-policy.mjs';

const original =
  /(?:^|\/)portfolio\/|(?:^|\/)hero-zbz-2714\.jpg$|\.(?:raw|dng|nef|nrw|arw|srf|sr2|cr2|cr3|crw|raf|orf|rw2|pef|3fr|fff|iiq|rwl|xmp)$/i;
const oldReference = /\/portfolio\/|\/hero-zbz-2714\.jpg/;
const raster = /\.(?:jpg|jpeg|png|webp|avif|gif|tif|tiff|heic|heif|jxl)$/i;

export async function filesUnder(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Symbolic link is not allowed: ${file}`);
    if (entry.isDirectory()) result.push(...(await filesUnder(file)));
    else result.push(file);
  }
  return result;
}

export async function inspectImage(file) {
  const issues = [];
  try {
    const meta = await sharp(file, { failOn: 'warning' }).metadata();
    if (
      !meta.width ||
      !meta.height ||
      Math.max(meta.width, meta.height) > MAX_PREVIEW_EDGE
    )
      issues.push('invalid dimensions or long edge exceeds 4096px');
    if (meta.pages > 1)
      issues.push('multi-page images are not approved for publishing');
    // Derived display copies carry no descriptive metadata. ICC color profiles are allowed.
    if (
      meta.exif ||
      meta.xmp ||
      meta.iptc ||
      meta.tifftagPhotoshop ||
      meta.comments?.length
    )
      issues.push('descriptive metadata is present (EXIF/XMP/IPTC/comments)');
    await sharp(file, { failOn: 'warning' }).stats();
  } catch {
    issues.push('image cannot be reliably decoded');
  }
  return issues;
}

export async function checkAssets({
  root = process.cwd(),
  exported = false,
  tracked = true,
} = {}) {
  const issues = [];
  if (tracked) {
    const files = execFileSync('git', ['ls-files', '-z'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean);
    for (const file of files) {
      // A tracked deletion is harmless; staged/committed originals that exist are blocked.
      if (
        original.test(file) &&
        (await lstat(path.join(root, file)).catch(() => null))
      )
        issues.push(`${file}: original asset is forbidden`);
    }
  }
  const publicRoot = path.join(root, exported ? '_site' : 'public');
  const files = await filesUnder(publicRoot);
  for (const file of files) {
    const relative = path.relative(publicRoot, file).replaceAll('\\', '/');
    if (original.test(relative))
      issues.push(`${relative}: original asset is forbidden`);
    if (raster.test(file))
      for (const issue of await inspectImage(file))
        issues.push(`${relative}: ${issue}`);
    if (/\.(?:html|js|json|xml|css|svg|txt)$/i.test(file)) {
      const source = (await readFile(file, 'utf8')).replaceAll('\\/', '/');
      if (oldReference.test(source))
        issues.push(`${relative}: legacy original reference`);
      if (/\.svg$/i.test(file) && /<metadata\b/i.test(source))
        issues.push(`${relative}: SVG metadata requires removal`);
    }
  }
  const sources = await filesUnder(path.join(root, 'src'));
  for (const file of sources) {
    if (
      /\.(?:tsx?|m?js|css)$/i.test(file) &&
      oldReference.test(await readFile(file, 'utf8'))
    )
      issues.push(`${path.relative(root, file)}: legacy original reference`);
  }
  const source = await readFile(
    path.join(root, 'src/lib/portfolio.ts'),
    'utf8',
  );
  const records = [
    ...source.matchAll(
      /src: '(\/portfolio-previews\/[^']+)',\s*width: (\d+),\s*height: (\d+)/g,
    ),
  ];
  if (!records.length)
    issues.push('No portfolio records found; cannot verify preview coverage');
  for (const [, src, width, height] of records) {
    for (const tier of previewWidths({
      width: Number(width),
      height: Number(height),
    })) {
      const relative = src.replace(/-\d+\.jpg$/, `-${tier}.jpg`);
      const file = path.join(publicRoot, relative.slice(1));
      try {
        const meta = await sharp(file).metadata();
        if (meta.width !== tier)
          issues.push(`${relative}: srcSet width does not match pixels`);
      } catch {
        issues.push(`${relative}: required preview missing or unreadable`);
      }
    }
  }
  return issues;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const issues = await checkAssets({
      exported: process.argv.includes('--export'),
    });
    if (issues.length) {
      console.error(issues.join('\n'));
      process.exitCode = 1;
    } else
      console.log(
        'Asset gate passed: original paths, preview sizes, decoding, metadata and gallery coverage.',
      );
  } catch (error) {
    console.error(`Asset gate could not complete: ${error.message}`);
    process.exitCode = 1;
  }
}
