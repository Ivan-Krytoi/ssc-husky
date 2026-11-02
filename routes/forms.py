# ============================================================
# Приём заявок на пробное занятие (правило конкурса §3.1–3.3:
# формы пишут заявки в настоящую БД SQLite).
# ============================================================
from flask import Blueprint, redirect, render_template, request, url_for

from db import get_db

bp = Blueprint("forms", __name__)


@bp.route("/join/", methods=["GET", "POST"])
def join():
    db = get_db()
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        group = request.form.get("group", "").strip()
        discipline = request.form.get("discipline", "").strip() or "Другое"
        contact = request.form.get("contact", "").strip()

        # Серверная валидация: только непустые обязательные поля.
        # Расширенную валидацию (формат группы/контакта) добавим в Фазе 2.
        if name and group and contact:
            db.execute(
                "INSERT INTO applications (name, group_name, discipline, contact)"
                " VALUES (?, ?, ?, ?)",
                (name, group, discipline, contact),
            )
            db.commit()
            return redirect(url_for("forms.join", sent=1))
        return redirect(url_for("forms.join", error=1))

    return render_template("join.html")
