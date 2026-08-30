import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { LightboxGallery } from '@/components/lightbox-gallery';
import { getSeries, series } from '@/lib/portfolio';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return series.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getSeries((await params).slug);
  if (!item) return {};
  const title = `${item.title}｜迅雷疾风`;
  return { title, description: item.statement, openGraph: { title, description: item.statement, images: [{ url: item.cover, alt: item.title }] }, twitter: { card: 'summary_large_image', title, description: item.statement, images: [item.cover] } };
}

export default async function SeriesPage({ params }: Props) {
  const item = getSeries((await params).slug);
  if (!item) notFound();
  const next = series[(series.findIndex((entry) => entry.slug === item.slug) + 1) % series.length];
  return (
    <main>
      <SiteHeader />
      <section className="grid gap-10 px-5 pb-14 pt-12 md:grid-cols-[1.35fr_.65fr] md:px-10 md:pb-24 md:pt-24">
        <div><p className="text-[10px] uppercase tracking-[0.24em] text-black/45">{item.category} · {item.englishTitle}</p><h1 className="mt-4 text-[clamp(2.8rem,6.5vw,6.2rem)] font-medium leading-[.94] tracking-[-0.055em]">{item.title}</h1></div>
        <div className="max-w-lg md:self-end"><p className="text-sm font-light leading-7 text-black/65">{item.statement}</p><dl className="mt-8 grid grid-cols-2 gap-4 border-t border-black/10 pt-4 text-xs"><div><dt className="text-black/40">地点</dt><dd className="mt-1">{item.location}</dd></div><div><dt className="text-black/40">年份</dt><dd className="mt-1">{item.year}</dd></div></dl></div>
      </section>
      <section className="px-0 md:px-5"><LightboxGallery images={item.images} /></section>
      <Link href={`/series/${next.slug}`} className="group my-20 grid gap-4 border-y border-black/10 px-5 py-10 md:mx-10 md:grid-cols-[1fr_auto] md:items-end md:px-0 md:py-14"><div><p className="text-[10px] uppercase tracking-[.22em] text-black/40">下一组作品</p><h2 className="mt-3 text-4xl font-medium tracking-[-.05em] md:text-6xl">{next.title}</h2></div><span className="text-2xl transition-transform group-hover:translate-x-2">→</span></Link>
      <SiteFooter />
    </main>
  );
}
