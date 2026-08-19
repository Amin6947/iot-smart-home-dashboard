"""
Pydantic Schemas - รูปแบบข้อมูล request/response
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ---------- Auth ----------
class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Telemetry ----------
class TelemetryIn(BaseModel):
    """ข้อมูลที่ ESP32 ส่งเข้ามา"""
    device_id: int
    value: float


class TelemetryOut(BaseModel):
    id: int
    device_id: int
    value: float
    timestamp: datetime

    class Config:
        from_attributes = True


# ---------- Device ----------
class DeviceOut(BaseModel):
    id: int
    name: str
    type: str
    state: bool

    class Config:
        from_attributes = True


class DeviceStateIn(BaseModel):
    """สั่งเปิด/ปิดอุปกรณ์"""
    state: bool


# ---------- House ----------
class HouseOut(BaseModel):
    id: int
    name: str
    location: str
    devices: List[DeviceOut] = []

    class Config:
        from_attributes = True
