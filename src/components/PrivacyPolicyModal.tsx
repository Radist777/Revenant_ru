import { ShieldCheck, X } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  privacyPolicyOperator,
  privacyPolicySections,
  privacyPolicyTitle,
} from "../data/privacyPolicy";
import type { PolicyBlock } from "../data/privacyPolicy";

type PrivacyPolicyModalProps = {
  open: boolean;
  onClose: () => void;
};

const TITLE_ID = "privacy-policy-title";

function PolicyBlockView({ block }: { block: PolicyBlock }) {
  if (block.type === "text") {
    return (
      <p className="text-base leading-relaxed text-white/85">{block.text}</p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="space-y-2 pl-1">
        {block.items.map((item, index) => (
          <li
            key={index}
            className="flex gap-2.5 text-base leading-relaxed text-white/85"
          >
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-300/80"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Таблица (пункт 6)
  return (
    <div className="overflow-hidden rounded-control border border-hairline">
      <table className="w-full border-collapse text-left align-top">
        <tbody>
          {block.rows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-hairline last:border-b-0"
            >
              <th
                scope="row"
                className="w-2/5 border-r border-hairline bg-surface-2 px-3.5 py-3 align-top text-[15px] font-semibold text-white/90 sm:px-4"
              >
                {row.label}
              </th>
              <td className="px-3.5 py-3 align-top text-base leading-relaxed text-white/85 sm:px-4">
                {row.items.length > 1 ? (
                  <ul className="space-y-1.5">
                    {row.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-300/80"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  row.items[0]
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPolicyModal({
  open,
  onClose,
}: PrivacyPolicyModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Блокировка прокрутки страницы + сохранение/возврат фокуса
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Фокус внутрь диалога после открытия
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Закрытие по Esc + простая ловушка фокуса (Tab)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6"
    >
      {/* Затемнение фона */}
      <button
        type="button"
        aria-label="Закрыть политику конфиденциальности"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/80"
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="animate-pop relative flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-hairline-strong bg-surface-1 shadow-e2"
      >
            {/* Шапка */}
            <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4 sm:px-7 sm:py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-blue-300/25 bg-blue-400/10 text-blue-200">
                  <ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id={TITLE_ID}
                    className="text-[15px] font-semibold leading-tight tracking-tight text-white sm:text-lg"
                  >
                    {privacyPolicyTitle}
                  </h2>
                  <p className="mt-0.5 text-sm text-white/65">
                    {privacyPolicyOperator}
                  </p>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-white/80 transition-colors hover:border-hairline-strong hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Прокручиваемый текст */}
            <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              <div className="space-y-7">
                {privacyPolicySections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="text-base font-semibold leading-snug text-white">
                      {section.heading}
                    </h3>
                    <div className="mt-2.5 space-y-3">
                      {section.blocks.map((block, index) => (
                        <PolicyBlockView key={index} block={block} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* Подвал модалки */}
            <div className="border-t border-hairline px-5 py-3.5 sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-11 w-full items-center justify-center rounded-control border border-hairline bg-surface-2 text-sm font-medium text-white transition-colors hover:border-hairline-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                Принять
              </button>
            </div>
      </div>
    </div>
  );
}
