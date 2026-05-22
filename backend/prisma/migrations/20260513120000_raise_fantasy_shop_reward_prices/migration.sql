-- Поднять цены наград fantasy-магазина (после турнира очков мало — покупки не должны быть «дешёвыми»).
-- Значения совпадают с актуальным prisma/seed.ts (sortOrder стабилен для демо-наград).

UPDATE "Reward"
SET
  "price" = CASE "sortOrder"
    WHEN 10 THEN 22000
    WHEN 20 THEN 32000
    WHEN 30 THEN 18500
    WHEN 40 THEN 16500
    WHEN 50 THEN 14500
    WHEN 60 THEN 26500
    ELSE "price"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "sortOrder" IN (10, 20, 30, 40, 50, 60);
