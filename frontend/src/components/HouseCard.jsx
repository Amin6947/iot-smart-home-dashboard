import DeviceCard from './DeviceCard'

export default function HouseCard({ house }) {
  return (
    <section className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <header className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          🏠 {house.name}
        </h2>
        <p className="text-sm text-slate-500">📍 {house.location}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {house.devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </section>
  )
}
