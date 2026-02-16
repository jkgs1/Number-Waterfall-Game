from app import initFlask
from events import register_events
from routes import register_routes
from socketio_instance import initSocketIO

app = initFlask()
socketio = initSocketIO(app)

register_routes(app)
register_events()

if __name__ == "__main__":
    socketio.run(app, debug=True)
