import { FunnelIcon } from '@heroicons/react/24/outline'
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
  return (
    <aside className="w-full rounded-2xl border border-[var(--line-soft)] bg-white p-4 shadow-sm lg:min-w-64 lg:self-start lg:sticky lg:top-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="m-0 inline-flex items-center gap-2 text-lg font-black text-gray-900">
          <FunnelIcon className="h-5 w-5 text-[var(--dark-red-btn)]" />
          {title}
        </h2>
        <ActionButton
          className="rounded-md bg-red-600 border-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 hover:border-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          onClick={onClearAll}
        >
          Vymazat filtry
        </ActionButton>
      </div>

      {sections.map((section) => (
        <div className="mt-3 rounded-xl border border-[var(--line-soft)] bg-gray-50/60 p-3" key={section.title}>
          <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-gray-600">{section.title}</h3>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {section.options.map((option) => (
              <li key={option}>
                <label className="inline-flex items-center gap-2 text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={(selectedValues[section.title] ?? []).includes(option)}
                    onChange={() => onToggleOption(section.title, option)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--dark-red-btn)] focus:ring-[var(--light_red)]"
                  />
                  <span>{option}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
