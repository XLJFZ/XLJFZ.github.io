import type { Metadata } from 'next';
import { ExifPrivacyChecker } from '@/components/exif-privacy-checker';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '照片隐私检查器｜迅雷疾风',
  description:
    '在浏览器本地检查并选择性清理 JPEG、JPEG XL、HEIC、HEIF、AVIF、WebP 与 TIFF 照片中的 EXIF 隐私信息。',
  alternates: { canonical: '/tools/exif-privacy/' },
};

export default function ExifPrivacyPage() {
  return (
    <main id="top" className="min-h-screen bg-[#161615] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        data-tool-content
        className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-16"
      >
        <div className="mb-10 grid gap-5 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              发布前隐私检查
            </p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-none tracking-[-.055em]">
              照片隐私检查器
            </h1>
          </div>
          <div className="max-w-xl md:justify-self-end">
            <p className="text-base font-light leading-7 text-white/52">
              检查
              GPS、设备序列号、所有者、拍摄时间、备注与编辑信息。按需要勾选清理项，一键生成经过复查的
              原格式副本。
            </p>
            <p className="mt-4 text-xs leading-5 tracking-[.04em] text-white/38">
              支持 JPEG、JXL、HEIC、HEIF、AVIF、WebP、TIFF · 不改变画质与像素 ·
              原文件不会被修改
            </p>
            <p className="mt-2 text-xs leading-5 text-white/30">
              JPEG XL 当前支持未压缩 EXIF；遇到 Brotli 压缩 EXIF
              会明确提示，不会误报为安全。
            </p>
          </div>
        </div>
        <ExifPrivacyChecker />
      </div>
      <SiteFooter />
    </main>
  );
}
