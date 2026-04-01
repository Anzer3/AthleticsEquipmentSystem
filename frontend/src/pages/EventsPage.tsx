import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ActionButton from '../components/ActionButton'
import InfoState from '../components/InfoState'
import SearchInput from '../components/SearchInput'
import { formatValue } from '../utils/presentation'
import { getCsrfToken } from '../utils/csrf'

type EventItem = {
  uuid: string
  name: string
  category: string | null
  compatible_equipment_type: string | null
  location: string | null
  start_time: string
  end_time: string
}

type CategoryOption = {
  uuid: string
  name: string
}

type EventTypeOption = {
  uuid: string
  name: string
}

type LocationOption = {
  uuid: string
  name: string
}

type EquipmentTypeOption = {
  uuid: string
  name: string
}

type EventForm = {
  name: string
  category: string
  compatible_equipment_type: string
  location: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
}

const EMPTY_FORM: EventForm = {
  name: '',
  category: '',
  compatible_equipment_type: '',
  location: '',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
}

const EVENT_TYPE_LABELS = ['Vrh koulí', 'Hod diskem', 'Hod kuželkou', 'Hod oštěpem']

const EVENT_TYPE_TO_EQUIPMENT: Record<string, string> = {
  'vrh koulí': 'koule',
  'hod diskem': 'disk',
  'hod kuželkou': 'kuželka',
  'hod oštěpem': 'oštěp',
}

const normalizeLabel = (value: string): string => value.trim().toLowerCase()

const resolveEventTypeLabel = (value: string): string => {
  const normalized = normalizeLabel(value)
  for (const label of EVENT_TYPE_LABELS) {
    if (normalized.includes(normalizeLabel(label))) {
      return label
    }
  }
  return value
}

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [eventTypes, setEventTypes] = useState<EventTypeOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeOption[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterEventType, setFilterEventType] = useState('')
  const [sortOrder, setSortOrder] = useState('start-asc')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [form, setForm] = useState<EventForm>(EMPTY_FORM)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [eventsResponse, categoriesResponse, eventTypesResponse, locationsResponse, equipmentTypesResponse] = await Promise.all([
        fetch('/api/events/', { credentials: 'include' }),
        fetch('/api/events/categories/', { credentials: 'include' }),
        fetch('/api/events/types/', { credentials: 'include' }),
        fetch('/api/events/locations/', { credentials: 'include' }),
        fetch('/api/equipment/types/', { credentials: 'include' }),
      ])

      if (!eventsResponse.ok || !categoriesResponse.ok || !eventTypesResponse.ok || !locationsResponse.ok || !equipmentTypesResponse.ok) {
        throw new Error('API error')
      }

      const [eventsData, categoriesData, eventTypesData, locationsData, equipmentTypesData] = await Promise.all([
        eventsResponse.json() as Promise<EventItem[]>,
        categoriesResponse.json() as Promise<CategoryOption[]>,
        eventTypesResponse.json() as Promise<EventTypeOption[]>,
        locationsResponse.json() as Promise<LocationOption[]>,
        equipmentTypesResponse.json() as Promise<EquipmentTypeOption[]>,
      ])

      setItems(eventsData)
      setCategories(categoriesData)
      setEventTypes(eventTypesData)
      setLocations(locationsData)
      setEquipmentTypes(equipmentTypesData)
    } catch {
      setError('Nepodařilo se načíst data pro správu soutěží.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const categoryById = useMemo(() => {
    return new Map(categories.map((item) => [item.uuid, item.name]))
  }, [categories])

  const locationById = useMemo(() => {
    return new Map(locations.map((item) => [item.uuid, item.name]))
  }, [locations])

  const equipmentTypeById = useMemo(() => {
    return new Map(equipmentTypes.map((item) => [item.uuid, item.name]))
  }, [equipmentTypes])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = items.filter((item) => {
      const matchesCategory = !filterCategory || item.category === filterCategory
      const matchesLocation = !filterLocation || item.location === filterLocation
      const eventLabel = resolveEventTypeLabel(item.name)
      const matchesEventType = !filterEventType || eventLabel === filterEventType

      if (!matchesCategory || !matchesLocation || !matchesEventType) {
        return false
      }

      if (!query) {
        return true
      }

      const categoryName = item.category ? categoryById.get(item.category) ?? '' : ''
      const typeName = item.compatible_equipment_type ? equipmentTypeById.get(item.compatible_equipment_type) ?? '' : ''
      const locationName = item.location ? locationById.get(item.location) ?? '' : ''
      const haystack = [eventLabel, categoryName, typeName, locationName].join(' ').toLowerCase()
      return haystack.includes(query)
    })

    if (sortOrder === 'start-asc' || sortOrder === 'start-desc') {
      return [...filtered].sort((a, b) => {
        const timeA = new Date(a.start_time).getTime()
        const timeB = new Date(b.start_time).getTime()
        if (sortOrder === 'start-desc') {
          return timeB - timeA
        }
        return timeA - timeB
      })
    }

    return filtered
  }, [items, search, filterCategory, filterLocation, filterEventType, sortOrder, categoryById, equipmentTypeById, locationById])

  const resetForm = () => {
    setEditingUuid(null)
    setForm(EMPTY_FORM)
  }

  const toInputDateParts = (value: string): { date: string; time: string } => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return { date: '', time: '' }
    }
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60000)
    return {
      date: localDate.toISOString().slice(0, 10),
      time: localDate.toISOString().slice(11, 16),
    }
  }

  const toBackendDateTime = (date: string, time: string): string => {
    if (!date || !time) {
      return ''
    }
    return new Date(`${date}T${time}`).toISOString()
  }

  const resolveEquipmentTypeUuid = (eventTypeName: string): string => {
    const mappedName = EVENT_TYPE_TO_EQUIPMENT[normalizeLabel(eventTypeName)]
    if (!mappedName) {
      return ''
    }
    const match = equipmentTypes.find((item) => normalizeLabel(item.name) === mappedName)
    return match?.uuid ?? ''
  }

  const handleEdit = (item: EventItem) => {
    const eventLabel = resolveEventTypeLabel(item.name)
    const startParts = toInputDateParts(item.start_time)
    const endParts = toInputDateParts(item.end_time)
    setEditingUuid(item.uuid)
    setForm({
      name: eventLabel,
      category: item.category ?? '',
      compatible_equipment_type: item.compatible_equipment_type ?? resolveEquipmentTypeUuid(eventLabel),
      location: item.location ?? '',
      start_date: startParts.date,
      start_time: startParts.time,
      end_date: endParts.date,
      end_time: endParts.time,
    })
  }

  const handleEventTypeChange = (value: string) => {
    if (!value) {
      setForm((prev) => ({ ...prev, name: '', compatible_equipment_type: '' }))
      return
    }

    const nextEquipmentType = resolveEquipmentTypeUuid(value)

    setForm((prev) => ({
      ...prev,
      name: value,
      compatible_equipment_type: nextEquipmentType || prev.compatible_equipment_type,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !form.name.trim()
      || !form.category
      || !form.compatible_equipment_type
      || !form.location
      || !form.start_date
      || !form.start_time
      || !form.end_date
      || !form.end_time
    ) {
      setError('Typ soutěže, kategorie, kompatibilní typ náčiní, lokace, začátek a konec jsou povinné.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const isEdit = Boolean(editingUuid)
      const response = await fetch(isEdit ? `/api/events/${editingUuid}/` : '/api/events/', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category || null,
          compatible_equipment_type: form.compatible_equipment_type || null,
          location: form.location || null,
          start_time: toBackendDateTime(form.start_date, form.start_time),
          end_time: toBackendDateTime(form.end_date, form.end_time),
        }),
      })

      if (!response.ok) {
        throw new Error('Nepodařilo se uložit soutěž.')
      }

      resetForm()
      await loadData()
    } catch {
      setError('Nepodařilo se uložit soutěž.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (uuid: string) => {
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch(`/api/events/${uuid}/`, {
        method: 'DELETE',
        headers: {
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Nepodařilo se smazat soutěž.')
      }

      if (editingUuid === uuid) {
        resetForm()
      }

      await loadData()
    } catch {
      setError('Nepodařilo se smazat soutěž.')
    }
  }

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Správa soutěží</h1>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Hledat soutěž"
          maxWidthClassName="lg:max-w-sm"
        />
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:items-end">
          <div className="min-w-[12rem]">
            <label htmlFor="event-sort" className="mb-1 block text-xs font-semibold text-gray-600">Řazení</label>
            <select
              id="event-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="start-asc">Od nejdřívější</option>
              <option value="start-desc">Od nejpozdější</option>
            </select>
          </div>
          <div className="min-w-[12rem]">
            <label htmlFor="filter-event-type" className="mb-1 block text-xs font-semibold text-gray-600">Typ soutěže</label>
            <select
              id="filter-event-type"
              value={filterEventType}
              onChange={(event) => setFilterEventType(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Všechny typy</option>
              {eventTypes.map((eventType) => (
                <option key={eventType.uuid} value={eventType.name}>{eventType.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[12rem]">
            <label htmlFor="filter-location" className="mb-1 block text-xs font-semibold text-gray-600">Lokace</label>
            <select
              id="filter-location"
              value={filterLocation}
              onChange={(event) => setFilterLocation(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Všechny lokace</option>
              {locations.map((location) => (
                <option key={location.uuid} value={location.uuid}>{location.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[12rem]">
            <label htmlFor="filter-category" className="mb-1 block text-xs font-semibold text-gray-600">Kategorie</label>
            <select
              id="filter-category"
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Všechny kategorie</option>
              {categories.map((category) => (
                <option key={category.uuid} value={category.uuid}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? <InfoState text="Načítám data soutěží..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{editingUuid ? 'Upravit soutěž' : 'Nová soutěž'}</h2>

          <form
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="event-type" className="mb-2 block text-sm font-semibold text-gray-900">Typ soutěže</label>
              <select
                id="event-type"
                value={form.name}
                onChange={(event) => handleEventTypeChange(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">-- Vyber typ soutěže --</option>
                {eventTypes.map((eventType) => (
                  <option key={eventType.uuid} value={eventType.name}>{eventType.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-category" className="mb-2 block text-sm font-semibold text-gray-900">Kategorie</label>
              <select
                id="event-category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">-- Vyber kategorii --</option>
                {categories.map((category) => (
                  <option key={category.uuid} value={category.uuid}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-compatible-type" className="mb-2 block text-sm font-semibold text-gray-900">Kompatibilní typ náčiní</label>
              <select
                id="event-compatible-type"
                value={form.compatible_equipment_type}
                onChange={(event) => setForm((prev) => ({ ...prev, compatible_equipment_type: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">-- Vyber typ náčiní --</option>
                {equipmentTypes.map((equipmentType) => (
                  <option key={equipmentType.uuid} value={equipmentType.uuid}>{equipmentType.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-location" className="mb-2 block text-sm font-semibold text-gray-900">Lokace</label>
              <select
                id="event-location"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">-- Vyber lokaci --</option>
                {locations.map((location) => (
                  <option key={location.uuid} value={location.uuid}>{location.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="event-start-date" className="mb-2 block text-sm font-semibold text-gray-900">Začátek - datum</label>
                <input
                  id="event-start-date"
                  type="date"
                  value={form.start_date}
                  onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label htmlFor="event-start-time" className="mb-2 block text-sm font-semibold text-gray-900">Začátek - čas</label>
                <input
                  id="event-start-time"
                  type="time"
                  value={form.start_time}
                  onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="event-end-date" className="mb-2 block text-sm font-semibold text-gray-900">Konec - datum</label>
                <input
                  id="event-end-date"
                  type="date"
                  value={form.end_date}
                  onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label htmlFor="event-end-time" className="mb-2 block text-sm font-semibold text-gray-900">Konec - čas</label>
                <input
                  id="event-end-time"
                  type="time"
                  value={form.end_time}
                  onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <ActionButton
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70"
                disabled={saving}
              >
                {saving ? 'Ukládám...' : editingUuid ? 'Uložit' : 'Vytvořit'}
              </ActionButton>

              {editingUuid ? (
                <ActionButton
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  onClick={resetForm}
                >
                  Zrušit
                </ActionButton>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Seznam soutěží</h2>

          {filteredItems.length === 0 ? <InfoState text="Nebyly nalezeny žádné soutěže." /> : null}

          {filteredItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredItems.map((item) => {
                const eventLabel = resolveEventTypeLabel(item.name)
                const typeLabel = item.compatible_equipment_type
                  ? equipmentTypeById.get(item.compatible_equipment_type) ?? item.compatible_equipment_type
                  : 'Bez omezení typu'

                return (
                <article key={item.uuid} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-base font-bold text-gray-900">{eventLabel}</h3>
                  <p className="mt-2 text-sm text-gray-600">Kategorie: {item.category ? categoryById.get(item.category) ?? item.category : 'Bez kategorie'}</p>
                  <p className="text-sm text-gray-600">Kompatibilní typ: {typeLabel}</p>
                  <p className="text-sm text-gray-600">Lokace: {item.location ? locationById.get(item.location) ?? item.location : 'Bez lokace'}</p>
                  <p className="mt-1 text-sm text-gray-600">Start: {formatValue(item.start_time)}</p>
                  <p className="text-sm text-gray-600">Konec: {formatValue(item.end_time)}</p>

                  <div className="mt-3 flex gap-2">
                    <ActionButton
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                      onClick={() => handleEdit(item)}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Upravit
                    </ActionButton>
                    <ActionButton
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                      onClick={() => {
                        void handleDelete(item.uuid)
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                      Smazat
                    </ActionButton>
                  </div>
                </article>
                )
              })}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
