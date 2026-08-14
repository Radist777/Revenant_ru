// Self-check заявки: node api/telegram.test.mjs
// Чистая логика из _lib.mjs плюс сам handler (Node ≥22.18 снимает типы с .ts сам,
// на более старых — node --experimental-strip-types api/telegram.test.mjs).
import assert from "node:assert/strict";
import { buildMessage, normalizeRequest, parsePhotos } from "./_lib.mjs";
import handler from "./telegram.ts";

const base = { name: "Алексей", phone: "+7 909 504-30-36", description: "не заряжается" };
const dataUrl = (mime, bytes) => `data:${mime};base64,${Buffer.alloc(bytes, 1).toString("base64")}`;

// Обязательные поля
for (const key of ["name", "phone", "description"]) {
  const r = normalizeRequest({ ...base, [key]: "   " });
  assert.equal(r.ok, false, `${key}: пустое значение должно отклоняться`);
  assert.match(r.error, /Не заполнено/);
}
assert.equal(normalizeRequest(null).ok, false);
assert.equal(normalizeRequest("строка").ok, false);
assert.equal(normalizeRequest([]).ok, false);
assert.equal(normalizeRequest(base).ok, true);

// Honeypot: непустой contact_ref — заявки нет, но и ошибки нет
const spam = normalizeRequest({ ...base, contact_ref: "https://spam.example" });
assert.equal(spam.spam, true, "непустой contact_ref должен помечаться как спам");
assert.equal(spam.value, undefined, "спам не должен доходить до отправки");
assert.equal(spam.ok, true, "боту отвечаем успехом, чтобы не искал обход");
// Проверка идёт до валидации: спамер не должен различать ответы по коду
const spamInvalid = normalizeRequest({ contact_ref: "bot" });
assert.equal(spamInvalid.spam, true);
assert.equal(spamInvalid.error, undefined);
// Пустое и нестроковое contact_ref настоящую заявку не ломают
for (const contact_ref of ["", "   ", undefined, 42, null]) {
  const r = normalizeRequest({ ...base, contact_ref });
  assert.equal(r.spam, undefined, `contact_ref=${String(contact_ref)}: не спам`);
  assert.equal(r.ok, true);
  assert.equal(r.value.name, "Алексей");
}
// Старое имя ловушки цеплял автофилл; теперь website — обычное игнорируемое поле
assert.equal(normalizeRequest({ ...base, website: "https://revenant.ru" }).spam, undefined);

// Длинные строки обрезаются, а не отвергаются
const long = normalizeRequest({ ...base, description: "я".repeat(5000), name: "и".repeat(300) });
assert.equal(long.ok, true);
assert.equal(long.value.description.length, 2000);
assert.equal(long.value.name.length, 100);

// Нестроковые значения не ломают нормализацию
const weird = normalizeRequest({ ...base, device: 42, model: null });
assert.equal(weird.ok, true);
assert.equal(weird.value.device, "");
assert.equal(weird.value.model, "");

// Сообщение: поля устройства на месте
const full = normalizeRequest({
  ...base,
  device: "Телевизор",
  model: "Samsung UE43",
  diagonal: "43",
  backCode: "SM-A525F",
  contactTime: "сегодня после 18:00",
}).value;
const msg = buildMessage(full);
for (const part of [
  "Имя: Алексей",
  "Устройство: Телевизор",
  "Модель: Samsung UE43",
  "Диагональ: 43",
  "Код на задней крышке: SM-A525F",
  "Проблема:\nне заряжается",
  "Удобное время: сегодня после 18:00",
]) {
  assert.ok(msg.includes(part), `в сообщении нет: ${part}`);
}

// Незаполненные поля не оставляют пустых строк и подписей
const minimal = buildMessage(normalizeRequest(base).value);
assert.ok(!minimal.includes("Устройство"), "пустое устройство не должно выводиться");
assert.ok(!minimal.includes("Удобное время"), "пустое время не должно выводиться");
assert.ok(!/\n\n\n/.test(minimal), "не должно быть двойных пустых строк");
// «Проблема:» — заголовок блока, остальные подписи без значения недопустимы
assert.ok(!/^(?!Проблема:$).*: *$/m.test(minimal), "не должно быть подписей без значения");

// Фото: мусор отбрасывается, лимит 3 соблюдается
assert.deepEqual(parsePhotos(undefined), []);
assert.deepEqual(parsePhotos("не массив"), []);
assert.deepEqual(parsePhotos([123, null, {}]), []);
assert.deepEqual(parsePhotos(["https://example.com/a.jpg"]), []);
assert.deepEqual(parsePhotos(["data:text/html;base64,PHNjcmlwdD4="]), []);
assert.deepEqual(parsePhotos(["data:image/gif;base64,R0lGOD"]), []);
assert.deepEqual(parsePhotos([dataUrl("image/jpeg", 0)]), []);
assert.deepEqual(parsePhotos([dataUrl("image/png", 5 * 1024 * 1024)]), []);

const ok = parsePhotos([
  dataUrl("image/jpeg", 10),
  "мусор",
  dataUrl("image/png", 10),
  dataUrl("image/webp", 10),
  dataUrl("image/jpeg", 10),
]);
assert.equal(ok.length, 3, "не больше трёх фото");
assert.deepEqual(
  ok.map((p) => p.mime),
  ["image/jpeg", "image/png", "image/webp"],
);
assert.ok(Buffer.isBuffer(ok[0].bytes) && ok[0].bytes.length === 10);

// ── Сам handler: fetch подменён, наружу не уходит ни одного запроса ──
process.env.TELEGRAM_BOT_TOKEN = "test-token";
process.env.TELEGRAM_CHAT_ID = "-1001";
delete process.env.ALLOWED_ORIGIN;

const realFetch = globalThis.fetch;
// Возвращает { code, body, calls } — что handler отдал клиенту и сколько раз звал fetch.
async function callHandler(body, fetchImpl, headers = {}) {
  let calls = 0;
  globalThis.fetch = async (...args) => {
    calls++;
    return fetchImpl(...args);
  };
  const out = {};
  const res = {
    status(code) {
      out.code = code;
      return res;
    },
    json(payload) {
      out.body = payload;
    },
  };
  try {
    await handler({ method: "POST", body, headers }, res);
  } finally {
    globalThis.fetch = realFetch;
  }
  return { ...out, calls };
}

const tgReply = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(payload),
});
const tgOk = () => tgReply(200, { ok: true, result: { message_id: 7 } });

// Ловушка сработала — в Telegram не ходим вообще
const trapped = await callHandler({ ...base, contact_ref: "https://autofill.example" }, () => {
  throw new Error("fetch не должен вызываться при сработавшей ловушке");
});
assert.equal(trapped.calls, 0, "honeypot: Telegram дёргать нельзя");
assert.equal(trapped.code, 200);
assert.deepEqual(trapped.body, { ok: true });

// HTTP 200 + {"ok":false} — это отказ, а не доставленная заявка
const refused = await callHandler(base, () =>
  tgReply(200, { ok: false, error_code: 400, description: "chat not found" }),
);
assert.notEqual(refused.body.ok, true, "ok:false из тела нельзя выдавать за успех");
assert.equal(refused.code, 502);
assert.match(refused.body.error, /chat not found/, "причина отказа должна доходить до клиента");

// Тело не разобралось (заглушка прокси) — тоже не успех
const garbage = await callHandler(base, () => ({
  ok: true,
  status: 200,
  text: async () => "<html>502 Bad Gateway</html>",
}));
assert.notEqual(garbage.body.ok, true, "неразобранное тело успехом не считается");
assert.equal(garbage.code, 502);

// Нормальный ответ Telegram — заявка принята
const delivered = await callHandler(base, tgOk);
assert.equal(delivered.calls, 1);
assert.equal(delivered.code, 200);
assert.deepEqual(delivered.body, { ok: true });

// ALLOWED_ORIGIN переживает бытовые опечатки: пробелы, слэш, регистр
process.env.ALLOWED_ORIGIN = " https://Revenant.ru/ , ";
const sloppy = await callHandler(base, tgOk, { origin: "https://revenant.ru" });
assert.equal(sloppy.code, 200, "опечатка в ALLOWED_ORIGIN не должна убивать форму");
const alien = await callHandler(base, tgOk, { origin: "https://evil.example" });
assert.equal(alien.code, 403, "чужой Origin по-прежнему отбивается");
assert.equal(alien.calls, 0);
// Список, пустой после нормализации, равносилен незаданной переменной
process.env.ALLOWED_ORIGIN = "  ,  ";
const blank = await callHandler(base, tgOk, { origin: "https://revenant.ru" });
assert.equal(blank.code, 200, 'ALLOWED_ORIGIN=" " не должен блокировать всё');
delete process.env.ALLOWED_ORIGIN;

console.log("api/telegram: все проверки пройдены");
