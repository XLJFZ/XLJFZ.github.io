import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  externalizeFontStyles,
  exportPages,
} from '../scripts/export-github-pages.mjs';

const css = `@font-face {font-family: 'Test';src:url(/_next/font.woff2);font-weight:300 600;unicode-range:U+4E00-9FFF;}\n.font {--font-cjk: 'Test';}`;

test('font CSS preserves exact bytes, cascade position, preloads and shared content hash', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-fonts-'));
  const style = `<style data-vinext-fonts>${css}</style>`;
  const before = `<head><link rel="preload" as="font" href="/_next/font.woff2"><style>before{}</style>${style}<style>after{}</style></head>`;
  const hash = createHash('sha256').update(css).digest('hex');
  const href = `/_next/static/fonts/fonts-${hash}.css`;
  const after = await externalizeFontStyles(before, outputDir);
  assert.equal(
    after,
    before.replace(
      style,
      `<link rel="stylesheet" href="${href}" data-vinext-fonts>`,
    ),
  );
  assert.equal(await readFile(path.join(outputDir, href), 'utf8'), css);
  assert.equal(await externalizeFontStyles(before, outputDir), after);
  assert.equal(await externalizeFontStyles(after, outputDir), after);
  const changed = await externalizeFontStyles(
    before.replace('300 600', '400'),
    outputDir,
  );
  assert.notEqual(changed, after);
});

test('font extraction rejects relative URLs rather than changing font resolution', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-fonts-'));
  await assert.rejects(
    externalizeFontStyles(
      `<style data-vinext-fonts>@font-face {src:url(./font.woff2)}</style>`,
      outputDir,
    ),
  );
});

test('every exported route shares the cached font stylesheet including 404', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-fonts-'));
  await exportPages({
    clientDir: '',
    outputDir,
    copyClient: false,
    fetchPage: async () =>
      `<head><style data-vinext-fonts>${css}</style></head>`,
  });
  const home = await readFile(path.join(outputDir, 'index.html'), 'utf8');
  for (const file of [
    'about/index.html',
    'series/urban-pulse/index.html',
    '404.html',
  ]) {
    assert.equal(await readFile(path.join(outputDir, file), 'utf8'), home);
  }
  assert.doesNotMatch(home, /<style data-vinext-fonts>/);
});
