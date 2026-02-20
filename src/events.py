from flask import request
from flask_socketio import emit, join_room

from socketio_instance import socketio

users = {}

def register_events():

    @socketio.on('join')
    def handle_join(username):
        users[request.sid] = username
        join_room(username)
        emit("message", f"{username} joined the chat", room=username)

        if username == "cv":
            @socketio.on("click")
            def handle_click(data):
                emit("click", data, broadcast=True)
                
        if username == "teacher":
            @socketio.on("start")
            def handle_start(settings):
                emit("start", settings, broadcast=True)
            @socketio.on("stop")
            def handle_stop():
                emit("stop")

    # @socketio.on('start')

    # def handle_start(data):
    #     emit("start_game", data, broadcast=True)
    # @socketio.on('stop')
    # def handle_stop():
    #     emit("stop_game", broadcast=True)

    # @socketio.on('message')
    # def handle_message(data):
    #     username = users.get(request.sid, "Anonymous")
    #     emit("message", f"{username}: {data}", broadcast=True)

    @socketio.on('disconnect')
    def handle_disconnect():
        username = users.pop(request.sid, "Anonymous")
        emit("message", f"{username} left the chat", broadcast=True)
