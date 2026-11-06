# -*- coding: utf-8 -*-
"""Экспорт статического демо для GitHub Pages (ветка gh-pages).

Превращает живой Flask-сайт в набор статических HTML:
    python scripts/export_static.py <куда экспортировать>

Правила, сложившиеся в репо:
  • страницы кладутся в папки: /album/ -> album/index.html;
  • внутренние href/src "/..." переписываются в "/ssc-husky/..." (базовый путь Pages);
  • static/ копируется целиком (картинки, css, js).
Запускать при поднятом живом сервере не нужно — рендер идёт через test_client.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app import app  # noqa: E402

BASE = "/ssc-husky"          # префикс GitHub Pages (имя репозитория)
PAGES = ["", "about", "sport", "schedule", "results", "news", "album", "join", "404"]


def rewrite(html: str) -> str:
    # внутренние ссылки и статика -> /ssc-husky/...
    html = re.sub(r'(href|src)="/(?!ssc-husky/|https?://|mailto:|tel:)([^"]*)"',
                  r'\1="%s/\2"' % BASE, html)
    return html


def main(out_dir: str) -> None:
    out = Path(out_dir)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    app.config.update(SERVER_NAME="localhost")
    with app.app_context():
        client = app.test_client()
        for page in PAGES:
            url = "/" if page == "" else ("/" + page + "/")
            resp = client.get(url)
            if resp.status_code != 200:
                print(f"[skip] {url} -> HTTP {resp.status_code}")
                continue
            html = rewrite(resp.get_data(as_text=True))
            folder = out if page == "" else (out / page)
            folder.mkdir(parents=True, exist_ok=True)
            (folder / "index.html").write_text(html, encoding="utf-8", newline="\n")
            print(f"[ok] {url} -> {(folder / 'index.html').relative_to(out)}")
        # 404.html в корне (Pages использует его)
        resp = client.get("/unknown-page/")
        html = rewrite(resp.get_data(as_text=True))
        (out / "404.html").write_text(html, encoding="utf-8", newline="\n")
        print("[ok] 404.html")

    # статика целиком
    shutil.copytree(ROOT / "static", out / "static")
    print(f"[done] экспорт: {out}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python scripts/export_static.py <out-dir>")
        sys.exit(2)
    main(sys.argv[1])
