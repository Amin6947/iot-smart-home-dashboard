import { useState } from 'react'
import TelemetryChart from './TelemetryChart'
import { setDeviceState } from '../api'

// การตั้งค่าการแสดงผลตามประเภทอุปกรณ์
const TYPE_META = {
  led:         { icon: '💡', label: 'ไฟ LED',        color: '#f59e0b', unit: '' },
  temperature: { icon: '🌡️', label: 'อุณหภูมิ',      color: '#ef4444', unit: '°C' },
  brightness:  { icon: '☀️', label: 'ความสว่าง',     color: '#3b82f6', unit: 'lx' },
}

export default function DeviceCard({ device }) {
  const [state, setState] = useState(device.state)
  const [busy, setBusy] = useState(false)
  const meta = TYPE_META[device.type] || { icon: '📟', label: device.type, color: '#64748b', unit: '' }

  async function toggle() {
    setBusy(true)
    try {
      const updated = await setDeviceState(device.id, !state)
      setState(updated.state)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <p className="font-medium text-slate-800">{device.name}</p>
            <p className="text-xs text-slate-400">{meta.label}</p>
          </div>
        </div>

        {device.type === 'led' ? (
          // ปุ่มเปิด-ปิดสำหรับ LED
          <button
            onClick={toggle}
            disabled={busy}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
              state ? 'bg-green-500' : 'bg-slate-300'
            } ${busy ? 'opacity-50' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                state ? 'translate-x-7' : ''
              }`}
            />
          </button>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500">
            เซนเซอร์
          </span>
        )}
      </div>

      {/* กราฟ real-time สำหรับเซนเซอร์ */}
      {device.type !== 'led' && (
        <TelemetryChart deviceId={device.id} color={meta.color} unit={meta.unit} />
      )}

      {device.type === 'led' && (
        <p className={`text-sm font-medium ${state ? 'text-green-600' : 'text-slate-400'}`}>
          สถานะ: {state ? 'เปิด' : 'ปิด'}
        </p>
      )}
    </div>
  )
}
