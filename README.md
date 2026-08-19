# 🏡 IoT Smart Home Dashboard

โปรเจกต์ระบบ Dashboard บ้านอัจฉริยะแบบครบวงจร ประกอบด้วย Backend (FastAPI),
Frontend (React + Tailwind) และ Firmware ESP32 (MicroPython)

```
A03/
├── backend/          # FastAPI + SQLite
│   ├── main.py           # แอปหลัก + endpoints + seed data
│   ├── database.py       # ตั้งค่า SQLAlchemy + SQLite
│   ├── models.py         # ตาราง houses, devices, telemetry
│   ├── schemas.py        # Pydantic schemas
│   └── requirements.txt
├── frontend/         # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   │       ├── HouseCard.jsx
│   │       ├── DeviceCard.jsx
│   │       └── TelemetryChart.jsx
│   └── package.json
├── firmware/         # ESP32
│   ├── main.py           # MicroPython firmware จริง
│   └── simulator.py      # จำลองบน PC (ไม่ต้องมีบอร์ด)
└── README.md
```

---

## 1. Backend (FastAPI)

### ความต้องการ
- Python 3.11 ขึ้นไป

### ติดตั้งและรัน
```bash
cd backend

# (แนะนำ) สร้าง virtual environment
python -m venv venv
# Windows PowerShell:
venv\Scripts\Activate.ps1
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
# หรือ: pip install fastapi uvicorn sqlalchemy

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

เปิดเอกสาร API อัตโนมัติที่ 👉 http://localhost:8000/docs

> ครั้งแรกที่รัน ระบบจะสร้างไฟล์ `smart_home.db` และใส่ข้อมูลตัวอย่าง
> (บ้าน 2 หลัง + อุปกรณ์ LED/เซนเซอร์) ให้อัตโนมัติ

### API Endpoints
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `POST` | `/api/device/telemetry` | รับข้อมูลจาก ESP32 |
| `GET`  | `/api/houses` | รายชื่อบ้าน + อุปกรณ์ทั้งหมด |
| `GET`  | `/api/devices/{id}/telemetry?limit=20` | ข้อมูลย้อนหลังสำหรับกราฟ |
| `POST` | `/api/devices/{id}/state` | เปิด/ปิดอุปกรณ์ (LED) |

### ตารางฐานข้อมูล
- **houses** — `id, name, location`
- **devices** — `id, house_id, name, type(led/temperature/brightness), state`
- **telemetry** — `id, device_id, value, timestamp`

---

## 2. Frontend (React + Tailwind)

### ความต้องการ
- Node.js 18 ขึ้นไป

### ติดตั้งและรัน
```bash
cd frontend
npm install
npm run dev
```
เปิดเบราว์เซอร์ที่ 👉 http://localhost:5173

> Vite ตั้งค่า proxy `/api` ไปที่ `http://localhost:8000` ไว้แล้ว
> (ดู `vite.config.js`) จึงไม่ต้องกังวลเรื่อง CORS ตอน dev

**คุณสมบัติ**
- แสดงบ้านทั้งหมดและอุปกรณ์ในแต่ละบ้าน
- กราฟ real-time อัพเดททุก 5 วินาที (Recharts)
- ปุ่ม toggle เปิด/ปิด LED

> หมายเหตุ: หากสร้างโปรเจกต์ใหม่เองด้วย `npm create vite@latest` ให้เลือก
> template **React** แล้วคัดลอกไฟล์ในโฟลเดอร์ `src/` และไฟล์ config ทับได้เลย

---

## 3. ESP32 Firmware (MicroPython)

1. แฟลช MicroPython ลง ESP32 — https://micropython.org/download/esp32/
2. แก้ค่าใน `firmware/main.py`:
   - `WIFI_SSID`, `WIFI_PASS`
   - `SERVER_URL` = `http://<IP-ของเครื่อง-backend>:8000/api/device/telemetry`
   - `TEMP_DEVICE_ID`, `BRIGHTNESS_DEVICE_ID` ให้ตรงกับ id ใน DB
3. อัพโหลดเป็น `main.py` ด้วย **Thonny** หรือ `ampy`

### ไม่มีบอร์ด? ใช้ Simulator แทน
```bash
pip install requests
python firmware/simulator.py
```
สคริปต์นี้จะส่งข้อมูลจำลองทุก 5 วินาที ทำให้กราฟบน dashboard ขยับจริง

---

## 4. ทดสอบด้วย curl

```bash
# ส่งข้อมูล telemetry (อุณหภูมิ 28.5 ให้ device id=2)
curl -X POST http://localhost:8000/api/device/telemetry \
  -H "Content-Type: application/json" \
  -d "{\"device_id\": 2, \"value\": 28.5}"

# ดูรายชื่อบ้านทั้งหมด
curl http://localhost:8000/api/houses

# ดูข้อมูลย้อนหลังของ device id=2
curl http://localhost:8000/api/devices/2/telemetry

# เปิด LED (device id=1)
curl -X POST http://localhost:8000/api/devices/1/state \
  -H "Content-Type: application/json" \
  -d "{\"state\": true}"
```

> บน Windows PowerShell ใช้ `curl.exe` (มีมากับ Windows 10/11) หรือใช้
> `Invoke-RestMethod` แทน เช่น:
> ```powershell
> Invoke-RestMethod -Uri http://localhost:8000/api/houses
> ```

---

## ลำดับการเปิดใช้งานทั้งระบบ
1. รัน **backend** → `uvicorn main:app --reload --port 8000`
2. รัน **simulator** (หรือต่อ ESP32) → `python firmware/simulator.py`
3. รัน **frontend** → `npm run dev` แล้วเปิด http://localhost:5173

กราฟจะอัพเดทอัตโนมัติ และกดปุ่มเปิด/ปิด LED ได้ทันที 🎉
