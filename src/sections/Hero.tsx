import {
  ArrowRight,
  Computer,
  Laptop,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Tv,
  Zap,
} from "lucide-react";
import type { CSSProperties } from "react";
import { TINT } from "../data/tints";
import { scrollToSection } from "../utils/smoothScroll";
import { useReveal } from "../utils/useReveal";

const deviceIcons = [Smartphone, Computer, Tv, Laptop];

export default function Hero() {
  const cardRef = useReveal<HTMLDivElement>();

  return (
    <section id="hero" className="relative min-h-[100svh] w-full overflow-hidden">
      <div className="relative z-10 flex min-h-[100svh] items-start justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+120px)] pt-[calc(env(safe-area-inset-top)+10px)] sm:items-center sm:px-6 sm:py-16 lg:py-12">
        <div ref={cardRef} className="reveal w-full max-w-md sm:max-w-5xl">
          <div
            className="card-cosmic relative flex min-h-[min(74svh,680px)] w-full flex-col justify-between overflow-hidden rounded-card border px-5 py-5 shadow-e2 min-[390px]:px-6 min-[390px]:py-6 sm:min-h-[680px] sm:px-10 sm:py-10 lg:min-h-[720px] lg:px-14 lg:py-14"
            style={{ "--tint": TINT.nebula } as CSSProperties}
          >
            {/* Один тонкий акцент сверху вместо стеклянных слоёв */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

            <div className="relative">
              <div className="mb-5 flex items-center justify-between gap-3 min-[390px]:mb-6 sm:mb-8">
                <div className="flex min-h-10 items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 text-xs uppercase tracking-[0.18em] text-white/85">
                  <MapPin size={14} className="text-blue-300" />
                  <span>Барнаул</span>
                </div>

                <div className="flex shrink-0 gap-1.5 rounded-full border border-hairline bg-surface-2 p-1.5">
                  {deviceIcons.map((Icon) => (
                    <span
                      key={Icon.displayName}
                      className="flex size-8 items-center justify-center rounded-full bg-surface-1 text-white/70"
                    >
                      <Icon size={15} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="mx-auto max-w-2xl text-center">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-blue-200/85">
                  Ремонт цифровой техники
                </p>

                <h1 className="text-[clamp(3.05rem,17vw,4.65rem)] font-light leading-[0.9] tracking-tight text-white sm:text-7xl lg:text-[6rem]">
                  <span className="inline-block">RE</span>
                  <span className="inline-block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}VENANT
                  </span>
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-white/88 min-[390px]:text-[17px] sm:mt-6 sm:text-xl sm:leading-relaxed">
                  Профессиональный ремонт ПК, телефонов и цифровой техники.
                </p>

                <p className="mx-auto mt-2 max-w-lg text-balance text-sm leading-relaxed text-white/70 min-[390px]:text-[15px] sm:mt-3 sm:text-lg">
                  Диагностика, замена комплектующих и понятная цена до начала работ.
                </p>
              </div>
            </div>

            <div className="relative mt-6 min-[390px]:mt-7 sm:mt-10">
              <div className="grid grid-cols-[1fr_auto] gap-2.5">
                <a
                  href="#request"
                  onClick={(event) => scrollToSection(event, "#request")}
                  className="group flex min-h-14 items-center justify-center rounded-control border border-hairline-strong bg-gradient-to-r from-blue-500 to-violet-500 px-5 text-sm font-medium text-white shadow-e1 transition hover:from-blue-400 hover:to-violet-400 active:scale-[0.98] min-[390px]:text-base"
                >
                  <span className="flex items-center gap-2">
                    Записаться
                    <ArrowRight
                      size={18}
                      className="-rotate-45 transition-transform duration-300 group-hover:rotate-0"
                    />
                  </span>
                </a>

                <a
                  href="tel:+79095043036"
                  aria-label="Позвонить"
                  className="flex min-h-14 items-center justify-center gap-2 rounded-control border border-hairline bg-surface-2 px-5 text-sm font-medium text-white transition-colors hover:border-hairline-strong active:scale-[0.97] min-[390px]:text-base"
                >
                  <Phone size={20} strokeWidth={1.9} className="text-blue-300" />
                  <span className="hidden min-[420px]:inline">Позвонить</span>
                </a>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                <div className="card-cosmic-inner flex min-h-16 items-start gap-3 rounded-control border p-3">
                  <ShieldCheck size={21} className="mt-0.5 shrink-0 text-blue-300" />
                  <div>
                    <h3 className="text-base font-medium leading-tight text-white">
                      Честный ремонт
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">
                      Озвучиваем цену до ремонта — никаких «сюрпризов».
                    </p>
                  </div>
                </div>

                <div className="card-cosmic-inner flex min-h-16 items-start gap-3 rounded-control border p-3">
                  <Zap size={21} className="mt-0.5 shrink-0 text-amber-300" />
                  <div>
                    <h3 className="text-base font-medium leading-tight text-white">
                      Пенсионерам скидка 20%
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">
                      Мы ценим ваш бюджет.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
