import { CheckIcon } from '@heroicons/react/24/solid'

type EquipmentCardProps = {
  uuid: string
  equipmentNumber: string
  athleteNumber: string
  equipmentType: string
  category: string
  measured: boolean
  onOpenDetail: (uuid: string) => void
  onMeasure: (uuid: string) => void
}

export default function EquipmentCard({
  uuid,
  equipmentNumber,
  athleteNumber,
  equipmentType,
  category,
  measured,
  onOpenDetail,
  onMeasure,
}: EquipmentCardProps) {
  return (
    <article
      className={[
        'flex w-full flex-col justify-between rounded-lg border bg-white p-3.5 text-left shadow-sm transition-colors duration-200',
        measured
          ? 'border-gray-200 hover:border-gray-400'
          : 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)] hover:border-red-600',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-black leading-tight text-gray-900">
          {equipmentType} {equipmentNumber}
        </h2>
        {measured ? (
          <span
            className="mt-0.5 inline-flex shrink-0 items-center justify-center text-green-600"
            title="Změřeno"
            aria-label="Změřeno"
          >
            <CheckIcon className="h-5 w-5" />
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Atlet</span>
          <span className="font-semibold text-gray-900 truncate" title={athleteNumber || 'Neznámý'}>{athleteNumber || 'Neznámý'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Kategorie</span>
          <span className="font-medium text-gray-700 truncate" title={category}>{category}</span>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-gray-100">
        <div className={`grid gap-2 ${measured ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={() => onOpenDetail(uuid)}
            className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-gray-200 focus:outline-none"
          >
            Podrobnosti
          </button>

          {!measured ? (
            <button
              type="button"
              onClick={() => onMeasure(uuid)}
              className="flex w-full items-center justify-center rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black tracking-wide text-white transition hover:bg-red-700 hover:border-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              Změřit
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
