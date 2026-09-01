import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { LightboxGallery } from '@/components/lightbox-gallery';
import { getSeries, series } from '@/lib/portfolio';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return series.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getSeries((await params).slug);
  if (!item) return {};
  const title = `${item.title}｜迅雷疾风`;
  return {
    title,
    description: item.statement,
    openGraph: {
      title,
      description: item.statement,
      images: [{ url: item.cover, alt: item.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: item.statement,
      images: [item.cover],
    },
  };
}

export default async function SeriesPage({ params }: Props) {
  const item = getSeries((await params).slug);
  if (!item) notFound();
  const next =
    series[
      (series.findIndex((entry) => entry.slug === item.slug) + 1) %
        series.length
    ];
  const nextCover = next.images.find((image) => image.src === next.cover);
  return (
    <main id="top">
      <SiteHeader active="series" />
      <section className="mx-auto grid max-w-[1480px] gap-10 px-5 pb-14 pt-12 sm:px-8 md:grid-cols-[1.35fr_.65fr] md:px-10 md:pb-24 md:pt-24 lg:px-14 xl:px-16">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-foreground/45">
            {item.category} · {item.englishTitle}
          </p>
          <h1 className="mt-4 text-[clamp(2.8rem,6.5vw,6.2rem)] font-medium leading-[.94] tracking-[-0.055em]">
            {item.title}
          </h1>
        </div>
        <div className="max-w-lg md:self-end">
          <p className="text-sm font-light leading-7 text-foreground/65">
            {item.statement}
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-foreground/10 pt-4 text-xs">
            <div className="col-span-2">
              <dt className="text-foreground/40">地点</dt>
              <dd className="mt-1">{item.location}</dd>
            </div>
            <div>
              <dt className="text-foreground/40">年份</dt>
              <dd className="mt-1">{item.year}</dd>
            </div>
            <div>
              <dt className="text-foreground/40">作品</dt>
              <dd className="mt-1">{item.images.length} 幅</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="mx-auto max-w-[1480px] px-5 sm:px-8 md:px-10 lg:px-14 xl:px-16">
        <LightboxGallery images={item.images} />
      </section>
      <a
        href={`/series/${next.slug}/`}
        className="group mx-auto my-20 grid max-w-[1480px] gap-8 border-y border-foreground/10 px-5 py-10 sm:px-8 md:grid-cols-[.75fr_1.25fr] md:items-end md:px-10 md:py-14 lg:px-14 xl:px-16"
      >
        <div className="md:pb-1">
          <p className="text-[10px] uppercase tracking-[.22em] text-foreground/40">
            下一组作品
          </p>
          <h2 className="mt-3 text-4xl font-medium tracking-[-.05em] md:text-6xl">
            {next.title}
          </h2>
          <p className="mt-4 flex items-center gap-4 text-xs tracking-[0.12em] text-foreground/50">
            {next.englishTitle}
            <span className="text-xl transition-transform group-hover:translate-x-2">
              →
            </span>
          </p>
        </div>
        <div className="overflow-hidden bg-[#292824]">
          <img
            src={next.cover}
            width={nextCover?.width}
            height={nextCover?.height}
            alt={`${next.title}专题封面`}
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.02]"
            style={{ objectPosition: next.coverPosition ?? 'center' }}
          />
        </div>
      </a>
      <SiteFooter />
    </main>
  );
}
