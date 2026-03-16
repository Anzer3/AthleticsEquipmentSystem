import type { ComponentType } from 'react'

type EquipmentTileProps = {
  uuid: string
  equipmentNumber: string
  equipmentType: string
  category: string
  status: string
  measured: boolean
  icon: ComponentType<{ className?: string }>
  onOpenDetail: (uuid: string) => void
}

export default function EquipmentTile({
  uuid,
  equipmentNumber,
  equipmentType,
  category,
  status,
  measured,
  icon: Icon,
  onOpenDetail,
}: EquipmentTileProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetail(uuid)}
      className="rounded-2xl border border-[var(--line-soft)] bg-gradient-to-b from-white to-gray-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--dark-red-btn)] hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-lg font-black text-gray-900">
          <span className="inline-flex rounded-lg bg-red-100 p-1.5 text-[var(--dark-red-btn)]">
            <Icon className="h-4 w-4" />
          </span>
          {equipmentNumber}
        </h2>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            measured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {measured ? 'Změřeno' : 'Čeká na měření'}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
        <p><span className="font-bold text-gray-700">Typ:</span> {equipmentType}</p>
        <p><span className="font-bold text-gray-700">Kategorie:</span> {category}</p>
        <p><span className="font-bold text-gray-700">Aktuální stav:</span> {status}</p>
      </div>
    </button>
  )
}
