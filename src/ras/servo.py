# Author: Tyler Petrochko
#
import RPi.GPIO as GPIO
import time

DUTY_OFFSET = 0.5
MIN = 2.5 + DUTY_OFFSET
MAX = 12.5 + DUTY_OFFSET

pin = 12

def lerp(val, fromLow, fromHigh, toLow, toHigh):
    return (toHigh-toLow)*(val-fromLow) / (fromHigh-fromLow) + toLow

def setup():
    global p
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)

    p = GPIO.PWM(pin, 50)
    p.start(0)

def setAngle(angle):
    if(angle < 0):
        angle = 0
    elif(angle > 180):
        angle = 180

    p.ChangeDutyCycle(lerp(angle, 0, 180, MIN, MAX))

def destroy():
    p.stop()
    GPIO.cleanup()

