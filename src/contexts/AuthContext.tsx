import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { DEMO_EMAIL, DEMO_SENHA, encerrarModoDemo, iniciarModoDemo, modoDemoAtivo, USUARIO_DEMO } from '../lib/demo'
import type { Usuario } from '../types'

interface CadastroInput {
  nome: string
  email: string
  senha: string
  bloco: string
  apartamento: string
}

interface AuthContextValue {
  session: Session | null
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (dados: CadastroInput) => Promise<{ confirmarEmail: boolean }>
  sair: () => Promise<void>
  recarregarPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  async function carregarPerfil(authId?: string) {
    if (!authId) {
      setUsuario(null)
      return
    }
    const { data, error } = await supabase
      .from('Usuario')
      .select('*')
      .eq('auth_id', authId)
      .single()
    if (error) throw new Error(`Não foi possível carregar o perfil: ${error.message}`)
    setUsuario(data as Usuario)
  }

  useEffect(() => {
    if (modoDemoAtivo()) {
      setSession({ user: { id: USUARIO_DEMO.auth_id } } as Session)
      setUsuario(USUARIO_DEMO)
      setCarregando(false)
      return
    }
    if (!supabaseConfigurado) {
      setCarregando(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      try {
        await carregarPerfil(data.session?.user.id)
      } finally {
        setCarregando(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSession) => {
      setSession(novaSession)
      if (!novaSession) setUsuario(null)
      else void carregarPerfil(novaSession.user.id)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function entrar(email: string, senha: string) {
    if (email.toLowerCase() === DEMO_EMAIL && senha === DEMO_SENHA) {
      iniciarModoDemo()
      setSession({ user: { id: USUARIO_DEMO.auth_id } } as Session)
      setUsuario(USUARIO_DEMO)
      return
    }
    if (!supabaseConfigurado) throw new Error('Configure o Supabase antes de entrar.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(error.message)
    setSession(data.session)
    await carregarPerfil(data.user.id)
  }

  async function cadastrar(dados: CadastroInput) {
    if (!supabaseConfigurado) throw new Error('Configure o Supabase antes de criar uma conta.')
    const { data, error } = await supabase.auth.signUp({
      email: dados.email,
      password: dados.senha,
      options: {
        data: {
          nome: dados.nome,
          bloco: dados.bloco,
          apartamento: dados.apartamento,
          perfil: 'morador',
        },
      },
    })
    if (error) throw new Error(error.message)

    // O gatilho documentado em supabase/schema.sql cria o perfil com segurança.
    if (data.session) {
      setSession(data.session)
      await carregarPerfil(data.user?.id)
    }
    return { confirmarEmail: !data.session }
  }

  async function sair() {
    if (modoDemoAtivo()) encerrarModoDemo()
    else if (supabaseConfigurado) await supabase.auth.signOut()
    setSession(null)
    setUsuario(null)
  }

  const value = {
    session,
    usuario,
    carregando,
    entrar,
    cadastrar,
    sair,
    recarregarPerfil: () => carregarPerfil(session?.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return context
}
