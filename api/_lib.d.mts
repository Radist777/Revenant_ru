// Типы для _lib.mjs (обычный ESM без типов). TS подхватывает этот файл
// по импорту "./_lib.mjs" из api/telegram.ts.

/** Тело заявки после нормализации. */
export type RequestData = {
  name: string;
  phone: string;
  description: string;
  device: string;
  backCode: string;
  diagonal: string;
  model: string;
  contactTime: string;
  /** Honeypot: в форме скрыт, у настоящей заявки всегда "". Непустой — бот. */
  contact_ref?: string;
};

export type NormalizeResult =
  /** Не заполнено обязательное поле либо тело не объект. */
  | { ok: false; error: string; spam?: undefined; value?: undefined }
  /** Сработал honeypot: ответить 200, в Telegram не слать. */
  | { ok: true; spam: true; error?: undefined; value?: undefined }
  | { ok: true; value: RequestData; error?: undefined; spam?: undefined };

export function normalizeRequest(raw: unknown): NormalizeResult;

export function buildMessage(data: RequestData): string;

/** bytes в рантайме — Buffer; параметр ArrayBuffer нужен, чтобы байты принимал Blob. */
export type Photo = { mime: string; bytes: Uint8Array<ArrayBuffer> };

export function parsePhotos(raw: unknown): Photo[];
