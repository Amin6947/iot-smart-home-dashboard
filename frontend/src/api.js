// เลเยอร์เรียก API ไปยัง FastAPI backend
// local dev: VITE_API_URL ไม่ตั้งค่า -> ใช้ path relative "/api" ผ่าน vite proxy
// production: ตั้ง VITE_API_URL=https://your-backend.onrender.com ตอน build
const API_ROOT = import.meta.env.VITE_API_URL || ''
const BASE = `${API_ROOT}/api`

const TOKEN_KEY = 'smart_home_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// error พิเศษเพื่อให้ App.jsx รู้ว่าต้องพากลับไปหน้า login
export class AuthError extends Error {}

async function authedFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.status === 401) {
    clearToken()
    // แจ้ง App.jsx ทั่วทั้งแอป ไม่ว่า 401 จะเกิดจาก component ไหน (กราฟ, ปุ่ม toggle, ฯลฯ)
    window.dispatchEvent(new Event('auth:expired'))
    throw new AuthError('เซสชันหมดอายุ กรุณาล็อกอินใหม่')
  }
  return res
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('username หรือ password ไม่ถูกต้อง')
  const data = await res.json()
  setToken(data.access_token)
  return data
}

export async function getHouses() {
  const res = await authedFetch('/houses')
  if (!res.ok) throw new Error('โหลดข้อมูลบ้านไม่สำเร็จ')
  return res.json()
}

export async function getTelemetry(deviceId, limit = 20) {
  const res = await authedFetch(`/devices/${deviceId}/telemetry?limit=${limit}`)
  if (!res.ok) throw new Error('โหลดข้อมูล telemetry ไม่สำเร็จ')
  return res.json()
}

export async function setDeviceState(deviceId, state) {
  const res = await authedFetch(`/devices/${deviceId}/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  if (!res.ok) throw new Error('สั่งงานอุปกรณ์ไม่สำเร็จ')
  return res.json()
}
