import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileBookingBar, { MOBILE_BAR_HIDDEN_PREFIXES } from '@/components/MobileBookingBar'
import FloatingContact from '@/components/FloatingContact'
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { PageSkeleton } from '@/components/SkeletonLoaders'

import Home from '@/pages/Home'

const Services = lazy(() => import('@/pages/Services'))
const Booking = lazy(() => import('@/pages/Booking'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const BookingDetail = lazy(() => import('@/pages/BookingDetail'))
const PaymentResult = lazy(() => import('@/pages/PaymentResult'))
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'))
const AdminBookings = lazy(() => import('@/pages/admin/AdminBookings'))
const AdminStaff = lazy(() => import('@/pages/admin/AdminStaff'))
const AdminServices = lazy(() => import('@/pages/admin/AdminServices'))
const AdminAddons = lazy(() => import('@/pages/admin/AdminAddons'))
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'))

export default function App() {
  const { pathname } = useLocation()
  const showMobileBar = !MOBILE_BAR_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <ErrorBoundary>
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
      </div>
    </ErrorBoundary>
  )
}

