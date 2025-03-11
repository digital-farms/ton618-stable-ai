# TON 618 - Космическая AI платформа

Интерактивное веб-приложение с процедурно генерируемой планетой, WebGL шейдерами и интеграцией с искусственным интеллектом.

## Структура проекта

```
ton618-stable-ai/
├── api/                    (API эндпоинты)
├── audio/                  (аудиофайлы)
│   └── sumno1.mp3
├── src/
│   ├── css/
│   │   ├── chat.css        (стили для чата)
│   │   └── index.css       (основные стили)
│   ├── js/
│   │   └── chat/
│   │       ├── chatApp.js  (основной класс чата)
│   │       └── initChat.js (инициализация чата)
│   └── pics/
│       ├── ton618_logo.svg
│       └── voidexe_logo.svg
├── dashboard.html          (личный кабинет)
├── index.html              (главная страница)
├── server.js               (Express сервер)
└── waitlist.html           (страница списка ожидания)
```

## Технологии

- **Фронтенд**:
  - HTML5, CSS3
  - Vanilla JavaScript
  - Three.js (v128) для 3D визуализаций
  - WebGL шейдеры для эффектов планеты
  - CSS анимации

- **Бэкенд**:
  - Node.js + Express
  - Supabase (база данных)
  - OpenRouter AI API (интеграция с AI моделями)

- **Интеграции**:
  - TON Blockchain (TonConnect UI)
  - Telegram Web App

## Особенности

- Процедурно генерируемая 3D планета с шейдерными эффектами
- Анимированный космический фон со звездами и символами
- Интеграция с AI чатом
- Подключение кошелька TON
- Система списка ожидания
- Адаптивный дизайн для мобильных устройств
- Защита от DDoS атак и настройка безопасности

## Настройка переменных окружения

Для локальной разработки и деплоя приложения необходимо настроить переменные окружения:

1. Создайте файл `.env` в корне проекта на основе шаблона `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Заполните значения переменных в файле `.env`:
   ```
   # API ключи для сервисов
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
   OPENROUTER_MODEL=google/gemini-2.0-flash-thinking-exp:free
   
   # Supabase конфигурация
   SUPABASE_URL=https://kozbsjeqafhthbwekhjl.supabase.co
   SUPABASE_KEY=your_supabase_key_here
   
   # Системный промпт для AI
   AI_SYSTEM_PROMPT="Ваш системный промпт для AI"
   ```

3. Для продакшен-деплоя настройте соответствующие переменные окружения на вашей платформе (Vercel, Netlify, Heroku и т.д.)

> **Примечание**: Файл `.env` содержит конфиденциальную информацию и не должен добавляться в систему контроля версий. Он уже добавлен в `.gitignore`.

## Зависимости

- Express.js - веб-сервер
- Helmet - безопасность HTTP заголовков
- CORS - настройка Cross-Origin Resource Sharing
- Express Rate Limit - защита от DDoS
- Supabase JS - клиент для базы данных
- Three.js - 3D визуализации
- TonConnect UI - интеграция с блокчейном TON
- Шрифт Orbitron - загружается через Google Fonts

## Запуск

1. Установите зависимости:
```
npm install
```

2. Запустите сервер:
```
npm start
```

3. Для разработки:
```
npm run dev
```

4. Для продакшена:
```
npm run prod
```

Сервер будет доступен по адресу: http://localhost:3001

## Безопасность

- Настроены Content Security Policy через Helmet
- Ограничение запросов (100 запросов за 15 минут)
- Настроен CORS для контроля доступа

## Примечание

Для полной функциональности требуются ключи API для OpenRouter AI и Supabase.
