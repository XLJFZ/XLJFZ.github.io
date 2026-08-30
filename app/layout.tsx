import type { Metadata } from 'next';
import { Geist, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const chinese = Noto_Sans_SC({ variable: '--font-cjk', subsets: ['latin'], weight: ['300', '400', '500', '600'] });

export const metadata: Metadata = {
  title: '林野影像｜建筑与风景摄影',
  description: '专注建筑、空间与自然景观的个人摄影作品集。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${sans.variable} ${chinese.variable}`}>{children}</body></html>;
}
