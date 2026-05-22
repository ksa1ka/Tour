-- Уникальное имя команды в рамках турнира (точное совпадение; регистр проверяется в API).
CREATE UNIQUE INDEX IF NOT EXISTS "Team_tournamentId_name_key" ON "Team"("tournamentId", "name");

-- Старый неуникальный индекс дублирует покрытие с уникальным — убираем лишнее.
DROP INDEX IF EXISTS "Team_tournamentId_name_idx";
