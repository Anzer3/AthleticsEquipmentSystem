import { useEffect, useState } from 'react'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import InfoState from '../components/InfoState'
import ActionButton from '../components/ActionButton'
import { getCsrfToken } from '../utils/csrf'

type EquipmentItem = {
  uuid: string
  equipment_number: string
  equipment_type: string
  measured: boolean
}

type UnitOption = {
  uuid: string
  unit: string
}

type MeasuredPropertyItem = {
  uuid: string
  name: string
  description: string
  units: UnitOption[]
}

type MeasurementPropertiesResponse = {
  equipment_uuid: string
  equipment_type: string | null
  properties: MeasuredPropertyItem[]
}

type NewMeasurementPageProps = {
  onBack: () => void
}

export default function NewMeasurementPage({ onBack }: NewMeasurementPageProps) {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [properties, setProperties] = useState<MeasuredPropertyItem[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({})

  const queryParams = new URLSearchParams(window.location.search)
  const preselectedUuid = queryParams.get('equipmentId')
  
  const [selectedUuid, setSelectedUuid] = useState<string>(preselectedUuid || '')

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch('/api/equipment/', { credentials: 'include' })
        if (!response.ok) throw new Error('API error')
        const data = await response.json()
        setItems(data)
      } catch {
        setError('Nepodařilo se načíst seznam náčiní.')
      } finally {
        setLoading(false)
      }
    }
    void fetchEquipment()
  }, [])

  useEffect(() => {
    if (!selectedUuid) {
      setProperties([])
      setValues({})
      setSelectedUnits({})
      return
    }

    const fetchProperties = async () => {
      setLoadingProperties(true)
      setSaveError(null)

      try {
        const response = await fetch(`/api/measurements/properties/?equipment_uuid=${encodeURIComponent(selectedUuid)}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('API error')
        }

        const data = (await response.json()) as MeasurementPropertiesResponse
        setProperties(data.properties)

        const initialValues: Record<string, string> = {}
        const initialUnits: Record<string, string> = {}

        data.properties.forEach((property) => {
          initialValues[property.uuid] = ''
          if (property.units.length > 0) {
            initialUnits[property.uuid] = property.units[0].uuid
          }
        })

        setValues(initialValues)
        setSelectedUnits(initialUnits)
      } catch {
        setSaveError('Nepodařilo se načíst měřené vlastnosti pro vybrané náčiní.')
        setProperties([])
      } finally {
        setLoadingProperties(false)
      }
    }

    void fetchProperties()
  }, [selectedUuid])

  const selectedItem = items.find(i => i.uuid === selectedUuid)
  const showWarning = !preselectedUuid && selectedItem?.measured

  const unmeasuredItems = items.filter(i => !i.measured)
  const measuredItems = items.filter(i => i.measured)

  const handleSave = async () => {
    if (!selectedUuid) {
      setSaveError('Nejprve vyberte náčiní.')
      return
    }

    if (properties.length === 0) {
      setSaveError('Pro vybraný typ náčiní nejsou dostupné žádné měřené vlastnosti.')
      return
    }

    const missingValues = properties.filter((property) => values[property.uuid].trim() === '')
    if (missingValues.length > 0) {
      setSaveError('Vyplňte prosím všechny měřené hodnoty.')
      return
    }

    const invalidValues = properties.filter((property) => Number.isNaN(Number(values[property.uuid])))
    if (invalidValues.length > 0) {
      setSaveError('Zadejte prosím platné číselné hodnoty.')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const csrfToken = getCsrfToken()

      const responses = await Promise.all(
        properties.map((property) =>
          fetch('/api/measurements/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({
              equipment: selectedUuid,
              property: property.uuid,
              value: Number(values[property.uuid]),
              unit: selectedUnits[property.uuid] || null,
            }),
          }),
        ),
      )

      const firstFailed = responses.find((response) => !response.ok)
      if (firstFailed) {
        throw new Error(`Měření se nepodařilo uložit (${firstFailed.status})`)
      }

      await fetch(`/api/equipment/${selectedUuid}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ measured: true }),
      })

      onBack()
    } catch {
      setSaveError('Nepodařilo se uložit měření. Zkuste to prosím znovu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Nové měření náčiní</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">Vyberte náčiní a zadejte naměřené hodnoty</p>
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

      {loading ? <InfoState text="Načítám seznam náčiní..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="equipment-select" className="mb-2 block text-sm font-semibold text-gray-900">
                Náčiní
              </label>
              
              <select
                id="equipment-select"
                className={`w-full rounded-lg border ${
                  preselectedUuid ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                } px-4 py-3 text-sm outline-none transition-all`}
                value={selectedUuid}
                onChange={(e) => setSelectedUuid(e.target.value)}
                disabled={!!preselectedUuid}
              >
                <option value="" disabled>-- Vyberte náčiní --</option>
                {unmeasuredItems.length > 0 && (
                  <optgroup label="Nezměřená náčiní">
                    {unmeasuredItems.map((item) => (
                      <option key={item.uuid} value={item.uuid}>
                        {item.equipment_number} - {item.equipment_type}
                      </option>
                    ))}
                  </optgroup>
                )}
                {measuredItems.length > 0 && (
                  <optgroup label="Již změřená náčiní">
                    {measuredItems.map((item) => (
                      <option key={item.uuid} value={item.uuid}>
                        {item.equipment_number} - {item.equipment_type} (Změřeno)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {showWarning && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800 border border-orange-100">
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-orange-500" />
                  Toto náčiní již bylo v minulosti změřeno. Nové měření aktualizuje stávající stav.
                </div>
              )}
            </div>

            {selectedUuid && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {loadingProperties ? <InfoState text="Načítám měřené vlastnosti..." /> : null}

                {!loadingProperties && properties.length === 0 ? (
                  <InfoState text="Vybraný typ náčiní zatím nemá definované měřené vlastnosti." />
                ) : null}

                {!loadingProperties && properties.length > 0 && (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div key={property.uuid}>
                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                          {property.name}
                          {property.units.length > 0 ? ` (${property.units[0].unit})` : ''}
                        </label>

                        {property.description ? (
                          <p className="mb-2 text-xs text-[var(--ink-soft)]">{property.description}</p>
                        ) : null}

                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input
                            type="number"
                            step="any"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Zadejte naměřenou hodnotu"
                            value={values[property.uuid] ?? ''}
                            onChange={(e) => {
                              const nextValue = e.target.value
                              setValues((previous) => ({
                                ...previous,
                                [property.uuid]: nextValue,
                              }))
                            }}
                          />

                          {property.units.length > 1 ? (
                            <select
                              className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              value={selectedUnits[property.uuid] ?? ''}
                              onChange={(e) => {
                                const nextUnit = e.target.value
                                setSelectedUnits((previous) => ({
                                  ...previous,
                                  [property.uuid]: nextUnit,
                                }))
                              }}
                            >
                              {property.units.map((unit) => (
                                <option key={unit.uuid} value={unit.uuid}>
                                  {unit.unit}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                              {property.units[0]?.unit ?? '-'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {saveError ? (
                  <div className="mt-4">
                    <InfoState text={saveError} variant="error" />
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <ActionButton
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                    onClick={handleSave}
                    disabled={loadingProperties || saving}
                  >
                    {saving ? 'Ukládám...' : 'Uložit měření'}
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
