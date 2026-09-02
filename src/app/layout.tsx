import type { Metadata, Viewport } from 'next';
import { Geist, Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const chinese = Noto_Sans_SC({
  variable: '--font-cjk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xljfz.github.io',
  ),
  title: '迅雷疾风｜建筑与风光摄影',
  description: '专注建筑、城市、旅行与自然风光的个人摄影作品集。',
  alternates: { canonical: '/' },
  icons: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  openGraph: {
    title: '迅雷疾风｜建筑与风光摄影',
    description: '专注建筑、城市、旅行与自然风光的个人摄影作品集。',
    images: [
      {
        url: '/portfolio/dsc-2989-shangri-la.jpg',
        width: 2800,
        height: 1034,
        alt: '晨雾与阳光中的松赞林寺',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '迅雷疾风｜建筑与风光摄影',
    description: '专注建筑、城市、旅行与自然风光的个人摄影作品集。',
    images: ['/portfolio/dsc-2989-shangri-la.jpg'],
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#22211f',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '迅雷疾风摄影作品集',
    alternateName: 'XLJFZ Photography',
    url: 'https://xljfz.github.io/',
    description: '专注建筑、城市、旅行与自然风光的个人摄影作品集。',
    inLanguage: 'zh-CN',
  };
  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${chinese.variable}`}>
        <a
          href="#content"
          className="fixed left-4 top-4 z-[100] -translate-y-20 bg-foreground px-4 py-2 text-xs tracking-[0.12em] text-background transition-transform focus:translate-y-0"
        >
          跳至正文
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
