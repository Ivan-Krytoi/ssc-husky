-- ============================================================
-- ССК «ХАСКИ» — СХЕМА БАЗЫ ДАННЫХ (SQLite)
-- Правило конкурса §3.3: жюри должно иметь полный доступ к БД.
-- Всё первичное (сид) — проверенные факты из сообщества ВК.
-- Плейсхолдеры → "[уточняется]" до данных от клуба.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---------- Дисциплины клуба (6 шт., сид) ----------
DROP TABLE IF EXISTS disciplines;
CREATE TABLE disciplines (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,     -- футбол / basket3x3 ...
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT '🏅',
  badge         TEXT,
  description   TEXT NOT NULL,
  schedule_note TEXT DEFAULT 'расписание уточняется',
  sort          INTEGER NOT NULL DEFAULT 0
);

-- ---------- События календаря ----------
DROP TABLE IF EXISTS events;
CREATE TABLE events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  discipline TEXT NOT NULL,               -- человекочитаемое: «мини-футбол»
  event_date TEXT,                        -- NULL → «дата уточняется»
  place      TEXT,
  status     TEXT NOT NULL DEFAULT 'soon' CHECK (status IN ('done','soon','tbd')),
  result     TEXT,                         -- «4 место командой» и т.п.
  sort       INTEGER NOT NULL DEFAULT 0
);

-- ---------- Результаты (медали спартакиады и турниров) ----------
DROP TABLE IF EXISTS results;
CREATE TABLE results (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  competition  TEXT NOT NULL,
  place        INTEGER NOT NULL,
  group_name   TEXT NOT NULL,             -- «М-103»
  points       TEXT DEFAULT '[уточняется]',
  note         TEXT,
  updated_at   TEXT NOT NULL DEFAULT ''
);

-- ---------- Достижения в цифрах (счётчики главной) ----------
DROP TABLE IF EXISTS stats;
CREATE TABLE stats (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  label TEXT NOT NULL,
  suffix TEXT DEFAULT ''
);

-- ---------- Новости клуба ----------
DROP TABLE IF EXISTS news;
CREATE TABLE news (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  date     TEXT NOT NULL,
  category TEXT NOT NULL,
  title    TEXT NOT NULL,
  body     TEXT NOT NULL,
  image    TEXT DEFAULT 'Баннер_обложка_ВК.jpg',
  sort     INTEGER NOT NULL DEFAULT 0
);

-- ---------- Заявки на пробное занятие (форма записи → БД) ----------
DROP TABLE IF EXISTS applications;
CREATE TABLE applications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name       TEXT NOT NULL,
  group_name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  contact    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Новая'
);

-- ---------- Обратная связь (страница контактов) ----------
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name       TEXT NOT NULL,
  contact    TEXT NOT NULL,
  body       TEXT NOT NULL
);

-- ---------- Администраторы мини-админки ----------
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

-- ============================================================
-- ПЕРВИЧНЫЕ ДАННЫЕ (сид), факты из сообщества ВК
-- ============================================================

INSERT INTO disciplines (slug, name, icon, badge, description, schedule_note, sort) VALUES
  ('football',   'Мини-футбол',      '⚽', 'Спартакиада вуза',      'Зачёт между группами. Сентябрьский тур: золото у М-103.', 'Вт 18:30, зал 201 — уточняется', 1),
  ('basket3x3',  'Баскетбол 3×3',    '🏀', '1 место УниверЛиги',    'Победители областной Универсиады 2026, лучший игрок — Коржов Евгений.', 'Чт 20:00, спортзал — уточняется', 2),
  ('volleyball', 'Волейбол',         '🏐', 'Финалист сезона 24/25', 'Спартакиада вуза: две ветки — основная и финальная.', 'Пн 19:00, зал 102 — уточняется', 3),
  ('fidgetal',   'Фиджитал-спорт',   '🎮', 'Турнир «Баскетбол»',    'Спорт и цифровые технологии — начинаем новые дисциплины.', 'формат уточняется', 4),
  ('darts',      'Дартс',            '🎯', 'Чемпионат 24/25',       'Точный на прицеле? Клуб держит чемпионат каждый сезон.', 'по расписанию', 5),
  ('cross',      'Кросс',            '🏃', 'УниверЛига',            'Команда из 12 человек — 4 место в командном зачёте кросса Универсиады.', 'сб 10:00, стадион — уточняется', 6);

INSERT INTO events (title, discipline, event_date, place, status, result, sort) VALUES
  ('Кросс Универсиады',                      'кросс',      '29.09.2026', 'городская лыжная база, Челябинск', 'done', '4 место командой (12 человек)', 1),
  ('Спартакиада · мини-футбол',              'мини-футбол','30.09.2026', 'площадка ЮУТУ, Комсомольский пр., 113а', 'done', '1 место — М-103, 2 — З-113, 3 — ТД-206', 2),
  ('Универсиада · волейбол',                 'волейбол',   NULL,         NULL, 'tbd', NULL, 3),
  ('Спартакиада · мини-футбол, ранние туры', 'мини-футбол',NULL,         '[уточнить из расписания]', 'soon', NULL, 4);

INSERT INTO results (competition, place, group_name, points, note, updated_at) VALUES
  ('Спартакиада · мини-футбол, внутренний зачёт', 1, 'М-103',  '[уточняется]', 'сентябрьский тур', '30.09.2026'),
  ('Спартакиада · мини-футбол, внутренний зачёт', 2, 'З-113',  '[уточняется]', 'сентябрьский тур', '30.09.2026'),
  ('Спартакиада · мини-футбол, внутренний зачёт', 3, 'ТД-206', '[уточняется]', 'сентябрьский тур', '30.09.2026');

INSERT INTO stats (key, value, label, suffix) VALUES
  ('founded',     2012, 'год основания клуба', ''),
  ('disciplines',    6, 'спортивных дисциплин', ''),
  ('photos',       430, 'фото в архиве клуба', '+'),
  ('cross_team',    12, 'человек — команда кросса', '');

INSERT INTO news (date, category, title, body, image, sort) VALUES
  ('01.10.2026', 'спорт клуба', 'Студенческий спорт Южного Урала: итоги и новые цели', 'Совещание РССС в УралГУФК: клуб «Хаски» — о перспективах регионального студенческого спорта.', 'Баннер_обложка_ВК.jpg', 1),
  ('02.10.2026', 'мини-футбол', 'Спартакиада: золото у М-103',   '30 сентября на площадке ЮУТУ прошли соревнования внутренней спартакиады по мини-футболу.', 'Баннер_обложка_ВК.jpg', 2),
  ('28.09.2026', 'баскетбол',   'ЮУТУ — победители турнира 3×3 Универсиады', 'Наши юноши первые; лучший игрок турнира — Коржов Евгений.', 'Баннер_обложка_ВК.jpg', 3);
