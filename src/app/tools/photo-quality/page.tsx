import type { Metadata } from 'next';
import { PhotoQualityScreener } from '@/components/photo-quality-screener';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '照片质量初筛器｜迅雷疾风',
  description: '在浏览器本地批量检查照片的清晰度、曝光剪切、分辨率与重复情况。',
  alternates: { canonical: '/tools/photo-quality/' },
};

export default function PhotoQualityPage() {
  return (
    <main id="top" className="min-h-screen bg-[#151514] text-white">
      <SiteHeader active="tools" />
      <PhotoQualityScreener />
      <SiteFooter />
    </main>
  );
}
