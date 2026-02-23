import webbrowser as wb

from app import initFlask
from events import register_events
from routes import register_routes
from socketio_instance import initSocketIO

app = initFlask()
socketio = initSocketIO(app)

register_routes(app)
register_events()

    
if __name__ == "__main__":
    wb.open_new("http://localhost:5000/ui")
    wb.open_new("http://localhost:5000/game")
    # run is a blocking function which means code under wont be executed
    socketio.run(app, debug=True)
