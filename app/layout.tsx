import type { Metadata } from 'next';
import { Geist, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const chinese = Noto_Sans_SC({ variable: '--font-cjk', subsets: ['latin'], weight: ['300', '400', '500', '600'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://linye-photo-portfolio.zhaobz2006.chatgpt.site'),
  title: '迅雷疾风｜建筑与风景摄影',
  description: '专注建筑、空间与自然景观的个人摄影作品集。',
  openGraph: {
    title: '迅雷疾风｜建筑与风景摄影',
    description: '专注建筑、空间与自然景观的个人摄影作品集。',
    images: [{ url: '/og.png', width: 1734, height: 907, alt: '迅雷疾风——建筑与风景摄影' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '迅雷疾风｜建筑与风景摄影',
    description: '专注建筑、空间与自然景观的个人摄影作品集。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${sans.variable} ${chinese.variable}`}>{children}</body></html>;
}
