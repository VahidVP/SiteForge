import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { LangProvider } from './context/LangContext'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import PaymentResult from './pages/PaymentResult'
import OwnerLogin from './pages/OwnerLogin'
import Admin from './pages/Admin'

function ScrollToTop() {
  const pathname = useLocation().pathname
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <div className="site-main">
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="/owner" element={<OwnerLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
      <Footer />
      </BrowserRouter>
    </LangProvider>
  )
}
