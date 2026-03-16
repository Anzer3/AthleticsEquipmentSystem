import { useEffect, useMemo, useState } from 'react'
import ActionButton from '../components/ActionButton'
import InfoState from '../components/InfoState'
import ModuleContainer from '../components/ModuleContainer'
import { formatValue } from '../utils/presentation'

type MeasurementDetail = Record<string, unknown>

type MeasurementDetailPageProps = {
  measurementUuid: string
  onBack: () => void
}

function toLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function MeasurementDetailPage({ measurementUuid, onBack }: MeasurementDetailPageProps) {
  const [detail, setDetail] = useState<MeasurementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/measurements/${measurementUuid}/`, { credentials: 'include' })
        if (!response.ok) {
          throw new Error(`API error ${response.status}`)
        }

        setDetail((await response.json()) as MeasurementDetail)
      } catch {
        setError('Detail měření se nepodařilo načíst.')
      } finally {
        setLoading(false)
      }
    }

    void loadDetail()
  }, [measurementUuid])

  const detailEntries = useMemo(() => {
    if (!detail) {
      return []
    }

    return Object.entries(detail)
  }, [detail])

  return (
    <ModuleContainer title="Detail měření" subtitle="Kompletní informace o vybraném záznamu měření.">
      <ActionButton
        className="mb-4 border-gray-300 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        onClick={onBack}
      >
        Zpět na seznam
      </ActionButton>

      {loading ? <InfoState text="Načítám detail měření..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      {!loading && !error && detail ? (
        <dl className="grid gap-2 rounded-xl border border-[var(--line-soft)] bg-gray-50 p-4 sm:grid-cols-[10rem_1fr] lg:grid-cols-[14rem_1fr]">
          {detailEntries.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-sm font-bold text-gray-700">{toLabel(key)}</dt>
              <dd className="m-0 break-all text-sm text-gray-900">{formatValue(value) || String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </ModuleContainer>
  )
}
