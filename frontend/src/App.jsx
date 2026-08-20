import { useEffect, useState } from 'react'
import { Home, LogOut, AlertCircle, Inbox } from 'lucide-react'
import HouseCard from './components/HouseCard'
import Login from './components/Login'
import { getHouses, getToken, clearToken, AuthError } from './api'

function HouseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken())
  const [houses, setHouses] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function handleExpired() { setLoggedIn(false) }
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  useEffect(() => {
    if (!loggedIn) return

    let active = true
    async function load() {
      try {
        const data = await getHouses()
        if (active) setHouses(data)
      } catch (e) {
        if (!active) return
        if (e instanceof AuthError) {
          setLoggedIn(false)
        } else {
          setError(e.message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [loggedIn])

  function handleLogout() {
    clearToken()
    setLoggedIn(false)
    setHouses([])
  }

  if (!loggedIn) {
    return <Login onLoggedIn={() => { setLoading(true); setLoggedIn(true) }} />
  }

  const deviceCount = houses.reduce((sum, h) => sum + h.devices.length, 0)

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Smart Home Dashboard</h1>
              {!loading && !error && (
                <p className="text-xs text-slate-400 leading-tight">
                  {houses.length} บ้าน &middot; {deviceCount} อุปกรณ์
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {loading && (
          <div className="space-y-6">
            <HouseCardSkeleton />
            <HouseCardSkeleton />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">โหลดข้อมูลไม่สำเร็จ</p>
              <p className="text-sm text-red-600/80 mt-0.5">{error} — ตรวจสอบว่า backend ทำงานอยู่หรือไม่</p>
            </div>
          </div>
        )}

        {!loading && !error && houses.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400">
            <Inbox className="w-10 h-10 mb-3" strokeWidth={1.5} />
            <p className="text-sm">ยังไม่มีข้อมูลบ้าน</p>
          </div>
        )}

        {!loading && houses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </main>
    </div>
  )
}
