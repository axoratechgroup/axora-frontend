import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import LoginPage from './pages/login/LoginPage.tsx'
import RegistroPage from './pages/registro/RegistroPage.tsx'
import DashboardPage from './pages/dashboard/DashboardPage.tsx'
import TopUpPage from './pages/topup/TopUpPage.tsx'
import TransferPage from './pages/transfer/TransferPage.tsx'
import ExchangePage from './pages/exchange/ExchangePage.tsx'
import HistorialPage from './pages/historial/HistorialPage.tsx'
import NotFoundPage from './pages/not-found/NotFoundPage.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import ProtectedRoute from './routes/ProtectedRoute.tsx'
import PublicOnlyRoute from './routes/PublicOnlyRoute.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/registro" element={<PublicOnlyRoute><RegistroPage /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/topup" element={<ProtectedRoute><TopUpPage /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
          <Route path="/exchange" element={<ProtectedRoute><ExchangePage /></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><HistorialPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
