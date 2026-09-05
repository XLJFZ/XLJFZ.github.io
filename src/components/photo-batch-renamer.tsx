'use client';

import { useMemo, useRef, useState } from 'react';
import Compressor from 'compressorjs';
import { PrivacyNextStep } from '@/components/privacy-next-step';
import { createZip } from '@/lib/jpeg-exif';
import { parsePhotoMetadata } from '@/lib/photo-metadata';
import {
  buildPhotoName,
  cameraSlug,
  duplicateNames,
  exifDate,
  THEMES,
  type RenameLanguage,
  type ThemeKey,
} from '@/lib/photo-renamer';

type Item = {
  file: File;
  metadata: ReturnType<typeof parsePhotoMetadata>;
  location: string;
  theme?: ThemeKey;
  customTheme: string;
  date: string;
  camera: string;
};

const compressionPresets = [
  { id: 'original', label: '不压缩', note: '只重命名，保留原格式' },
  {
    id: 'light',
    label: '轻量',
    note: '1600px · 质量 76',
    maxEdge: 1600,
    quality: 76,
  },
  {
    id: 'balanced',
    label: '推荐',
    note: '2400px · 质量 82',
    maxEdge: 2400,
    quality: 82,
  },
  {
    id: 'large',
    label: '大图',
    note: '3200px · 质量 86',
    maxEdge: 3200,
    quality: 86,
  },
] as const;

type CompressionId = (typeof compressionPresets)[number]['id'];

async function compressPhoto(file: File, maxEdge: number, quality: number) {
  return new Promise<Blob>(
    (resolve, reject) =>
      new Compressor(file, {
        maxWidth: maxEdge,
        maxHeight: maxEdge,
        quality: quality / 100,
        mimeType: 'image/jpeg',
        retainExif: true,
        checkOrientation: true,
        strict: false,
        success: resolve,
        error: reject,
      }),
  );
}

export function PhotoBatchRenamer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [language, setLanguage] = useState<RenameLanguage>('en');
  const [batchLocation, setBatchLocation] = useState('');
  const [batchTheme, setBatchTheme] = useState<ThemeKey | ''>('');
  const [compressionId, setCompressionId] = useState<CompressionId>('original');
  const [isWorking, setIsWorking] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const selectedCompression =
    compressionPresets.find((preset) => preset.id === compressionId) ??
    compressionPresets[0];
  const names = useMemo(
    () =>
      items.map((item, index) =>
        buildPhotoName({
          originalName: item.file.name,
          date: item.date,
          location: item.location,
          theme: item.theme,
          customTheme: item.customTheme,
          camera: item.camera,
          sequence: index + 1,
          language,
          extension: compressionId === 'original' ? undefined : '.jpg',
        }),
      ),
    [items, language, compressionId],
  );
  const duplicates = useMemo(() => duplicateNames(names), [names]);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next = await Promise.all(
      [...files]
        .filter(
          (file) =>
            /image\/(jpeg|png|webp)/.test(file.type) ||
            /\.(jpe?g|png|webp)$/i.test(file.name),
        )
        .map(async (file) => {
          const metadata = parsePhotoMetadata(await file.arrayBuffer());
          return {
            file,
            metadata,
            location: '',
            customTheme: '',
            date: exifDate(metadata?.capturedAt),
            camera: cameraSlug(metadata, language),
          };
        }),
    );
    setItems((current) => [...current, ...next]);
  }
  function update(index: number, patch: Partial<Item>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }
  async function download() {
    if (!items.length || duplicates.size || isWorking) return;
    setIsWorking(true);
    setDownloadError('');
    try {
      const files = [];
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const output =
          'maxEdge' in selectedCompression
            ? await compressPhoto(
                item.file,
                selectedCompression.maxEdge,
                selectedCompression.quality,
              )
            : item.file;
        files.push({
          name: names[index],
          data: new Uint8Array(await output.arrayBuffer()),
          modified: item.file.lastModified
            ? new Date(item.file.lastModified)
            : new Date(),
        });
      }
      const url = URL.createObjectURL(createZip(files));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'renamed-photos.zip';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setHasDownloaded(true);
    } catch (reason) {
      setDownloadError(
        reason instanceof Error ? reason.message : '压缩或打包失败，请重试。',
      );
    } finally {
      setIsWorking(false);
    }
  }
  return (
    <section className="border border-white/12 bg-[#1b1b19] p-5 md:p-8">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <button
          type="button"
          aria-label="选择或拖入多张照片"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-[260px] cursor-pointer items-center justify-center border border-dashed border-white/20 bg-black/10 p-8 text-center hover:border-white/45"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void addFiles(event.dataTransfer.files);
          }}
        >
          <span>
            <strong className="block text-xl font-medium">
              选择或拖入多张照片
            </strong>
            <span className="mt-3 block text-sm text-white/45">
              JPEG、PNG、WebP · 照片只在浏览器本地读取
            </span>
          </span>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => void addFiles(event.target.files)}
        />
        <div className="space-y-5 border-t border-white/12 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <fieldset>
            <legend className="text-xs tracking-[.14em] text-white/40">
              命名语言
            </legend>
            <div className="mt-3 flex gap-2">
              {(
                [
                  ['en', 'English'],
                  ['zh', '中文'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer border px-4 py-2 text-sm ${language === value ? 'border-white bg-white text-black' : 'border-white/15'}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    checked={language === value}
                    onChange={() => setLanguage(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-xs text-white/45">
            批量地点
            <input
              value={batchLocation}
              onChange={(e) => setBatchLocation(e.target.value)}
              className="mt-2 w-full border border-white/15 bg-transparent p-3 text-sm text-white"
              placeholder={language === 'zh' ? '例如：上海' : 'e.g. shanghai'}
            />
          </label>
          <button
            className="border border-white/20 px-4 py-2 text-sm"
            onClick={() =>
              setItems((current) =>
                current.map((item) => ({ ...item, location: batchLocation })),
              )
            }
          >
            应用地点到全部
          </button>
          <label className="block text-xs text-white/45">
            批量主题
            <select
              value={batchTheme}
              onChange={(e) => setBatchTheme(e.target.value as ThemeKey | '')}
              className="mt-2 w-full border border-white/15 bg-[#20201e] p-3 text-white"
            >
              <option value="">待确认</option>
              {THEMES.map((t) => (
                <option value={t.en} key={t.en}>
                  {t[language]}
                </option>
              ))}
            </select>
          </label>
          <button
            className="border border-white/20 px-4 py-2 text-sm"
            onClick={() =>
              batchTheme &&
              setItems((current) =>
                current.map((item) => ({
                  ...item,
                  theme: batchTheme,
                  customTheme: '',
                })),
              )
            }
          >
            应用主题到全部
          </button>
        </div>
      </div>
      {items.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="text-xs text-white/35">
              <tr>
                <th className="pb-3">原名称</th>
                <th>日期 / 相机（可修改）</th>
                <th>地点</th>
                <th>主题（选择或手写）</th>
                <th>新名称</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  className="border-t border-white/10 align-top"
                  key={`${item.file.name}-${item.file.lastModified}`}
                >
                  <td className="py-4 pr-4 text-white/60">{item.file.name}</td>
                  <td className="space-y-2 py-4 pr-4">
                    <input
                      aria-label="拍摄日期"
                      type="date"
                      className="block border border-white/15 bg-transparent p-2"
                      value={item.date}
                      onChange={(e) => update(index, { date: e.target.value })}
                    />
                    <input
                      aria-label="相机"
                      placeholder="相机或编号"
                      className="w-40 border border-white/15 bg-transparent p-2"
                      value={item.camera}
                      onChange={(e) =>
                        update(index, { camera: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-4 pr-4">
                    <input
                      aria-label="地点"
                      placeholder="直接填写地点"
                      className="w-32 border border-white/15 bg-transparent p-2"
                      value={item.location}
                      onChange={(e) =>
                        update(index, { location: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-4 pr-4">
                    <select
                      aria-label="预设主题"
                      className="border border-white/15 bg-[#20201e] p-2"
                      value={item.theme ?? ''}
                      onChange={(e) =>
                        update(index, {
                          theme: (e.target.value as ThemeKey) || undefined,
                          customTheme: '',
                        })
                      }
                    >
                      <option value="">待确认</option>
                      {THEMES.map((t) => (
                        <option value={t.en} key={t.en}>
                          {t[language]}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label="自定义主题"
                      placeholder="或直接写主题"
                      className="mt-2 block w-44 border border-white/15 bg-transparent p-2"
                      value={item.customTheme}
                      onChange={(e) =>
                        update(index, {
                          customTheme: e.target.value,
                          theme: undefined,
                        })
                      }
                    />
                    <span className="mt-1 block text-xs text-white/35">
                      人工选择或直接填写
                    </span>
                  </td>
                  <td
                    className={`py-4 font-mono text-xs ${duplicates.has(names[index]) ? 'text-red-300' : 'text-white/70'}`}
                  >
                    {names[index]}
                    {duplicates.has(names[index]) && (
                      <span className="block">名称重复</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <fieldset className="mt-7 border-t border-white/12 pt-5">
        <legend className="text-xs tracking-[.14em] text-white/40">
          下载时压缩
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {compressionPresets.map((preset) => (
            <label
              key={preset.id}
              className={`cursor-pointer border p-3 ${compressionId === preset.id ? 'border-white bg-white text-black' : 'border-white/15'}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="renamer-compression"
                checked={compressionId === preset.id}
                onChange={() => setCompressionId(preset.id)}
              />
              <span className="block text-sm">{preset.label}</span>
              <span className="mt-1 block text-xs opacity-55">
                {preset.note}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-white/38">
          三档压缩统一输出 JPEG，并保留可用 EXIF 与方向信息；PNG、WebP 会转换为
          JPEG。“不压缩”保持原始字节、格式和画质。
        </p>
      </fieldset>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-5">
        <p className="max-w-2xl text-xs leading-5 text-white/38">
          当前基础版使用受控主题词表与人工填写。经评估，可靠的浏览器端 CLIP
          零样本模型首次约需下载 350
          MB，对静态站点与移动设备过重，因此未默认集成；没有使用颜色或文件名冒充语义识别。照片不会上传，原文件不会修改。
        </p>
        <button
          disabled={!items.length || duplicates.size > 0 || isWorking}
          onClick={() => void download()}
          className="bg-white px-5 py-3 text-sm text-black disabled:opacity-30"
        >
          {isWorking ? '正在处理…' : '下载命名副本 ZIP'}
        </button>
      </div>
      {downloadError && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {downloadError}
        </p>
      )}
      {hasDownloaded && <PrivacyNextStep />}
    </section>
  );
}
