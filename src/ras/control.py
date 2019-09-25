# Author: Tyler Petrochko
#
import pigpio
import json
import random
import time

SERVO_PIN = 18 # GPIO 18
PI = None

def lerp(val, fromLow, fromHigh, toLow, toHigh):
    return (toHigh-toLow)*(val-fromLow) / (fromHigh-fromLow) + toLow

def init():
    global PI
    PI = pigpio.pi()

def setAngle(angle):
    print(f"Setting angle to {angle}")
    if(angle < 0):
        angle = 0
    elif(angle > 180):
        angle = 180

    PI.set_servo_pulsewidth(SERVO_PIN, lerp(angle, 0, 180, 500, 2500))

def process(raw):
    data = None
    try:
        data = json.loads(raw)
    except Exception:
        print(f"Couldn't parse: {raw}")
        return

    # Servos
    if ("horizontal" in data):
        try:
            value = int(data["horizontal"])
            # Flip it or it will be mirrored
            setAngle(180 - lerp(value, -1, 1, 0, 180))
        except Exception as e:
            h = data["horizontal"]
            print(f"Couldn't pass horizontal axis: {h}: {e}")

