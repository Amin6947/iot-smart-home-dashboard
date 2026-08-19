"""
IoT Smart Home Dashboard - FastAPI Backend
===========================================
รันด้วย:  uvicorn main:app --reload --host 0.0.0.0 --port 8000

Endpoints:
  POST /api/device/telemetry      -> รับข้อมูลจาก ESP32
  GET  /api/houses                -> รายชื่อบ้าน + อุปกรณ์ทั้งหมด
  GET  /api/devices/{id}/telemetry-> ข้อมูลย้อนหลังของอุปกรณ์ (สำหรับกราฟ)
  POST /api/devices/{id}/state    -> เปิด/ปิดอุปกรณ์ (LED)
"""
import os
import sys
from datetime import datetime
from typing import List

# Windows console ใช้ codepage cp1252 เป็นค่าเริ่มต้น ซึ่ง print ภาษาไทยไม่ได้
# บังคับ stdout/stderr เป็น UTF-8 กันแอปล่มตอน seed_data() print ข้อความไทย
if sys.stdout.encoding is not None and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import engine, get_db, SessionLocal

# สร้างตารางทั้งหมดตาม models (ถ้ายังไม่มี)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Home Dashboard API", version="1.0.0")

# origin ของ frontend ตัวจริง (ตั้งผ่าน env var ตอน deploy) — ห้ามใช้ "*" ใน production
# เพราะ endpoint ควบคุมอุปกรณ์ต้องพึ่ง CORS มาช่วยกันเว็บอื่นยิง request ข้ามโดเมนมาแทน user
_frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Seed ข้อมูลตัวอย่างเมื่อ start (ถ้าฐานข้อมูลว่าง)
# ---------------------------------------------------------------------------
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        if db.query(models.House).count() > 0:
            return  # มีข้อมูลแล้ว ไม่ต้อง seed ซ้ำ

        house1 = models.House(name="บ้านหลังใหญ่", location="กรุงเทพฯ")
        house2 = models.House(name="บ้านต่างจังหวัด", location="เชียงใหม่")
        db.add_all([house1, house2])
        db.flush()  # ให้ได้ id ก่อนสร้าง device

        devices = [
            models.Device(house_id=house1.id, name="ไฟห้องนั่งเล่น", type="led", state=False),
            models.Device(house_id=house1.id, name="เซนเซอร์อุณหภูมิ", type="temperature"),
            models.Device(house_id=house1.id, name="เซนเซอร์ความสว่าง", type="brightness"),
            models.Device(house_id=house2.id, name="ไฟหน้าบ้าน", type="led", state=True),
            models.Device(house_id=house2.id, name="เซนเซอร์อุณหภูมิ", type="temperature"),
        ]
        db.add_all(devices)
        db.commit()
        print("[seed] สร้างข้อมูลตัวอย่างเรียบร้อย")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Smart Home Dashboard API", "docs": "/docs"}


@app.post("/api/auth/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn):
    """ล็อกอินด้วย username/password (เจ้าของบ้านคนเดียว) -> คืน JWT"""
    if not auth.verify_admin(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="username หรือ password ไม่ถูกต้อง")
    token = auth.create_access_token(payload.username)
    return {"access_token": token, "token_type": "bearer"}


@app.post(
    "/api/device/telemetry",
    response_model=schemas.TelemetryOut,
    dependencies=[Depends(auth.verify_device_key)],
)
def receive_telemetry(payload: schemas.TelemetryIn, db: Session = Depends(get_db)):
    """รับข้อมูลจาก ESP32 แล้วบันทึกลงตาราง telemetry (ต้องมี X-Device-Key ที่ถูกต้อง)"""
    device = db.query(models.Device).filter(models.Device.id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="ไม่พบอุปกรณ์ (device_id)")

    record = models.Telemetry(
        device_id=payload.device_id,
        value=payload.value,
        timestamp=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/houses", response_model=List[schemas.HouseOut])
def list_houses(db: Session = Depends(get_db), _user: str = Depends(auth.get_current_user)):
    """ส่งรายชื่อบ้านทั้งหมดพร้อมอุปกรณ์ (ต้องล็อกอิน)"""
    return db.query(models.House).all()


@app.get("/api/devices/{device_id}/telemetry", response_model=List[schemas.TelemetryOut])
def device_telemetry(
    device_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
    _user: str = Depends(auth.get_current_user),
):
    """ข้อมูลย้อนหลังของอุปกรณ์ (เรียงเก่า -> ใหม่) สำหรับพล็อตกราฟ (ต้องล็อกอิน)"""
    rows = (
        db.query(models.Telemetry)
        .filter(models.Telemetry.device_id == device_id)
        .order_by(models.Telemetry.timestamp.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(rows))


@app.post("/api/devices/{device_id}/state", response_model=schemas.DeviceOut)
def set_device_state(
    device_id: int,
    payload: schemas.DeviceStateIn,
    db: Session = Depends(get_db),
    _user: str = Depends(auth.get_current_user),
):
    """เปิด/ปิดอุปกรณ์ เช่น LED (ต้องล็อกอิน)"""
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="ไม่พบอุปกรณ์")
    device.state = payload.state
    db.commit()
    db.refresh(device)
    return device
