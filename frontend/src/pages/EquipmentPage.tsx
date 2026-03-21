import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import ActionButton from '../components/ActionButton'
import EquipmentCard from '../components/EquipmentCard'
import FilterSidebar from '../components/FilterSidebar'
import InfoState from '../components/InfoState'
import SearchInput from '../components/SearchInput'
import StatTile from '../components/StatTile'

type Equipment = {
  uuid: string
  equipment_number: string
  athlete_number?: string
  category: string
  equipment_type: string
  status: string
  measured: boolean
  location?: string
}

const pluralizeType = (type: string): string => {
  const normalized = type.toLowerCase().trim()
  if (normalized === 'disk') return 'Disky'
  if (normalized === 'oštěp') return 'Oštěpy'
  if (normalized === 'koule') return 'Koule'
  if (normalized === 'kladivo') return 'Kladiva'
  if (normalized === 'břemeno') return 'Břemena'
  return type + 'y' // Fallback
}

type EquipmentPageProps = {
  onNavigateToDetail: (uuid: string) => void
  onNavigate: (path: string) => void
}

export default function EquipmentPage({ onNavigateToDetail, onNavigate }: EquipmentPageProps) {
  const [items, setItems] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStatsDetails, setShowStatsDetails] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const equipmentResponse = await fetch('/api/equipment/', { credentials: 'include' })

        if (!equipmentResponse.ok) {
          throw new Error(`API error ${equipmentResponse.status}`)
        }

        setItems((await equipmentResponse.json()) as Equipment[])
      } catch {
        setError('Nepodařilo se načíst náčiní.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const sections = [
    {
      title: 'Změřeno',
      options: ['Ano', 'Ne'],
    },
    {
      title: 'Typ náčiní',
      options: Array.from(new Set(items.map((item) => item.equipment_type))).sort((a, b) =>
        a.localeCompare(b, 'cs'),
      ),
    },
    {
      title: 'Kategorie',
      options: Array.from(new Set(items.map((item) => item.category))).sort((a, b) =>
        a.localeCompare(b, 'cs'),
      ),
    },
    {
      title: 'Stav',
      options: Array.from(new Set(items.map((item) => item.status))).sort((a, b) =>
        a.localeCompare(b, 'cs'),
      ),
    },
  ]

  const filteredItems = useMemo(() => {
    const typeFilter = filters['Typ náčiní'] ?? []
    const statusFilter = filters['Stav'] ?? []
    const categoryFilter = filters['Kategorie'] ?? []
    const measuredFilter = filters['Změřeno'] ?? []

    const filtered = items.filter((item) => {
      const searchLower = search.toLowerCase()
      const bySearch = item.equipment_number.toLowerCase().includes(searchLower) || 
                       (item.athlete_number?.toLowerCase() || '').includes(searchLower)
      const measuredText = item.measured ? 'Ano' : 'Ne'
      const byType = typeFilter.length === 0 || typeFilter.includes(item.equipment_type)
      const byStatus = statusFilter.length === 0 || statusFilter.includes(item.status)
      const byCategory = categoryFilter.length === 0 || categoryFilter.includes(item.category)
      const byMeasured = measuredFilter.length === 0 || measuredFilter.includes(measuredText)

      return bySearch && byType && byStatus && byCategory && byMeasured
    })

    return filtered.sort((a, b) => {
      if (a.measured !== b.measured) {
        return Number(a.measured) - Number(b.measured)
      }

      return a.equipment_number.localeCompare(b.equipment_number, 'cs')
    })
  }, [filters, items, search])

  const statusStats = useMemo(() => {
    const countByStatus = new Map<string, number>()
    const typeByStatus = new Map<string, Record<string, number>>()

    for (const item of items) {
      countByStatus.set(item.status, (countByStatus.get(item.status) ?? 0) + 1)
      
      const pluralType = pluralizeType(item.equipment_type)
      const statusTypeCounts = typeByStatus.get(item.status) || {}
      statusTypeCounts[pluralType] = (statusTypeCounts[pluralType] || 0) + 1
      typeByStatus.set(item.status, statusTypeCounts)
    }

    const trackedStatuses = ['Dostupné', 'Na sektoru', 'Neschváleno', 'Navráceno']
    return trackedStatuses.map((statusName) => {
      const typeCounts = typeByStatus.get(statusName) || {}
      
      return {
        name: statusName,
        count: countByStatus.get(statusName) ?? 0,
        details: Object.entries(typeCounts)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
      }
    })
  }, [items])

  const totalDetails = useMemo(() => {
    const counts = items.reduce((acc, item) => {
      const pluralType = pluralizeType(item.equipment_type)
      acc[pluralType] = (acc[pluralType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [items])

  const handleToggleOption = (sectionTitle: string, option: string) => {
    setFilters((previous) => {
      const selectedValues = previous[sectionTitle] ?? []
      const nextValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option]

      return {
        ...previous,
        [sectionTitle]: nextValues,
      }
    })
  }

  return (
    <div className="w-full max-w-[1400px] grid gap-5 lg:grid-cols-[15rem_1fr]">
      <FilterSidebar
        sections={sections}
        selectedValues={filters}
        onToggleOption={handleToggleOption}
        onClearAll={() => setFilters({})}
      />

      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Náčiní</h1>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3 items-start md:items-stretch">
          <div className="flex-1 grid grid-cols-2 gap-3 md:grid-cols-5 w-full">
            <StatTile title="Celkem" value={items.length} highlighted details={totalDetails} showDetails={showStatsDetails} />

            {statusStats.map((status) => (
              <StatTile key={status.name} title={status.name} value={status.count} details={status.details} showDetails={showStatsDetails} />
            ))}
          </div>
          
          <button
            onClick={() => setShowStatsDetails(!showStatsDetails)}
            className="flex h-full min-h-[3rem] w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-red-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-gray-200 focus:outline-none md:w-12 md:flex-col"
            title={showStatsDetails ? 'Skrýt detaily' : 'Zobrazit detaily'}
          >
            {showStatsDetails ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                <span className="md:hidden">Skrýt detaily</span>
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                <span className="md:hidden">Zobrazit detaily</span>
              </>
            )}
          </button>
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Hledat podle celého čísla sportovce nebo náčiní"
            maxWidthClassName="md:max-w-xl"
          />

          <ActionButton
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 md:self-stretch"
            onClick={() => onNavigate('/new-measurement')}
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            Nové měření
          </ActionButton>
        </div>

        {loading ? <InfoState text="Načítám seznam náčiní..." /> : null}
        {error ? <InfoState text={error} variant="error" /> : null}

        {!loading && !error ? (
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] items-start gap-3 sm:[grid-template-columns:repeat(auto-fill,minmax(210px,1fr))] md:gap-4 lg:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {filteredItems.map((item) => (
              <EquipmentCard
                key={item.uuid}
                uuid={item.uuid}
                equipmentNumber={item.equipment_number}
                athleteNumber={item.athlete_number ?? ''}
                equipmentType={item.equipment_type}
                category={item.category}
                measured={item.measured}
                onOpenDetail={onNavigateToDetail}
                onMeasure={(uuid) => onNavigate(`/new-measurement?equipmentId=${uuid}`)}
              />
            ))}
          </div>
        ) : null}

        {!loading && !error && filteredItems.length === 0 ? (
          <InfoState text="Nenalezeno žádné náčiní." />
        ) : null}
      </section>
    </div>
  )
}
