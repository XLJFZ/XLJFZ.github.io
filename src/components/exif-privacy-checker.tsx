'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  Check,
  ImagePlus,
  LockKeyhole,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { ToolProgress } from '@/components/tool-progress';
import { Button } from '@/components/ui/button';
import { runPhotoBatch } from '@/lib/photo-batch';
import { createZip } from '@/lib/jpeg-exif';
import {
  cleanExifPrivacy,
  hasCompressedJxlExif,
  inspectExifPrivacy,
  isSupportedPrivacyPhoto,
  type PrivacyCategory,
  type PrivacyFinding,
} from '@/lib/exif-privacy';

type Photo = { file: File; findings: PrivacyFinding[] };
type Output = { file: File; name: string; data: Uint8Array; modified: Date };

const categories: Array<{ id: PrivacyCategory; label: string; note: string }> =
  [
    { id: 'location', label: 'GPS 位置', note: '经纬度、海拔与定位时间' },
    { id: 'serial', label: '设备标识', note: '机身、镜头序列号与厂商私有信息' },
    { id: 'owner', label: '所有者', note: '姓名、作者与版权信息' },
    { id: 'time', label: '拍摄时间', note: '原始、创建、修改时间与时区' },
    {
      id: 'notes',
      label: '备注与编辑信息',
      note: '描述、关键词、软件与处理设备',
    },
  ];

const names: Record<PrivacyCategory, string> = Object.fromEntries(
  categories.map((item) => [item.id, item.label]),
) as Record<PrivacyCategory, string>;

function safeName(name: string) {
  const match = name.match(/(\.[^.]+)$/);
  const extension = match?.[1] ?? '';
  return `${extension ? name.slice(0, -extension.length) : name}-clean${extension}`;
}

export function ExifPrivacyChecker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Set<PrivacyCategory>>(
    new Set(categories.map((item) => item.id)),
  );
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');

  const controller = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [notice, setNotice] = useState('');
  const [failures, setFailures] = useState<
    Array<{ file: File; message: string }>
  >([]);
  const [pending, setPending] = useState<File[]>([]);
  const [phase, setPhase] = useState<'inspect' | 'clean'>('inspect');
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [],
  );

  const run = async (
    files: File[],
    mode: 'inspect' | 'clean',
    retry = false,
  ) => {
    if (controller.current || !files.length) return;
    const active = new AbortController();
    controller.current = active;
    setIsWorking(true);
    setPhase(mode);
    setProgress({ done: 0, total: files.length });
    setNotice('');
    setError('');
    const retainedFailures = retry
      ? failures.filter((item) => !files.includes(item.file))
      : [];
    const retainedPending = retry
      ? pending.filter((file) => !files.includes(file))
      : [];
    setFailures(retainedFailures);
    setPending(retainedPending);
    if (!retry) setOutputs([]);
    const selection = new Set(selected);
    try {
      const result = await runPhotoBatch(
        files,
        async (file) => {
          const source = await file.arrayBuffer();
          if (active.signal.aborted) return;
          if (mode === 'inspect') {
            if (/\.jxl$/i.test(file.name) && hasCompressedJxlExif(source))
              throw new Error(
                '使用 Brotli 压缩 EXIF，当前无法安全选择性清理。',
              );
            const photo = { file, findings: inspectExifPrivacy(source) };
            setPhotos((current) =>
              current.some((item) => item.file === file)
                ? current
                : [...current, photo],
            );
          } else {
            const data = cleanExifPrivacy(source, selection);
            const remaining = inspectExifPrivacy(
              data.buffer.slice(
                data.byteOffset,
                data.byteOffset + data.byteLength,
              ),
            );
            if (remaining.some((finding) => selection.has(finding.category)))
              throw new Error('清理验证未通过');
            setOutputs((current) => [
              ...current.filter((item) => item.file !== file),
              {
                file,
                name: safeName(file.name),
                data,
                modified: new Date(file.lastModified),
              },
            ]);
          }
        },
        active.signal,
        setProgress,
      );
      if (controller.current !== active) return;
      setFailures([
        ...retainedFailures,
        ...result.failures.map(({ item, message }) => ({
          file: item,
          message,
        })),
      ]);
      setPending([...retainedPending, ...result.pending]);
      setNotice(
        active.signal.aborted
          ? '已取消，已完成的结果已保留；可继续处理剩余照片。'
          : '处理结束，成功结果已保留。',
      );
    } finally {
      if (controller.current === active) {
        controller.current = null;
        setIsWorking(false);
      }
    }
  };

  const addFiles = async (incoming: FileList | File[]) => {
    if (controller.current) return;
    const files = Array.from(incoming);
    const known = new Set(
      photos.map(({ file }) =>
        [file.name, file.size, file.lastModified].join(':'),
      ),
    );
    const supported = files.filter(isSupportedPrivacyPhoto).filter((file) => {
      const key = [file.name, file.size, file.lastModified].join(':');
      if (known.has(key)) return false;
      known.add(key);
      return true;
    });
    if (!supported.length) {
      setError(
        '没有可添加的新照片：请选择尚未添加的 JPEG、JXL、HEIC、HEIF、AVIF、WebP 或 TIFF 照片。',
      );
      return;
    }
    await run(supported, 'inspect');
    if (files.some((file) => !isSupportedPrivacyPhoto(file)))
      setError('已忽略暂不支持的文件。');
    if (inputRef.current) inputRef.current.value = '';
  };

  const clear = () => {
    if (controller.current) return;
    setPhotos([]);
    setOutputs([]);
    setFailures([]);
    setPending([]);
    setNotice('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const toggle = (id: PrivacyCategory) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setOutputs([]);
    if (phase === 'clean') {
      setFailures([]);
      setPending([]);
      setNotice('');
    }
  };

  const clean = async () => {
    if (!selected.size) {
      setError('请至少选择一类要清理的信息。');
      return;
    }
    await run(
      photos.map((photo) => photo.file),
      'clean',
    );
  };

  const download = () => {
    const zip = createZip(outputs);
    const url = URL.createObjectURL(zip);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clean-photos-${new Date().toISOString().slice(0, 10)}.zip`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const total = photos.reduce((sum, photo) => sum + photo.findings.length, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="border border-white/10 bg-[#1c1c1a]">
        <button
          type="button"
          className={`group flex min-h-64 w-full flex-col items-center justify-center px-6 text-center transition-colors ${isDragging ? 'bg-white/[.09]' : 'hover:bg-white/[.035]'}`}
          disabled={isWorking}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void addFiles(event.dataTransfer.files);
          }}
        >
          <span className="mb-5 flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/[.035] transition-transform group-hover:-translate-y-1">
            <ImagePlus className="size-5" aria-hidden="true" />
          </span>
          <span className="text-xl tracking-[-.02em]">拖入照片检查隐私</span>
          <span className="mt-3 text-sm text-white/45">
            或点击选择，可一次添加多张
          </span>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/jxl,image/heic,image/heif,image/avif,image/webp,image/tiff,.jpg,.jpeg,.jxl,.heic,.heif,.avif,.webp,.tif,.tiff"
          multiple
          disabled={isWorking}
          onChange={(event) =>
            event.target.files && void addFiles(event.target.files)
          }
        />

        {photos.length > 0 && (
          <div className="border-t border-white/10">
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-sm">
                {photos.length} 张照片 · 发现 {total} 项隐私信息
              </p>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white"
                onClick={clear}
                disabled={isWorking}
              >
                <Trash2 className="size-4" aria-hidden="true" /> 清空
              </button>
            </div>
            <ul className="max-h-[480px] divide-y divide-white/[.07] overflow-auto border-t border-white/[.07]">
              {photos.map(({ file, findings }) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm text-white/78">
                      {file.name}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${findings.length ? 'text-[#e0a099]' : 'text-[#b8c99d]'}`}
                    >
                      {findings.length ? `${findings.length} 项` : '未发现'}
                    </span>
                  </div>
                  {findings.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {findings.map((finding, index) => (
                        <div
                          key={`${finding.label}-${index}`}
                          className="border-l border-white/12 pl-3 text-xs leading-5"
                        >
                          <span className="text-white/38">
                            {names[finding.category]} · {finding.label}
                          </span>
                          <span className="block break-all text-white/68">
                            {finding.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <aside className="flex flex-col border border-white/10 bg-[#20201e] p-5 md:p-6">
        <p className="text-xs tracking-[.18em] text-white/40">
          选择要清理的信息
        </p>
        <fieldset className="mt-5 grid gap-2">
          <legend className="sr-only">隐私信息类别</legend>
          {categories.map((category) => (
            <label
              key={category.id}
              aria-label={`${category.label}：${category.note}`}
              className={`flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors ${selected.has(category.id) ? 'border-white/45 bg-white/[.06]' : 'border-white/10 text-white/55 hover:border-white/25'}`}
            >
              <input
                className="mt-1 accent-[#d4c29e]"
                type="checkbox"
                checked={selected.has(category.id)}
                onChange={() => toggle(category.id)}
                disabled={isWorking}
              />
              <span>
                <span className="block text-sm text-white">
                  {category.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-white/42">
                  {category.note}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-white/52">
          <p className="flex items-start gap-3">
            <LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden="true" />
            检查与清理全程在本机完成，照片不会上传。
          </p>
          <p className="mt-3 pl-7 text-xs leading-5 text-white/38">
            生成新文件，不覆盖原图；未勾选的曝光参数、相机型号等 EXIF 会保留。
          </p>
        </div>
        <section className="tool-result-panel mt-6">
          <p className="tool-result-summary">
            已检查 {photos.length} 张 · 已清理 {outputs.length} 张
          </p>
          <div className="mt-5 space-y-3 text-sm" aria-live="polite">
            {isWorking && (
              <>
                <p>
                  {phase === 'inspect' ? '检查' : '清理'}：已完成{' '}
                  {progress.done} / {progress.total}
                </p>
                <ToolProgress
                  done={progress.done}
                  total={progress.total}
                  label={phase === 'inspect' ? '正在检查' : '正在清理'}
                />
                <Button
                  variant="ghost"
                  className="h-9 rounded-none px-0 text-xs text-white/60 hover:bg-transparent hover:text-white"
                  onClick={() => controller.current?.abort()}
                >
                  取消处理
                </Button>
              </>
            )}
            {!isWorking && notice && <p>{notice}</p>}
            {failures.length > 0 && (
              <>
                <p className="text-[#e0a099]">
                  {failures.length} 张失败，其他结果不受影响
                </p>
                <ul className="max-h-48 overflow-auto space-y-2">
                  {failures.map(({ file, message }, index) => (
                    <li key={index} className="break-all">
                      {file.name}：{message}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="min-h-10 rounded-none border-white/20 bg-transparent text-white/75"
                  disabled={isWorking}
                  onClick={() =>
                    void run(
                      failures.map((item) => item.file),
                      phase,
                      true,
                    )
                  }
                >
                  重试失败项
                </Button>
              </>
            )}
            {pending.length > 0 && (
              <Button
                variant="outline"
                className="min-h-10 rounded-none border-white/20 bg-transparent text-white/75"
                disabled={isWorking}
                onClick={() => void run(pending, phase, true)}
              >
                继续剩余 {pending.length} 张
              </Button>
            )}
          </div>
          {error && (
            <p className="mt-5 text-sm text-[#e0a099]" role="alert">
              {error}
            </p>
          )}
          <div className="mt-5 border-t border-white/10 pt-5">
            {outputs.length > 0 ? (
              <>
                <div className="mb-4 flex items-center gap-3 border-t border-white/10 pt-4 text-sm text-[#b8c99d]">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  {outputs.length} 张已重新检查，所选信息已清理
                </div>
                <Button
                  className="h-12 w-full rounded-none"
                  onClick={download}
                  disabled={isWorking}
                >
                  <Archive className="size-4" /> 下载清理副本 ZIP
                </Button>
              </>
            ) : (
              <Button
                className="h-12 w-full rounded-none"
                onClick={() => void clean()}
                disabled={!photos.length || isWorking}
              >
                {isWorking
                  ? '处理中…'
                  : `生成清理副本${photos.length ? ` · ${photos.length} 张` : ''}`}
              </Button>
            )}
            {outputs.length > 0 && (
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-white/40">
                <Check className="size-3" aria-hidden="true" />
                原文件保持不变
              </p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
