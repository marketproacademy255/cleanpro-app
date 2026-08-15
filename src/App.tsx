import { Route, Routes } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
import NotFound from '@/pages/NotFound'

import AdminLayout from '@/pages/admin/AdminLayout'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminBookings from '@/pages/admin/AdminBookings'
import AdminStaff from '@/pages/admin/AdminStaff'
import AdminServices from '@/pages/admin/AdminServices'
import AdminAddons from '@/pages/admin/AdminAddons'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/xizmatlar" element={<Services />} />
          <Route path="/band-qilish" element={<Booking />} />
          <Route path="/kirish" element={<Login />} />
          <Route path="/royxatdan-otish" element={<Register />} />
          <Route path="/biz-haqimizda" element={<About />} />
          <Route path="/aloqa" element={<Contact />} />
          <Route path="/tolov-natijasi" element={<PaymentResult />} />

          <Route
            path="/kabinet"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kabinet/buyurtma/:id"
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
            <Route path="buyurtmalar" element={<AdminBookings />} />
            <Route path="xizmatchilar" element={<AdminStaff />} />
            <Route path="xizmatlar" element={<AdminServices />} />
            <Route path="qoshimchalar" element={<AdminAddons />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
