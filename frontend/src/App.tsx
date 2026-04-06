import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OtpVerifyPage from './pages/auth/OtpVerifyPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import CustomerSearchPage from './pages/CustomerSearchPage'
import InboxPage from './pages/InboxPage'
import ChatPage from './pages/ChatPage'
import ProtectedRoute from './components/ProtectedRoute'
import ProfileCompletionGuard from './components/ProfileCompletionGuard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OtpVerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/search" element={<CustomerSearchPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route element={<ProfileCompletionGuard />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
