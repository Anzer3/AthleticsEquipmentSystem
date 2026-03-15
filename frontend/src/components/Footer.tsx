export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--light_red)] bg-white px-6 py-4 text-sm text-gray-600">
      <small>Copyright {year} Athletics Equipment System</small>
    </footer>
  )
}
