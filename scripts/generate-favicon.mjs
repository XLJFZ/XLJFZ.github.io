import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * 由 public/favicon.svg 生成 public/favicon.ico。
 *
 * 背景：站点此前只声明 SVG 图标，但浏览器与部分抓取工具仍会请求根路径的
 * /favicon.ico；该文件缺失时 GitHub Pages 会回落到 441KB 的 404.html，
 * 每次页面加载都产生一次无意义的大响应。这里补齐多尺寸 ICO。
 *
 * 输出为「PNG 内嵌 ICO」：ICONDIR + ICONDIRENTRY[] + PNG 数据块，
 * 主流浏览器与 Windows Vista 以上系统均可直接读取，无需额外依赖。
 */

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const sourceSvg = path.join(projectRoot, 'public', 'favicon.svg');
const destination = path.join(projectRoot, 'public', 'favicon.ico');
const sizes = [16, 32, 48];
// SVG 原始尺寸为 32px；按 8 倍密度栅格化后再缩到目标尺寸，保证小尺寸边缘干净。
const density = 72 * 8;

function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // 保留字段
  header.writeUInt16LE(1, 2); // 类型：1 = 图标
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let dataOffset = header.length + directory.length;

  images.forEach(({ size, data }, index) => {
    const entry = 16 * index;
    // 尺寸字段为 1 字节，256 用 0 表示；当前最大 48，直接写入。
    directory.writeUInt8(size, entry);
    directory.writeUInt8(size, entry + 1);
    directory.writeUInt8(0, entry + 2); // 调色板数量
    directory.writeUInt8(0, entry + 3); // 保留字段
    directory.writeUInt16LE(1, entry + 4); // 颜色平面
    directory.writeUInt16LE(32, entry + 6); // 每像素位数
    directory.writeUInt32LE(data.length, entry + 8);
    directory.writeUInt32LE(dataOffset, entry + 12);
    dataOffset += data.length;
  });

  return Buffer.concat([
    header,
    directory,
    ...images.map((image) => image.data),
  ]);
}

async function main() {
  const svg = await readFile(sourceSvg);
  const images = await Promise.all(
    sizes.map(async (size) => ({
      size,
      data: await sharp(svg, { density })
        .resize(size, size, { kernel: 'lanczos3' })
        .png()
        .toBuffer(),
    })),
  );

  await mkdir(path.dirname(destination), { recursive: true });
  const ico = buildIco(images);
  await writeFile(destination, ico);
  console.log(
    `Generated public/favicon.ico at ${sizes.join('/')}px (${(ico.length / 1024).toFixed(1)} KB)`,
  );
}

await main();
