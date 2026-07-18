/* ── FOOTER ── */
import BrandLogo from '../../brand/BrandLogo';

export default function LandingFooter() {
  return (
    <footer className="py-20 border-t border-slate-200/60 bg-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <BrandLogo size="md" asLink />
          <div className="flex gap-12">
            <a className="text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest transition-colors" href="#">Kiến trúc</a>
            <a className="text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest transition-colors" href="#">Mạng lưới</a>
            <a className="text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest transition-colors" href="#">Bảo mật</a>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.1em]">
            © 2026 Thiết kế bởi PM System Global.
          </p>
        </div>
      </div>
    </footer>
  );
}
