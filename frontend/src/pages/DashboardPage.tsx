import { useEffect, useState } from 'react'

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
    <section className="w-full max-w-5xl flex flex-col gap-4">
      <div className="rounded-xl border border-[var(--light_red)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-700">Vitej v systemu, {username}. Toto je zakladni prehled.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-lg border border-[var(--light_red)] bg-white p-4">
          <h2 className="m-0 text-sm font-semibold text-gray-600">Aktivni zavody</h2>
          <p className="m-0 mt-1 text-3xl font-bold text-[var(--dark-red-btn)]">{counts.events}</p>
        </article>
        <article className="rounded-lg border border-[var(--light_red)] bg-white p-4">
          <h2 className="m-0 text-sm font-semibold text-gray-600">Registrovane nacini</h2>
          <p className="m-0 mt-1 text-3xl font-bold text-[var(--dark-red-btn)]">{counts.equipments}</p>
        </article>
        <article className="rounded-lg border border-[var(--light_red)] bg-white p-4">
          <h2 className="m-0 text-sm font-semibold text-gray-600">Dnesni mereni</h2>
          <p className="m-0 mt-1 text-3xl font-bold text-[var(--dark-red-btn)]">{counts.measurements}</p>
        </article>
      </div>
    </section>
  )
}
