import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileBookingBar, { MOBILE_BAR_HIDDEN_PREFIXES } from '@/components/MobileBookingBar'
import FloatingContact from '@/components/FloatingContact'
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute'

import Home from '@/pages/Home'
import Services from '@/pages/Services'
import Booking from '@/pages/Booking'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import BookingDetail from '@/pages/BookingDetail'
import PaymentResult from '@/pages/PaymentResult'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import NotFound from '@/pages/NotFound'

import AdminLayout from '@/pages/admin/AdminLayout'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminBookings from '@/pages/admin/AdminBookings'
import AdminStaff from '@/pages/admin/AdminStaff'
import AdminServices from '@/pages/admin/AdminServices'
import AdminAddons from '@/pages/admin/AdminAddons'
import AdminReviews from '@/pages/admin/AdminReviews'

export default function App() {
  const { pathname } = useLocation()
  const showMobileBar = !MOBILE_BAR_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={`flex-1 ${showMobileBar ? 'pb-16 md:pb-0' : ''}`}>
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
      </main>
      <Footer />
      <MobileBookingBar />
      <FloatingContact />
    </div>
  )
}
