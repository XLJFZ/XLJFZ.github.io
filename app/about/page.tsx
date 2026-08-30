import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function About() {
  return (
    <main>
      <SiteHeader />
      <section className="grid min-h-[calc(100svh-70px)] gap-12 px-5 py-14 md:grid-cols-[1.15fr_.85fr] md:gap-24 md:px-10 md:py-24">
        <div><p className="text-[10px] uppercase tracking-[.24em] text-black/45">About</p><h1 className="mt-4 text-[clamp(2.8rem,6.5vw,5.8rem)] font-medium leading-[.94] tracking-[-.055em]">关于<br />迅雷疾风</h1></div>
        <div className="max-w-xl md:pt-16"><p className="text-xl font-light leading-9 tracking-[-.02em]">我是一名关注城市建筑与自然地景的摄影师。镜头不是答案，而是持续观看世界的方式。</p><div className="mt-12 space-y-5 text-sm font-light leading-7 text-black/60"><p>作品常从日常行走开始：城市中被忽略的转角、光落在材料上的几秒钟，以及天气将熟悉景观变得陌生的时刻。</p><p>目前工作与生活于上海，可接受建筑、风景、旅行及编辑类拍摄委托。</p></div><div className="mt-14 border-t border-black/10 pt-6"><p className="text-[10px] uppercase tracking-[.2em] text-black/40">联系与社交</p><div className="mt-4 flex flex-wrap gap-x-7 gap-y-3 text-sm"><a href="mailto:hello@example.com">hello@example.com</a><a href="#">Instagram</a><a href="#">小红书</a></div><p className="mt-5 text-xs text-black/35">以上为占位信息，可替换为你的真实联系方式。</p></div></div>
      </section>
      <SiteFooter />
    </main>
  );
}
