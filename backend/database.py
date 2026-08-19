"""
Database configuration - SQLAlchemy
โหมด local dev: ใช้ SQLite (ไฟล์เดียว ไม่ต้องติดตั้งอะไรเพิ่ม)
โหมด production: ตั้ง DATABASE_URL เป็น Postgres (เช่นจาก Render) เพื่อให้ข้อมูลอยู่ถาวร
  เหตุผลที่ต้องสลับ: web service บน hosting ฟรีส่วนใหญ่มีดิสก์แบบ ephemeral
  ไฟล์ SQLite จะหายเมื่อ redeploy/restart ถ้าไม่ใช้ persistent disk เพิ่มเงิน
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./smart_home.db")

# Render ให้ connection string แบบ "postgres://" แต่ SQLAlchemy 2.x ต้องการ "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency สำหรับฉีด (inject) DB session เข้า endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
