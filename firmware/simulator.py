"""
ESP32 Simulator (รันบน PC) - จำลองการส่งข้อมูลเซนเซอร์
=====================================================
ใช้ทดสอบ dashboard โดยไม่ต้องมี ESP32 จริง

ติดตั้ง:  pip install requests
รัน:      python simulator.py
"""
import os
import random
import time

import requests

SERVER_URL = os.environ.get("SERVER_URL", "http://localhost:8000/api/device/telemetry")
# ต้องตรงกับ DEVICE_API_KEY ฝั่ง backend เสมอ
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "dev-device-key")

# device_id เหล่านี้ตรงกับข้อมูล seed ใน backend/main.py
SENSORS = [
    {"device_id": 2, "type": "temperature"},  # บ้าน 1: อุณหภูมิ
    {"device_id": 3, "type": "brightness"},   # บ้าน 1: ความสว่าง
    {"device_id": 5, "type": "temperature"},  # บ้าน 2: อุณหภูมิ
]


def make_value(sensor_type):
    if sensor_type == "temperature":
        return round(random.uniform(25, 35), 2)
    if sensor_type == "brightness":
        return round(random.uniform(0, 1023), 0)
    return round(random.random() * 100, 2)


def main():
    print("เริ่มจำลองการส่งข้อมูล... (Ctrl+C เพื่อหยุด)")
    while True:
        for s in SENSORS:
            value = make_value(s["type"])
            try:
                res = requests.post(
                    SERVER_URL,
                    json={"device_id": s["device_id"], "value": value},
                    headers={"X-Device-Key": DEVICE_API_KEY},
                    timeout=5,
                )
                print(f"device {s['device_id']} = {value} -> {res.status_code}")
            except Exception as e:
                print("error:", e)
        time.sleep(5)


if __name__ == "__main__":
    main()
