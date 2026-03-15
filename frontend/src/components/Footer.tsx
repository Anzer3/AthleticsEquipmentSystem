export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--light_red)] bg-white/95 px-6 py-4 text-sm text-gray-600 backdrop-blur-sm">
      <small className="font-semibold">Copyright {year} Athletics Equipment System</small>
    </footer>
  )
}
