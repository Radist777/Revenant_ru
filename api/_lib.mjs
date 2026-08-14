// Чистая логика заявки: валидация, текст сообщения, разбор фото.
// Обычный ESM без типов — импортируется и из api/telegram.ts, и из self-check
// api/telegram.test.mjs (.ts из .mjs напрямую не импортируется).
// Префикс _ означает, что Vercel не делает из файла эндпоинт.

// Лимиты длины: превышение обрезается, а не отвергается.
const LIMITS = {
  name: 100,
  phone: 32,
  description: 2000,
  device: 200,
  backCode: 200,
  diagonal: 200,
  model: 200,
  contactTime: 200,
};

// Обязательные поля и их подписи для текста ошибки.
const REQUIRED = {
  name: "Имя",
  phone: "Телефон",
  description: "Что сломалось",
};

const PHOTO_PREFIX = /^data:image\/(jpeg|png|webp);base64,/;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_PHOTOS = 3;

function clean(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit).trim() : "";
}

// Приводит тело запроса к плоскому объекту строк; ok:false — если нет обязательного поля,
// spam:true — сработал honeypot (звать Telegram нельзя, но и ошибку показывать незачем).
export function normalizeRequest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Ожидается JSON-объект" };
  }
  // Honeypot: поле contact_ref скрыто от человека и всегда приходит пустым.
  // Непустое — заполнил бот. Имя намеренно нейтральное: за "website" цеплялся
  // автофилл браузера и менеджеры паролей, и живая заявка молча исчезала.
  // Проверка первая, до валидации: иначе по разным кодам ответа спамер поймёт,
  // что поле ловушка, и перестанет его трогать.
  const trap = raw.contact_ref;
  if (typeof trap === "string" && trap.trim()) return { ok: true, spam: true };
  const value = {};
  for (const [key, limit] of Object.entries(LIMITS)) value[key] = clean(raw[key], limit);
  for (const [key, label] of Object.entries(REQUIRED)) {
    if (!value[key]) return { ok: false, error: `Не заполнено обязательное поле: ${label}` };
  }
  return { ok: true, value };
}

// Plain text без parse_mode — экранирование не нужно. Пустые поля не выводятся.
export function buildMessage(data) {
  const lines = ["🔧 Новая заявка — Ревенант", "", `Имя: ${data.name}`, `Телефон: ${data.phone}`];

  const device = [
    ["Устройство", data.device],
    ["Модель", data.model],
    ["Диагональ", data.diagonal],
    ["Код на задней крышке", data.backCode],
  ]
    .filter(([, v]) => v)
    .map(([label, v]) => `${label}: ${v}`);
  if (device.length) lines.push("", ...device);

  lines.push("", "Проблема:", data.description);
  if (data.contactTime) lines.push("", `Удобное время: ${data.contactTime}`);

  return lines.join("\n");
}

// Первые 3 валидных data-URL картинки; всё остальное молча пропускается.
export function parsePhotos(raw) {
  if (!Array.isArray(raw)) return [];
  const photos = [];
  for (const item of raw) {
    if (photos.length >= MAX_PHOTOS) break;
    if (typeof item !== "string") continue;
    const match = PHOTO_PREFIX.exec(item);
    if (!match) continue;
    const bytes = Buffer.from(item.slice(item.indexOf(",") + 1), "base64");
    if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) continue;
    photos.push({ mime: `image/${match[1]}`, bytes });
  }
  return photos;
}
