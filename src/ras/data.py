import socket
import time
import os
import sys
import control

METRICS_POLLING_MS = 1000

control.init()

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


bytes_received = 0
last_metrics_dump_ms = time.time() * 1000
def profile(data):
    global bytes_received
    global last_metrics_dump_ms

    bytes_received += len(data)
    t = time.time() * 1000
    if t - last_metrics_dump_ms > METRICS_POLLING_MS:
        bytes_per_second = (bytes_received / (t - last_metrics_dump_ms)) * 1000
        print(f"Bytes/second: {bytes_per_second}")
        bytes_received = 0
        last_metrics_dump_ms = t

while True:
    print("Awaiting connection...")
    connection, address = s.accept()

    try:
        print(f"Connected to address: {address}")
        while True:
            data = connection.recv(1024)
            profile(data)
            
            if not data:
                break
            
            control.process(data)
            connection.sendall(data)
    except Exception as e:
        print(f"Got exception reading from UV4L Unix Socket: {e}")
    finally:
        connection.close()


