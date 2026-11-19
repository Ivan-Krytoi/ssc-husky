-- ============================================================
-- ССК «ХАСКИ» — схема для Supabase (PostgreSQL)
-- Перенос schema.sql (SQLite). Таблица admins не переносится:
-- роль админки выполняет панель Supabase.
-- RLS: контент читается всеми, заявки/сообщения — только INSERT.
-- ============================================================

-- ---------- Дисциплины клуба ----------
create table if not exists disciplines (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  name          text not null,
  icon          text not null default '🏅',
  badge         text,
  description   text not null,
  schedule_note text default 'расписание уточняется',
  sort          integer not null default 0
);

-- ---------- События календаря ----------
create table if not exists events (
  id         bigint generated always as identity primary key,
  title      text not null,
  discipline text not null,
  event_date text,
  place      text,
  status     text not null default 'soon' check (status in ('done','soon','tbd')),
  result     text,
  sort       integer not null default 0
);

-- ---------- Результаты ----------
create table if not exists results (
  id           bigint generated always as identity primary key,
  competition  text not null,
  place        integer not null,
  group_name   text not null,
  points       text default '[уточняется]',
  note         text,
  updated_at   text not null default ''
);

-- ---------- Достижения в цифрах ----------
create table if not exists stats (
  key    text primary key,
  value  integer not null,
  label  text not null,
  suffix text default ''
);

-- ---------- Новости ----------
create table if not exists news (
  id       bigint generated always as identity primary key,
  date     text not null,
  category text not null,
  title    text not null,
  body     text not null,
  image    text default 'Баннер_обложка_ВК.jpg',
  sort     integer not null default 0
);

-- ---------- Заявки на пробное занятие ----------
create table if not exists applications (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 2 and 100),
  group_name text not null check (char_length(group_name) between 1 and 50),
  discipline text not null check (char_length(discipline) between 1 and 100),
  contact    text not null check (char_length(contact) between 3 and 100),
  status     text not null default 'Новая'
);

-- ---------- Обратная связь ----------
create table if not exists messages (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 2 and 100),
  contact    text not null check (char_length(contact) between 3 and 100),
  body       text not null check (char_length(body) between 5 and 2000)
);

-- ============================================================
-- RLS (защита строк)
-- ============================================================
alter table disciplines  enable row level security;
alter table events       enable row level security;
alter table results      enable row level security;
alter table stats        enable row level security;
alter table news         enable row level security;
alter table applications enable row level security;
alter table messages     enable row level security;

drop policy if exists "public read disciplines" on disciplines;
create policy "public read disciplines" on disciplines for select to anon, authenticated using (true);

drop policy if exists "public read events" on events;
create policy "public read events" on events for select to anon, authenticated using (true);

drop policy if exists "public read results" on results;
create policy "public read results" on results for select to anon, authenticated using (true);

drop policy if exists "public read stats" on stats;
create policy "public read stats" on stats for select to anon, authenticated using (true);

drop policy if exists "public read news" on news;
create policy "public read news" on news for select to anon, authenticated using (true);

-- Заявки и сообщения: аноним может только отправить (INSERT).
-- Читать/менять/удалять — нельзя (только через панель Supabase).
drop policy if exists "anon insert applications" on applications;
create policy "anon insert applications" on applications for insert to anon, authenticated with check (true);

drop policy if exists "anon insert messages" on messages;
create policy "anon insert messages" on messages for insert to anon, authenticated with check (true);

-- ============================================================
-- Первичные данные (сид), факты из сообщества ВК
-- ============================================================
insert into disciplines (slug, name, icon, badge, description, schedule_note, sort) values
  ('football',   'Мини-футбол',      '⚽', 'Спартакиада вуза',      'Зачёт между группами. Сентябрьский тур: золото у М-103.', 'Вт 18:30, зал 201 — уточняется', 1),
  ('basket3x3',  'Баскетбол 3×3',    '🏀', '1 место УниверЛиги',    'Победители областной Универсиады 2026, лучший игрок — Коржов Евгений.', 'Чт 20:00, спортзал — уточняется', 2),
  ('volleyball', 'Волейбол',         '🏐', 'Финалист сезона 24/25', 'Спартакиада вуза: две ветки — основная и финальная.', 'Пн 19:00, зал 102 — уточняется', 3),
  ('fidgetal',   'Фиджитал-спорт',   '🎮', 'Турнир «Баскетбол»',    'Спорт и цифровые технологии — начинаем новые дисциплины.', 'формат уточняется', 4),
  ('darts',      'Дартс',            '🎯', 'Чемпионат 24/25',       'Точный на прицеле? Клуб держит чемпионат каждый сезон.', 'по расписанию', 5),
  ('cross',      'Кросс',            '🏃', 'УниверЛига',            'Команда из 12 человек — 4 место в командном зачёте кросса Универсиады.', 'сб 10:00, стадион — уточняется', 6)
on conflict (slug) do nothing;

insert into events (title, discipline, event_date, place, status, result, sort) values
  ('Кросс Универсиады',                      'кросс',      '29.09.2026', 'городская лыжная база, Челябинск', 'done', '4 место командой (12 человек)', 1),
  ('Спартакиада · мини-футбол',              'мини-футбол','30.09.2026', 'площадка ЮУТУ, Комсомольский пр., 113а', 'done', '1 место — М-103, 2 — З-113, 3 — ТД-206', 2),
  ('Универсиада · волейбол',                 'волейбол',   null,         null, 'tbd', null, 3),
  ('Спартакиада · мини-футбол, ранние туры', 'мини-футбол',null,         '[уточнить из расписания]', 'soon', null, 4);

insert into results (competition, place, group_name, points, note, updated_at) values
  ('Спартакиада · мини-футбол, внутренний зачёт', 1, 'М-103',  '[уточняется]', 'сентябрьский тур', '30.09.2026'),
  ('Спартакиада · мини-футбол, внутренний зачёт', 2, 'З-113',  '[уточняется]', 'сентябрьский тур', '30.09.2026'),
  ('Спартакиада · мини-футбол, внутренний зачёт', 3, 'ТД-206', '[уточняется]', 'сентябрьский тур', '30.09.2026');

insert into stats (key, value, label, suffix) values
  ('founded',     2012, 'год основания клуба', ''),
  ('disciplines',    6, 'спортивных дисциплин', ''),
  ('photos',       430, 'фото в архиве клуба', '+'),
  ('cross_team',    12, 'человек — команда кросса', '')
on conflict (key) do nothing;

insert into news (date, category, title, body, image, sort) values
  ('01.10.2026', 'спорт клуба', 'Студенческий спорт Южного Урала: итоги и новые цели', 'Совещание РССС в УралГУФК: клуб «Хаски» — о перспективах регионального студенческого спорта.', 'Баннер_обложка_ВК.jpg', 1),
  ('02.10.2026', 'мини-футбол', 'Спартакиада: золото у М-103',   '30 сентября на площадке ЮУТУ прошли соревнования внутренней спартакиады по мини-футболу.', 'Баннер_обложка_ВК.jpg', 2),
  ('28.09.2026', 'баскетбол',   'ЮУТУ — победители турнира 3×3 Универсиады', 'Наши юноши первые; лучший игрок турнира — Коржов Евгений.', 'Баннер_обложка_ВК.jpg', 3);