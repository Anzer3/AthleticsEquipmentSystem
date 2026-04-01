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
  equipment_distributed?: boolean
  equipment_unloaded?: boolean
}

type CategoryOption = {
  uuid: string
  name: string
}

type EquipmentItem = {
  uuid: string
  equipment_number: string
  athlete_numbers: string[]
  equipment_type: string
  legal: boolean
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
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalActionUuid, setModalActionUuid] = useState<string | null>(null)
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>([])
  const [assignedEquipment, setAssignedEquipment] = useState<EquipmentItem[]>([])
  const [assignedByEvent, setAssignedByEvent] = useState<Record<string, EquipmentItem[]>>({})
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [confirmResetEvent, setConfirmResetEvent] = useState<EventItem | null>(null)
  const [pendingMove, setPendingMove] = useState<{ uuid: string; next: number; current: number } | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [distributionUpdating, setDistributionUpdating] = useState<string | null>(null)
  const [unloadingEventUuid, setUnloadingEventUuid] = useState<string | null>(null)

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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/events/categories/', { credentials: 'include' })
        if (!response.ok) {
          return
        }
        setCategories((await response.json()) as CategoryOption[])
      } catch {
        // Ignore categories load failures.
      }
    }

    void loadCategories()
  }, [])

  const categoryById = useMemo(() => {
    return new Map(categories.map((item) => [item.uuid, item.name]))
  }, [categories])

  useEffect(() => {
    let cancelled = false
    const activeEvents = events.filter((event) => {
      const column = event.column ?? 0
      return column === 1 || column === 2 || column === 3
    })
    if (activeEvents.length === 0) {
      setAssignedByEvent((previous) => (Object.keys(previous).length ? {} : previous))
      return () => {
        cancelled = true
      }
    }

    const loadAssigned = async () => {
      const results = await Promise.all(
        activeEvents.map(async (event) => {
          try {
            const response = await fetch(`/api/events/${event.uuid}/equipment/`, { credentials: 'include' })
            if (!response.ok) {
              return { uuid: event.uuid, assigned: [] as EquipmentItem[] }
            }
            const data = (await response.json()) as { assigned: EquipmentItem[] }
            return { uuid: event.uuid, assigned: data.assigned }
          } catch {
            return { uuid: event.uuid, assigned: [] as EquipmentItem[] }
          }
        })
      )

      if (cancelled) {
        return
      }

      const next: Record<string, EquipmentItem[]> = {}
      for (const result of results) {
        next[result.uuid] = result.assigned
      }
      setAssignedByEvent(next)
    }

    void loadAssigned()

    return () => {
      cancelled = true
    }
  }, [events])

  const toggleDistribution = async (event: EventItem) => {
    if (!event.uuid) {
      return
    }

    const nextDistributed = !event.equipment_distributed
    setDistributionUpdating(event.uuid)
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch(`/api/events/${event.uuid}/distribution/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ distributed: nextDistributed }),
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      setEvents((previous) => previous.map((item) => (
        item.uuid === event.uuid
          ? { ...item, equipment_distributed: nextDistributed }
          : item
      )))
    } catch {
      setError('Nepodarilo se zmenit stav distribuce.')
    } finally {
      setDistributionUpdating(null)
    }
  }

  const unloadEvent = async (event: EventItem) => {
    if (!event.uuid) {
      return
    }

    setUnloadingEventUuid(event.uuid)
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch(`/api/events/${event.uuid}/unload/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      setEvents((previous) => previous.map((item) => (
        item.uuid === event.uuid
          ? { ...item, equipment_unloaded: true, assigned_equipment: 0 }
          : item
      )))
      setAssignedByEvent((previous) => ({ ...previous, [event.uuid]: [] }))
    } catch {
      setError('Nepodarilo se vylozit nacini.')
    } finally {
      setUnloadingEventUuid(null)
    }
  }

  const performMove = async (eventUuid: string, next: number, current: number) => {
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

  const moveEvent = async (eventUuid: string, direction: -1 | 1) => {
    const target = events.find((item) => item.uuid === eventUuid)
    if (!target) {
      return
    }

    if (target.equipment_distributed || target.equipment_unloaded) {
      return
    }

    const current = target.column ?? 0
    const next = Math.min(COLUMNS.length - 1, Math.max(0, current + direction))
    if (next === current) {
      return
    }

    if (next === 0 && (target.assigned_equipment ?? 0) > 0) {
      setPendingMove({ uuid: eventUuid, next, current })
      setConfirmResetEvent(target)
      return
    }

    await performMove(eventUuid, next, current)
  }

  const handleConfirmReset = async () => {
    if (!pendingMove || !confirmResetEvent) {
      return
    }

    setConfirmingReset(true)
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch(`/api/events/${pendingMove.uuid}/clear-equipment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      setEvents((previous) => previous.map((item) => (
        item.uuid === pendingMove.uuid
          ? { ...item, assigned_equipment: 0 }
          : item
      )))
      setAssignedByEvent((previous) => ({ ...previous, [pendingMove.uuid]: [] }))

      await performMove(pendingMove.uuid, pendingMove.next, pendingMove.current)
      setConfirmResetEvent(null)
      setPendingMove(null)
    } catch {
      setError('Nepodarilo se odebrat nacini ze souteze.')
    } finally {
      setConfirmingReset(false)
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
      setAssignedByEvent((previous) => ({ ...previous, [eventUuid]: data.assigned }))
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
    if (!movingItem || !movingItem.legal) {
      return
    }

    setModalActionUuid(equipmentUuid)
    setModalError(null)

    // Optimistic modal update without full-page reload.
    setAvailableEquipment((previous) => previous.filter((item) => item.uuid !== equipmentUuid))
    setAssignedEquipment((previous) => [movingItem, ...previous])
    setAssignedByEvent((previous) => {
      const current = previous[eventUuid] ?? assignedEquipment
      return { ...previous, [eventUuid]: [movingItem, ...current] }
    })
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
        body: JSON.stringify({ equipment: equipmentUuid, event: eventUuid, status: 'IN USE' }),
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
      setAssignedByEvent((previous) => {
        const current = previous[eventUuid] ?? []
        return { ...previous, [eventUuid]: current.filter((item) => item.uuid !== equipmentUuid) }
      })
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
    setAssignedByEvent((previous) => {
      const current = previous[eventUuid] ?? assignedEquipment
      return { ...previous, [eventUuid]: current.filter((item) => item.uuid !== equipmentUuid) }
    })
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
      setAssignedByEvent((previous) => {
        const current = previous[eventUuid] ?? []
        return { ...previous, [eventUuid]: [movingItem, ...current] }
      })
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
      const athleteLabel = item.athlete_numbers.join(', ')
      const label = `${item.equipment_type} ${item.equipment_number} ${athleteLabel}`.toLowerCase()
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
                    const isLocked = Boolean(event.equipment_distributed || event.equipment_unloaded)
                    const isUnloaded = Boolean(event.equipment_unloaded)
                    const assignedList = assignedByEvent[event.uuid]
                    const showAssignedSection = currentIndex === 1 || currentIndex === 2 || currentIndex === 3
                    const showAssignedLoading =
                      showAssignedSection
                      && assignedList === undefined
                      && (event.assigned_equipment ?? 0) > 0
                    const cardClassName = [
                      'rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition',
                      isUnloaded ? 'opacity-60 grayscale' : 'hover:shadow-md',
                    ].join(' ')

                    return (
                      <article key={event.uuid} className={cardClassName}>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-extrabold tracking-tight text-slate-900">
                            {event.name} · {event.category ? categoryById.get(event.category) ?? event.category : 'Bez kategorie'}
                          </h3>
                          <span className="shrink-0 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-800">
                            Náčiní: {event.assigned_equipment ?? 0}
                          </span>
                        </div>
                        {event.equipment_distributed ? (
                          <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                            Odvezeno
                          </span>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-600">Start: {formatValue(event.start_time)}</p>
                        <p className="text-xs text-slate-600">Konec: {formatValue(event.end_time)}</p>

                        {showAssignedSection ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-700">Přiřazená náčiní</p>
                            {showAssignedLoading ? (
                              <p className="mt-1 text-xs text-slate-500">Načítám...</p>
                            ) : assignedList && assignedList.length > 0 ? (
                              <ul className="mt-1 space-y-1 text-xs text-slate-600">
                                {assignedList.map((item) => (
                                  <li key={item.uuid} className="truncate">
                                    {item.equipment_type} {item.equipment_number}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-1 text-xs text-slate-500">Zatím žádné náčiní.</p>
                            )}
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-center justify-between gap-2">
                          {canMoveLeft ? (
                            <button
                              type="button"
                              onClick={() => {
                                void moveEvent(event.uuid, -1)
                              }}
                              disabled={isMoving || isLocked}
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
                              disabled={isMoving || isLocked}
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

                          {currentIndex === 2 ? (
                            <button
                              type="button"
                              onClick={() => {
                                void toggleDistribution(event)
                              }}
                              disabled={distributionUpdating === event.uuid}
                              className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {event.equipment_distributed ? 'Přivezeno' : 'Odvézt'}
                            </button>
                          ) : null}

                          {currentIndex === 3 && !event.equipment_unloaded ? (
                            <button
                              type="button"
                              onClick={() => {
                                void unloadEvent(event)
                              }}
                              disabled={unloadingEventUuid === event.uuid}
                              className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Vyložit
                            </button>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
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
                        item.legal
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-rose-300 bg-rose-50',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.equipment_type} {item.equipment_number}</p>
                        <p className="text-xs text-gray-600">Atlet: {item.athlete_numbers.join(', ') || 'Neznamy'}</p>
                        {!item.legal ? (
                          <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-rose-700">Neschváleno</p>
                        ) : null}
                      </div>

                      {item.legal ? (
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
                        <p className="text-xs text-gray-600">Atlet: {item.athlete_numbers.join(', ') || 'Neznamy'}</p>
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

      {confirmResetEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Vrácení soutěže</h2>
            <p className="mt-2 text-sm text-gray-700">
              Pro tuto soutěž již byla přiřazena náčiní. Přesunutím do sloupce nadcházející
              budou aktuální náčiní ze soutěže odebrána.
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-800">
              {confirmResetEvent.name}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setConfirmResetEvent(null)
                  setPendingMove(null)
                }}
                disabled={confirmingReset}
              >
                Zrušit
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-70"
                onClick={() => {
                  void handleConfirmReset()
                }}
                disabled={confirmingReset}
              >
                Provést vrácení
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
