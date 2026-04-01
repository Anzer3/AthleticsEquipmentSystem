import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import ActionButton from '../components/ActionButton'
import InfoState from '../components/InfoState'
import { getCsrfToken } from '../utils/csrf'
import { formatValue } from '../utils/presentation'

type EquipmentReturnItem = {
  uuid: string
  equipment_number: string
  athlete_numbers: string[]
  equipment_type: string
  status: string
  location: string | null
  event: string | null
  event_end_time: string | null
}

const STATUS_LABELS: Record<string, string> = {
  registered: 'Registrováno',
  available: 'Dostupné',
  'in use': 'V použití',
  returned: 'Navráceno',
  illegal: 'Nepovolené',
}

const getStatusLabel = (status: string) => STATUS_LABELS[status.trim().toLowerCase()] ?? status

export default function EquipmentReturnPage() {
  const [athleteNumber, setAthleteNumber] = useState('')
  const [items, setItems] = useState<EquipmentReturnItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issuingUuid, setIssuingUuid] = useState<string | null>(null)
  const [showOnlyUnissued, setShowOnlyUnissued] = useState(false)

  const fetchEquipment = async (query: string) => {
    setLoading(true)
    setError(null)

    const trimmed = query.trim()
    const url = trimmed
      ? `/api/equipment/return/?athlete_number=${encodeURIComponent(trimmed)}`
      : '/api/equipment/return/'

    try {
      const response = await fetch(url, { credentials: 'include' })

      if (!response.ok) {
        throw new Error('API error')
      }

      setItems((await response.json()) as EquipmentReturnItem[])
    } catch {
      setItems([])
      setError('Nepodařilo se načíst náčiní.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchEquipment('')
  }, [])

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const filteredItems = useMemo(() => {
    const query = athleteNumber.trim().toLowerCase()

    return items.filter((item) => {
      const athleteMatch = item.athlete_numbers.join(' ').toLowerCase().includes(query)
      const numberMatch = item.equipment_number.toLowerCase().includes(query)
      const typeMatch = item.equipment_type.toLowerCase().includes(query)
      const matchesQuery = !query || athleteMatch || numberMatch || typeMatch
      const isReturned = item.status.trim().toLowerCase() === 'returned'
      const matchesIssued = !showOnlyUnissued || !isReturned

      return matchesQuery && matchesIssued
    })
  }, [athleteNumber, items, showOnlyUnissued])

  const hasQuery = Boolean(athleteNumber.trim())
  const emptyMessage = items.length === 0
    ? 'Zatím není žádné náčiní.'
    : showOnlyUnissued && !hasQuery
      ? 'Žádné nevydané náčiní.'
      : 'Pro zadané číslo nebylo nalezeno žádné náčiní.'

  const handleIssue = async (uuid: string) => {
    setIssuingUuid(uuid)
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch('/api/equipment/return/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ uuid }),
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      const updated = (await response.json()) as EquipmentReturnItem
      setItems((previous) => previous.map((item) => (item.uuid === uuid ? updated : item)))
    } catch {
      setError('Nepodařilo se vydat náčiní.')
    } finally {
      setIssuingUuid(null)
    }
  }

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Výdej náčiní</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">
          Vyhledejte náčiní podle startovního čísla sportovce a potvrďte výdej.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          void handleSearch(event)
        }}
        className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="athlete-number" className="mb-2 block text-sm font-semibold text-gray-900">
              Startovní číslo
            </label>
            <input
              id="athlete-number"
              type="text"
              value={athleteNumber}
              onChange={(event) => setAthleteNumber(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Např. 245"
            />
            <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={showOnlyUnissued}
                onChange={(event) => setShowOnlyUnissued(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-200"
              />
              Zobrazit jen nevydané
            </label>
          </div>
          <ActionButton
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Hledám...' : 'Vyhledat náčiní'}
          </ActionButton>
        </div>
      </form>

      {loading ? <InfoState text="Načítám náčiní..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && filteredItems.length === 0 ? (
        <InfoState text={emptyMessage} />
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const normalizedStatus = item.status.trim().toLowerCase()
            const isReturned = normalizedStatus === 'returned'
            const athleteLabel = item.athlete_numbers.join(', ')
            const locationLabel = item.location || 'Neznámá lokace'

            return (
              <article key={item.uuid} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {item.equipment_type} {item.equipment_number}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">Čísla sportovců: {athleteLabel || 'Neznámá'}</p>
                    <p className="mt-1 text-sm text-gray-600">Lokace: {locationLabel}</p>
                    <p className="mt-1 text-sm text-gray-600">Soutěž: {item.event || 'Bez soutěže'}</p>
                    {item.event_end_time ? (
                      <p className="mt-1 text-sm text-gray-600">Konec soutěže: {formatValue(item.event_end_time)}</p>
                    ) : null}
                    <p className="mt-2 text-xs font-semibold text-gray-500">Stav: {getStatusLabel(item.status)}</p>
                  </div>

                  <ActionButton
                    className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => handleIssue(item.uuid)}
                    disabled={isReturned || issuingUuid === item.uuid}
                  >
                    {issuingUuid === item.uuid ? 'Vydávám...' : isReturned ? 'Vydáno' : 'Vydat'}
                  </ActionButton>
                </div>
              </article>
            )}
          )}
        </div>
      ) : null}
    </div>
  )
}
