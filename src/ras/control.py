# Author: Tyler Petrochko
#
import pigpio
import json
import random
import time

SERVO_PIN = 18 # GPIO 18
MOTOR_PIN = 17 # GPIO 17
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


def setSpeed(speed):
    if (speed < 0 or speed > 1):
        print(f"Speed {speed} is not in range 0-1")

    speed = max(speed, 0) # Make sure it's not negative
    speed = min(speed, 1) # Make sure it's not > 1
    print(f"Setting speed to {speed}")

    PI.set_servo_pulsewidth(MOTOR_PIN, lerp(speed, 0, 1, 1500, 2000))


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
            steering = int(data["horizontal"])
            speed = int(data["vertical"])
            # Flip it or it will be mirrored
            setAngle(180 - lerp(steering, -1, 1, 0, 180))
            setSpeed(speed)
        except Exception as e:
            h = data["horizontal"]
            print(f"Couldn't pass horizontal axis: {h}: {e}")

