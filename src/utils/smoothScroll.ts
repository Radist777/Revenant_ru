import type { MouseEvent } from "react";

export function scrollToSection(
  event: MouseEvent<HTMLAnchorElement>,
  hash: string
) {
  if (!hash.startsWith("#")) return;

  const target = document.querySelector(hash);
  if (!target) return;

  event.preventDefault();

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const isDesktop = window.innerWidth >= 1024;
  const desktopShift =
    window.innerWidth >= 640
      ? Number((target as HTMLElement).dataset.scrollShift ?? 0)
      : 0;
  // На десктопе учитываем высоту sticky-шапки (~64px)
  const headerOffset = isDesktop ? 84 : 12;
  const top =
    target.getBoundingClientRect().top + window.scrollY - headerOffset + desktopShift;

  window.history.pushState(null, "", hash);
  window.scrollTo({
    top,
    behavior: reducedMotion ? "auto" : "smooth",
  });
}
