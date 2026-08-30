export function SiteFooter() {
  return (
    <footer className="grid gap-8 border-t border-black/10 px-5 py-9 text-xs md:grid-cols-[1fr_auto] md:px-10">
      <p>© 2026 林野影像</p>
      <div className="flex gap-6 text-black/60">
        <a href="#" aria-label="Instagram 占位链接">Instagram</a>
        <a href="#" aria-label="小红书占位链接">小红书</a>
        <a href="mailto:hello@example.com">Email</a>
      </div>
    </footer>
  );
}
