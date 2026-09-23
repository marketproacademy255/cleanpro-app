import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileBookingBar, { MOBILE_BAR_HIDDEN_PREFIXES } from '@/components/MobileBookingBar'
import FloatingContact from '@/components/FloatingContact'
import LiveNotification from '@/components/LiveNotification'
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { PageSkeleton } from '@/components/SkeletonLoaders'

import Home from '@/pages/Home'

// Helper for dynamic imports that handles single-page app deployment chunk cache invalidation
function safeLazy<T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T }>) {
  return lazy(() =>
    importFn().catch((error) => {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.name === 'ChunkLoadError' ||
        String(error).includes('dynamically imported module')

      if (isChunkError) {
        const reloaded = sessionStorage.getItem('chunk_reload_attempts')
        if (!reloaded) {
          sessionStorage.setItem('chunk_reload_attempts', '1')
          window.location.reload()
          return new Promise<{ default: T }>(() => {})
        }
      }
      throw error
    }),
  )
}

const Services = safeLazy(() => import('@/pages/Services'))
const Booking = safeLazy(() => import('@/pages/Booking'))
const Login = safeLazy(() => import('@/pages/Login'))
const Register = safeLazy(() => import('@/pages/Register'))
const Dashboard = safeLazy(() => import('@/pages/Dashboard'))
const BookingDetail = safeLazy(() => import('@/pages/BookingDetail'))
const PaymentResult = safeLazy(() => import('@/pages/PaymentResult'))
const About = safeLazy(() => import('@/pages/About'))
const Contact = safeLazy(() => import('@/pages/Contact'))
const Blog = safeLazy(() => import('@/pages/Blog'))
const BlogPost = safeLazy(() => import('@/pages/BlogPost'))
const Privacy = safeLazy(() => import('@/pages/Privacy'))
const Terms = safeLazy(() => import('@/pages/Terms'))
const NotFound = safeLazy(() => import('@/pages/NotFound'))

const AdminLayout = safeLazy(() => import('@/pages/admin/AdminLayout'))
const AdminOverview = safeLazy(() => import('@/pages/admin/AdminOverview'))
const AdminBookings = safeLazy(() => import('@/pages/admin/AdminBookings'))
const AdminStaff = safeLazy(() => import('@/pages/admin/AdminStaff'))
const AdminServices = safeLazy(() => import('@/pages/admin/AdminServices'))
const AdminAddons = safeLazy(() => import('@/pages/admin/AdminAddons'))
const AdminReviews = safeLazy(() => import('@/pages/admin/AdminReviews'))

import MouseGlowFollower from '@/components/MouseGlowFollower'

export default function App() {
  const { pathname } = useLocation()
  const showMobileBar = !MOBILE_BAR_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <ErrorBoundary>
      <MouseGlowFollower />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className={`flex-1 ${showMobileBar ? 'pb-16 md:pb-0' : ''}`}>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/payment-result" element={<PaymentResult />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/booking/:id"
                element={
                  <ProtectedRoute>
                    <BookingDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="addons" element={<AdminAddons />} />
                <Route path="reviews" element={<AdminReviews />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <MobileBookingBar />
        <FloatingContact />
        <LiveNotification />
      </div>
    </ErrorBoundary>
  )
}

