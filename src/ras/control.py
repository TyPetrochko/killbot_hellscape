# Author: Tyler Petrochko
#
import RPi.GPIO as GPIO
import json

pin = 11 # GPIO 17

def init():
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)

def blinkOn():
    GPIO.output(pin, GPIO.HIGH)

def blinkOff():
    GPIO.output(pin, GPIO.LOW)

def process(raw):
    data = None
    try:
        data = json.loads(raw)
    except Exception:
        print(f"Couldn't parse: {raw}")

    if ("shift" in data and data["shift"]):
        blinkOn()
    elif ("shift" in data and not data["shift"]):
        blinkOff()


