import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import PrivateRoute from './components/PrivateRoute'

// Code-splitting : ces pages sont chargées à la demande
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Demandes        = lazy(() => import('./pages/Demandes'))
const AllDemandes     = lazy(() => import('./pages/AllDemandes'))
const Employes        = lazy(() => import('./pages/Employes'))
const Profil          = lazy(() => import('./pages/Profil'))
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword   = lazy(() => import('./pages/ResetPassword'))
const PasswordResets  = lazy(() => import('./pages/PasswordResets'))
const VerifyDocument  = lazy(() => import('./pages/VerifyDocument'))
const Chatbot         = lazy(() => import('./pages/Chatbot'))
const Messages        = lazy(() => import('./pages/Messages'))

function Fallback() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text2)',
      fontSize: 14,
    }}>
      <div style={{
        width: 28, height: 28,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/"                element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify"          element={<VerifyDocument />} />
        <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/demandes"        element={<PrivateRoute><Demandes /></PrivateRoute>} />
        <Route path="/all-demandes"    element={<PrivateRoute><AllDemandes /></PrivateRoute>} />
        <Route path="/employes"        element={<PrivateRoute><Employes /></PrivateRoute>} />
        <Route path="/password-resets" element={<PrivateRoute><PasswordResets /></PrivateRoute>} />
        <Route path="/profil"          element={<PrivateRoute><Profil /></PrivateRoute>} />
        <Route path="/chatbot"         element={<PrivateRoute><Chatbot /></PrivateRoute>} />
        <Route path="/messages"        element={<PrivateRoute><Messages /></PrivateRoute>} />
      </Routes>
    </Suspense>
  )
}

export default App
