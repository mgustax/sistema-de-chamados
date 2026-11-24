import { ClipboardList, LogOut, Menu, Plus, Wrench, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { modoDemoAtivo } from '../lib/demo'
import { Logo } from './Logo'

export function AppLayout() {
  const { usuario, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const equipe = usuario?.perfil === 'funcionario'

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuAberto ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="icon-button mobile-only" onClick={() => setMenuAberto(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <nav className="nav" aria-label="Navegação principal">
          <NavLink to="/" end onClick={() => setMenuAberto(false)}>
            {equipe ? <Wrench size={19} /> : <ClipboardList size={19} />}
            {equipe ? 'Fila de manutenção' : 'Meus chamados'}
          </NavLink>
          {!equipe && <NavLink to="/chamados/novo" onClick={() => setMenuAberto(false)}><Plus size={19} /> Novo chamado</NavLink>}
        </nav>
        <div className="sidebar-user">
          <div className="avatar" aria-hidden="true">{usuario?.nome?.charAt(0).toUpperCase()}</div>
          <div className="user-copy"><strong>{usuario?.nome}</strong><span>{modoDemoAtivo() ? 'Modo demonstração' : equipe ? usuario?.categoria : [usuario?.bloco, usuario?.apartamento].filter(Boolean).join(' · ')}</span></div>
          <button className="icon-button" onClick={sair} aria-label="Sair"><LogOut size={18} /></button>
        </div>
      </aside>
      {menuAberto && <button className="menu-overlay" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />}
      <div className="app-main">
        <header className="mobile-header">
          <button className="icon-button" onClick={() => setMenuAberto(true)} aria-label="Abrir menu"><Menu /></button>
          <Logo />
          <span className="avatar avatar-small" aria-hidden="true">{usuario?.nome?.charAt(0).toUpperCase()}</span>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
