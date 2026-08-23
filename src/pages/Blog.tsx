import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { blogPosts } from '@/lib/blogPosts'

export default function Blog() {
  return (
    <div className="section py-14">
      <h1 className="text-3xl font-bold text-gray-900">Maslahatlar</h1>
      <p className="mt-2 max-w-2xl text-gray-500">
        Uy va ofisni toza saqlash bo'yicha qisqa va foydali maslahatlar.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            to={`/maslahatlar/${post.slug}`}
            className="group overflow-hidden rounded-lg border border-gray-200 transition hover:border-brand-300 hover:shadow-md"
          >
            <div className="h-40 overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.date).toLocaleDateString('uz-UZ')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readMinutes} daqiqa
                </span>
              </div>
              <h2 className="mt-2 font-semibold text-gray-900">{post.title}</h2>
              <p className="mt-1.5 text-sm text-gray-500">{post.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                O'qish
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
