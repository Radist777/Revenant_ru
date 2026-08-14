# Ревенант — лендинг сервиса

## Заявки в Telegram

Форма заявки шлёт `POST /api/telegram` (`api/telegram.ts`, конвенция Vercel).
Сигнатура `(req, res)` — вариант Vercel; для Netlify Functions нужен адаптер,
просто переложить файл нельзя. Токен живёт только в переменных окружения на
сервере и в клиентский бандл не попадает.

Успехом считается только ответ Telegram `HTTP 2xx` **и** `"ok": true` в теле:
Telegram отвечает `200 {"ok":false,"description":"chat not found"}` и на отказ.
Иначе эндпоинт отдаёт `502` с описанием причины — форма не должна показывать
зелёное «Заявка отправлена» по недоставленной заявке.

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

- **Токен** — создать бота у [@BotFather](https://t.me/BotFather) (`/newbot`), он выдаст строку вида `123456:AA...`.
- **chat_id** — написать боту любое сообщение и открыть
  `https://api.telegram.org/bot<TOKEN>/getUpdates`; нужное число лежит в `result[0].message.chat.id`
  (у групп оно отрицательное; бота нужно предварительно добавить в группу).

Локально переменные кладутся в `.env` (он в `.gitignore`), шаблон — `.env.example`.
На хостинге те же две переменные задаются в настройках проекта.

### Защита от спама

Эндпоинт публичный, поэтому в нём три дешёвых заслона:

- **Honeypot.** В форме есть скрытое поле `contact_ref`, человек его не видит и не
  заполняет. Если в теле запроса `contact_ref` непустой — сервер отвечает `200 {"ok":true}`
  и ничего не шлёт в Telegram. Бот считает, что заявка ушла, и не ищет обход.
  Имя намеренно нейтральное: за прежнее `website` цеплялись автофилл браузера и
  менеджеры паролей, и заявка живого человека молча исчезала.
- **Origin.** Необязательная переменная `ALLOWED_ORIGIN` — список источников через
  запятую, как их шлёт браузер (`https://example.ru`). Заголовок `Origin` сверяется
  со списком, при несовпадении — `403`. Пробелы вокруг элементов, завершающий слэш
  и регистр при сравнении не учитываются, а список, пустой после нормализации
  (например `ALLOWED_ORIGIN=" "`), равносилен незаданной переменной — опечатка не
  должна убивать форму.
  **Если переменная не задана, проверка просто пропускается.** Это сделано намеренно:
  привязать её автоматически к `VERCEL_URL` нельзя — на кастомном домене браузер
  пришлёт домен сайта, а не адрес `*.vercel.app`, и форма молча отбивала бы все
  настоящие заявки. Молчащая форма хуже спама, поэтому включается она вручную.
- **Размер тела.** Тело больше 5 МБ отклоняется с `413` без разбора JSON.

```
ALLOWED_ORIGIN=https://revenant.ru,https://www.revenant.ru
```

Это не защищает от целенаправленной атаки (Origin подделывается любым не-браузерным
клиентом), но снимает поток автоматического мусора, из-за которого Telegram отвечал
`429` и настоящие заявки переставали доходить.

**Важно:** `npm run dev` (Vite) не обслуживает `/api` — запрос вернёт 404.
Для локальной проверки отправки нужен `vercel dev`.

Проверки функции — чистая логика (валидация, текст сообщения, разбор фото) и сам
handler с подменённым `fetch` (наружу ничего не уходит):

```
node api/telegram.test.mjs
```

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
