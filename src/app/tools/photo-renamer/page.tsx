import type { Metadata } from 'next';
import { PhotoBatchRenamer } from '@/components/photo-batch-renamer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '智能照片批量命名器｜迅雷疾风',
  description:
    '在浏览器本地读取 EXIF、预览新名称并下载不覆盖原文件的命名副本。',
  alternates: { canonical: '/tools/photo-renamer/' },
};
export default function PhotoRenamerPage() {
  return (
    <main id="top" className="min-h-screen bg-[#161615] text-white">
      <SiteHeader active="tools" />
      <div
        id="content"
        data-tool-content
        className="mx-auto w-full max-w-[1500px] px-5 py-10 md:px-10 md:py-16"
      >
        <div className="mb-10 grid gap-5 border-t border-white/12 pt-5 md:grid-cols-[1fr_1.1fr] md:items-end">
          <div>
            <p className="text-xs tracking-[.2em] text-white/38">
              LOCAL PHOTO WORKFLOW
            </p>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-none tracking-[-.055em]">
              智能照片批量命名器
            </h1>
          </div>
          <p className="max-w-xl text-base font-light leading-7 text-white/52 md:justify-self-end">
            用可核实的 EXIF
            日期、相机、地点、主题与连续编号生成中英文名称。完整预览后下载副本，不覆盖原文件。
          </p>
        </div>
        <PhotoBatchRenamer />
      </div>
      <SiteFooter />
    </main>
  );
}
