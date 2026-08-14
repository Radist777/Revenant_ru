import { MapPin, Mail, Phone, Send, ShieldCheck } from "lucide-react";
import { usePrivacyPolicy } from "../context/privacyPolicy";

const contactLinks = [
  {
    label: "Телефон",
    value: "+7 (909) 504-30-36",
    href: "tel:+79095043036",
    icon: Phone,
    external: false,
  },
  {
    label: "Почта",
    value: "revenant.ru@gmail.com",
    href: "mailto:revenant.ru@gmail.com",
    icon: Mail,
    external: false,
  },
  {
    label: "Telegram",
    value: "Написать в Telegram",
    href: "https://t.me/ViktorTechnoV",
    icon: Send,
    external: true,
  },
];

// Ссылка на карту (Барнаул). Замените на точный адрес/точку сервиса.
const MAP_URL = "https://yandex.ru/maps/197/barnaul/";

export default function Footer() {
  const { open: openPrivacyPolicy } = usePrivacyPolicy();

  return (
    <footer className="relative w-full border-t border-hairline bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-[calc(env(safe-area-inset-bottom)+28px)] sm:px-6 sm:pt-12 sm:pb-10 lg:pb-12">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          {/* Бренд + гарантия */}
          <div className="max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-200/85">
              Ревенант
            </p>
            <p className="mt-2 text-base leading-relaxed text-white/80">
              Ремонт и настройка компьютерной и цифровой техники в Барнауле.
            </p>
            <p className="mt-4 flex items-start gap-2 text-[15px] leading-relaxed text-white/75">
              <ShieldCheck
                size={18}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              На выполненные работы и установленные комплектующие
              предоставляется гарантия.
            </p>
          </div>

          {/* Контакты */}
          <div>
            <h2 className="text-base font-semibold text-white/90">Контакты</h2>
            <ul className="mt-3 space-y-2.5">
              {contactLinks.map(({ label, value, href, icon: Icon, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="group flex items-center gap-3 text-white/80 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                      className="shrink-0 text-blue-300/90"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-sm text-white/60">{label}</span>
                      <span className="text-base font-medium leading-tight">
                        {value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ссылки */}
          <nav aria-label="Дополнительные ссылки">
            <h2 className="text-base font-semibold text-white/90">Информация</h2>
            <ul className="mt-3 space-y-2.5 text-[15px]">
              <li>
                <a
                  href={MAP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-white/80 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                >
                  <MapPin
                    size={17}
                    strokeWidth={1.8}
                    className="shrink-0 text-blue-300/90"
                    aria-hidden="true"
                  />
                  На карте — Барнаул
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openPrivacyPolicy}
                  className="text-left text-white/80 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                >
                  Политика конфиденциальности
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Нижняя строка */}
        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-[15px] text-white/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span>© 2026 Ревенант. Все права защищены.</span>
          <a
            href="https://cryzothic.tech"
            target="_blank"
            rel="noreferrer"
            className="w-fit text-white/60 transition hover:text-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          >
            Сделано в cryzothic.tech
          </a>
        </div>
      </div>
    </footer>
  );
}
