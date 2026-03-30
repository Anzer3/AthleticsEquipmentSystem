import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeftIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import ActionButton from '../components/ActionButton'
import InfoState from '../components/InfoState'
import { getCsrfToken } from '../utils/csrf'

type CategoryOption = {
  uuid: string
  name: string
}

type EquipmentTypeOption = {
  uuid: string
  name: string
}

type StatusOption = {
  uuid: string
  name: string
}

type EventOption = {
  uuid: string
  name: string
}

type LocationOption = {
  uuid: string
  name: string
}

type NewEquipmentPageProps = {
  onBack: () => void
  onSuccess: (uuid: string) => void
}

type BackendValidationError = Record<string, string[]>

export default function NewEquipmentPage({ onBack, onSuccess }: NewEquipmentPageProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [types, setTypes] = useState<EquipmentTypeOption[]>([])
  const [statuses, setStatuses] = useState<StatusOption[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [equipmentNumber, setEquipmentNumber] = useState('')
  const [athleteNumber, setAthleteNumber] = useState('')
  const [categoryUuids, setCategoryUuids] = useState<string[]>([])
  const [typeUuid, setTypeUuid] = useState('')
  const [statusUuid, setStatusUuid] = useState('')
  const [eventUuid, setEventUuid] = useState('')
  const [locationUuid, setLocationUuid] = useState('')
  const [measured, setMeasured] = useState(false)
  const [legal, setLegal] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true)
      setError(null)

      try {
        const [categoriesResponse, typesResponse, statusesResponse, eventsResponse, locationsResponse] = await Promise.all([
          fetch('/api/events/categories/', { credentials: 'include' }),
          fetch('/api/equipment/types/', { credentials: 'include' }),
          fetch('/api/equipment/statuses/', { credentials: 'include' }),
          fetch('/api/events/', { credentials: 'include' }),
          fetch('/api/events/locations/', { credentials: 'include' }),
        ])

        if (!categoriesResponse.ok || !typesResponse.ok || !statusesResponse.ok || !eventsResponse.ok || !locationsResponse.ok) {
          throw new Error('API error')
        }

        const [categoriesData, typesData, statusesData, eventsData, locationsData] = await Promise.all([
          categoriesResponse.json() as Promise<CategoryOption[]>,
          typesResponse.json() as Promise<EquipmentTypeOption[]>,
          statusesResponse.json() as Promise<StatusOption[]>,
          eventsResponse.json() as Promise<EventOption[]>,
          locationsResponse.json() as Promise<LocationOption[]>,
        ])

        setCategories(categoriesData)
        setTypes(typesData)
        setStatuses(statusesData)
        setEvents(eventsData)
        setLocations(locationsData)

        const availableStatus = statusesData.find(
          (status) => status.name.trim().toLowerCase() === 'available',
        )

        setStatusUuid(availableStatus?.uuid ?? statusesData[0]?.uuid ?? '')
      } catch {
        setError('Nepodařilo se načíst číselníky pro vytvoření náčiní.')
      } finally {
        setLoadingOptions(false)
      }
    }

    void loadOptions()
  }, [])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    [categories],
  )

  const sortedTypes = useMemo(
    () => [...types].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    [types],
  )

  const sortedStatuses = useMemo(
    () => [...statuses].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    [statuses],
  )

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    [events],
  )

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    [locations],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEquipmentNumber = equipmentNumber.trim()
    const trimmedAthleteNumber = athleteNumber.trim()

    if (!trimmedEquipmentNumber) {
      setError('Vyplňte prosím evidenční číslo náčiní.')
      return
    }

    if (!trimmedAthleteNumber) {
      setError('Vyplňte prosím číslo sportovce.')
      return
    }

    if (!typeUuid) {
      setError('Vyberte prosím typ náčiní.')
      return
    }

    if (categoryUuids.length > 10) {
      setError('Náčiní může mít maximálně 10 kategorií.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch('/api/equipment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          equipment_number: trimmedEquipmentNumber,
          athlete_number: trimmedAthleteNumber,
          category: categoryUuids[0] || null,
          categories: categoryUuids,
          equipment_type: typeUuid,
          status: statusUuid || null,
          event: eventUuid || null,
          location: locationUuid || null,
          measured,
          legal,
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as BackendValidationError | null
        if (data?.equipment_number?.length) {
          throw new Error(data.equipment_number[0])
        }
        throw new Error('Nepodařilo se uložit nové náčiní.')
      }

      const created = (await response.json()) as { uuid: string }
      onSuccess(created.uuid)
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message)
      } else {
        setError('Nepodařilo se uložit nové náčiní.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Nové náčiní</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">Zadejte údaje a vytvořte nové náčiní do evidence</p>
      </div>

      <div className="mb-6">
        <ActionButton
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
          onClick={onBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zpět
        </ActionButton>
      </div>

      {loadingOptions ? <InfoState text="Načítám možnosti formuláře..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loadingOptions ? (
        <form
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
          className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="equipment-number" className="mb-2 block text-sm font-semibold text-gray-900">
                Evidenční číslo náčiní
              </label>
              <input
                id="equipment-number"
                type="text"
                value={equipmentNumber}
                onChange={(event) => setEquipmentNumber(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Např. D-101"
                maxLength={15}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="athlete-number" className="mb-2 block text-sm font-semibold text-gray-900">
                Číslo sportovce
              </label>
              <input
                id="athlete-number"
                type="text"
                value={athleteNumber}
                onChange={(event) => setAthleteNumber(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Např. 245"
                maxLength={15}
                required
              />
            </div>

            <div>
              <label htmlFor="equipment-type" className="mb-2 block text-sm font-semibold text-gray-900">
                Typ náčiní
              </label>
              <select
                id="equipment-type"
                value={typeUuid}
                onChange={(event) => setTypeUuid(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">-- Vyberte typ --</option>
                {sortedTypes.map((type) => (
                  <option key={type.uuid} value={type.uuid}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-semibold text-gray-900">
                Kategorie (max 10)
              </label>
              <select
                id="category"
                value={categoryUuids}
                onChange={(event) => {
                  const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
                  setCategoryUuids(selected.slice(0, 10))
                }}
                multiple
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {sortedCategories.map((category) => (
                  <option key={category.uuid} value={category.uuid}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Pro výběr více kategorií použij Ctrl/Cmd + klik.</p>
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-semibold text-gray-900">
                Stav
              </label>
              <select
                id="status"
                value={statusUuid}
                onChange={(event) => setStatusUuid(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {sortedStatuses.map((status) => (
                  <option key={status.uuid} value={status.uuid}>
                    {status.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Stav je automaticky dopočten podle měření, schválení a vozíku.</p>
            </div>

            <div>
              <label htmlFor="location" className="mb-2 block text-sm font-semibold text-gray-900">
                Lokace
              </label>
              <select
                id="location"
                value={locationUuid}
                onChange={(event) => setLocationUuid(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Bez lokace --</option>
                {sortedLocations.map((locationOption) => (
                  <option key={locationOption.uuid} value={locationOption.uuid}>
                    {locationOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="active-event" className="mb-2 block text-sm font-semibold text-gray-900">
                Aktivní soutěž
              </label>
              <select
                id="active-event"
                value={eventUuid}
                onChange={(event) => setEventUuid(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Bez soutěže --</option>
                {sortedEvents.map((eventOption) => (
                  <option key={eventOption.uuid} value={eventOption.uuid}>
                    {eventOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-800 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={measured}
                  onChange={(event) => setMeasured(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Náčiní je již změřeno
              </label>
            </div>

            <div className="flex items-center">
              <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-800 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={legal}
                  onChange={(event) => setLegal(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Náčiní je schváleno
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <ActionButton
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={saving}
            >
              <PlusCircleIcon className="h-5 w-5" />
              {saving ? 'Ukládám...' : 'Vytvořit náčiní'}
            </ActionButton>
          </div>
        </form>
      ) : null}
    </div>
  )
}