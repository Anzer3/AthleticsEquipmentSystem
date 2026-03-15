type InfoStateProps = {
  text: string
  variant?: 'neutral' | 'error'
}

export default function InfoState({ text, variant = 'neutral' }: InfoStateProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        variant === 'error'
          ? 'border-red-200 bg-red-50/90 text-red-700'
          : 'border-[var(--line-soft)] bg-gray-50 text-gray-600'
      }`}
    >
      {text}
    </div>
  )
}
