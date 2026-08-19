"""
ESP32 MicroPython Firmware - Smart Home Sensor Node
====================================================
ส่งข้อมูลอุณหภูมิ/ความสว่างไปยัง FastAPI backend ผ่าน POST /api/device/telemetry

การเตรียม:
  1. แฟลช MicroPython ลง ESP32 (https://micropython.org/download/esp32/)
  2. อัพโหลดไฟล์นี้เป็น main.py ด้วย Thonny หรือ ampy
  3. แก้ WIFI_SSID, WIFI_PASS และ SERVER_URL ให้ตรงกับเครือข่ายของคุณ

หมายเหตุ: device_id ต้องตรงกับ id ในตาราง devices ของ backend
"""
import network
import urequests
import ujson
import time

# ---- ตั้งค่า ----
WIFI_SSID = "YOUR_WIFI_NAME"
WIFI_PASS = "YOUR_WIFI_PASSWORD"
# local: ใช้ IP ของเครื่องที่รัน backend | production: ใส่ URL จริงจาก Render เช่น
# "https://your-backend.onrender.com/api/device/telemetry"
SERVER_URL = "http://192.168.1.100:8000/api/device/telemetry"
# ต้องตรงกับ DEVICE_API_KEY ที่ตั้งไว้ฝั่ง backend (.env) ไม่งั้นจะถูกปฏิเสธด้วย HTTP 401
DEVICE_API_KEY = "dev-device-key"

TEMP_DEVICE_ID = 2        # id ของเซนเซอร์อุณหภูมิใน DB
BRIGHTNESS_DEVICE_ID = 3  # id ของเซนเซอร์ความสว่างใน DB
SEND_INTERVAL = 5         # วินาที


def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("กำลังเชื่อมต่อ WiFi...")
        wlan.connect(WIFI_SSID, WIFI_PASS)
        while not wlan.isconnected():
            time.sleep(0.5)
    print("เชื่อมต่อแล้ว:", wlan.ifconfig()[0])


def read_temperature():
    """
    อ่านอุณหภูมิจริงจากเซนเซอร์ (เช่น DHT22) ที่นี่
    ตัวอย่างนี้จำลองด้วยค่าสุ่ม
    """
    import urandom
    return 25 + (urandom.getrandbits(8) / 255.0) * 10  # 25-35 °C


def read_brightness():
    """
    อ่านค่าความสว่างจาก LDR ผ่าน ADC
    ตัวอย่างจริง:
        from machine import ADC, Pin
        adc = ADC(Pin(34)); adc.atten(ADC.ATTN_11DB)
        return adc.read()
    """
    import urandom
    return urandom.getrandbits(10)  # 0-1023


def send_telemetry(device_id, value):
    payload = ujson.dumps({"device_id": device_id, "value": value})
    try:
        res = urequests.post(
            SERVER_URL,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Device-Key": DEVICE_API_KEY,
            },
        )
        print("ส่ง:", payload, "-> HTTP", res.status_code)
        res.close()
    except Exception as e:
        print("ส่งไม่สำเร็จ:", e)


def main():
    connect_wifi()
    while True:
        send_telemetry(TEMP_DEVICE_ID, round(read_temperature(), 2))
        send_telemetry(BRIGHTNESS_DEVICE_ID, read_brightness())
        time.sleep(SEND_INTERVAL)


if __name__ == "__main__":
    main()
