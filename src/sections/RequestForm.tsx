import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Hash,
  ImagePlus,
  Loader2,
  Phone,
  Plus,
  Ruler,
  Sparkles,
  Tag,
  TriangleAlert,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent, ReactNode } from "react";
import { usePrivacyPolicy } from "../context/privacyPolicy";
import { TINT } from "../data/tints";
import { useReveal } from "../utils/useReveal";

type FormValues = {
  name: string;
  phone: string;
  device: string;
  description: string;
  contactTime: string;
  backCode: string;
  diagonal: string;
  model: string;
};

type FormErrors = Partial<Record<keyof FormValues | "privacy", string>>;

type FieldProps = {
  icon: LucideIcon;
  label: string;
  error?: string;
  errorId?: string;
  multiline?: boolean;
  required?: boolean;
  children: ReactNode;
};

const initialValues: FormValues = {
  name: "",
  phone: "",
  device: "",
  description: "",
  contactTime: "",
  backCode: "",
  diagonal: "",
  model: "",
};

const repairOptions = [
  "Ноутбук",
  "Компьютер",
  "Смартфон",
  "Телевизор",
  "Обучение и настройка",
  "Другое устройство",
];

type DeviceField = {
  key: "backCode" | "diagonal" | "model";
  label: string;
  placeholder: string;
  icon: LucideIcon;
  numeric?: boolean;
};

// Характеристики, которые имеет смысл спрашивать по конкретному устройству.
// Для «Компьютер», «Обучение и настройка», «Другое устройство» доп. полей нет.
const deviceFields: Record<string, DeviceField[]> = {
  Смартфон: [
    {
      key: "backCode",
      label: "Код на задней крышке (если есть)",
      placeholder: "Например, SM-A525F",
      icon: Hash,
    },
    { key: "model", label: "Модель", placeholder: "Samsung A52", icon: Tag },
  ],
  Телевизор: [
    {
      key: "backCode",
      label: "Код на задней крышке",
      placeholder: "Например, UE43TU7090U",
      icon: Hash,
    },
    { key: "diagonal", label: "Диагональ", placeholder: "43", icon: Ruler, numeric: true },
    { key: "model", label: "Модель", placeholder: "Samsung TU7090", icon: Tag },
  ],
  Ноутбук: [
    { key: "model", label: "Модель", placeholder: "Lenovo IdeaPad 3", icon: Tag },
  ],
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300";

function maskPhone(value: string) {
  const rawDigits = value.replace(/\D/g, "");
  const withoutCountry = rawDigits.startsWith("8")
    ? rawDigits.slice(1)
    : rawDigits.startsWith("7")
      ? rawDigits.slice(1)
      : rawDigits;
  const digits = withoutCountry.slice(0, 10);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ];

  let result = "+7";
  if (parts[0]) result += ` (${parts[0]}`;
  if (parts[0].length === 3) result += ")";
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;

  return result;
}

/**
 * Ужимаем фото прямо в браузере: три снимка с телефона (~15 МБ) не пролезут
 * в лимит тела serverless-функции 4.5 МБ и заявка потеряется молча.
 * Длинная сторона ≤1280px, JPEG 0.8.
 */
async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 2D недоступен");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.8);
}

function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <span
      id={id}
      className="animate-pop mt-2 block px-1 text-sm font-medium text-rose-200/95"
    >
      {children}
    </span>
  );
}

function FieldShell({
  icon: Icon,
  label,
  error,
  errorId,
  multiline = false,
  required = false,
  children,
}: FieldProps) {
  return (
    <label className={`group block${error ? " animate-shake" : ""}`}>
      <span className="mb-2 block px-1 text-sm font-medium leading-none text-white/90">
        {label}
        {required && (
          <span className="text-rose-300" aria-hidden="true">
            {" *"}
          </span>
        )}
      </span>
      <span
        className={[
          "relative flex min-h-14 gap-3 rounded-control border bg-surface-input px-4 transition-colors duration-200",
          "focus-within:bg-surface-2",
          multiline ? "items-start" : "items-center",
          error
            ? "border-rose-300/55 ring-1 ring-rose-400/25"
            : "border-hairline focus-within:border-accent",
        ].join(" ")}
      >
        <Icon
          size={20}
          strokeWidth={1.85}
          className={
            error
              ? `relative shrink-0 text-rose-200 ${multiline ? "mt-4" : ""}`
              : `relative shrink-0 text-blue-200 ${multiline ? "mt-4" : ""}`
          }
        />
        {children}
      </span>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </label>
  );
}

export default function RequestForm() {
  const { open: openPrivacyPolicy } = usePrivacyPolicy();
  const cardRef = useReveal<HTMLDivElement>();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sentWarning, setSentWarning] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [hasPrivacyConsent, setHasPrivacyConsent] = useState(false);
  // Ловушка для ботов: люди это поле не видят и не таба́ют, бот заполняет.
  // Имя не «website»: менеджеры паролей вписывают туда URL, и живая заявка
  // молча улетала бы в спам.
  const [contactRef, setContactRef] = useState("");
  const deviceTriggerRef = useRef<HTMLButtonElement>(null);
  const fieldRefs = useRef<
    Partial<Record<keyof FormValues | "privacy", HTMLElement | null>>
  >({});

  const photoLabel = useMemo(() => {
    if (photos.length === 0) return "Добавить фото";
    return `${photos.length} из 3 фото`;
  }, [photos.length]);

  const extraFields = deviceFields[values.device] ?? [];

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updatePhone = (value: string) => {
    // Backspace по разделителю: цифр столько же, строка короче — значит стёрли
    // «)» или «-», и маска сейчас допишет его обратно, а поле залипнет.
    // Удаляем цифру руками, чтобы стирание всегда двигалось назад.
    const isSeparatorDelete =
      value.length < values.phone.length &&
      value.replace(/\D/g, "") === values.phone.replace(/\D/g, "");
    const next = isSeparatorDelete
      ? value.replace(/\D/g, "").slice(0, -1)
      : value;
    const digits = next.replace(/\D/g, "");

    if (next.trim() === "" || digits === "" || digits === "7" || digits === "8") {
      updateValue("phone", "");
      return;
    }

    updateValue("phone", maskPhone(next));
  };

  // Опция размонтируется вместе со списком, поэтому фокус возвращаем на триггер:
  // иначе он падает на <body> и до новых полей не дотабаться.
  const closeDeviceList = () => {
    setIsDeviceOpen(false);
    deviceTriggerRef.current?.focus();
  };

  // Смена устройства сбрасывает характеристики: иначе диагональ телевизора
  // уедет в заявку на ноутбук.
  const selectDevice = (option: string) => {
    setValues((current) => ({
      ...current,
      device: option,
      backCode: "",
      diagonal: "",
      model: "",
    }));
    closeDeviceList();
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const phoneDigits = values.phone.replace(/\D/g, "");

    if (values.name.trim().length < 2) {
      nextErrors.name = "Как к вам обращаться?";
    }
    if (phoneDigits.length < 11) {
      nextErrors.phone = "Введите номер телефона полностью.";
    }
    if (values.description.trim().length < 8) {
      nextErrors.description = "Опишите проблему хотя бы в пару слов.";
    }
    if (!hasPrivacyConsent) {
      nextErrors.privacy = "Подтвердите согласие с политикой конфиденциальности.";
    }

    setErrors(nextErrors);

    // Фокус на первое проблемное поле — иначе непонятно, что именно не так.
    const firstInvalid = (["name", "phone", "description", "privacy"] as const).find(
      (key) => nextErrors[key]
    );
    if (firstInvalid) fieldRefs.current[firstInvalid]?.focus();

    return Object.keys(nextErrors).length === 0;
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    setSendError(null);

    try {
      // Сжатие best-effort: упавшее фото пропускаем, заявку это не роняет.
      const encoded = await Promise.all(
        photos.map((photo) => compressImage(photo).catch(() => null))
      );

      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: values.phone,
          description: values.description.trim(),
          device: values.device || undefined,
          backCode: values.backCode.trim() || undefined,
          diagonal: values.diagonal.trim() || undefined,
          model: values.model.trim() || undefined,
          contactTime: values.contactTime.trim() || undefined,
          contact_ref: contactRef,
          photos: encoded.filter((item): item is string => item !== null),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; warning?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? `Сервер ответил ${response.status}`);
      }

      // Успех с оговоркой (например, часть фото не ушла) — показываем, иначе
      // человек считает, что мастер уже видит снимки.
      setSentWarning(payload.warning ?? null);
      setIsSent(true);
      setValues(initialValues);
      setPhotos([]);
      setContactRef("");
      setHasPrivacyConsent(false);
      setShowDetails(false);
      window.setTimeout(() => setIsSent(false), 4200);
    } catch {
      // Форму не сбрасываем — человек не должен потерять введённое.
      setSendError(
        "Не удалось отправить заявку. Проверьте связь и попробуйте ещё раз или позвоните нам: +7 (909) 504-30-36."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotos(Array.from(event.currentTarget.files ?? []).slice(0, 3));
  };

  // Только вид и aria: атрибут disabled на сфокусированной кнопке сбрасывает
  // фокус на <body>, и клавиатурный пользователь теряет место в форме.
  // Повторную отправку держит ранний выход в submitRequest.
  const isSubmitDisabled = !hasPrivacyConsent || isSubmitting;

  return (
    <section
      id="request"
      className="relative scroll-mt-24 px-3 py-12 pb-[calc(env(safe-area-inset-bottom)+124px)] sm:px-6 sm:py-8 sm:pb-36 lg:py-10"
    >
      <div className="relative mx-auto w-full max-w-3xl">
        <div
          ref={cardRef}
          style={{ "--tint": TINT.violet } as CSSProperties}
          className="reveal card-cosmic relative rounded-card border px-4 py-5 shadow-e2 min-[390px]:px-5 sm:p-7"
        >
          <div className="relative mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-100/90">
              <Sparkles size={15} className="text-blue-300" />
              Заявка в сервис
            </div>
            <h2 className="text-balance text-3xl font-light leading-tight tracking-normal text-white min-[390px]:text-4xl sm:text-5xl">
              Расскажите, что случилось
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80 min-[390px]:text-base sm:text-lg">
              Оставьте контакты и короткое описание. Мастер свяжется с вами,
              уточнит детали и подскажет следующий шаг.
            </p>
          </div>

          <form className="relative grid gap-4" onSubmit={submitRequest} noValidate>
            {/* Honeypot: уводим за экран, а не display:none — так его видят боты,
                но не видят люди и скринридеры. */}
            <input
              type="text"
              name="contact_ref"
              value={contactRef}
              onChange={(event) => setContactRef(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] top-0 h-px w-px"
            />

            <FieldShell
              icon={User}
              label="Имя"
              error={errors.name}
              errorId="request-name-error"
              required
            >
              <input
                ref={(node) => {
                  fieldRefs.current.name = node;
                }}
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                placeholder="Например, Алексей"
                autoComplete="name"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "request-name-error" : undefined}
                className="relative h-14 min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/45"
              />
            </FieldShell>

            <FieldShell
              icon={Phone}
              label="Телефон"
              error={errors.phone}
              errorId="request-phone-error"
              required
            >
              <input
                ref={(node) => {
                  fieldRefs.current.phone = node;
                }}
                value={values.phone}
                onChange={(event) => updatePhone(event.target.value)}
                placeholder="+7 (___) ___-__-__"
                inputMode="tel"
                autoComplete="tel"
                aria-required="true"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "request-phone-error" : undefined}
                className="relative h-14 min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/45"
              />
            </FieldShell>

            <FieldShell
              icon={FileText}
              label="Что сломалось"
              error={errors.description}
              errorId="request-description-error"
              multiline
              required
            >
              <textarea
                ref={(node) => {
                  fieldRefs.current.description = node;
                }}
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
                placeholder="Например: не включается, шумит, быстро разряжается..."
                rows={4}
                aria-required="true"
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? "request-description-error" : undefined
                }
                className="relative min-h-28 min-w-0 flex-1 resize-none bg-transparent py-4 text-[16px] leading-relaxed text-white outline-none placeholder:text-white/45"
              />
            </FieldShell>

            <div
              className="relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsDeviceOpen(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && isDeviceOpen) {
                  event.preventDefault();
                  closeDeviceList();
                }
              }}
            >
              <span className="mb-2 block px-1 text-sm font-medium leading-none text-white/90">
                Устройство (необязательно)
              </span>
              <button
                ref={deviceTriggerRef}
                type="button"
                aria-expanded={isDeviceOpen}
                aria-haspopup="listbox"
                onClick={() => setIsDeviceOpen((value) => !value)}
                className={[
                  "relative flex min-h-14 w-full items-center gap-3 rounded-control border bg-surface-input px-4 text-left transition-colors duration-200 active:scale-[0.99]",
                  focusRing,
                  isDeviceOpen ? "border-accent bg-surface-2" : "border-hairline",
                ].join(" ")}
              >
                <Wrench size={20} strokeWidth={1.85} className="relative shrink-0 text-blue-200" />
                <span
                  className={[
                    "relative min-w-0 flex-1 text-[16px]",
                    values.device ? "text-white" : "text-white/45",
                  ].join(" ")}
                >
                  {values.device || "Выберите устройство"}
                </span>
                <ChevronDown
                  size={19}
                  strokeWidth={1.85}
                  className={[
                    "relative shrink-0 text-white/58 transition duration-300",
                    isDeviceOpen ? "rotate-180 text-blue-200" : "",
                  ].join(" ")}
                />
              </button>

              {isDeviceOpen && (
                <div
                  role="listbox"
                  className="animate-pop absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-control border border-hairline-strong bg-surface-2 p-1.5 shadow-e2"
                >
                  {repairOptions.map((option) => {
                    const isSelected = values.device === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectDevice(option)}
                        className={[
                          "relative flex min-h-11 w-full items-center justify-between rounded-control px-3.5 text-left text-[15px] font-medium transition",
                          focusRing,
                          isSelected
                            ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white"
                            : "text-white/80 hover:bg-white/[0.07] hover:text-white",
                        ].join(" ")}
                      >
                        <span>{option}</span>
                        {isSelected && (
                          <CheckCircle2 size={17} className="text-blue-100" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {extraFields.length > 0 && (
              <div className="animate-pop grid gap-4">
                {extraFields.map((field) => (
                  <FieldShell key={field.key} icon={field.icon} label={field.label}>
                    <input
                      value={values[field.key]}
                      onChange={(event) => updateValue(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      inputMode={field.numeric ? "numeric" : undefined}
                      autoComplete="off"
                      className="relative h-14 min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/45"
                    />
                  </FieldShell>
                ))}
              </div>
            )}

            {/* Необязательное скрыто, чтобы первое обращение было коротким */}
            <button
              type="button"
              aria-expanded={showDetails}
              aria-controls="request-extra"
              onClick={() => setShowDetails((value) => !value)}
              style={{ "--tint": TINT.violet } as CSSProperties}
              className={`card-cosmic-inner flex min-h-12 items-center justify-between rounded-control border px-4 text-sm font-medium text-white/85 transition-colors ${focusRing}`}
            >
              <span className="flex items-center gap-2">
                <Plus size={17} className="text-blue-300" />
                Дополнительные данные
                <span className="text-white/50">— фото, удобное время</span>
              </span>
              <ChevronDown
                size={18}
                className={[
                  "shrink-0 text-white/58 transition duration-300",
                  showDetails ? "rotate-180 text-blue-200" : "",
                ].join(" ")}
              />
            </button>

            {showDetails && (
              <div id="request-extra" className="animate-pop grid gap-4">
                <div>
                  <span className="mb-2 block px-1 text-sm font-medium leading-none text-white/90">
                    Фото проблемы (необязательно)
                  </span>
                  <label className="relative flex min-h-20 cursor-pointer items-center gap-3 rounded-control border border-dashed border-hairline-strong bg-surface-input px-4 py-3 transition-colors duration-200 hover:border-accent hover:bg-surface-2 active:scale-[0.99]">
                    <span className="relative flex size-12 shrink-0 items-center justify-center rounded-control border border-hairline bg-surface-2 text-blue-200">
                      <ImagePlus size={22} strokeWidth={1.8} />
                    </span>
                    <span className="relative min-w-0 flex-1">
                      <span className="block text-base font-medium text-white">{photoLabel}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/75">
                        Опционально, JPG или PNG, до трёх изображений
                      </span>
                    </span>
                    <Upload size={19} className="relative shrink-0 text-white/54" />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={selectPhotos}
                      className="sr-only"
                    />
                  </label>

                  {photos.length > 0 && (
                    <div className="mt-2 grid gap-2">
                      {photos.map((photo, index) => (
                        <div
                          key={`${photo.name}-${index}`}
                          className="flex min-h-12 items-center justify-between gap-3 rounded-control border border-hairline bg-surface-2 px-3 text-sm text-white/80"
                        >
                          <span className="truncate">{photo.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPhotos((current) =>
                                current.filter((_, photoIndex) => photoIndex !== index)
                              )
                            }
                            aria-label={`Удалить фото ${photo.name}`}
                            className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-1 text-white/70 transition-colors hover:border-hairline-strong ${focusRing}`}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FieldShell icon={Clock3} label="Удобное время для связи (необязательно)">
                  <input
                    value={values.contactTime}
                    onChange={(event) => updateValue("contactTime", event.target.value)}
                    placeholder="Сегодня после 18:00"
                    autoComplete="off"
                    className="relative h-14 min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/45"
                  />
                </FieldShell>
              </div>
            )}

            <div className={errors.privacy ? "animate-shake" : undefined}>
              <div
                style={{ "--tint": TINT.violet } as CSSProperties}
                className="card-cosmic-inner rounded-control border p-4"
              >
                <input
                  ref={(node) => {
                    fieldRefs.current.privacy = node;
                  }}
                  id="privacy-consent"
                  type="checkbox"
                  checked={hasPrivacyConsent}
                  onChange={(event) => {
                    setHasPrivacyConsent(event.target.checked);
                    setErrors((current) => ({ ...current, privacy: undefined }));
                  }}
                  className="privacy-consent sr-only"
                  aria-required="true"
                  aria-invalid={!!errors.privacy}
                  aria-describedby={errors.privacy ? "privacy-consent-error" : undefined}
                />
                <label htmlFor="privacy-consent" className="flex cursor-pointer items-start gap-3">
                  <span
                    className={[
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[7px] border transition",
                      hasPrivacyConsent
                        ? "border-blue-200 bg-blue-400 text-slate-950"
                        : "border-white/30 bg-surface-input text-transparent",
                    ].join(" ")}
                  >
                    <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span className="text-[15px] leading-relaxed text-white/90">
                    Согласен с политикой конфиденциальности
                    <span className="text-rose-300" aria-hidden="true">
                      {" *"}
                    </span>
                  </span>
                </label>
                <div className="ml-8 mt-2">
                  <button
                    type="button"
                    onClick={openPrivacyPolicy}
                    className="font-medium text-blue-100 underline decoration-blue-200/40 underline-offset-4 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                  >
                    Открыть политику
                  </button>
                </div>
              </div>
              {errors.privacy && (
                <FieldError id="privacy-consent-error">{errors.privacy}</FieldError>
              )}
            </div>

            <button
              type="submit"
              aria-disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={[
                "group mt-1 flex min-h-16 w-full items-center justify-center rounded-control border px-5 text-[16px] font-semibold transition",
                focusRing,
                isSubmitDisabled
                  ? "cursor-not-allowed border-hairline bg-surface-2 text-white/45 shadow-none"
                  : "border-hairline-strong bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-e1 hover:from-blue-400 hover:to-violet-400 active:scale-[0.99]",
              ].join(" ")}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={19} className="animate-spin" aria-hidden="true" />
                  Отправляем…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Отправить заявку
                  <ArrowRight
                    size={19}
                    className={[
                      "-rotate-45 transition-transform duration-300",
                      hasPrivacyConsent ? "group-hover:rotate-0" : "text-white/30",
                    ].join(" ")}
                  />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Живые регионы смонтированы постоянно, а внутрь подставляется текст.
          Если вставлять сам регион вместе с содержимым, скринридеры часто молчат:
          регион не был зарегистрирован до мутации. Пустая обёртка не перехватывает
          клики (pointer-events-none) и не занимает высоты. */}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+16px)] z-[60] mx-auto max-w-sm"
      >
        {isSent && (
          <div className="animate-pop pointer-events-auto flex items-start gap-3 rounded-control border border-hairline-strong bg-surface-2 p-3 text-white shadow-e2">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-400/16 text-emerald-200">
              <CheckCircle2 size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">Заявка отправлена</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-white/80">
                Скоро свяжемся и уточним детали ремонта.
              </span>
              {/* Оговорка от сервера — иначе человек думает, что мастер уже видит фото */}
              {sentWarning && (
                <span className="mt-1.5 block text-sm leading-relaxed text-amber-200">
                  {sentWarning}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <div
        role="alert"
        className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+16px)] z-[60] mx-auto max-w-sm"
      >
        {sendError && (
          <div className="animate-pop pointer-events-auto flex items-start gap-3 rounded-control border border-rose-300/45 bg-rose-950/85 p-3 text-white shadow-e2 backdrop-blur">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-400/16 text-rose-200">
              <TriangleAlert size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">Заявка не ушла</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-white/85">
                {sendError}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSendError(null)}
              aria-label="Закрыть сообщение об ошибке"
              className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-hairline text-white/70 transition-colors hover:border-hairline-strong ${focusRing}`}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
