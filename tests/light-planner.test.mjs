import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('light planner exposes map, time, lens and export controls', async () => {
  const source = await readFile('src/components/light-planner.tsx', 'utf8');
  assert.match(source, /maplibre-gl/);
  assert.match(source, /SunCalc\.getPosition/);
  assert.match(source, /SunCalc\.getMoonPosition/);
  assert.match(source, /type="range"/);
  assert.match(source, /导出拍摄计划卡/);
  assert.match(source, /canvas\.toDataURL\('image\/png'\)/);
});

test('map host keeps a real height after MapLibre applies its own styles', async () => {
  const [component, css] = await Promise.all([
    readFile('src/components/light-planner.tsx', 'utf8'),
    readFile('src/app/globals.css', 'utf8'),
  ]);
  assert.match(component, /className="planner-map/);
  assert.match(
    css,
    /\.planner-map\s*\{[^}]*position:\s*absolute\s*!important;[^}]*inset:\s*0;[^}]*height:\s*100%;/s,
  );
});

test('GitHub Pages export ships the MapLibre worker beside its browser chunk', async () => {
  const source = await readFile('scripts/export-github-pages.mjs', 'utf8');
  assert.match(source, /maplibre-gl-worker\.mjs/);
  assert.match(source, /maplibre-gl-shared\.mjs/);
  assert.match(source, /node_modules[\s\S]*maplibre-gl[\s\S]*dist/);
  assert.match(source, /dist[\s\S]*client[\s\S]*_next[\s\S]*static[\s\S]*chunks/);
});

test('map can switch between a flat plan and an elevated 3D view', async () => {
  const source = await readFile('src/components/light-planner.tsx', 'utf8');
  assert.match(source, /二维地图/);
  assert.match(source, /三维地形/);
  assert.match(source, /planner-terrain/);
  assert.match(source, /setTerrain/);
  assert.match(source, /easeTo/);
  assert.match(source, /aria-pressed/);
});

test('planner supports a complete location-to-light-to-lens workflow', async () => {
  const source = await readFile('src/components/light-planner.tsx', 'utf8');
  assert.match(source, /搜索地点/);
  assert.match(source, /经度/);
  assert.match(source, /纬度/);
  assert.match(source, /立面朝向/);
  assert.match(source, /planner-fov/);
  assert.match(source, /定位失败/);
  assert.match(source, /搜索失败/);
  assert.match(source, /timeline-event/);
});

test('exported plan card includes the critical light windows', async () => {
  const source = await readFile('src/components/light-planner.tsx', 'utf8');
  assert.match(source, /日出.*黄金.*日落/s);
  assert.match(source, /蓝调/);
  assert.match(source, /月升/);
});

test('light planner is included in the tool index, sitemap and static export', async () => {
  const sources = await Promise.all([
    readFile('src/app/tools/page.tsx', 'utf8'),
    readFile('public/sitemap.xml', 'utf8'),
    readFile('scripts/export-github-pages.mjs', 'utf8'),
  ]);
  for (const source of sources) assert.match(source, /tools\/light-planner/);
});
