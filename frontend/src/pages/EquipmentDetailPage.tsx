import { useEffect, useMemo, useState } from 'react'
import { PencilSquareIcon, CheckIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import ActionButton from '../components/ActionButton'
import InfoState from '../components/InfoState'
import ModuleContainer from '../components/ModuleContainer'
import { formatValue } from '../utils/presentation'

type EquipmentDetail = Record<string, unknown>

type EquipmentDetailPageProps = {
  equipmentUuid: string
  onBack: () => void
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

export default function EquipmentDetailPage({ equipmentUuid, onBack }: EquipmentDetailPageProps) {
  const [detail, setDetail] = useState<EquipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

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
    return displayKeys.map(key => [key, detail[key]]).filter(([_, val]) => val !== undefined)
  }, [detail])

  return (
    <ModuleContainer title="Detail náčiní" subtitle="Kompletní specifikace a možnost úprav">
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
              <ActionButton
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--dark-red-btn)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                onClick={() => setIsEditing(true)}
              >
                <PencilSquareIcon className="h-4 w-4" />
                Upravit náčiní
              </ActionButton>
            )}
          </div>
        )}
      </div>

      {loading ? <InfoState text="Načítám detail náčiní..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error && detail ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900">Vlastnosti</h3>
          </div>
          <dl className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 lg:grid-cols-3 lg:divide-y-0">
            {detailEntries.map(([key, value], index) => {
              const k = key as string;
              const isEditable = isEditing && (k === 'equipment_number' || k === 'athlete_number');
              
              return (
                <div key={k} className={`p-6 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">{toLabel(k)}</dt>
                  <dd className="mt-2 text-sm text-gray-900">
                    {isEditable ? (
                      <input
                        type="text"
                        value={editForm[k]}
                        onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-[var(--dark-red-btn)] focus:ring-2 focus:ring-red-100"
                      />
                    ) : (
                      <span className={k === 'measured' ? `inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${value ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}` : 'font-medium'}>
                         {formatValue(value) || String(value)}
                      </span>
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      ) : null}
    </ModuleContainer>
  )
}
