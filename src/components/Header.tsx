import { ArrowRight, Phone } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { scrollToSection } from "../utils/smoothScroll";

const navLinks = [
  { href: "#services", label: "Услуги" },
  { href: "#prices", label: "Цены" },
  { href: "#request", label: "Заявка" },
];

function scrollToTop(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  window.history.pushState(null, "", " ");
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
}

/**
 * Тонкая десктоп-шапка. Появляется только когда секция Hero прокручена
 * (fixed, чтобы не резервировать место сверху и не дублировать CTA в Hero).
 */
export default function Header() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 hidden border-b border-hairline bg-surface-1/95 backdrop-blur transition-all duration-300 lg:block",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <a
          href="#"
          onClick={scrollToTop}
          className="text-lg font-semibold tracking-tight text-white"
        >
          RE
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            VENANT
          </span>
        </a>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => scrollToSection(event, link.href)}
              className="rounded-full px-4 py-2 text-[15px] font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+79095043036"
            className="flex items-center gap-2 text-[15px] font-medium text-white/85 transition-colors hover:text-white"
          >
            <Phone size={16} className="text-blue-300" />
            +7 (909) 504-30-36
          </a>

          <a
            href="#request"
            onClick={(event) => scrollToSection(event, "#request")}
            className="group flex items-center gap-2 rounded-full border border-hairline-strong bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 text-[15px] font-semibold text-white shadow-e1 transition hover:from-blue-400 hover:to-violet-400 active:scale-[0.98]"
          >
            Записаться
            <ArrowRight
              size={16}
              className="-rotate-45 transition-transform duration-300 group-hover:rotate-0"
            />
          </a>
        </div>
      </div>
    </header>
  );
}
