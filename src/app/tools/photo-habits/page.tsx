import type { Metadata } from 'next';

import { PhotoHabitsAnalyzer } from '@/components/photo-habits-analyzer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '我的摄影习惯分析｜迅雷疾风',
  description:
    '在浏览器本地读取照片 EXIF，统计常用焦段、光圈、ISO、快门和拍摄时间。',
  alternates: { canonical: '/tools/photo-habits/' },
};

export default function PhotoHabitsPage() {
  return (
    <main id="top" className="min-h-screen bg-[#151514] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        className="mx-auto max-w-[1500px] px-5 py-9 md:px-10 md:py-14"
      >
        <div className="mb-8 grid gap-5 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.15fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              本地 EXIF 分析
            </p>
            <h1 className="mt-4 text-[clamp(2.35rem,5vw,4.8rem)] font-medium leading-none tracking-[-.055em]">
              我的摄影习惯
            </h1>
          </div>
          <div className="max-w-xl md:justify-self-end">
            <p className="text-base font-light leading-7 text-white/52">
              用真实拍摄频率判断一支镜头是不是刚需。所有统计都在你的浏览器内完成。
            </p>
            <a
              className="mt-4 inline-flex border-b border-white/25 pb-1 text-xs tracking-[.08em] text-white/45 transition-colors hover:border-white hover:text-white"
              href="/tools/image-compressor/"
            >
              需要整理网站图片？打开批量压缩 →
            </a>
          </div>
        </div>
        <PhotoHabitsAnalyzer />
      </div>
      <SiteFooter />
    </main>
  );
}
