# ============================================================
# ССК «ХАСКИ» — работа с SQLite
# Правила конкурса §3.3: схема в schema.sql, доступ жюри
# (копия БД + инструкция в README, команда flask init-db).
# ============================================================
import os
import sqlite3
import click

from flask import current_app, g
from werkzeug.security import generate_password_hash

DATABASE = "data/haski.db"


def get_db():
    """Подключение «на запрос»: в g, чтобы переиспользовать."""
    if "db" not in g:
        g.db = sqlite3.connect(
            os.path.join(current_app.instance_path, DATABASE),
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Создаёт БД из schema.sql + администратора мини-админки."""
    app = current_app._get_current_object()
    path = os.path.join(app.instance_path, DATABASE)
    os.makedirs(os.path.dirname(path), exist_ok=True)

    db = get_db()

    with open(os.path.join(app.root_path, "schema.sql"), "rb") as f:
        db.executescript(f.read().decode("utf-8"))

    # Администратор для мини-админки (Фаза 2): демо-доступ для жюри.
    db.execute(
        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
        ("admin", generate_password_hash("haski-demo-2026")),
    )
    db.commit()
    click.echo(f"БД инициализирована: {path}")


@click.command("init-db")
def init_db_command():
    """CLI: flask init-db — заново создаёт haski.db из schema.sql."""
    init_db()


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
