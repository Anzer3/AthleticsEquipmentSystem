type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  maxWidthClassName?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  maxWidthClassName = 'md:max-w-md',
}: SearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border-2 border-[var(--dark-red-btn)]/35 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none placeholder:text-gray-500 focus:border-[var(--dark-red-btn)] focus:ring-4 focus:ring-[var(--light_red)] ${maxWidthClassName}`.trim()}
    />
  )
}
