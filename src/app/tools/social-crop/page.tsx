import type { Metadata } from 'next';
import { SocialCropPreviewer } from '@/components/social-crop-previewer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '社交平台裁切预览器｜迅雷疾风',
  description: '同时预览常见社交平台画幅，在浏览器本地调整主体位置并导出。',
  alternates: { canonical: '/tools/social-crop/' },
};

export default function SocialCropPage() {
  return (
    <main id="top" className="min-h-screen bg-[#161615] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        className="mx-auto max-w-[1500px] px-5 py-10 md:px-10 md:py-16"
      >
        <div className="mb-10 grid gap-5 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              社交图片准备
            </p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-none tracking-[-.055em]">
              社交平台裁切预览器
            </h1>
          </div>
          <p className="max-w-xl text-base font-light leading-7 text-white/52 md:justify-self-end">
            一次检查照片在方形、竖屏、横屏与宽幅画面里的构图。每个比例都能单独移动主体，并按原图可用分辨率导出。
          </p>
        </div>
        <SocialCropPreviewer />
      </div>
      <SiteFooter />
    </main>
  );
}
