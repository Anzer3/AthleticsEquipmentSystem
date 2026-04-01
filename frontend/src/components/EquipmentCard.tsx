import { MapPinIcon } from '@heroicons/react/24/outline'
import diskIcon from '../assets/disk.png'
import kouleIcon from '../assets/koule.png'
import kuzelkaIcon from '../assets/kuzelka.png'
import ostepIcon from '../assets/ostep.png'
import fallbackIcon from '../assets/WPA_icon.webp'

type EquipmentCardProps = {
  uuid: string
  equipmentNumber: string
  athleteNumbers: string
  equipmentType: string
  category: string
  location: string
  measured: boolean
  status: string
  onOpenDetail: (uuid: string) => void
  onMeasure: (uuid: string) => void
  onNavigateToLocation: () => void
}

const STATUS_TRIANGLE_COLORS: Record<string, string> = {
  registered: 'bg-red-600',
  available: 'bg-green-500',
  'in use': 'bg-blue-500',
  returned: 'bg-gray-400',
  illegal: 'bg-black',
}

const STATUS_LABELS: Record<string, string> = {
  registered: 'Registrováno',
  available: 'Dostupné',
  'in use': 'V použití',
  returned: 'Navráceno',
  illegal: 'Nepovolené',
}

const normalizeText = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const getEquipmentIcon = (equipmentType: string) => {
  const normalized = normalizeText(equipmentType)

  if (normalized.includes('disk')) {
    return { src: diskIcon, alt: 'Disk' }
  }
  if (normalized.includes('koule')) {
    return { src: kouleIcon, alt: 'Koule' }
  }
  if (normalized.includes('kuzelka')) {
    return { src: kuzelkaIcon, alt: 'Kuželka' }
  }
  if (normalized.includes('ostep')) {
    return { src: ostepIcon, alt: 'Oštěp' }
  }

  return { src: fallbackIcon, alt: 'Náčiní' }
}

export default function EquipmentCard({
  uuid,
  equipmentNumber,
  athleteNumbers,
  equipmentType,
  category,
  location,
  measured,
  status,
  onOpenDetail,
  onMeasure,
  onNavigateToLocation,
}: EquipmentCardProps) {
  const normalizedStatus = status.trim().toLowerCase()
  const statusTriangle = STATUS_TRIANGLE_COLORS[normalizedStatus] ?? 'bg-gray-300'
  const statusLabel = STATUS_LABELS[normalizedStatus] ?? status
  const icon = getEquipmentIcon(equipmentType)
  const locationLabel = location || 'Bez lokace'
  const hasLocation = Boolean(location && location.trim())

  return (
    <article
      className={[
        'relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border bg-white p-4 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5',
        measured
          ? 'border-gray-200'
          : 'border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.15)]',
      ].join(' ')}
    >
      <span
        className={`absolute right-0 top-0 h-17 w-17 ${statusTriangle}`}
        style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
        title={`Stav: ${statusLabel}`}
        aria-hidden="true"
      />

      <div className="flex items-center gap-2">
        <img src={icon.src} alt={icon.alt} className="h-10 w-10 object-contain" />
        <h2 className="truncate text-base font-bold text-gray-900">
          {equipmentType} {equipmentNumber}
        </h2>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Atlet</span>
          <span className="truncate font-semibold text-gray-900" title={athleteNumbers || 'Neznámý'}>
            {athleteNumbers || 'Neznámý'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Kategorie</span>
          <span className="truncate font-medium text-gray-700" title={category}>
            {category}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <MapPinIcon className="h-4 w-4 text-gray-500" />
        {hasLocation ? (
          <button
            type="button"
            onClick={onNavigateToLocation}
            className="truncate text-left  hover:underline focus:outline-none focus:ring-2 focus:ring-blue-100"
            title={locationLabel}
          >
            {locationLabel}
          </button>
        ) : (
          <span className="truncate text-gray-600" title={locationLabel}>{locationLabel}</span>
        )}
      </div>

      <div className="mt-3.5 border-t border-gray-100 pt-3">
        <div className={`grid gap-2 ${measured ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={() => onOpenDetail(uuid)}
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Podrobnosti
          </button>

          {!measured ? (
            <button
              type="button"
              onClick={() => onMeasure(uuid)}
              className="flex w-full items-center justify-center rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-black tracking-wide text-white transition hover:border-red-700 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Změřit
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
