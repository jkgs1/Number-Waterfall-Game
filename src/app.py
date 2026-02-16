from flask import Flask


def initFlask():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your_secret_key'
    return app
