import type { Metadata } from 'next';
import { ImageCompressor } from '@/components/image-compressor';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '照片批量压缩｜迅雷疾风',
  description: '在浏览器本地批量压缩 JPEG 照片，保留原始 EXIF 信息。',
  alternates: { canonical: '/tools/image-compressor/' },
};

export default function ImageCompressorPage() {
  return (
    <main id="top" className="min-h-screen bg-[#161615] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-16"
      >
        <div className="mb-10 grid gap-5 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              网站图片准备
            </p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-none tracking-[-.055em]">
              照片批量压缩
            </h1>
          </div>
          <div className="max-w-xl md:justify-self-end">
            <p className="text-base font-light leading-7 text-white/52">
              缩小尺寸与体积，同时保留相机、镜头、拍摄参数和其他 EXIF
              信息。仅支持 JPEG，原文件不会被修改。
            </p>
            <a
              className="mt-4 inline-flex border-b border-white/25 pb-1 text-xs tracking-[.08em] text-white/45 transition-colors hover:border-white hover:text-white"
              href="/tools/photo-habits/"
            >
              想了解自己的拍摄偏好？打开摄影习惯分析 →
            </a>
          </div>
        </div>
        <ImageCompressor />
      </div>
      <SiteFooter />
    </main>
  );
}
