import { FunnelIcon } from '@heroicons/react/24/outline'

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
    <aside className="w-full xl:w-72 xl:min-w-72 rounded border border-gray-300 bg-[#f0f0f0] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="m-0 inline-flex items-center gap-2 text-lg font-bold text-gray-900">
          <FunnelIcon className="h-5 w-5 text-[var(--dark-red-btn)]" />
          {title}
        </h2>
        <button
          type="button"
          className="rounded border border-[var(--dark-red-btn)] px-2 py-1 text-xs font-semibold text-[var(--dark-red-btn)] hover:bg-red-50"
          onClick={onClearAll}
        >
          Reset
        </button>
      </div>

      {sections.map((section) => (
        <div className="mt-3 border-t border-gray-300 pt-3" key={section.title}>
          <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">{section.title}</h3>
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
