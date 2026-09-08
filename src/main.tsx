import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import LoginPage from './pages/login/LoginPage.tsx'
import RegistroPage from './pages/registro/RegistroPage.tsx'
import ForgotPasswordPage from './pages/forgot-password/ForgotPasswordPage.tsx'
import ResetPasswordPage from './pages/reset-password/ResetPasswordPage.tsx'
import DashboardPage from './pages/dashboard/DashboardPage.tsx'
import TopUpPage from './pages/topup/TopUpPage.tsx'
import TransferPage from './pages/transfer/TransferPage.tsx'
import ExchangePage from './pages/exchange/ExchangePage.tsx'
import HistorialPage from './pages/historial/HistorialPage.tsx'
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage.tsx'
import AdminPage from './pages/admin/AdminPage.tsx'
import SoportePage from './pages/soporte/SoportePage.tsx'
import NotFoundPage from './pages/not-found/NotFoundPage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ThemedToastContainer } from './components/common/ThemedToastContainer.tsx'
import ProtectedRoute from './routes/ProtectedRoute.tsx'
import PublicOnlyRoute from './routes/PublicOnlyRoute.tsx'

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <ThemeProvider>
      <ThemedToastContainer />
      <AuthProvider>
        <BrowserRouter>

        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/registro" element={<PublicOnlyRoute><RegistroPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/topup" element={<ProtectedRoute><TopUpPage /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
          <Route path="/exchange" element={<ProtectedRoute><ExchangePage /></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><HistorialPage /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/soporte" element={<SoportePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
</StrictMode>,
)
