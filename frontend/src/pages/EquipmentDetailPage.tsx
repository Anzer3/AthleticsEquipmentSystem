import { useEffect, useMemo, useState } from 'react'
import { PencilSquareIcon, CheckIcon, XMarkIcon, ArrowLeftIcon, ClipboardDocumentCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import ActionButton from '../components/ActionButton'
import InfoState from '../components/InfoState'
import { formatValue } from '../utils/presentation'

type EquipmentDetail = Record<string, unknown>

type EquipmentMeasurement = {
  uuid: string
  measured_property: string
  value: number
  unit_name: string
  measured_at: string
}

type EquipmentDetailPageProps = {
  equipmentUuid: string
  onBack: () => void
  onNavigate: (path: string) => void
}

function toLabel(key: string): string {
  const translations: Record<string, string> = {
    equipment_number: 'Číslo náčiní',
    athlete_number: 'Číslo atleta',
    category_name: 'Kategorie',
    equipment_type_name: 'Typ náčiní',
    status_name: 'Stav',
    measured: 'Změřeno',
    created_at: 'Vytvořeno',
    updated_at: 'Naposledy upraveno',
  }
  return translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function EquipmentDetailPage({ equipmentUuid, onBack, onNavigate }: EquipmentDetailPageProps) {
  const [detail, setDetail] = useState<EquipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [measurements, setMeasurements] = useState<EquipmentMeasurement[]>([])
  const [measurementsLoading, setMeasurementsLoading] = useState(true)

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/equipment/${equipmentUuid}/`, { credentials: 'include' })
        if (!response.ok) {
          throw new Error(`API error ${response.status}`)
        }

        const data = await response.json()
        setDetail(data)
        setEditForm({
          equipment_number: String(data.equipment_number || ''),
          athlete_number: String(data.athlete_number || ''),
        })
      } catch {
        setError('Detail náčiní se nepodařilo načíst.')
      } finally {
        setLoading(false)
      }
    }

    void loadDetail()
  }, [equipmentUuid])

  useEffect(() => {
    const loadMeasurements = async () => {
      setMeasurementsLoading(true)
      try {
        const response = await fetch(`/api/measurements/?equipment_uuid=${equipmentUuid}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('API error')
        }
        setMeasurements((await response.json()) as EquipmentMeasurement[])
      } catch {
        setMeasurements([])
      } finally {
        setMeasurementsLoading(false)
      }
    }

    void loadMeasurements()
  }, [equipmentUuid])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/equipment/${equipmentUuid}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Chyba při ukládání')
      }

      const updatedData = await response.json()
      setDetail(updatedData)
      setIsEditing(false)
    } catch {
      alert('Nepodařilo se uložit změny.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (detail) {
      setEditForm({
        equipment_number: String(detail.equipment_number || ''),
        athlete_number: String(detail.athlete_number || ''),
      })
    }
  }

  const detailEntries = useMemo(() => {
    if (!detail) {
      return []
    }
    
    const displayKeys = ['equipment_number', 'athlete_number', 'category_name', 'equipment_type_name', 'status_name', 'measured', 'created_at', 'updated_at']
    return displayKeys.map(key => [key, detail[key]]).filter((kv) => kv[1] !== undefined)
  }, [detail])

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Detail náčiní</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">Kompletní specifikace a možnost úprav</p>
      </div>
      
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <ActionButton
          className="inline-flex items-center gap-2 rounded-xl border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-gray-200"
          onClick={onBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zpět na seznam
        </ActionButton>

        {!loading && !error && detail && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <ActionButton
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Zrušit
                </ActionButton>
                <ActionButton
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <CheckIcon className="h-4 w-4" />
                  {saving ? 'Ukládám...' : 'Uložit změny'}
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors ${
                    detail.measured
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={() => onNavigate(`/new-measurement?equipmentId=${equipmentUuid}`)}
                >
                  {detail.measured ? <ArrowPathIcon className="h-4 w-4" /> : <ClipboardDocumentCheckIcon className="h-4 w-4" />}
                  {detail.measured ? 'Znovu změřit' : 'Změřit'}
                </ActionButton>
                <ActionButton
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--dark-red-btn)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Upravit
                </ActionButton>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? <InfoState text="Načítám detail náčiní..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error && detail ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detailEntries.map(([key, value]) => {
              const k = key as string
              const isEditable = isEditing && (k === 'equipment_number' || k === 'athlete_number')

              return (
                <div key={k} className="flex flex-col justify-center rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <dt className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">{toLabel(k)}</dt>
                  <dd className="font-semibold text-gray-900">
                    {isEditable ? (
                      <input
                        type="text"
                        value={editForm[k]}
                        onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-[var(--dark-red-btn)] focus:ring-2 focus:ring-red-100"
                      />
                    ) : (
                      <span className={k === 'measured' ? `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-bold ${value ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}` : 'text-base'}>
                        {typeof value === 'boolean' && k === 'measured' ? (value ? 'Ano, Změřeno' : 'Nezměřeno') : (formatValue(value) || String(value))}
                      </span>
                    )}
                  </dd>
                </div>
              )
            })}
          </div>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Naměřené hodnoty</h2>

            {measurementsLoading ? <InfoState text="Načítám naměřené hodnoty..." /> : null}

            {!measurementsLoading && measurements.length === 0 ? (
              <InfoState text="Pro toto náčiní zatím nejsou uložené žádné naměřené hodnoty." />
            ) : null}

            {!measurementsLoading && measurements.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {measurements.map((measurement) => (
                  <article key={measurement.uuid} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-bold text-gray-900">{measurement.measured_property}</p>
                    <p className="mt-1 text-lg font-black text-blue-700">
                      {measurement.value} {measurement.unit_name !== '-' ? measurement.unit_name : ''}
                    </p>
                    <p className="mt-2 text-xs text-gray-600">{formatValue(measurement.measured_at)}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}
