import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { Loading } from './components/Feedback'
import { useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { ChamadoDetailPage } from './pages/ChamadoDetailPage'
import { ChamadoFormPage } from './pages/ChamadoFormPage'
import { EquipeDashboard } from './pages/EquipeDashboard'
import { MoradorDashboard } from './pages/MoradorDashboard'

function AreaProtegida() {
  const { session, usuario, carregando } = useAuth()
  if (carregando) return <div className="full-loading"><Loading texto="Abrindo o Meu Chamado..." /></div>
  if (!session) return <Navigate to="/entrar" replace />
  if (!usuario) return <div className="full-loading"><p>Perfil não encontrado. Verifique o gatilho de criação de usuários no Supabase.</p></div>
  return <AppLayout />
}

function PaginaInicial() {
  const { usuario } = useAuth()
  return usuario?.perfil === 'funcionario' ? <EquipeDashboard /> : <MoradorDashboard />
}

function ApenasMorador({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  return usuario?.perfil === 'morador' ? children : <Navigate to="/" replace />
}

export default function App() {
  return <Routes>
    <Route path="/entrar" element={<AuthPage />} />
    <Route element={<AreaProtegida />}>
      <Route index element={<PaginaInicial />} />
      <Route path="chamados/novo" element={<ApenasMorador><ChamadoFormPage /></ApenasMorador>} />
      <Route path="chamados/:id" element={<ChamadoDetailPage />} />
      <Route path="chamados/:id/editar" element={<ApenasMorador><ChamadoFormPage /></ApenasMorador>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
