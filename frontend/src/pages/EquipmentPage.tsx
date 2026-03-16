import { useEffect, useMemo, useState } from 'react'
import {
  LifebuoyIcon,
  PaperAirplaneIcon,
  ScaleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import EquipmentTile from '../components/EquipmentTile'
import FilterSidebar from '../components/FilterSidebar'
import InfoState from '../components/InfoState'
import ModuleContainer from '../components/ModuleContainer'
import SearchInput from '../components/SearchInput'
import StatTile from '../components/StatTile'

type Equipment = {
  uuid: string
  equipment_number: string
  category: string
  equipment_type: string
  status: string
  measured: boolean
}

type EquipmentPageProps = {
  onNavigateToDetail: (uuid: string) => void
}

export default function EquipmentPage({ onNavigateToDetail }: EquipmentPageProps) {
  const [items, setItems] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    return items.filter((item) => {
      const bySearch = item.equipment_number.toLowerCase().includes(search.toLowerCase())
      const measuredText = item.measured ? 'Ano' : 'Ne'
      const byType = typeFilter.length === 0 || typeFilter.includes(item.equipment_type)
      const byStatus = statusFilter.length === 0 || statusFilter.includes(item.status)
      const byCategory = categoryFilter.length === 0 || categoryFilter.includes(item.category)
      const byMeasured = measuredFilter.length === 0 || measuredFilter.includes(measuredText)

      return bySearch && byType && byStatus && byCategory && byMeasured
    })
  }, [filters, items, search])

  const statusStats = useMemo(() => {
    const countByStatus = new Map<string, number>()
    for (const item of items) {
      countByStatus.set(item.status, (countByStatus.get(item.status) ?? 0) + 1)
    }

    const trackedStatuses = ['Dostupné', 'Na sektoru', 'Neschváleno', 'Navráceno']
    return trackedStatuses.map((statusName) => ({
      name: statusName,
      count: countByStatus.get(statusName) ?? 0,
    }))
  }, [items])

  const getTypeIcon = (equipmentType: string) => {
    const normalized = equipmentType.toLowerCase()

    if (normalized.includes('oštěp') || normalized.includes('ostep')) {
      return PaperAirplaneIcon
    }

    if (normalized.includes('koule')) {
      return ScaleIcon
    }

    if (normalized.includes('disk')) {
      return LifebuoyIcon
    }

    return Squares2X2Icon
  }

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
    <div className="w-full max-w-[1400px] grid gap-4 lg:grid-cols-[17rem_1fr]">
      <FilterSidebar
        sections={sections}
        selectedValues={filters}
        onToggleOption={handleToggleOption}
        onClearAll={() => setFilters({})}
      />

      <ModuleContainer
        title="Náčiní"
        subtitle=""
      >
        <div className="mb-5 grid grid-cols-5 gap-2 md:gap-3">
          <StatTile title="Celkem náčiní" value={items.length} highlighted />

          {statusStats.map((status) => (
            <StatTile key={status.name} title={status.name} value={status.count} />
          ))}
        </div>

        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Hledat podle čísla atleta"
            maxWidthClassName="md:max-w-md"
          />
        </div>

        {loading ? <InfoState text="Načítám seznam náčiní..." /> : null}
        {error ? <InfoState text={error} variant="error" /> : null}

        {!loading && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <EquipmentTile
                key={item.uuid}
                uuid={item.uuid}
                equipmentNumber={item.equipment_number}
                equipmentType={item.equipment_type}
                category={item.category}
                status={item.status}
                measured={item.measured}
                icon={getTypeIcon(item.equipment_type)}
                onOpenDetail={onNavigateToDetail}
              />
            ))}
          </div>
        ) : null}

        {!loading && !error && filteredItems.length === 0 ? (
          <InfoState text="Filtrům neodpovídá žádné náčiní." />
        ) : null}
      </ModuleContainer>
    </div>
  )
}
