import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getTelemetry } from '../api'

// กราฟ real-time: ดึงข้อมูล telemetry ของ device ทุก 5 วินาที
export default function TelemetryChart({ deviceId, color = '#2563eb', unit = '' }) {
  const [data, setData] = useState([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const rows = await getTelemetry(deviceId, 20)
        if (!active) return
        setData(
          rows.map((r) => ({
            time: new Date(r.timestamp + 'Z').toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            value: r.value,
          }))
        )
      } catch (e) {
        console.error(e)
      }
    }

    load()
    const id = setInterval(load, 5000) // อัพเดททุก 5 วินาที
    return () => {
      active = false
      clearInterval(id)
    }
  }, [deviceId])

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">ยังไม่มีข้อมูล...</p>
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} unit={unit} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
