# ССК «Хаски» — сайт студенческого спортивного клуба (Flask + SQLite)

Конкурс «Добрые Сайты 2026». Реализация по регламенту §3: Flask, две таблицы
в SQLite, заявки с формы записываются в настоящую БД.

## Ссылки

| Что                             | Где                                                            |
|---------------------------------|----------------------------------------------------------------|
| Сайт (демо дизайна, GitHub Pages)| https://ivan-krytoi.github.io/ssc-husky/                      |
| Код проекта                     | https://github.com/Ivan-Krytoi/ssc-husky                       |

Демо на Pages показывает дизайн и все разделы сайта. Заявки с формы записи
попадают в облачную БД Supabase (PostgreSQL) прямо из браузера — и в демо,
и в живом Flask-варианте; локальная SQLite остаётся резервным вариантом
без JS. Запуск Flask — по инструкции ниже.

## Как запустить (для жюри)

```bash
# 1) виртуальное окружение (один раз) — всё выполняется в корне проекта
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows PowerShell; Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt

# 2) создать базу данных из схемы (один раз, пересоздаёт haski.db)
set FLASK_APP=app                 # Windows cmd; PowerShell: $env:FLASK_APP = "app"
flask init-db

# 3) запустить сайт
flask run --port 5001
# открыть http://127.0.0.1:5001/
```

Готово: сайт на `http://127.0.0.1:5001/`.

## Что где лежит

```
(корень проекта)
├── app.py                 # фабрика приложения + обработчик 404
├── db.py                  # get_db(), close_db(), CLI-команда flask init-db
├── schema.sql             # СХЕМА БД + первичные данные (сид)
├── requirements.txt       # Flask>=3.1
├── routes/
│   ├── pages.py           # публичные страницы: /, /about/, /sport/, /schedule/, /results/, /news/, /album/
│   └── forms.py           # POST /form заявок на пробное занятие
├── templates/             # base.html + страницы (главная — «Пролёт карточек»)
├── static/
│   ├── css/               # tokens.css, style.css (дизайн-кит), home-cards.css, pages.css
│   ├── js/app.js          # тема, счётчики, reveal, фильтры календаря, паузы полёта
│   │   /js/album.js       # лайтбокс альбома (Esc/←/→, возврат фокуса, блокировка скролла)
│   │   /js/cloud-db.js    # отправка заявок в облачную БД Supabase (работает и на Pages)
│   └── assets/            # логотип/баннер/favicon/паттерны + assets/album (26 фото клуба)
└── instance/              # локальная БД (в git не попадает, создаётся flask init-db)
    └── data/haski.db      # SQLite — создаётся flask init-db
```

## База данных (для проверки жюри)

Схема и данные находятся в файле `schema.sql`, сама база находится в
`instance/data/haski.db`. Таблицы:

| Таблица       | Назначение                                      | Что в ней на момент сдачи |
|---------------|-------------------------------------------------|---------------------------|
| `disciplines` | 6 дисциплин клуба                               | факты из сообщества ВК    |
| `events`      | календарь сезона                                | факты + «дата уточняется» |
| `results`     | турнирная таблица спартакиады                   | золото М-103 и т.д.       |
| `stats`       | счётчики главной страницы                       | 2012 / 6 / 430+ / 12      |
| `news`        | лента новостей                                  | 3 поста из ВК             |
| `applications`| **заявки с формы записи** (динамика)            | добавляются с сайта       |
| `messages`    | обратная связь (страница контактов)             | —                         |
| `admins`      | учётка мини-админки (Фаза 2)                    | admin / haski-demo-2026   |

### Структура таблиц (поля)

Одинакова в SQLite и Supabase; в SQLite типы `INTEGER/TEXT`, в Postgres —
`bigint/text/timestamptz`. Полные определения: `schema.sql` (SQLite) и
`scripts/supabase_schema.sql` (Postgres + RLS).

```
disciplines   id, slug UNIQUE, name, icon, badge, description, schedule_note, sort
events        id, title, discipline, event_date (NULL → «дата уточняется»),
              place, status (done|soon|tbd), result, sort
results       id, competition, place, group_name, points, note, updated_at
stats         key PK, value, label, suffix
news          id, date, category, title, body, image, sort
applications  id, created_at, name, group_name, discipline, contact, status («Новая»)
messages      id, created_at, name, contact, body
admins        id, username UNIQUE, password_hash   — только SQLite (мини-админка)
```

Связи: жёстких FOREIGN KEY нет — `events.discipline` и `applications.discipline`
хранят человекочитаемое название дисциплины, `results.group_name` — номер группы.
В Supabase у `applications`/`messages` стоят CHECK-ограничения длины полей
(защита от мусора и переполнения), у `events.status` — CHECK по трём статусам.

Проверить содержимое:

```bash
./.venv/Scripts/python.exe -c "import sqlite3; [print(r) for r in sqlite3.connect('instance/data/haski.db').execute('SELECT id, name, discipline, contact FROM applications')]"
```

## Облачная база данных (Supabase, бесплатный тариф)

Чтобы заявки работали и в статическом демо на GitHub Pages, форма записи
пишет в облачный PostgreSQL (Supabase, проект `haski-club`, регион Europe):

- адрес проекта: `https://zvoenupgvmtulfkgwzyf.supabase.co`;
- схема и сид: `scripts/supabase_schema.sql` (Postgres-версия `schema.sql`,
  выполняется в SQL Editor дашборда Supabase);
- отправка с сайта: `static/js/cloud-db.js` — POST в REST API Supabase
  с публичным anon-ключом (он не секретный и рассчитан на браузер);
- защита (RLS): контент (`disciplines`, `events`, `results`, `stats`, `news`)
  читается всеми; `applications` и `messages` — анониму только INSERT,
  чтение/изменение/удаление запрещены (заявки видит только владелец проекта);
- просмотр заявок: дашборд Supabase → Table Editor → `applications`
  (вход через GitHub владельца проекта);
- ограничения бесплатного тарифа: 500 МБ, проект засыпает после 7 дней
  без обращений и просыпается по первому запросу (данные не теряются).

Локальная SQLite (`flask init-db`) остаётся запасным путём: без JS форма
отправляется обычным POST во Flask и пишется в `instance/data/haski.db`.

## Особенности главной («Пролёт карточек»)

- 6 карточек-разделов летят снизу вверх по 3D-конвейеру (CSS-анимация `husky-fly`, без JS-драйвера);
- клик по карточке открывает соответствующий раздел сайта (обычная ссылка — SEO-дружелюбно); карточки кликабельны на протяжении всего видимого полёта;
- пауза полёта: кнопка «pause», фокус с клавиатуры (карточка ставится в центр), тап по пустому месту сцены на телефоне, секция вне экрана; наведение курсора полёт не останавливает;
- тема применяется из `<head>` до первой отрисовки — при переходах между страницами не вспыхивает тёмный фон;
- `prefers-reduced-motion: reduce` — полёт отключается, карточки показываются статично (доступность);
- контраст текстов и имена кнопок проверены Lighthouse: Accessibility 100.

## Раздел «Альбом»

Витрина из 26 лучших кадров клуба (имиджевая фотосессия, спартакиада,
волейбол, мини-футбол, настольный теннис, фиджитал, дартс, кросс), отобранных
из открытых альбомов сообщества ВКонтакте (vk.ru/albums-227779289, 435+ фото).
Кадр месяца показывается крупно над masonry-сеткой; фильтры-чипы переиспользуют
механику календаря; лайтбокс — свой (стрелки, Esc, возврат фокуса, блокировка
скролла). Данные страницы — константы в `routes/pages.py` (ALBUM_CATS /
ALBUM_PHOTOS), имена файлов фото — `static/assets/album/`.

## Скрипты

```bash
python scripts/export_static.py out_dir   # статическое демо для GitHub Pages (gh-pages)
```

## Демо-доступ администратора (Фаза 2)

`admin` / `haski-demo-2026` — пароль хранится в виде Werkzeug-хеша. В текущей
сборке используется только таблица `admins`; сама админка будет добавлена
в Фазе 2.

## Данные

Все первичные данные взяты из сообщества ВКонтакте клуба:
vk.ru/ssc_husky_official. Ещё неподтверждённые клубом значения отмечены
бейджем `уточняется` и плейсхолдером `[УТОЧНИТЬ]` — их легко найти поиском.
