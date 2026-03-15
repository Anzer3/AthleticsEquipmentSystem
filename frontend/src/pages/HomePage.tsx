type HomePageProps = {
  username: string | null
  onGoToLogin: () => void
}

export default function HomePage({ username, onGoToLogin }: HomePageProps) {
  return (
    <section className="w-full max-w-2xl rounded-xl border border-[var(--light_red)] bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Home</h1>
      {username ? (
        <p className="m-0 text-gray-700">Vitej, {username}. Jsi prihlaseny.</p>
      ) : (
        <>
          <p className="m-0 text-gray-700">Nejsi prihlaseny.</p>
          <button
            type="button"
            className="mt-2 inline-flex w-fit rounded-md border border-[var(--dark-red-btn)] bg-[var(--dark-red-btn)] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
            onClick={onGoToLogin}
          >
            Prejit na login
          </button>
        </>
      )}
    </section>
  )
}
