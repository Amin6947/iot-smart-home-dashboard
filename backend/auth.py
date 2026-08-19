"""
Authentication - single-admin JWT login + shared API key สำหรับอุปกรณ์ ESP32
================================================================================
ระบบนี้ออกแบบสำหรับ "เจ้าของบ้านคนเดียว" ไม่ใช่ multi-tenant SaaS:
  - ผู้ใช้ (คุณ) ล็อกอินด้วย username/password -> ได้ JWT -> ใช้เรียก API ควบคุมบ้าน
  - อุปกรณ์ ESP32 ยิง telemetry เข้ามาด้วย API key คงที่ (ไม่ต้อง login แบบ user)

ตั้งค่าผ่าน environment variables (ดู .env.example):
  SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, DEVICE_API_KEY
"""
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 วัน

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
# ค่าเริ่มต้นสำหรับ local dev เท่านั้น — ต้องตั้ง ADMIN_PASSWORD เองก่อน deploy จริงเสมอ
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin1234")
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "dev-device-key")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_ADMIN_PASSWORD_HASH = pwd_context.hash(ADMIN_PASSWORD)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
device_key_header = APIKeyHeader(name="X-Device-Key", auto_error=False)


def verify_admin(username: str, password: str) -> bool:
    if username != ADMIN_USERNAME:
        return False
    return pwd_context.verify(password, _ADMIN_PASSWORD_HASH)


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """Dependency ป้องกัน endpoint ที่ต้องล็อกอิน (ใช้กับ user เท่านั้น ไม่ใช่ ESP32)"""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ไม่ได้ล็อกอิน หรือ token หมดอายุ",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username != ADMIN_USERNAME:
            raise credentials_error
        return username
    except JWTError:
        raise credentials_error


def verify_device_key(api_key: str = Security(device_key_header)) -> None:
    """Dependency ป้องกัน endpoint รับข้อมูลจาก ESP32 ด้วย shared secret key"""
    if not api_key or api_key != DEVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ไม่มีหรือ X-Device-Key ไม่ถูกต้อง",
        )
