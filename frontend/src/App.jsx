import { useEffect, useState } from 'react'
import HouseCard from './components/HouseCard'
import Login from './components/Login'
import { getHouses, getToken, clearToken, AuthError } from './api'

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

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">
            🏡 Smart Home Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">อัพเดทกราฟทุก 5 วินาที</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 border border-slate-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {loading && <p className="text-slate-500">กำลังโหลด...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
            ⚠️ {error} — ตรวจสอบว่า backend ทำงานอยู่หรือไม่
          </div>
        )}
        {!loading && !error && houses.length === 0 && (
          <p className="text-slate-500">ยังไม่มีข้อมูลบ้าน</p>
        )}
        {houses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </main>
    </div>
  )
}
