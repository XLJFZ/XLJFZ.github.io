export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={`flex items-center justify-between px-5 py-5 md:px-10 md:py-7 ${inverse ? 'absolute inset-x-0 top-0 z-20 text-white mix-blend-difference' : 'border-b border-black/10'}`}>
      <a href="/" className="text-[13px] font-semibold tracking-[0.22em] transition-opacity hover:opacity-60" aria-label="迅雷疾风首页">迅雷疾风</a>
      <nav aria-label="主导航" className="flex items-center gap-5 text-xs tracking-[0.14em] md:gap-8">
        <a className="relative py-1 transition-opacity after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100" href="/series/">作品</a>
        <a className="relative py-1 transition-opacity after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100" href="/about/">关于</a>
      </nav>
    </header>
  );
}
