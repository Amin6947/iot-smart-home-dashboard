import { useState } from 'react'
import { Lightbulb, Thermometer, Sun, Loader2 } from 'lucide-react'
import TelemetryChart from './TelemetryChart'
import { setDeviceState } from '../api'

// การตั้งค่าการแสดงผลตามประเภทอุปกรณ์
const TYPE_META = {
  led: {
    icon: Lightbulb,
    label: 'ไฟ LED',
    color: '#f59e0b',
    unit: '',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
  },
  temperature: {
    icon: Thermometer,
    label: 'อุณหภูมิ',
    color: '#f43f5e',
    unit: '°C',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-600',
  },
  brightness: {
    icon: Sun,
    label: 'ความสว่าง',
    color: '#0ea5e9',
    unit: ' lx',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-600',
  },
}

export default function DeviceCard({ device }) {
  const [state, setState] = useState(device.state)
  const [busy, setBusy] = useState(false)
  const meta = TYPE_META[device.type] || {
    icon: Lightbulb,
    label: device.type,
    color: '#64748b',
    unit: '',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-500',
  }
  const Icon = meta.icon

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
    <div className="bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-200/70 p-4 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg ${meta.badgeBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-[18px] h-[18px] ${meta.badgeText}`} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-slate-800 truncate">{device.name}</p>
            <p className="text-xs text-slate-400">{meta.label}</p>
          </div>
        </div>

        {device.type === 'led' ? (
          <button
            onClick={toggle}
            disabled={busy}
            aria-label={state ? 'ปิดอุปกรณ์' : 'เปิดอุปกรณ์'}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-60 ${
              state ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            {busy ? (
              <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  state ? 'translate-x-5' : ''
                }`}
              />
            )}
          </button>
        ) : (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500 shrink-0">
            เซนเซอร์
          </span>
        )}
      </div>

      {device.type !== 'led' && (
        <TelemetryChart deviceId={device.id} color={meta.color} unit={meta.unit} />
      )}

      {device.type === 'led' && (
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${state ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className={state ? 'text-emerald-600' : 'text-slate-400'}>
            {state ? 'เปิดอยู่' : 'ปิดอยู่'}
          </span>
        </div>
      )}
    </div>
  )
}
