export function SiteFooter() {
  return (
    <footer className="grid gap-8 border-t border-black/10 px-5 py-9 text-[11px] tracking-[.08em] md:grid-cols-[1fr_auto] md:px-10">
      <p>© 2026 迅雷疾风</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-black/55">
        <a className="transition-colors hover:text-black" href="#" aria-label="Instagram 占位链接">Instagram</a>
        <a className="transition-colors hover:text-black" href="#" aria-label="小红书占位链接">小红书</a>
        <a className="transition-colors hover:text-black" href="mailto:hello@example.com">Email</a>
      </div>
    </footer>
  );
}
