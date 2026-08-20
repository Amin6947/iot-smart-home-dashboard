import { Home, MapPin, Lightbulb } from 'lucide-react'
import DeviceCard from './DeviceCard'

export default function HouseCard({ house }) {
  const activeLights = house.devices.filter((d) => d.type === 'led' && d.state).length

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 sm:p-6">
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-brand-600" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{house.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {house.location}
            </p>
          </div>
        </div>

        {activeLights > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/80 rounded-full px-2.5 py-1">
            <Lightbulb className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
            {activeLights} เปิดอยู่
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {house.devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </section>
  )
}
