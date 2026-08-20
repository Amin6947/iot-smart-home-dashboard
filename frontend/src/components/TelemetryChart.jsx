import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getTelemetry } from '../api'

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg">
      <span className="font-semibold">{payload[0].value}{unit}</span>
      <span className="text-slate-300 ml-1">{payload[0].payload.time}</span>
    </div>
  )
}

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
    return (
      <div className="h-40 flex items-center justify-center">
        <p className="text-xs text-slate-400">รอข้อมูลจากเซนเซอร์...</p>
      </div>
    )
  }

  const latest = data[data.length - 1].value
  const gradientId = `grad-${deviceId}`

  return (
    <div>
      <p className="text-2xl font-bold text-slate-800 mb-1 tabular-nums">
        {latest}<span className="text-sm font-medium text-slate-400">{unit}</span>
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
