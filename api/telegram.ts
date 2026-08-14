// Отправка заявки в Telegram. Конвенция Vercel: /api/telegram.ts.
// Сигнатура (req, res) — вариант Vercel; Netlify Functions её не понимают
// (там handler(event, context) с возвратом объекта), нужен адаптер-обёртка.
// TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID читаются только из process.env —
// в клиентский бандл они не попадают.
import { buildMessage, normalizeRequest, parsePhotos } from "./_lib.mjs";

export { buildMessage, normalizeRequest, parsePhotos };
export type { RequestData } from "./_lib.mjs";

// Минимальные интерфейсы req/res — @vercel/node в зависимостях нет.
type Req = { method?: string; body?: unknown; headers?: Record<string, string | undefined> };
type Res = { status(code: number): Res; json(body: unknown): void };

// Фото жмутся на клиенте (1280px, JPEG q0.8) — три штуки это ~1.5 МБ base64.
// ponytail: длина строки, не байты; для ASCII-JSON разница неважна.
const MAX_BODY_CHARS = 5 * 1024 * 1024;

const asText = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Origin приводится к сравнимому виду: пробелы вокруг элемента списка,
// завершающий слэш и регистр — бытовые опечатки в переменной окружения,
// из-за которых форма отдавала 403 на каждый настоящий запрос.
const normalizeOrigin = (o: string) => o.trim().replace(/\/+$/, "").toLowerCase();

// Telegram отвечает HTTP 200 и на отказ — настоящий результат лежит в поле ok
// тела ответа. Успех = HTTP 2xx И body.ok === true; неразобранное тело успехом
// не считается. Иначе заявка «отправляется» в никуда, а клиент видит зелёное.
async function readTelegram(r: { ok: boolean; text(): Promise<string> }) {
  const text = await r.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  const tg = (body ?? {}) as { ok?: unknown; description?: unknown };
  return {
    ok: r.ok && tg.ok === true,
    // description у Telegram информативен: "chat not found", "bot was blocked by the user".
    description: typeof tg.description === "string" ? tg.description : text.slice(0, 300),
  };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Поддерживается только POST" });
  }

  // Netlify отдаёт тело строкой, Vercel — уже разобранным объектом.
  let raw: unknown = req.body;
  if (typeof raw === "string") {
    if (raw.length > MAX_BODY_CHARS) {
      return res.status(413).json({ ok: false, error: "Слишком большое тело запроса" });
    }
    try {
      raw = JSON.parse(raw);
    } catch {
      return res.status(400).json({ ok: false, error: "Некорректный JSON" });
    }
  }

  const parsed = normalizeRequest(raw);
  // Honeypot — первым делом: бот получает «успех» и не засоряет чат.
  if (parsed.spam) return res.status(200).json({ ok: true });

  // ALLOWED_ORIGIN необязателен: если не задан — проверки нет. Привязывать
  // к VERCEL_URL нельзя — на кастомном домене Origin браузера другой, и форма
  // молча отбивала бы настоящие заявки, что хуже спама.
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed) {
    const list = allowed.split(",").map(normalizeOrigin).filter(Boolean);
    // Пустой после нормализации список (например ALLOWED_ORIGIN=" ") означает
    // «не задано» — молча отбивать все заявки из-за опечатки нельзя.
    if (list.length) {
      const origin = normalizeOrigin(req.headers?.origin ?? "");
      if (!list.includes(origin)) {
        return res.status(403).json({ ok: false, error: "Запрос с чужого источника" });
      }
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // Молчаливый успех недопустим: заявка бы просто исчезла.
    return res
      .status(500)
      .json({ ok: false, error: "Сервер не настроен: нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID" });
  }

  if (!parsed.ok) return res.status(400).json({ ok: false, error: parsed.error });

  const api = `https://api.telegram.org/bot${token}`;
  try {
    const r = await fetch(`${api}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(parsed.value),
        disable_web_page_preview: true,
      }),
    });
    const sent = await readTelegram(r);
    if (!sent.ok) {
      const error = `Telegram API ${r.status}: ${sent.description}`;
      return res.status(502).json({ ok: false, error });
    }
  } catch (e) {
    return res.status(502).json({ ok: false, error: `Telegram недоступен: ${asText(e)}` });
  }

  // Фото — best-effort после текста: их провал не роняет уже принятую заявку.
  const photos = parsePhotos((raw as { photos?: unknown }).photos);
  let failed = 0;
  for (const [i, photo] of photos.entries()) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append(
      "photo",
      new Blob([photo.bytes], { type: photo.mime }),
      `photo-${i + 1}.${photo.mime.split("/")[1]}`,
    );
    try {
      const r = await fetch(`${api}/sendPhoto`, { method: "POST", body: form });
      if (!(await readTelegram(r)).ok) failed++;
    } catch {
      failed++;
    }
  }

  return res.status(200).json(
    failed
      ? { ok: true, warning: `Заявка отправлена, но не ушло фото: ${failed} из ${photos.length}` }
      : { ok: true },
  );
}
