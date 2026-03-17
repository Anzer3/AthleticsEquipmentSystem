import type { ComponentType } from 'react'

type EquipmentTileProps = {
  uuid: string
  equipmentNumber: string
  athleteNumber: string
  equipmentType: string
  category: string
  status: string
  measured: boolean
  location?: string
  icon: ComponentType<{ className?: string }>
  onOpenDetail: (uuid: string) => void
}

export default function EquipmentTile({
  uuid,
  equipmentNumber,
  athleteNumber,
  equipmentType,
  category,
  status,
  measured,
  location,
  icon: Icon,
  onOpenDetail,
}: EquipmentTileProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetail(uuid)}
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg focus:outline-none"
    >
      {/* Background Icon Decoration */}
      <Icon className="absolute -right-4 -top-4 h-32 w-32 opacity-[0.03] text-gray-900 pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <h2 className="inline-flex items-center gap-3 text-xl font-bold text-gray-900 leading-tight">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[var(--dark-red-btn)] ring-1 ring-inset ring-red-100">
            <Icon className="h-6 w-6 stroke-2" />
          </span>
          <span>{equipmentType} {equipmentNumber}</span>
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
            measured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {measured ? 'Změřeno' : 'Čeká'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
        <div className="space-y-0.5 text-gray-500">
          <p className="font-semibold text-gray-400 text-xs uppercase tracking-wide">Atlet</p>
          <p className="font-bold text-gray-900">{athleteNumber || 'Neznámý'}</p>
        </div>
        <div className="space-y-0.5 text-gray-500">
          <p className="font-semibold text-gray-400 text-xs uppercase tracking-wide">Kategorie</p>
          <p className="font-medium text-gray-700">{category}</p>
        </div>
        <div className="space-y-0.5 text-gray-500">
          <p className="font-semibold text-gray-400 text-xs uppercase tracking-wide">Stav</p>
          <p className="font-semibold text-gray-800">{status}</p>
        </div>
        <div className="space-y-0.5 text-gray-500">
          <p className="font-semibold text-gray-400 text-xs uppercase tracking-wide">Místo</p>
          <p className="font-medium text-gray-700">{location || 'Neurčeno'}</p>
        </div>
      </div>
    </button>
  )
}
