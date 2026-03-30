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
  status: string | null
  location: string | null
  start_time: string
  end_time: string
}

type CategoryOption = {
  uuid: string
  name: string
}

type EventStatusOption = {
  uuid: string
  display_text: string
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
  status: string
  location: string
  start_time: string
  end_time: string
}

const EMPTY_FORM: EventForm = {
  name: '',
  category: '',
  compatible_equipment_type: '',
  status: '',
  location: '',
  start_time: '',
  end_time: '',
}

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [statuses, setStatuses] = useState<EventStatusOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeOption[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [form, setForm] = useState<EventForm>(EMPTY_FORM)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [eventsResponse, categoriesResponse, statusesResponse, locationsResponse, equipmentTypesResponse] = await Promise.all([
        fetch('/api/events/', { credentials: 'include' }),
        fetch('/api/events/categories/', { credentials: 'include' }),
        fetch('/api/events/statuses/', { credentials: 'include' }),
        fetch('/api/events/locations/', { credentials: 'include' }),
        fetch('/api/equipment/types/', { credentials: 'include' }),
      ])

      if (!eventsResponse.ok || !categoriesResponse.ok || !statusesResponse.ok || !locationsResponse.ok || !equipmentTypesResponse.ok) {
        throw new Error('API error')
      }

      const [eventsData, categoriesData, statusesData, locationsData, equipmentTypesData] = await Promise.all([
        eventsResponse.json() as Promise<EventItem[]>,
        categoriesResponse.json() as Promise<CategoryOption[]>,
        statusesResponse.json() as Promise<EventStatusOption[]>,
        locationsResponse.json() as Promise<LocationOption[]>,
        equipmentTypesResponse.json() as Promise<EquipmentTypeOption[]>,
      ])

      setItems(eventsData)
      setCategories(categoriesData)
      setStatuses(statusesData)
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

  const statusById = useMemo(() => {
    return new Map(statuses.map((item) => [item.uuid, item.display_text]))
  }, [statuses])

  const locationById = useMemo(() => {
    return new Map(locations.map((item) => [item.uuid, item.name]))
  }, [locations])

  const equipmentTypeById = useMemo(() => {
    return new Map(equipmentTypes.map((item) => [item.uuid, item.name]))
  }, [equipmentTypes])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((item) => {
      const categoryName = item.category ? categoryById.get(item.category) ?? '' : ''
      const typeName = item.compatible_equipment_type ? equipmentTypeById.get(item.compatible_equipment_type) ?? '' : ''
      const statusName = item.status ? statusById.get(item.status) ?? '' : ''
      const locationName = item.location ? locationById.get(item.location) ?? '' : ''
      const haystack = [item.name, categoryName, typeName, statusName, locationName].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [items, search, categoryById, equipmentTypeById, statusById, locationById])

  const resetForm = () => {
    setEditingUuid(null)
    setForm(EMPTY_FORM)
  }

  const toInputDateTime = (value: string): string => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  const toBackendDateTime = (value: string): string => {
    return value ? new Date(value).toISOString() : ''
  }

  const handleEdit = (item: EventItem) => {
    setEditingUuid(item.uuid)
    setForm({
      name: item.name,
      category: item.category ?? '',
      compatible_equipment_type: item.compatible_equipment_type ?? '',
      status: item.status ?? '',
      location: item.location ?? '',
      start_time: toInputDateTime(item.start_time),
      end_time: toInputDateTime(item.end_time),
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim() || !form.start_time || !form.end_time) {
      setError('Název, začátek a konec soutěže jsou povinné.')
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
          status: form.status || null,
          location: form.location || null,
          start_time: toBackendDateTime(form.start_time),
          end_time: toBackendDateTime(form.end_time),
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
        <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">MVP správa: vytvoření, úprava a smazání soutěží.</p>
      </div>

      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Hledat soutěž"
          maxWidthClassName="md:max-w-md"
        />
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
              <label htmlFor="event-name" className="mb-2 block text-sm font-semibold text-gray-900">Název</label>
              <input
                id="event-name"
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label htmlFor="event-category" className="mb-2 block text-sm font-semibold text-gray-900">Kategorie</label>
              <select
                id="event-category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Bez kategorie --</option>
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
              >
                <option value="">-- Bez omezení typu --</option>
                {equipmentTypes.map((equipmentType) => (
                  <option key={equipmentType.uuid} value={equipmentType.uuid}>{equipmentType.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-status" className="mb-2 block text-sm font-semibold text-gray-900">Stav</label>
              <select
                id="event-status"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Bez stavu --</option>
                {statuses.map((status) => (
                  <option key={status.uuid} value={status.uuid}>{status.display_text}</option>
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
              >
                <option value="">-- Bez lokace --</option>
                {locations.map((location) => (
                  <option key={location.uuid} value={location.uuid}>{location.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="event-start" className="mb-2 block text-sm font-semibold text-gray-900">Začátek</label>
              <input
                id="event-start"
                type="datetime-local"
                value={form.start_time}
                onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label htmlFor="event-end" className="mb-2 block text-sm font-semibold text-gray-900">Konec</label>
              <input
                id="event-end"
                type="datetime-local"
                value={form.end_time}
                onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
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
                const typeLabel = item.compatible_equipment_type
                  ? equipmentTypeById.get(item.compatible_equipment_type) ?? item.compatible_equipment_type
                  : 'Bez omezení typu'

                return (
                <article key={item.uuid} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">Kategorie: {item.category ? categoryById.get(item.category) ?? item.category : 'Bez kategorie'}</p>
                  <p className="text-sm text-gray-600">Kompatibilní typ: {typeLabel}</p>
                  <p className="text-sm text-gray-600">Stav: {item.status ? statusById.get(item.status) ?? item.status : 'Bez stavu'}</p>
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
