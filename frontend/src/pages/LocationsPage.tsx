import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ActionButton from '../components/ActionButton'
import InfoState from '../components/InfoState'
import SearchInput from '../components/SearchInput'
import { getCsrfToken } from '../utils/csrf'

type LocationItem = {
  uuid: string
  name: string
  description: string
}

type LocationForm = {
  name: string
  description: string
}

export default function LocationsPage() {
  const [items, setItems] = useState<LocationItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [form, setForm] = useState<LocationForm>({ name: '', description: '' })

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/events/locations/', { credentials: 'include' })
      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }
      setItems((await response.json()) as LocationItem[])
    } catch {
      setError('Nepodařilo se načíst lokace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((item) => {
      return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    })
  }, [items, search])

  const resetForm = () => {
    setEditingUuid(null)
    setForm({ name: '', description: '' })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = form.name.trim()
    const description = form.description.trim()

    if (!name) {
      setError('Název lokace je povinný.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const isEdit = Boolean(editingUuid)
      const response = await fetch(isEdit ? `/api/events/locations/${editingUuid}/` : '/api/events/locations/', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error('Nepodařilo se uložit lokaci.')
      }

      resetForm()
      await loadData()
    } catch {
      setError('Nepodařilo se uložit lokaci.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: LocationItem) => {
    setEditingUuid(item.uuid)
    setForm({
      name: item.name,
      description: item.description || '',
    })
  }

  const handleDelete = async (uuid: string) => {
    setError(null)

    try {
      const csrfToken = getCsrfToken()
      const response = await fetch(`/api/events/locations/${uuid}/`, {
        method: 'DELETE',
        headers: {
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Nepodařilo se smazat lokaci.')
      }

      if (editingUuid === uuid) {
        resetForm()
      }

      await loadData()
    } catch {
      setError('Nepodařilo se smazat lokaci.')
    }
  }

  return (
    <div className="w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Správa lokací</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)] md:text-base">MVP správa: vytvoření, úprava a smazání lokací.</p>
      </div>

      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Hledat lokaci"
          maxWidthClassName="md:max-w-md"
        />
      </div>

      {loading ? <InfoState text="Načítám lokace..." /> : null}
      {error ? <InfoState text={error} variant="error" /> : null}

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{editingUuid ? 'Upravit lokaci' : 'Nová lokace'}</h2>

          <form
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="location-name" className="mb-2 block text-sm font-semibold text-gray-900">
                Název
              </label>
              <input
                id="location-name"
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label htmlFor="location-description" className="mb-2 block text-sm font-semibold text-gray-900">
                Popis
              </label>
              <textarea
                id="location-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-2">
              <ActionButton
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70"
                disabled={saving}
              >
                {saving ? 'Ukládám...' : editingUuid ? 'Uložit' : 'Vytvořit'}
              </ActionButton>

              {editingUuid ? (
                <ActionButton
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  onClick={resetForm}
                >
                  Zrušit
                </ActionButton>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Seznam lokací</h2>

          {filteredItems.length === 0 ? <InfoState text="Nebyly nalezeny žádné lokace." /> : null}

          {filteredItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredItems.map((item) => (
                <article key={item.uuid} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                  <p className="mt-2 min-h-10 text-sm text-gray-600">{item.description || 'Bez popisu'}</p>

                  <div className="mt-3 flex gap-2">
                    <ActionButton
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                      onClick={() => handleEdit(item)}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Upravit
                    </ActionButton>
                    <ActionButton
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                      onClick={() => {
                        void handleDelete(item.uuid)
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                      Smazat
                    </ActionButton>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
