import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon } from '@heroicons/react/24/outline'
import ActionButton from './ActionButton'

type FilterSection = {
  title: string
  options: string[]
}

type FilterSidebarProps = {
  title?: string
  sections: FilterSection[]
  selectedValues: Record<string, string[]>
  onToggleOption: (sectionTitle: string, option: string) => void
  onClearAll: () => void
}

export default function FilterSidebar({
  title = 'Filtry',
  sections,
  selectedValues,
  onToggleOption,
  onClearAll,
}: FilterSidebarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false)

  const hasSelectedFilters = Object.values(selectedValues).some((values) => values.length > 0)

  return (
    <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 lg:min-w-[15rem] lg:self-start lg:sticky lg:top-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpenMobile((previous) => !previous)}
          className="inline-flex items-center gap-2 rounded border border-transparent bg-transparent p-0 text-left text-base font-black text-gray-900 focus:outline-none lg:pointer-events-none"
          aria-expanded={isOpenMobile}
        >
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          {title}
          <span className="inline-flex lg:hidden">
            {isOpenMobile ? <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : <ChevronDownIcon className="h-5 w-5 text-gray-500" />}
          </span>
        </button>

        <ActionButton
          className="hidden rounded-md border-gray-200 bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 focus:ring-2 focus:ring-gray-200 lg:inline-flex"
          onClick={onClearAll}
        >
          Resetovat
        </ActionButton>
      </div>

      <div className={`${isOpenMobile ? 'block' : 'hidden'} lg:block`}>
        {hasSelectedFilters ? <p className="mb-3 text-xs font-semibold text-red-600">Jsou aktivní filtry</p> : null}

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{section.title}</h3>
              <ul className="flex flex-col gap-2">
                {section.options.map((option) => (
                  <li key={option}>
                    <label className="inline-flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={(selectedValues[section.title] ?? []).includes(option)}
                        onChange={() => onToggleOption(section.title, option)}
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 transition"
                      />
                      <span>{option}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
