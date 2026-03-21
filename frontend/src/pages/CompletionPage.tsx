export default function CompletionPage() {
  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Kompletace</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">
          Přehled kompletace náčiní a připravenosti pro závody.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">
          Modul kompletace je připraven pro rozšíření. Můžeme sem doplnit checklist před soutěží,
          stav kompletace sad náčiní a kontroly připravenosti.
        </p>
      </section>
    </div>
  )
}
