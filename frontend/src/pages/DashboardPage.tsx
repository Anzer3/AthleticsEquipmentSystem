import { useEffect, useState } from 'react'
import { CalendarIcon, Squares2X2Icon, ScaleIcon } from '@heroicons/react/24/outline'

type DashboardPageProps = {
  username: string
}

type CountState = {
  events: number
  equipments: number
  measurements: number
}

export default function DashboardPage({ username }: DashboardPageProps) {
  const [counts, setCounts] = useState<CountState>({
    events: 0,
    equipments: 0,
    measurements: 0,
  })

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [eventsRes, equipmentsRes, measurementsRes] = await Promise.all([
          fetch('/api/events/', { credentials: 'include' }),
          fetch('/api/equipment/', { credentials: 'include' }),
          fetch('/api/measurements/', { credentials: 'include' }),
        ])

        const [events, equipments, measurements] = await Promise.all([
          eventsRes.ok ? ((await eventsRes.json()) as unknown[]) : [],
          equipmentsRes.ok ? ((await equipmentsRes.json()) as unknown[]) : [],
          measurementsRes.ok ? ((await measurementsRes.json()) as unknown[]) : [],
        ])

        setCounts({
          events: events.length,
          equipments: equipments.length,
          measurements: measurements.length,
        })
      } catch {
        setCounts({
          events: 0,
          equipments: 0,
          measurements: 0,
        })
      }
    }

    void loadCounts()
  }, [])

  return (
    <section className="w-full max-w-6xl flex flex-col gap-6 p-4 md:p-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--dark-red-btn)] to-red-800 p-8 shadow-lg text-white">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-white opacity-5 blur-xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black md:text-4xl">Dobrý den, {username}!</h1>
          <p className="mt-3 text-red-100 max-w-xl text-lg">Vítejte v systému pro správu atletického náčiní a soutěží. Zde je váš základní přehled o stavu systému.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Aktivní závody</h2>
              <p className="mt-2 text-4xl font-black text-gray-900">{counts.events}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
              <CalendarIcon className="h-7 w-7" />
            </div>
          </div>
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Registrované náčiní</h2>
              <p className="mt-2 text-4xl font-black text-gray-900">{counts.equipments}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[var(--dark-red-btn)] transition-colors group-hover:bg-red-100">
              <Squares2X2Icon className="h-7 w-7" />
            </div>
          </div>
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Dnešní měření</h2>
              <p className="mt-2 text-4xl font-black text-gray-900">{counts.measurements}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <ScaleIcon className="h-7 w-7" />
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
