import { ArrowLeft, Building2, CheckCircle2, Eye, EyeOff, ShieldCheck, Wrench } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert } from '../components/Feedback'
import { Logo } from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { supabaseConfigurado } from '../lib/supabase'
import { DEMO_EMAIL, DEMO_SENHA } from '../lib/demo'

export function AuthPage() {
  const { session, entrar, cadastrar } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', senha: '', bloco: '', apartamento: '' })

  if (session) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setErro('')
    setSucesso('')
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        await entrar(form.email, form.senha)
      } else {
        const resultado = await cadastrar(form)
        if (resultado.confirmarEmail) {
          setSucesso('Conta criada! Confira seu e-mail para confirmar o cadastro e entrar.')
          setModo('entrar')
        }
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível continuar.')
    } finally {
      setEnviando(false)
    }
  }

  async function entrarComoDemo() {
    setErro('')
    setSucesso('')
    setEnviando(true)
    setForm((atual) => ({ ...atual, email: DEMO_EMAIL, senha: DEMO_SENHA }))
    try {
      await entrar(DEMO_EMAIL, DEMO_SENHA)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível iniciar a demonstração.')
    } finally {
      setEnviando(false)
    }
  }

  function atualizar(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <Logo />
        <div className="auth-brand-copy">
          <span className="eyebrow"><span /> Cuidado que aproxima</span>
          <h1>Manutenção do condomínio, <em>sem complicação.</em></h1>
          <p>Abra chamados, acompanhe cada etapa e saiba quando tudo estiver resolvido.</p>
          <div className="brand-points">
            <span><CheckCircle2 /> Acompanhamento em tempo real</span>
            <span><ShieldCheck /> Seus dados protegidos</span>
            <span><Wrench /> Atendimento organizado</span>
          </div>
        </div>
        <p className="auth-footer">© 2026 Meu Chamado</p>
      </section>

      <main className="auth-form-area">
        {modo === 'cadastrar' && <button className="back-link" onClick={() => setModo('entrar')}><ArrowLeft size={18} /> Voltar para entrar</button>}
        <div className="auth-card">
          <span className="auth-mobile-mark"><Building2 /></span>
          <p className="overline">{modo === 'entrar' ? 'BEM-VINDO DE VOLTA' : 'ÁREA DO MORADOR'}</p>
          <h2>{modo === 'entrar' ? 'Entre na sua conta' : 'Crie sua conta'}</h2>
          <p className="auth-subtitle">{modo === 'entrar' ? 'Acesse para acompanhar seus chamados.' : 'Cadastre-se para solicitar manutenções.'}</p>

          {!supabaseConfigurado && <Alert tipo="aviso">O Supabase ainda não está configurado. Você pode usar a conta de demonstração abaixo.</Alert>}
          {erro && <Alert tipo="erro">{erro}</Alert>}
          {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}

          <form onSubmit={submit} className="form-stack">
            {modo === 'cadastrar' && <>
              <label>Nome completo<input autoComplete="name" value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} required placeholder="Como devemos chamar você?" /></label>
              <div className="form-row">
                <label>Bloco<input value={form.bloco} onChange={(e) => atualizar('bloco', e.target.value)} required placeholder="Ex.: B" /></label>
                <label>Apartamento<input value={form.apartamento} onChange={(e) => atualizar('apartamento', e.target.value)} required placeholder="Ex.: 204" /></label>
              </div>
            </>}
            <label>E-mail<input type="email" autoComplete="email" value={form.email} onChange={(e) => atualizar('email', e.target.value)} required placeholder="voce@exemplo.com" /></label>
            <label>Senha
              <span className="password-field">
                <input type={mostrarSenha ? 'text' : 'password'} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} minLength={6} value={form.senha} onChange={(e) => atualizar('senha', e.target.value)} required placeholder="Mínimo de 6 caracteres" />
                <button type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <EyeOff /> : <Eye />}</button>
              </span>
            </label>
            <button className="button button-primary button-wide" disabled={enviando}>{enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
          </form>
          {modo === 'entrar' && <div className="demo-box">
            <div><strong>Conta de demonstração</strong><span>Funciona sem banco de dados</span></div>
            <code>{DEMO_EMAIL}</code>
            <code>{DEMO_SENHA}</code>
            <button className="button button-secondary button-wide" onClick={entrarComoDemo} disabled={enviando}>Entrar com conta de teste</button>
          </div>}
          <p className="auth-switch">{modo === 'entrar' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'} <button onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(''); setSucesso('') }}>{modo === 'entrar' ? 'Cadastre-se' : 'Entrar'}</button></p>
        </div>
      </main>
    </div>
  )
}
