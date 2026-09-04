import { spawn } from 'node:child_process';
import { copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const routes = [
  '/',
  '/about',
  '/tools',
  '/tools/photo-habits',
  '/tools/image-compressor',
  '/tools/print-size',
  '/tools/social-crop',
  '/tools/light-planner',
  '/series',
  '/series/urban-pulse',
  '/series/distant-weather',
  '/series/textures-of-time',
  '/series/nearby-moments',
  '/404',
];

export async function exportPages({
  clientDir,
  outputDir,
  fetchPage,
  copyClient = true,
}) {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  if (copyClient) await cp(clientDir, outputDir, { recursive: true });

  for (const route of routes) {
    const relativePath =
      route === '/404'
        ? '404.html'
        : route === '/'
          ? 'index.html'
          : path.join(route.slice(1), 'index.html');
    const destination = path.join(outputDir, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await fetchPage(route), 'utf8');
  }

  await writeFile(path.join(outputDir, '.nojekyll'), '', 'utf8');
  await copyFile(
    'public/favicon.ico',
    path.join(outputDir, 'favicon.ico'),
  ).catch(() => {});
}

async function waitUntilReady(origin, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Preview server did not become ready at ${origin}`);
}

async function installMapLibreWorker(projectRoot) {
  const workerFiles = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];
  const chunks = path.join(
    projectRoot,
    'dist',
    'client',
    '_next',
    'static',
    'chunks',
  );
  await mkdir(chunks, { recursive: true });
  await Promise.all(
    workerFiles.map((fileName) =>
      copyFile(
        path.join(projectRoot, 'node_modules', 'maplibre-gl', 'dist', fileName),
        path.join(chunks, fileName),
      ),
    ),
  );
}

async function main() {
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
  );
  const port = process.env.PAGES_EXPORT_PORT ?? '4173';
  const origin = `http://127.0.0.1:${port}`;
  await installMapLibreWorker(projectRoot);
  const wrangler = path.join(
    projectRoot,
    'node_modules',
    'wrangler',
    'bin',
    'wrangler.js',
  );
  const server = spawn(
    process.execPath,
    [wrangler, 'dev', '--config', 'dist/server/wrangler.json', '--port', port],
    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
  );

  try {
    await waitUntilReady(origin);
    await exportPages({
      clientDir: path.join(projectRoot, 'dist', 'client'),
      outputDir: path.join(projectRoot, '_site'),
      fetchPage: async (route) => {
        const response = await fetch(`${origin}${route}`);
        if (!response.ok && !(route === '/404' && response.status === 404)) {
          throw new Error(`${route} returned ${response.status}`);
        }
        return response.text();
      },
    });
    console.log(`Exported ${routes.length} routes to _site`);
  } finally {
    server.kill('SIGTERM');
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
