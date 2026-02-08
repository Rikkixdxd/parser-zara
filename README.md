# parser-zara

Небольшой парсер + сохранение DTO и нормализованных данных в PostgreSQL.

## Требования

- Node.js (совместим с `tsx`)
- PostgreSQL, доступный по `DATABASE_URL`

## Быстрый старт

1) Проверьте `DATABASE_URL` в `.env`.
2) Создайте таблицы:

```powershell
npm run db:setup
```

3) Запустите сбор данных:

```powershell
npm run start
```