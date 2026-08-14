import { ChevronDown, Wallet } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { priceCategories, priceNotes, type PriceRow } from "../data/prices";
import { useReveal } from "../utils/useReveal";

// Склонение через Intl — «1 позиция / 2 позиции / 5 позиций»
const pluralRules = new Intl.PluralRules("ru-RU");
const positionForms: Record<string, string> = {
  one: "позиция",
  few: "позиции",
  many: "позиций",
  other: "позиций",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300";

/** Строка прейскуранта: название слева, цена справа, между ними пунктир. */
function PriceLine({ row, muted }: { row: PriceRow; muted?: boolean }) {
  return (
    <li className="py-1.5">
      <span className="flex items-baseline gap-2">
        <span
          className={`min-w-0 break-words text-sm leading-relaxed ${muted ? "text-white/70" : "text-white/85"}`}
        >
          {row.name}
        </span>
        {/* Пунктирный лидер — декор, для скринридера не нужен */}
        <span aria-hidden className="min-w-3 flex-1 border-b border-dashed border-hairline" />
        <span
          className={`shrink-0 whitespace-nowrap text-sm font-medium tabular-nums ${muted ? "text-white/80" : "text-white"}`}
        >
          {row.price}
        </span>
      </span>
      {row.note && (
        <span className="mt-0.5 block text-xs leading-relaxed text-white/55">{row.note}</span>
      )}
    </li>
  );
}

export default function Prices() {
  const headerRef = useReveal<HTMLDivElement>();
  const listRef = useReveal<HTMLDivElement>();
  // Открыта одна категория — иначе секция перестаёт быть компактной
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      id="prices"
      className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="relative mx-auto w-full max-w-3xl">
        <div ref={headerRef} className="reveal mb-6 sm:mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-100/90">
            <Wallet size={15} className="text-blue-300" />
            Прейскурант
          </div>

          <h2 className="text-balance text-3xl font-light leading-tight tracking-normal text-white min-[390px]:text-4xl sm:text-5xl">
            Цены на ремонт
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Итоговую сумму называем до начала работ — после бесплатной диагностики. Без скрытых
            доплат.
          </p>
        </div>

        <div ref={listRef} className="reveal grid gap-3 min-[390px]:gap-4">
          {priceCategories.map((category) => {
            const Icon = category.icon;
            const isOpen = openId === category.id;
            const buttonId = `price-${category.id}-button`;
            const panelId = `price-${category.id}-panel`;
            const rest =
              category.groups.reduce((sum, group) => sum + group.rows.length, 0) -
              category.highlights.length;

            return (
              <article
                key={category.id}
                className="card-cosmic rounded-card border shadow-e1 transition-colors"
                style={{ "--tint": category.tint } as CSSProperties}
              >
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId(isOpen ? null : category.id)}
                    className={`flex min-h-12 w-full items-start gap-3 rounded-card p-4 text-left ${focusRing}`}
                  >
                    {/* Плашка иконки берёт тон из --tint карточки */}
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-control border"
                      style={{
                        background: "color-mix(in oklab, var(--tint) 14%, transparent)",
                        borderColor: "color-mix(in oklab, var(--tint) 30%, transparent)",
                      }}
                    >
                      <Icon
                        size={22}
                        strokeWidth={1.75}
                        aria-hidden
                        style={{ color: "color-mix(in oklab, var(--tint) 45%, white)" }}
                      />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="break-words text-base font-semibold leading-snug text-white sm:text-lg">
                        {category.title}
                      </span>
                      <span
                        className="shrink-0 whitespace-nowrap text-sm font-medium tabular-nums"
                        style={{ color: "color-mix(in oklab, var(--tint) 50%, white)" }}
                      >
                        {category.from}
                      </span>
                    </span>

                    <ChevronDown
                      size={20}
                      aria-hidden
                      className={`mt-1.5 shrink-0 text-white/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </h3>

                {isOpen ? (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="animate-pop px-4 pb-4"
                  >
                    {category.groups.map((group, index) => (
                      <div key={group.title ?? index} className={index > 0 ? "mt-5" : ""}>
                        {group.title && (
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                            {group.title}
                          </p>
                        )}
                        <ul>
                          {group.rows.map((row) => (
                            <PriceLine key={row.name} row={row} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pb-4">
                    <ul>
                      {category.highlights.map((row) => (
                        <PriceLine key={row.name} row={row} muted />
                      ))}
                    </ul>
                    <p className="mt-1.5 text-xs text-white/55">
                      …ещё {rest} {positionForms[pluralRules.select(rest)]}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-card border border-hairline bg-surface-1 p-4">
          <ul className="grid gap-2">
            {priceNotes.map((note) => (
              <li key={note} className="flex gap-2 text-xs leading-relaxed text-white/60">
                <span aria-hidden className="text-white/35">
                  —
                </span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
