import Link from 'next/link';

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={`flex items-center justify-between px-5 py-5 md:px-10 md:py-7 ${inverse ? 'absolute inset-x-0 top-0 z-20 text-white mix-blend-difference' : 'border-b border-black/10'}`}>
      <Link href="/" className="text-[13px] font-semibold tracking-[0.22em]">迅雷疾风</Link>
      <nav aria-label="主导航" className="flex items-center gap-5 text-xs tracking-[0.14em] md:gap-8">
        <Link className="transition-opacity hover:opacity-55" href="/series">作品</Link>
        <Link className="transition-opacity hover:opacity-55" href="/about">关于</Link>
      </nav>
    </header>
  );
}
