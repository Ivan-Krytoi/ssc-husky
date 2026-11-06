# ============================================================
# Публичные страницы ССК «Хаски»
# Главная — «Пролёт карточек» (3D-карточки летят снизу вверх,
# клик по карточке ведёт в соответствующий раздел сайта).
# ============================================================
from flask import Blueprint, render_template

from db import get_db

bp = Blueprint("pages", __name__)


def _q(sql, *args):
    return get_db().execute(sql, args).fetchall()


@bp.route("/")
def index():
    # Колодой управляют данные БД: дисциплины, события, медали, новости.
    disciplines = _q("SELECT * FROM disciplines ORDER BY sort")
    events = _q(
        "SELECT * FROM events"
        " WHERE status IN ('done','soon','tbd') ORDER BY sort LIMIT 4"
    )
    medals = _q(
        "SELECT * FROM results ORDER BY updated_at DESC, place ASC LIMIT 3"
    )
    news = _q("SELECT * FROM news ORDER BY sort LIMIT 3")
    stats = _q("SELECT * FROM stats ORDER BY key")
    return render_template(
        "index.html",
        disciplines=disciplines,
        events=events,
        medals=medals,
        news_list=news,
        stats=stats,
    )


@bp.route("/about/")
def about():
    medals = _q("SELECT * FROM results ORDER BY updated_at DESC, place ASC LIMIT 3")
    return render_template("about.html", medals=medals)


@bp.route("/sport/")
def sport():
    disciplines = _q("SELECT * FROM disciplines ORDER BY sort")
    return render_template("sport.html", disciplines=disciplines)


@bp.route("/schedule/")
def schedule():
    events = _q("SELECT * FROM events ORDER BY event_date IS NULL, sort")
    return render_template("schedule.html", events=events)


@bp.route("/results/")
def results():
    medals = _q("SELECT * FROM results ORDER BY updated_at DESC, place ASC")
    stats = _q("SELECT * FROM stats ORDER BY key")
    return render_template("results.html", medals=medals, stats=stats)


@bp.route("/news/")
def news():
    news_list = _q("SELECT * FROM news ORDER BY sort")
    return render_template("news.html", news_list=news_list)


# ============================================================
# АЛЬБОМ — витрина лучших фото клуба (25 кадров).
# Источники: открытые альбомы сообщества ВК «Хаски»
# (vk.ru/albums-227779289, 435+ фото). Файлы — static/assets/album.
# ============================================================
ALBUM_CATS = [
    ("team",      "Команда и имидж"),
    ("volleyball", "Волейбол"),
    ("football",  "Мини-футбол"),
    ("tennis",    "Настольный теннис"),
    ("fidgetal",  "Фиджитал"),
    ("darts",     "Дартс"),
    ("cross",     "Кросс"),
]

ALBUM_PHOTOS = [
    # featured — «кадр месяца», крупный блок над сеткой
    {"file": "imidj_457239054.jpg", "cat": "team", "featured": True,
     "title": "Сборная клуба в клубной форме",
     "alt": "Групповой портрет команды ССК «Хаски» в клубной форме на белом студийном фоне"},
    {"file": "imidj_457239021.jpg", "cat": "team",
     "title": "Настроение клуба",
     "alt": "Студия: четыре студента смеются в обнимку на фоне зелёного мха"},
    {"file": "imidj_457239024.jpg", "cat": "team",
     "title": "Спорт — часть жизни",
     "alt": "Портрет студента с футбольным мячом на ладони в студии"},
    {"file": "imidj_457239034.jpg", "cat": "team",
     "title": "Куча-мала в студии",
     "alt": "Весёлая группа студентов обнимается, один показывает жест «ок»"},
    {"file": "foot_457239646.jpg", "cat": "football",
     "title": "Спартакиада вуза: общий кадр",
     "alt": "Сводные команды спартакиады ЮУТУ на футбольном поле с мячом"},
    {"file": "foot_457239675.jpg", "cat": "football",
     "title": "Судья в фирменной форме",
     "alt": "Арбитр в голубой накидке «Хаски» на фоне играющих команд"},
    {"file": "foot_457239639.jpg", "cat": "football",
     "title": "Инструктаж перед туром",
     "alt": "Тренер объясняет план игры команде в жёлтых манишках"},
    {"file": "foot_457239684.jpg", "cat": "football",
     "title": "Вратарь вводит мяч в игру",
     "alt": "Вратарь в розовой форме готовится передать мяч на поле"},
    {"file": "vol_457239402.jpg", "cat": "volleyball",
     "title": "Награждение финалистов",
     "alt": "Вручение диплома и сувенира волейболистам на краю площадки"},
    {"file": "vol_457239441.jpg", "cat": "volleyball",
     "title": "Медалисты с тренером",
     "alt": "Медалисты волейбольного финала стоят рядом с наставником"},
    {"file": "vol_457239442.jpg", "cat": "volleyball",
     "title": "Команда-финалист у сетки",
     "alt": "Девушки в чёрной форме с медалями обнимаются у волейбольной сетки"},
    {"file": "vol_457239404.jpg", "cat": "volleyball",
     "title": "Тренировочный тур в зале",
     "alt": "Игроки в зелёных манишках разминаются на тренировке волейболом в зале"},
    {"file": "tennis_457239141.jpg", "cat": "tennis",
     "title": "Чемпионат клуба по настольному теннису",
     "alt": "Игрок у теннисного стола, за партой наблюдающие зрители"},
    {"file": "tennis_457239151.jpg", "cat": "tennis",
     "title": "Удар форхендом",
     "alt": "Игрок исполняет удар форхендом красной ракеткой над столом"},
    {"file": "tennis_457239162.jpg", "cat": "tennis",
     "title": "Эмоции победы",
     "alt": "Игрок в красной футболке обнимает товарища после выигрыша партии"},
    {"file": "tennis_457239176.jpg", "cat": "tennis",
     "title": "Трибуны фанатеют",
     "alt": "Болельщик аплодирует после яркого розыгрыша"},
    {"file": "fidget_457239196.jpg", "cat": "fidgetal",
     "title": "Поддержка на турнире",
     "alt": "Студенческая группа поддержки с синими помпонами у трибун зала"},
    {"file": "fidget_457239229.jpg", "cat": "fidgetal",
     "title": "Награды турнира «Баскетбол»",
     "alt": "Кубки и баскетбольный мяч на полу игрового зала"},
    {"file": "fidget_457239231.jpg", "cat": "fidgetal",
     "title": "Данк в игровой зал",
     "alt": "Игрок в чёрной форме выполняет данк в прыжке к кольцу"},
    {"file": "fidget_457239233.jpg", "cat": "fidgetal",
     "title": "Победители фиджитал-турнира",
     "alt": "Два игрока с медалями и грамотой фиджитал-турнира"},
    {"file": "darts_457239101.jpg", "cat": "darts",
     "title": "Момент броска",
     "alt": "Девушка выпускает дротик по мишени в спортзале"},
    {"file": "darts_457239115.jpg", "cat": "darts",
     "title": "Командный зачёт дартс",
     "alt": "Команда дартсменов с дипломами на фоне мишени"},
    {"file": "darts_457239122.jpg", "cat": "darts",
     "title": "Призёры чемпионата по дартс",
     "alt": "Группа победителей чемпионата по дартс с дипломами"},
    {"file": "cross_457239792.jpg", "cat": "cross",
     "title": "Кросс Универсиады: темп",
     "alt": "Бегун с номером 178 бежит по лесной дистанции"},
    {"file": "cross_457239795.jpg", "cat": "cross",
     "title": "Сборная клуба на кроссе",
     "alt": "Команда «Хаски» с флагами Универсиады и баннером клуба"},
    {"file": "cross_457239800.jpg", "cat": "cross",
     "title": "Перед стартом",
     "alt": "Шеренга бегунов в номерах ждёт стартовый выстрел"},
]


@bp.route("/album/")
def album():
    featured = next((p for p in ALBUM_PHOTOS if p.get("featured")), None)
    photos = [p for p in ALBUM_PHOTOS if not p.get("featured")]
    cat_names = dict(ALBUM_CATS)
    for p in ALBUM_PHOTOS:
        p["cat_name"] = cat_names[p["cat"]]
    return render_template(
        "album.html",
        cats=ALBUM_CATS,
        photos=photos,
        featured=featured,
        total=len(ALBUM_PHOTOS),
    )
