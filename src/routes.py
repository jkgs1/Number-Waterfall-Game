import os

from flask import send_from_directory

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.join(SRC_DIR, "..")
HTML_DIR = os.path.join(ROOT_DIR, "html")

TEACHER_DIR = os.path.join(HTML_DIR, "ui")
GAME_DIR = os.path.join(HTML_DIR, "game")


def register_routes(app):

    # ---- UI APP ----
    @app.route("/ui", defaults={"path": ""})
    @app.route("/ui/<path:path>")
    def serve_ui(path):
        if path != "" and os.path.exists(os.path.join(TEACHER_DIR, path)):
            return send_from_directory(TEACHER_DIR, path)

        # SPA fallback
        return send_from_directory(TEACHER_DIR, "index.html")


    # ---- GAME APP ----
    @app.route("/game", defaults={"path": ""})
    @app.route("/game/<path:path>")
    def serve_game(path):
        if path != "" and os.path.exists(os.path.join(GAME_DIR, path)):
            return send_from_directory(GAME_DIR, path)

        # SPA fallback
        return send_from_directory(GAME_DIR, "index.html")