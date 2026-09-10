import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ThemedToastContainer } from './components/common/ThemedToastContainer.tsx'
import { PageLoader } from './components/common/PageLoader.tsx'
import ProtectedRoute from './routes/ProtectedRoute.tsx'
import PublicOnlyRoute from './routes/PublicOnlyRoute.tsx'

const LoginPage = lazy(() => import('./pages/login/LoginPage.tsx'))
const RegistroPage = lazy(() => import('./pages/registro/RegistroPage.tsx'))
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password/ForgotPasswordPage.tsx'))
const ResetPasswordPage = lazy(() => import('./pages/reset-password/ResetPasswordPage.tsx'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.tsx'))
const TopUpPage = lazy(() => import('./pages/topup/TopUpPage.tsx'))
const TransferPage = lazy(() => import('./pages/transfer/TransferPage.tsx'))
const ExchangePage = lazy(() => import('./pages/exchange/ExchangePage.tsx'))
const HistorialPage = lazy(() => import('./pages/historial/HistorialPage.tsx'))
const ConfiguracionPage = lazy(() => import('./pages/configuracion/ConfiguracionPage.tsx'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage.tsx'))
const SoportePage = lazy(() => import('./pages/soporte/SoportePage.tsx'))
const NotFoundPage = lazy(() => import('./pages/not-found/NotFoundPage.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedToastContainer />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
