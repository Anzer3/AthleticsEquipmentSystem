import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import InfoState from '../components/InfoState'
import { getCsrfToken } from '../utils/csrf'
import { formatValue } from '../utils/presentation'

type EventItem = {
  uuid: string
  name: string
  start_time: string
  end_time: string
  category: string | null
  column?: number
  assigned_equipment?: number
}

type EquipmentItem = {
  uuid: string
  equipment_number: string
  athlete_number: string
  equipment_type: string
  measured: boolean
}

type Column = {
  id: number
  title: string
}

const COLUMNS: Column[] = [
  { id: 0, title: 'Nadcházející' },
  { id: 1, title: 'Aktuálně odbavované' },
  { id: 2, title: 'Distribuce' },
  { id: 3, title: 'Obslouzeno' },
]

export default function CompletionPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalActionUuid, setModalActionUuid] = useState<string | null>(null)
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>([])
  const [assignedEquipment, setAssignedEquipment] = useState<EquipmentItem[]>([])
  const [equipmentSearch, setEquipmentSearch] = useState('')

  const fetchEvents = async (): Promise<EventItem[]> => {
    const response = await fetch('/api/events/', { credentials: 'include' })
    if (!response.ok) {
      throw new Error(`API error ${response.status}`)
    }

    const data = (await response.json()) as EventItem[]
    return [...data].sort((a, b) => {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })
  }

  const loadEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      setEvents(await fetchEvents())
    } catch {
      setError('Nepodarilo se nacist souteze pro kompletaci.')
    } finally {
      setLoading(false)
    }
  }

  const refreshEventsSilently = async () => {
    try {
      setEvents(await fetchEvents())
    } catch {
      // Keep current view; next refresh can recover.
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  const moveEvent = async (eventUuid: string, direction: -1 | 1) => {
    const target = events.find((item) => item.uuid === eventUuid)
    if (!target) {
      return
    }

    const current = target.column ?? 0
    const next = Math.min(COLUMNS.length - 1, Math.max(0, current + direction))
    if (next === current) {
      return
    }

    setError(null)
    setMoving(eventUuid)

    // Optimistic UI update for smoother movement between columns.
    setEvents((previous) => previous.map((item) => (item.uuid === eventUuid ? { ...item, column: next } : item)))

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch('/api/events/column/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ uuid: eventUuid, column: next }),
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      window.setTimeout(() => {
        void refreshEventsSilently()
      }, 400)
    } catch {
      setEvents((previous) => previous.map((item) => (item.uuid === eventUuid ? { ...item, column: current } : item)))
      setError('Nepodarilo se ulozit novy sloupec soutěže.')
    } finally {
      setMoving(null)
    }
  }

  const loadEventEquipment = async (eventUuid: string) => {
    setModalLoading(true)
    setModalError(null)

    try {
      const response = await fetch(`/api/events/${eventUuid}/equipment/`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      const data = (await response.json()) as {
        available: EquipmentItem[]
        assigned: EquipmentItem[]
      }

      setAvailableEquipment(data.available)
      setAssignedEquipment(data.assigned)
    } catch {
      setModalError('Nepodarilo se nacist nacini pro vybranou soutez.')
    } finally {
      setModalLoading(false)
    }
  }

  const openAssignModal = async (event: EventItem) => {
    setSelectedEvent(event)
    setEquipmentSearch('')
    setAvailableEquipment([])
    setAssignedEquipment([])
    await loadEventEquipment(event.uuid)
  }

  const closeAssignModal = () => {
    setSelectedEvent(null)
    setModalError(null)
    setEquipmentSearch('')
    setModalActionUuid(null)
    setAvailableEquipment([])
    setAssignedEquipment([])
  }

  const assignEquipment = async (eventUuid: string, equipmentUuid: string) => {
    const movingItem = availableEquipment.find((item) => item.uuid === equipmentUuid)
    if (!movingItem || !movingItem.measured) {
      return
    }

    setModalActionUuid(equipmentUuid)
    setModalError(null)

    // Optimistic modal update without full-page reload.
    setAvailableEquipment((previous) => previous.filter((item) => item.uuid !== equipmentUuid))
    setAssignedEquipment((previous) => [movingItem, ...previous])
    setEvents((previous) => previous.map((item) => {
      if (item.uuid !== eventUuid) {
        return item
      }
      return {
        ...item,
        assigned_equipment: (item.assigned_equipment ?? 0) + 1,
      }
    }))

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch('/api/events/equipment-assignment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ equipment: equipmentUuid, event: eventUuid }),
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      window.setTimeout(() => {
        void refreshEventsSilently()
      }, 400)
    } catch {
      setAssignedEquipment((previous) => previous.filter((item) => item.uuid !== equipmentUuid))
      setAvailableEquipment((previous) => [movingItem, ...previous])
      setEvents((previous) => previous.map((item) => {
        if (item.uuid !== eventUuid) {
          return item
        }
        return {
          ...item,
          assigned_equipment: Math.max(0, (item.assigned_equipment ?? 0) - 1),
        }
      }))
      setModalError('Nepodarilo se pridat nacini do souteze.')
    } finally {
      setModalActionUuid(null)
    }
  }

  const unassignEquipment = async (eventUuid: string, equipmentUuid: string) => {
    const movingItem = assignedEquipment.find((item) => item.uuid === equipmentUuid)
    if (!movingItem) {
      return
    }

    setModalActionUuid(equipmentUuid)
    setModalError(null)

    setAssignedEquipment((previous) => previous.filter((item) => item.uuid !== equipmentUuid))
    setAvailableEquipment((previous) => [movingItem, ...previous])
    setEvents((previous) => previous.map((item) => {
      if (item.uuid !== eventUuid) {
        return item
      }
      return {
        ...item,
        assigned_equipment: Math.max(0, (item.assigned_equipment ?? 0) - 1),
      }
    }))

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch('/api/events/equipment-assignment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ equipment: equipmentUuid, event: null }),
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      window.setTimeout(() => {
        void refreshEventsSilently()
      }, 400)
    } catch {
      setAvailableEquipment((previous) => previous.filter((item) => item.uuid !== equipmentUuid))
      setAssignedEquipment((previous) => [movingItem, ...previous])
      setEvents((previous) => previous.map((item) => {
        if (item.uuid !== eventUuid) {
          return item
        }
        return {
          ...item,
          assigned_equipment: (item.assigned_equipment ?? 0) + 1,
        }
      }))
      setModalError('Nepodarilo se odebrat nacini ze souteze.')
    } finally {
      setModalActionUuid(null)
    }
  }

  const filteredAvailableEquipment = useMemo(() => {
    const query = equipmentSearch.trim().toLowerCase()
    if (!query) {
      return availableEquipment
    }

    return availableEquipment.filter((item) => {
      const label = `${item.equipment_type} ${item.equipment_number} ${item.athlete_number}`.toLowerCase()
      return label.includes(query)
    })
  }, [availableEquipment, equipmentSearch])

  const eventsByColumn = useMemo(() => {
    const grouped: Record<number, EventItem[]> = {}
    for (const column of COLUMNS) {
      grouped[column.id] = []
    }

    for (const event of events) {
      const columnId = event.column ?? 0
      if (!grouped[columnId]) {
        grouped[columnId] = []
      }
      grouped[columnId].push(event)
    }

    for (const column of COLUMNS) {
      grouped[column.id].sort((a, b) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      })
    }

    return grouped
  }, [events])

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Kompletace</h1>
      </div>

      {loading ? <InfoState text="Nacitam souteze pro kompletaci..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error ? (
        <section className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2 grid-cols-1">
          {COLUMNS.map((column) => {
            const columnEvents = eventsByColumn[column.id] ?? []

            return (
              <div key={column.id} className="min-h-[calc(100vh-16rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                  <h2 className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">{column.title}</h2>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                    {columnEvents.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnEvents.map((event) => {
                    const currentIndex = event.column ?? 0
                    const canMoveLeft = currentIndex > 0
                    const canMoveRight = currentIndex < COLUMNS.length - 1
                    const isMoving = moving === event.uuid

                    return (
                      <article key={event.uuid} className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-extrabold tracking-tight text-slate-900">{event.name}</h3>
                          <span className="shrink-0 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-800">
                            Náčiní: {event.assigned_equipment ?? 0}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-600">Start: {formatValue(event.start_time)}</p>
                        <p className="text-xs text-slate-600">Konec: {formatValue(event.end_time)}</p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          {canMoveLeft ? (
                            <button
                              type="button"
                              onClick={() => {
                                void moveEvent(event.uuid, -1)
                              }}
                              disabled={isMoving}
                              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Posunout vlevo"
                            >
                              <ArrowLeftIcon className="h-4 w-4" />
                            </button>
                          ) : null}

                          {canMoveRight ? (
                            <button
                              type="button"
                              onClick={() => {
                                void moveEvent(event.uuid, 1)
                              }}
                              disabled={isMoving}
                              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Posunout vpravo"
                            >
                              <ArrowRightIcon className="h-4 w-4" />
                            </button>
                          ) : null}

                          {currentIndex === 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                void openAssignModal(event)
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-100"
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                              Pridat nacini
                            </button>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}

                  {columnEvents.length === 0 ? (
                    <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
                      Zadna soutez v tomto sloupci.
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </section>
      ) : null}

      {selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Prirazeni nacini k soutezi</h2>
                <p className="text-sm text-gray-600">{selectedEvent.name}</p>
              </div>
              <button
                type="button"
                onClick={closeAssignModal}
                className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-700 hover:bg-gray-100"
                aria-label="Zavrit modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <section className="border-b border-gray-100 p-4 md:border-r md:border-b-0">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Kompatibilni nacini (kategorie + typ)</h3>
                <input
                  type="text"
                  value={equipmentSearch}
                  onChange={(event) => setEquipmentSearch(event.target.value)}
                  placeholder="Hledat nacini"
                  className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="max-h-[55vh] space-y-2 overflow-auto pr-1">
                  {filteredAvailableEquipment.map((item) => (
                    <article
                      key={item.uuid}
                      className={[
                        'flex items-center justify-between rounded-md border px-3 py-2',
                        item.measured
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-rose-300 bg-rose-50',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.equipment_type} {item.equipment_number}</p>
                        <p className="text-xs text-gray-600">Atlet: {item.athlete_number || 'Neznamy'}</p>
                        {!item.measured ? (
                          <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-rose-700">Nezměřeno</p>
                        ) : null}
                      </div>

                      {item.measured ? (
                        <button
                          type="button"
                          onClick={() => {
                            void assignEquipment(selectedEvent.uuid, item.uuid)
                          }}
                          disabled={modalActionUuid === item.uuid}
                          className="inline-flex items-center rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Pridat nacini"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </article>
                  ))}

                  {!modalLoading && filteredAvailableEquipment.length === 0 ? (
                    <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
                      Zadne kompatibilni nacini k pridani.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="p-4">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Prirazena nacini pro soutez</h3>
                <div className="max-h-[55vh] space-y-2 overflow-auto pr-1">
                  {assignedEquipment.map((item) => (
                    <article key={item.uuid} className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.equipment_type} {item.equipment_number}</p>
                        <p className="text-xs text-gray-600">Atlet: {item.athlete_number || 'Neznamy'}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void unassignEquipment(selectedEvent.uuid, item.uuid)
                        }}
                        disabled={modalActionUuid === item.uuid}
                        className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Odebrat nacini"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </article>
                  ))}

                  {!modalLoading && assignedEquipment.length === 0 ? (
                    <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
                      Zatim neni prirazene zadne nacini.
                    </p>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="border-t border-gray-100 px-5 py-3">
              {modalLoading ? <InfoState text="Nacitam nacini pro vybranou soutez..." /> : null}
              {modalError ? <InfoState text={modalError} variant="error" /> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
