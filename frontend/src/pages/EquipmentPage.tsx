import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArchiveBoxIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import ActionButton from '../components/ActionButton'
import EquipmentCard from '../components/EquipmentCard'
import InfoState from '../components/InfoState'
import SearchInput from '../components/SearchInput'

type Equipment = {
  uuid: string
  equipment_number: string
  athlete_numbers: string[]
  category: string
  equipment_type: string
  status: string
  event: string
  location: string
  measured: boolean
  legal: boolean
}


type EquipmentPageProps = {
  onNavigateToDetail: (uuid: string) => void
  onNavigate: (path: string) => void
}

const ISSUED_STATUS_NAME = 'returned'
const STATUS_LABELS: Record<string, string> = {
  REGISTERED: 'Registrováno',
  AVAILABLE: 'Dostupné',
  'IN USE': 'Používá se',
  RETURNED: 'Navráceno',
  ILLEGAL: 'Nepovolené',
}
const STATUS_LEGEND = [
  { status: 'REGISTERED', colorClass: 'bg-red-600' },
  { status: 'AVAILABLE', colorClass: 'bg-green-500' },
  { status: 'IN USE', colorClass: 'bg-blue-500' },
  { status: 'RETURNED', colorClass: 'bg-gray-400' },
  { status: 'ILLEGAL', colorClass: 'bg-black' },
]

const getStatusLabel = (status: string) => STATUS_LABELS[status.trim().toUpperCase()] ?? status

export default function EquipmentPage({ onNavigateToDetail, onNavigate }: EquipmentPageProps) {
  const [items, setItems] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReturned, setShowReturned] = useState(false)
  const [filterMeasured, setFilterMeasured] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const loadEquipment = useCallback(async (showLoader: boolean) => {
    if (showLoader) {
      setLoading(true)
      setError(null)
    }

    try {
      const equipmentResponse = await fetch('/api/equipment/', { credentials: 'include' })

      if (!equipmentResponse.ok) {
        throw new Error(`API error ${equipmentResponse.status}`)
      }

      setItems((await equipmentResponse.json()) as Equipment[])
    } catch {
      if (showLoader) {
        setError('Nepodařilo se načíst náčiní.')
      }
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadEquipment(true)
  }, [loadEquipment])

  useEffect(() => {
    const source = new EventSource('/api/equipment/stream/', { withCredentials: true })

    source.onmessage = (event) => {
      if (!event.data) {
        return
      }

      let payload: { type?: string; equipment?: Equipment | Equipment[]; uuid?: string }
      try {
        payload = JSON.parse(event.data) as { type?: string; equipment?: Equipment | Equipment[]; uuid?: string }
      } catch {
        return
      }

      if (payload.type === 'equipment_delete' && payload.uuid) {
        setItems((previous) => previous.filter((item) => item.uuid !== payload.uuid))
        return
      }

      if (payload.type === 'equipment_bulk_upsert') {
        const batch = Array.isArray(payload.equipment) ? payload.equipment : []
        if (batch.length === 0) {
          return
        }

        setItems((previous) => {
          const next = [...previous]
          const indexById = new Map(next.map((item, index) => [item.uuid, index]))
          const additions: Equipment[] = []

          for (const equipment of batch) {
            const index = indexById.get(equipment.uuid)
            if (index === undefined) {
              additions.push(equipment)
            } else {
              next[index] = equipment
            }
          }

          return additions.length ? [...additions, ...next] : next
        })
        return
      }

      if (payload.type === 'equipment_upsert') {
        const equipment = payload.equipment
        if (!equipment || Array.isArray(equipment)) {
          return
        }

        setItems((previous) => {
          const index = previous.findIndex((item) => item.uuid === equipment.uuid)
          if (index === -1) {
            return [equipment, ...previous]
          }

          const next = [...previous]
          next[index] = equipment
          return next
        })
      }
    }

    return () => source.close()
  }, [loadEquipment])

  const typeOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.equipment_type))).sort((a, b) => a.localeCompare(b, 'cs')),
    [items],
  )
  const categoryOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'cs')),
    [items],
  )
  const statusOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.status))).sort((a, b) => a.localeCompare(b, 'cs')),
    [items],
  )

  const filteredItems = useMemo(() => {
    const showReturnedEquipment = showReturned

    const filtered = items.filter((item) => {
      const searchLower = search.toLowerCase()
      const athleteSearch = item.athlete_numbers.join(' ').toLowerCase()
      const bySearch = item.equipment_number.toLowerCase().includes(searchLower)
        || athleteSearch.includes(searchLower)
      const normalizedStatus = item.status.trim().toLowerCase()
      const isIssued = normalizedStatus === ISSUED_STATUS_NAME
      const measuredText = item.measured ? 'Ano' : 'Ne'
      const byType = !filterType || filterType === item.equipment_type
      const byStatus = !filterStatus || filterStatus === item.status
      const byCategory = !filterCategory || filterCategory === item.category
      const byMeasured = !filterMeasured || filterMeasured === measuredText
      const byIssued = showReturnedEquipment || !isIssued

      return bySearch && byType && byStatus && byCategory && byMeasured && byIssued
    })

    return filtered.sort((a, b) => {
      if (a.measured !== b.measured) {
        return Number(a.measured) - Number(b.measured)
      }

      return a.equipment_number.localeCompare(b.equipment_number, 'cs')
    })
  }, [
    filterCategory,
    showReturned,
    filterMeasured,
    filterStatus,
    filterType,
    items,
    search,
  ])

  const groupedItems = useMemo(() => {
    const groups = new Map<string, Equipment[]>()

    for (const item of filteredItems) {
      const group = groups.get(item.equipment_type)
      if (group) {
        group.push(item)
      } else {
        groups.set(item.equipment_type, [item])
      }
    }

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'cs'))
  }, [filteredItems])

  const resetFilters = () => {
    setShowReturned(false)
    setFilterMeasured('')
    setFilterType('')
    setFilterCategory('')
    setFilterStatus('')
  }

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Náčiní</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600">
          {STATUS_LEGEND.map((item) => (
            <span key={item.status} className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.colorClass}`} aria-hidden="true" />
              {getStatusLabel(item.status)}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Hledat podle celého čísla sportovce nebo náčiní"
            maxWidthClassName="lg:max-w-sm"
          />

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ActionButton
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-700 border border-red-200 transition-colors hover:bg-red-50"
              onClick={() => onNavigate('/new-equipment')}
            >
              <ArchiveBoxIcon className="h-4 w-4" />
              Nové náčiní
            </ActionButton>

            <ActionButton
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
              onClick={() => onNavigate('/new-measurement')}
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              Nové měření
            </ActionButton>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:items-end">
            <div className="min-w-[12rem]">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Navrácená</span>
              <label htmlFor="filter-returned" className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  id="filter-returned"
                  type="checkbox"
                  checked={showReturned}
                  onChange={(event) => setShowReturned(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                Zobrazit navrácené
              </label>
            </div>
            <div className="min-w-[12rem]">
              <label htmlFor="filter-measured" className="mb-1 block text-xs font-semibold text-gray-600">Změřeno</label>
              <select
                id="filter-measured"
                value={filterMeasured}
                onChange={(event) => setFilterMeasured(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Vše</option>
                <option value="Ano">Ano</option>
                <option value="Ne">Ne</option>
              </select>
            </div>
            <div className="min-w-[12rem]">
              <label htmlFor="filter-status" className="mb-1 block text-xs font-semibold text-gray-600">Stav</label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Všechny stavy</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{getStatusLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[12rem]">
              <label htmlFor="filter-type" className="mb-1 block text-xs font-semibold text-gray-600">Typ náčiní</label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Všechny typy</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
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
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <ActionButton
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 lg:self-end"
            onClick={resetFilters}
          >
            Reset filtrů
          </ActionButton>
        </div>
      </div>

      {loading ? <InfoState text="Načítám seznam náčiní..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error && groupedItems.length > 0 ? (
        <div className="space-y-5">
          {groupedItems.map(([type, group]) => (
            <section key={type} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{type}</h2>
                <span className="text-xs font-semibold text-gray-500">{group.length} ks</span>
              </div>
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] items-start gap-3 sm:[grid-template-columns:repeat(auto-fill,minmax(210px,1fr))] md:gap-4 lg:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                {group.map((item) => (
                  <EquipmentCard
                    key={item.uuid}
                    uuid={item.uuid}
                    equipmentNumber={item.equipment_number}
                    athleteNumbers={item.athlete_numbers.join(', ')}
                    equipmentType={item.equipment_type}
                    category={item.category}
                    location={item.location}
                    measured={item.measured}
                    status={item.status}
                    onOpenDetail={onNavigateToDetail}
                    onMeasure={(uuid) => onNavigate(`/new-measurement?equipmentId=${uuid}`)}
                    onNavigateToLocation={() => onNavigate('/locations')}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {!loading && !error && filteredItems.length === 0 ? (
        <InfoState text="Nenalezeno žádné náčiní." />
      ) : null}
    </div>
  )
}
