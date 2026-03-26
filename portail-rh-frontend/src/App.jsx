import { Routes, Route } from 'react-router-dom'
import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Demandes     from './pages/Demandes'
import AllDemandes  from './pages/AllDemandes'
import Employes     from './pages/Employes'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Routes>
      <Route path="/"      element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/demandes"     element={<PrivateRoute><Demandes /></PrivateRoute>} />
      <Route path="/all-demandes" element={<PrivateRoute><AllDemandes /></PrivateRoute>} />
      <Route path="/employes"     element={<PrivateRoute><Employes /></PrivateRoute>} />
    </Routes>
  )
}

export default App