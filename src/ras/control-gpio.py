# Author: Tyler Petrochko
#
import RPi.GPIO as GPIO
import json
import random
import time

LED_PIN = 11 # GPIO 17
SERVO_PIN = 12 # GPIO 18

# Servo constants
DUTY_OFFSET = 0.5
MIN = 2.5 + DUTY_OFFSET
MAX = 12.5 + DUTY_OFFSET


SERVO_PWM = None
SERVO_ANGLE = None

def lerp(val, fromLow, fromHigh, toLow, toHigh):
    return (toHigh-toLow)*(val-fromLow) / (fromHigh-fromLow) + toLow

def init():
    global SERVO_PWM
    GPIO.setmode(GPIO.BOARD)
    
    # init  LED
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.output(LED_PIN, GPIO.LOW)

    # init servo
    GPIO.setup(SERVO_PIN, GPIO.OUT)
    GPIO.output(SERVO_PIN, GPIO.LOW)
    SERVO_PWM = GPIO.PWM(SERVO_PIN, 50)
    SERVO_PWM.start(0)

def destroy():
    SERVO_PWM.stop()
    GPIO.cleanup()

def blinkOn():
    GPIO.output(LED_PIN, GPIO.HIGH)

def blinkOff():
    GPIO.output(LED_PIN, GPIO.LOW)

def setAngle(angle):
    print(f"Setting angle to {angle}")
    if(angle < 0):
        angle = 0
    elif(angle > 180):
        angle = 180

    SERVO_PWM.ChangeDutyCycle(lerp(angle, 0, 180, MIN, MAX))

def process(raw):
    global SERVO_ANGLE
    data = None
    try:
        data = json.loads(raw)
    except Exception:
        print(f"Couldn't parse: {raw}")
        return

    # Blink
    # if ("shift" in data and data["shift"]):
    #     blinkOn()
    # elif ("shift" in data and not data["shift"]):
    #     blinkOff()

    # Servos
    if ("horizontal" in data):
        try:
            value = int(data["horizontal"])
            angle = lerp(value, -1, 1, 0, 90)
            if angle != SERVO_ANGLE:
                setAngle(angle)
                SERVO_ANGLE = angle
                print(f"Setting it to {angle}")
            else:
                print("Not changing it...")
        except Exception as e:
            h = data["horizontal"]
            print(f"Couldn't pass horizontal axis: {h}: {e}")


# TODO remove
init()
setAngle(0.0)
time.sleep(3)
setAngle(45.0)
time.sleep(3)
while True:
    time.sleep(3)
    r = random.uniform(0, 100)
    print(f"Setting it to {r}")
    setAngle(r)
