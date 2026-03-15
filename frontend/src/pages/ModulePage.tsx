import { useEffect, useMemo, useState } from 'react'
import FilterSidebar from '../components/FilterSidebar'

type ModuleField = {
  key: string
  label: string
}

type ModulePageProps = {
  title: string
  description: string
  listEndpoint: string
  detailEndpointBase: string
  fields: ModuleField[]
  filterKeys: string[]
}

type ApiItem = Record<string, unknown>

function asText(value: unknown): string {
  if (value === null || value === undefined) {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Ano' : 'Ne'
  }

  return String(value)
}

function labelFromKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function ModulePage({
  title,
  description,
  listEndpoint,
  detailEndpointBase,
  fields,
  filterKeys,
}: ModulePageProps) {
  const [items, setItems] = useState<ApiItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedItemDetail, setSelectedItemDetail] = useState<ApiItem | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadList = async () => {
      setLoadingList(true)
      setError(null)

      try {
        const response = await fetch(listEndpoint, { credentials: 'include' })
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = (await response.json()) as ApiItem[]
        setItems(data)

        if (data.length > 0) {
          const firstId = asText(data[0].uuid)
          setSelectedId(firstId)
        } else {
          setSelectedId(null)
        }
      } catch {
        setError('Nepodarilo se nacist data modulu.')
      } finally {
        setLoadingList(false)
      }
    }

    void loadList()
  }, [listEndpoint])

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedId) {
        setSelectedItemDetail(null)
        return
      }

      setLoadingDetail(true)

      try {
        const response = await fetch(`${detailEndpointBase}${selectedId}/`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const detail = (await response.json()) as ApiItem
        setSelectedItemDetail(detail)
      } catch {
        setSelectedItemDetail(null)
      } finally {
        setLoadingDetail(false)
      }
    }

    void loadDetail()
  }, [detailEndpointBase, selectedId])

  const filterSections = useMemo(
    () =>
      filterKeys.map((filterKey) => ({
        title: labelFromKey(filterKey),
        options: Array.from(
          new Set(items.map((item) => asText(item[filterKey])).filter((value) => value !== '-')),
        ).sort((a, b) => a.localeCompare(b, 'cs')),
      })),
    [filterKeys, items],
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return filterKeys.every((filterKey) => {
        const sectionTitle = labelFromKey(filterKey)
        const selectedValues = filters[sectionTitle] ?? []
        if (selectedValues.length === 0) {
          return true
        }

        return selectedValues.includes(asText(item[filterKey]))
      })
    })
  }, [filterKeys, filters, items])

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

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <section className="w-full max-w-[1400px] grid gap-4 xl:grid-cols-[18rem_1fr]">
      <FilterSidebar
        sections={filterSections}
        selectedValues={filters}
        onToggleOption={handleToggleOption}
        onClearAll={handleClearFilters}
      />

      <div className="min-w-0">
        <article className="w-full rounded-xl border border-[var(--light_red)] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-700">{description}</p>

          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_22rem]">
            <div className="overflow-x-auto rounded-md border border-gray-200">
              {loadingList ? (
                <p className="m-0 p-4 text-sm text-gray-600">Nacitam seznam...</p>
              ) : filteredItems.length === 0 ? (
                <p className="m-0 p-4 text-sm text-gray-600">Zadne zaznamy pro zvolene filtry.</p>
              ) : (
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                    <tr>
                      {fields.map((field) => (
                        <th key={field.key} className="px-3 py-2 font-semibold">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const itemId = asText(item.uuid)

                      return (
                        <tr
                          key={itemId}
                          className={`cursor-pointer border-t border-gray-100 hover:bg-red-50/40 ${
                            selectedId === itemId ? 'bg-red-50/80' : ''
                          }`}
                          onClick={() => setSelectedId(itemId)}
                        >
                          {fields.map((field) => (
                            <td key={field.key} className="px-3 py-2 text-gray-800">
                              {asText(item[field.key])}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <aside className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h2 className="m-0 text-base font-semibold text-gray-900">Detail zaznamu</h2>
              {!selectedId ? (
                <p className="mt-2 text-sm text-gray-600">Vyber zaznam ze seznamu.</p>
              ) : loadingDetail ? (
                <p className="mt-2 text-sm text-gray-600">Nacitam detail...</p>
              ) : !selectedItemDetail ? (
                <p className="mt-2 text-sm text-gray-600">Detail se nepodarilo nacist.</p>
              ) : (
                <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
                  {Object.entries(selectedItemDetail).map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="font-semibold text-gray-700">
                        {labelFromKey(key)}
                      </dt>
                      <dd className="m-0 break-all text-gray-900">
                        {asText(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </aside>
          </div>
        </article>
      </div>
    </section>
  )
}
