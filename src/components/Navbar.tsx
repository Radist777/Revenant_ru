import { ArrowRight, Menu, Phone, Sparkles, Wallet, Wrench, X } from "lucide-react";
import { useState } from "react";
import { scrollToSection } from "../utils/smoothScroll";

const menuItems = [
  {
    href: "#services",
    label: "Услуги",
    icon: Wrench,
  },
  {
    href: "#prices",
    label: "Цены",
    icon: Wallet,
  },
  {
    href: "#request",
    label: "Заявка",
    icon: Sparkles,
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] sm:px-6 lg:hidden">
      <div className="mx-auto flex w-full max-w-md flex-col items-stretch gap-2 sm:max-w-lg">
        {isOpen && (
          <nav className="animate-pop overflow-hidden rounded-[30px] border border-white/12 bg-slate-950/70 p-2 shadow-[0_16px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="grid gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(event) => {
                      scrollToSection(event, item.href);
                      setIsOpen(false);
                    }}
                    className="flex min-h-12 items-center gap-3 rounded-[22px] px-4 text-[15px] font-medium text-white transition hover:bg-white/10 active:scale-[0.98]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full border border-hairline bg-surface-2 text-blue-300">
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </nav>
        )}

        <div className="relative overflow-hidden rounded-[34px] border border-white/12 bg-slate-950/70 p-2 shadow-[0_16px_56px_rgba(0,0,0,0.44)] backdrop-blur-2xl">
          <div className="relative grid grid-cols-3 gap-2">
            <a
              href="tel:++79095043036"
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[26px] border border-hairline bg-surface-2 text-white transition hover:border-hairline-strong active:scale-[0.97]"
            >
              <Phone size={21} strokeWidth={1.9} className="text-blue-300" />
              <span className="text-[13px] font-medium leading-none">Позвонить</span>
            </a>

            <a
              href="#request"
              onClick={(event) => {
                scrollToSection(event, "#request");
                setIsOpen(false);
              }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[26px] bg-gradient-to-r from-blue-500 to-violet-500 text-white transition hover:from-blue-400 hover:to-violet-400 active:scale-[0.97]"
            >
              <ArrowRight size={21} strokeWidth={1.9} className="-rotate-45" />
              <span className="text-[13px] font-medium leading-none">Записаться</span>
            </a>

            <button
              type="button"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setIsOpen((value) => !value)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[26px] border border-hairline bg-surface-2 text-white transition hover:border-hairline-strong active:scale-[0.97]"
            >
              {isOpen ? (
                <X size={22} strokeWidth={1.9} />
              ) : (
                <Menu size={22} strokeWidth={1.9} />
              )}
              <span className="text-[13px] font-medium leading-none">Меню</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
