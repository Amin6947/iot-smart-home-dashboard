"""
ORM Models - ตาราง houses, devices, telemetry
"""
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship

from database import Base


class House(Base):
    __tablename__ = "houses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, default="")

    devices = relationship(
        "Device", back_populates="house", cascade="all, delete-orphan"
    )


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=False)
    name = Column(String, nullable=False)
    # ประเภทอุปกรณ์: "led" | "temperature" | "brightness"
    type = Column(String, nullable=False)
    # สถานะเปิด/ปิด (ใช้กับ actuator เช่น LED)
    state = Column(Boolean, default=False)

    house = relationship("House", back_populates="devices")
    telemetry = relationship(
        "Telemetry", back_populates="device", cascade="all, delete-orphan"
    )


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    device = relationship("Device", back_populates="telemetry")
