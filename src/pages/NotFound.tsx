import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="section flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl font-extrabold text-brand-600">404</div>
      <p className="mt-4 text-gray-500">Sahifa topilmadi.</p>
      <Link to="/" className="btn-primary mt-6">Bosh sahifaga qaytish</Link>
    </div>
  )
}
