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

    @socketio.on('message')
    def handle_message(data):
        username = users.get(request.sid, "Anonymous")
        emit("message", f"{username}: {data}", broadcast=True)

    @socketio.on('disconnect')
    def handle_disconnect():
        username = users.pop(request.sid, "Anonymous")
        emit("message", f"{username} left the chat", broadcast=True)
