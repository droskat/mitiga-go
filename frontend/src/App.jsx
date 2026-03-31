import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import PendingApproval from './pages/PendingApproval'
import Feed from './pages/Feed'
import GossipDetail from './pages/GossipDetail'
import CreateGossip from './pages/CreateGossip'
import Scoreboard from './pages/Scoreboard'
import Nicknames from './pages/Nicknames'
import Approvals from './pages/Approvals'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isApproved } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (!isApproved) return <Navigate to="/pending" />
  return children
}

function PendingRoute({ children }) {
  const { isAuthenticated, isApproved } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (isApproved) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending" element={<PendingRoute><PendingApproval /></PendingRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Feed />} />
        <Route path="gossip/:id" element={<GossipDetail />} />
        <Route path="create" element={<CreateGossip />} />
        <Route path="scoreboard" element={<Scoreboard />} />
        <Route path="nicknames" element={<Nicknames />} />
        <Route path="approvals" element={<Approvals />} />
      </Route>
    </Routes>
  )
}
