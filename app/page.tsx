import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { series } from '@/lib/portfolio';

export default function Home() {
  return (
    <main>
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-neutral-950 text-white">
        <SiteHeader inverse />
        <img src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2200&q=88" alt="粗野主义建筑在阴云下的几何轮廓" className="absolute inset-0 h-full w-full scale-[1.01] object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/70" aria-hidden="true" />
        <div className="relative z-10 grid w-full gap-6 px-5 pb-7 md:grid-cols-[1fr_auto] md:items-end md:px-10 md:pb-10">
          <div><p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-white/70">建筑 · 风景 · 2023—2026</p><h1 className="max-w-4xl text-[clamp(3.2rem,9vw,8.7rem)] font-medium leading-[0.86] tracking-[-0.065em]">空间的<br />静默叙事</h1></div>
          <Link href="/series" className="mb-1 flex items-center gap-4 text-xs tracking-[0.14em] text-white/85 transition-colors hover:text-white">浏览作品 <span aria-hidden="true" className="text-lg">↘</span></Link>
        </div>
      </section>
      <section className="px-5 py-20 md:px-10 md:py-28">
        <div className="mb-16 grid gap-6 md:grid-cols-2"><p className="text-[10px] uppercase tracking-[.24em] text-black/45">Selected Series</p><p className="max-w-xl text-xl font-light leading-9 tracking-[-.02em] md:justify-self-end">在建筑的秩序与自然的偶然之间，寻找安静、准确而有余韵的画面。</p></div>
        <div className="space-y-20 md:space-y-28">{series.map((item, index) => <Link href={`/series/${item.slug}`} key={item.slug} className={`group grid gap-5 md:grid-cols-[1.45fr_.55fr] md:items-end ${index % 2 ? 'md:grid-cols-[.55fr_1.45fr]' : ''}`}><div className={`overflow-hidden bg-neutral-200 ${index % 2 ? 'md:order-2' : ''}`}><img src={item.cover} alt={item.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]" /></div><div className={index % 2 ? 'md:order-1' : ''}><p className="text-[10px] uppercase tracking-[.2em] text-black/40">{String(index + 1).padStart(2, '0')} · {item.category}</p><h2 className="mt-3 text-4xl font-medium leading-none tracking-[-.05em] md:text-6xl">{item.title}</h2><p className="mt-4 text-sm text-black/50">{item.englishTitle} · {item.year}</p></div></Link>)}</div>
      </section>
      <section className="grid gap-12 bg-[#181817] px-5 py-20 text-white md:grid-cols-2 md:px-10 md:py-28"><h2 className="text-[clamp(2.8rem,7vw,6.5rem)] font-medium leading-[.95] tracking-[-.06em]">让影像<br />保持呼吸</h2><div className="max-w-lg md:self-end md:justify-self-end"><p className="font-light leading-8 text-white/65">可承接建筑、空间、旅行与编辑类拍摄。若你有一个等待被看见的地点，欢迎来信。</p><a href="mailto:hello@example.com" className="mt-8 inline-flex border-b border-white/40 pb-2 text-sm tracking-[.1em]">发起合作 →</a></div></section>
      <SiteFooter />
    </main>
  );
}
