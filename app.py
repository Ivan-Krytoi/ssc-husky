from flask import Flask, render_template

from db import init_app


def create_app():
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY="haski-dev-key-2026",  # для Фазы 2 (сессии админки/flash)
        TITLE_SUFFIX="ССК «Хаски»",
        TEMPLATES_AUTO_RELOAD=True,  # dev: правки шаблонов без перезапуска
    )

    init_app(app)

    from routes.pages import bp as pages_bp
    from routes.forms import bp as forms_bp

    app.register_blueprint(pages_bp)
    app.register_blueprint(forms_bp)

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template("404.html"), 404

    return app


app = create_app()
