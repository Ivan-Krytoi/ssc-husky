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
