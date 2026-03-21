type NotFoundPageProps = {
  onGoHome: () => void
}

export default function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-4">
      <section className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--dark-red-btn)]">404</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Stránka nebyla nalezena</h1>
        <p className="mt-3 text-sm text-gray-600">Odkaz je neplatný nebo stránka byla přesunuta.</p>

        <button
          type="button"
          onClick={onGoHome}
          className="mt-6 rounded-xl bg-[var(--dark-red-btn)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          Zpět na hlavní stránku
        </button>
      </section>
    </div>
  )
}
