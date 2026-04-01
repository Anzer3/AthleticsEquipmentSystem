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

type NewEquipmentPageProps = {
  onBack: () => void
  onSuccess: (uuid: string) => void
}

type BackendValidationError = Record<string, string[]>

export default function NewEquipmentPage({ onBack, onSuccess }: NewEquipmentPageProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [types, setTypes] = useState<EquipmentTypeOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [equipmentNumber, setEquipmentNumber] = useState('')
  const [athleteNumbers, setAthleteNumbers] = useState<string[]>([''])
  const [categoryUuids, setCategoryUuids] = useState<string[]>([''])
  const [typeUuid, setTypeUuid] = useState('')
  const [equipmentNumberLoading, setEquipmentNumberLoading] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true)
      setError(null)

      try {
        const [categoriesResponse, typesResponse] = await Promise.all([
          fetch('/api/events/categories/', { credentials: 'include' }),
          fetch('/api/equipment/types/', { credentials: 'include' }),
        ])

        if (!categoriesResponse.ok || !typesResponse.ok) {
          throw new Error('API error')
        }

        const [categoriesData, typesData] = await Promise.all([
          categoriesResponse.json() as Promise<CategoryOption[]>,
          typesResponse.json() as Promise<EquipmentTypeOption[]>,
        ])

        setCategories(categoriesData)
        setTypes(typesData)
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

  useEffect(() => {
    if (!typeUuid) {
      setEquipmentNumber('')
      setEquipmentNumberLoading(false)
      return
    }

    let cancelled = false

    const loadNextNumber = async () => {
      setEquipmentNumber('')
      setEquipmentNumberLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/equipment/next-number/?equipment_type=${encodeURIComponent(typeUuid)}`,
          { credentials: 'include' },
        )

        if (!response.ok) {
          throw new Error('API error')
        }

        const data = (await response.json()) as { equipment_number?: string }
        if (!cancelled) {
          setEquipmentNumber(data.equipment_number ?? '')
        }
      } catch {
        if (!cancelled) {
          setEquipmentNumber('')
          setError('Nepodařilo se načíst evidenční číslo náčiní.')
        }
      } finally {
        if (!cancelled) {
          setEquipmentNumberLoading(false)
        }
      }
    }

    void loadNextNumber()

    return () => {
      cancelled = true
    }
  }, [typeUuid])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEquipmentNumber = equipmentNumber.trim()
    const cleanedAthleteNumbers = athleteNumbers
      .map((value) => value.trim())
      .filter(Boolean)
    const cleanedCategories = categoryUuids
      .map((value) => value.trim())
      .filter(Boolean)

    if (cleanedAthleteNumbers.length === 0) {
      setError('Vyplňte prosím alespoň jedno číslo sportovce.')
      return
    }

    if (!typeUuid) {
      setError('Vyberte prosím typ náčiní.')
      return
    }

    if (!trimmedEquipmentNumber) {
      setError('Evidenční číslo náčiní se nepodařilo vygenerovat.')
      return
    }

    if (cleanedCategories.length > 10) {
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
          athlete_numbers: cleanedAthleteNumbers,
          category: cleanedCategories[0] || null,
          categories: cleanedCategories,
          equipment_type: typeUuid,
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
          onSubmit={(formEvent) => {
            void handleSubmit(formEvent)
          }}
          className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Čísla sportovců
              </label>
              <div className="space-y-2">
                {athleteNumbers.map((value, index) => (
                  <div key={`athlete-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={value}
                      onChange={(formEvent) => {
                        const nextValue = formEvent.target.value
                        setAthleteNumbers((previous) =>
                          previous.map((item, idx) => (idx === index ? nextValue : item)),
                        )
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Např. 245"
                      maxLength={30}
                      required
                    />
                    {athleteNumbers.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setAthleteNumbers((previous) => previous.filter((_, idx) => idx !== index))
                        }
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        Odebrat
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAthleteNumbers((previous) => [...previous, ''])}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  + Přidat číslo
                </button>
                <span className="text-xs text-gray-500">Každé číslo zvlášť.</span>
              </div>
            </div>

            <div>
              <label htmlFor="equipment-type" className="mb-2 block text-sm font-semibold text-gray-900">
                Typ náčiní
              </label>
              <select
                id="equipment-type"
                value={typeUuid}
                onChange={(formEvent) => setTypeUuid(formEvent.target.value)}
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

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Kategorie (max 10)
              </label>
              <div className="space-y-2">
                {categoryUuids.map((value, index) => (
                  <div key={`category-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={value}
                      onChange={(formEvent) => {
                        const nextValue = formEvent.target.value
                        setCategoryUuids((previous) =>
                          previous.map((item, idx) => (idx === index ? nextValue : item)),
                        )
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Vyberte kategorii --</option>
                      {sortedCategories.map((category) => (
                        <option key={category.uuid} value={category.uuid}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoryUuids.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryUuids((previous) => previous.filter((_, idx) => idx !== index))
                        }
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        Odebrat
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (categoryUuids.length < 10) {
                      setCategoryUuids((previous) => [...previous, ''])
                    }
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  + Přidat kategorii
                </button>
                <span className="text-xs text-gray-500">Maximálně 10 kategorií.</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="equipment-number" className="mb-2 block text-sm font-semibold text-gray-900">
                Evidenční číslo náčiní
              </label>
              <input
                id="equipment-number"
                type="text"
                value={equipmentNumberLoading ? 'Načítám...' : equipmentNumber}
                readOnly
                disabled={!typeUuid || equipmentNumberLoading}
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-700 outline-none"
                placeholder="Automaticky po výběru typu"
                maxLength={15}
                required
              />
              <p className="mt-1 text-xs text-gray-500">Číslo se generuje automaticky podle typu náčiní.</p>
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
