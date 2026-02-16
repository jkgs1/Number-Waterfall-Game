from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*")

def initSocketIO(app):
    socketio.init_app(app)
    return socketio