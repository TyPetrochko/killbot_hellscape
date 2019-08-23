import socket
import time
import os
import sys

socket_path = '/tmp/uv4l.socket'
if len(sys.argv) > 1:
    socket_path = sys.argv[1]

try:
    os.unlink(socket_path)
except OSError:
    if os.path.exists(socket_path):
        raise

s = socket.socket(socket.AF_UNIX, socket.SOCK_SEQPACKET)
s.bind(socket_path)
s.listen(1)

while True:
    print("Awaiting connection...")
    connection, address = s.accept()

    print(f"Connected to address: {address}")
    while True:
        data = connection.recv(1024)
        print(f"Got data: {data}")
        if not data:
            break
        connection.sendall(data)


