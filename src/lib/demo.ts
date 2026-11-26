import type { Chamado, ChamadoInput, LocalCondominio, Usuario } from '../types'

export const DEMO_EMAIL = 'morador@teste.local'
export const DEMO_SENHA = 'Teste@123'
export const DEMO_FUNCIONARIO_EMAIL = 'funcionario@teste.local'
export const DEMO_FUNCIONARIO_SENHA = 'Teste@123'

const CHAVE_SESSAO = 'meu-chamado:demo-sessao'
const CHAVE_CHAMADOS = 'meu-chamado:demo-chamados'
const CHAVE_VERSAO = 'meu-chamado:demo-versao'
const VERSAO_DADOS = '2'

export const USUARIO_DEMO: Usuario = {
  id: 'demo-morador-001',
  auth_id: 'demo-auth-morador-001',
  nome: 'Marina Oliveira',
  email: DEMO_EMAIL,
  perfil: 'morador',
  categoria: null,
  bloco: 'Bloco B',
  apartamento: '204',
}

export const FUNCIONARIO_DEMO: Usuario = {
  id: 'demo-funcionario-001',
  auth_id: 'demo-auth-funcionario-001',
  nome: 'Carlos Mendes',
  email: DEMO_FUNCIONARIO_EMAIL,
  perfil: 'funcionario',
  categoria: 'Elétrica',
  bloco: null,
  apartamento: null,
}

export const LOCAIS_DEMO: LocalCondominio[] = [
  { id: 'local-1', nome: 'Apartamento 204' },
  { id: 'local-2', nome: 'Garagem' },
  { id: 'local-3', nome: 'Hall de entrada' },
  { id: 'local-4', nome: 'Área da piscina' },
  { id: 'local-5', nome: 'Elevador social' },
]

const MORADOR_RESUMIDO = {
  id: USUARIO_DEMO.id,
  nome: USUARIO_DEMO.nome,
  bloco: USUARIO_DEMO.bloco,
  apartamento: USUARIO_DEMO.apartamento,
}

function diasAtras(dias: number) {
  return new Date(Date.now() - dias * 86_400_000).toISOString()
}

function chamadosIniciais(): Chamado[] {
  return [
    {
      id: 'demo-chamado-001',
      descricao: 'Vazamento na torneira da cozinha',
      categoria: 'Hidráulica',
      status: 'Aberto',
      data_abertura: diasAtras(1),
      morador_id: USUARIO_DEMO.id,
      local_id: 'local-1',
      atendente_id: null,
      local: LOCAIS_DEMO[0],
      morador: MORADOR_RESUMIDO,
    },
    {
      id: 'demo-chamado-002',
      descricao: 'Lâmpada queimada próxima à vaga 32',
      categoria: 'Elétrica',
      status: 'Aceito',
      data_abertura: diasAtras(3),
      morador_id: USUARIO_DEMO.id,
      local_id: 'local-2',
      atendente_id: FUNCIONARIO_DEMO.id,
      local: LOCAIS_DEMO[1],
      morador: MORADOR_RESUMIDO,
      atendente: { id: FUNCIONARIO_DEMO.id, nome: FUNCIONARIO_DEMO.nome },
    },
    {
      id: 'demo-chamado-003',
      descricao: 'Porta do hall fechando com dificuldade',
      categoria: 'Estrutura',
      status: 'Feito',
      data_abertura: diasAtras(8),
      morador_id: USUARIO_DEMO.id,
      local_id: 'local-3',
      atendente_id: 'demo-funcionario-002',
      local: LOCAIS_DEMO[2],
      morador: MORADOR_RESUMIDO,
      atendente: { id: 'demo-funcionario-002', nome: 'Ana Souza' },
    },
    {
      id: 'demo-chamado-004',
      descricao: 'Tomada do salão de festas sem energia',
      categoria: 'Elétrica',
      status: 'Aberto',
      data_abertura: diasAtras(2),
      morador_id: USUARIO_DEMO.id,
      local_id: 'local-4',
      atendente_id: null,
      local: LOCAIS_DEMO[3],
      morador: MORADOR_RESUMIDO,
    },
  ]
}

export function obterUsuarioDemoAtivo(): Usuario | null {
  const sessao = localStorage.getItem(CHAVE_SESSAO)
  if (sessao === FUNCIONARIO_DEMO.auth_id) return FUNCIONARIO_DEMO
  // Mantém compatibilidade com sessões demo criadas pela versão anterior.
  if (sessao === 'ativa' || sessao === USUARIO_DEMO.auth_id) return USUARIO_DEMO
  return null
}

export function modoDemoAtivo() {
  return obterUsuarioDemoAtivo() !== null
}

export function iniciarModoDemo(usuario: Usuario = USUARIO_DEMO) {
  localStorage.setItem(CHAVE_SESSAO, usuario.auth_id)
  if (!localStorage.getItem(CHAVE_CHAMADOS)) salvarChamadosDemo(chamadosIniciais())
  if (localStorage.getItem(CHAVE_VERSAO) !== VERSAO_DADOS) {
    const atuais: Chamado[] = listarChamadosDemo().map((chamado) => ({
      ...chamado,
      morador: chamado.morador ?? MORADOR_RESUMIDO,
    }))
    const chamadoEletrico = chamadosIniciais().find((chamado) => chamado.id === 'demo-chamado-004')
    if (chamadoEletrico && !atuais.some((chamado) => chamado.id === chamadoEletrico.id)) {
      atuais.push(chamadoEletrico)
    }
    salvarChamadosDemo(atuais)
    localStorage.setItem(CHAVE_VERSAO, VERSAO_DADOS)
  }
}

export function encerrarModoDemo() {
  localStorage.removeItem(CHAVE_SESSAO)
}

export function listarChamadosDemo(): Chamado[] {
  const salvos = localStorage.getItem(CHAVE_CHAMADOS)
  if (!salvos) {
    const iniciais = chamadosIniciais()
    salvarChamadosDemo(iniciais)
    return iniciais
  }
  try {
    return JSON.parse(salvos) as Chamado[]
  } catch {
    const iniciais = chamadosIniciais()
    salvarChamadosDemo(iniciais)
    return iniciais
  }
}

export function salvarChamadosDemo(chamados: Chamado[]) {
  localStorage.setItem(CHAVE_CHAMADOS, JSON.stringify(chamados))
}

export function criarChamadoDemo(input: ChamadoInput): Chamado {
  const chamado: Chamado = {
    id: crypto.randomUUID(),
    ...input,
    status: 'Aberto',
    data_abertura: new Date().toISOString(),
    morador_id: USUARIO_DEMO.id,
    atendente_id: null,
    local: LOCAIS_DEMO.find((local) => local.id === input.local_id) ?? null,
    morador: MORADOR_RESUMIDO,
  }
  salvarChamadosDemo([chamado, ...listarChamadosDemo()])
  return chamado
}

export function editarChamadoDemo(id: string, input: ChamadoInput): Chamado {
  const chamados = listarChamadosDemo()
  const atual = chamados.find((item) => item.id === id)
  if (!atual || atual.status !== 'Aberto') throw new Error('Este chamado não pode mais ser editado.')
  const atualizado: Chamado = {
    ...atual,
    ...input,
    local: LOCAIS_DEMO.find((local) => local.id === input.local_id) ?? null,
  }
  salvarChamadosDemo(chamados.map((item) => item.id === id ? atualizado : item))
  return atualizado
}

export function excluirChamadoDemo(id: string) {
  const chamados = listarChamadosDemo()
  const atual = chamados.find((item) => item.id === id)
  if (!atual || atual.status !== 'Aberto') throw new Error('Somente chamados abertos podem ser excluídos.')
  salvarChamadosDemo(chamados.filter((item) => item.id !== id))
}

export function listarFilaDaEquipeDemo(funcionarioId: string, categoria: string): Chamado[] {
  return listarChamadosDemo()
    .filter((chamado) =>
      (chamado.status === 'Aberto' && chamado.categoria === categoria)
      || chamado.atendente_id === funcionarioId,
    )
    .sort((a, b) => a.data_abertura.localeCompare(b.data_abertura))
}

export function aceitarChamadoDemo(id: string, funcionario: Usuario): Chamado {
  const chamados = listarChamadosDemo()
  const atual = chamados.find((item) => item.id === id)
  if (!atual || atual.status !== 'Aberto' || atual.atendente_id) {
    throw new Error('Este chamado acabou de ser assumido por outra pessoa da equipe.')
  }
  if (atual.categoria !== funcionario.categoria) {
    throw new Error('Este chamado pertence a outra categoria de manutenção.')
  }
  const atualizado: Chamado = {
    ...atual,
    status: 'Aceito',
    atendente_id: funcionario.id,
    atendente: { id: funcionario.id, nome: funcionario.nome },
  }
  salvarChamadosDemo(chamados.map((item) => item.id === id ? atualizado : item))
  return atualizado
}

export function marcarComoFeitoDemo(id: string, funcionarioId: string): Chamado {
  const chamados = listarChamadosDemo()
  const atual = chamados.find((item) => item.id === id)
  if (!atual || atual.status !== 'Aceito' || atual.atendente_id !== funcionarioId) {
    throw new Error('Somente o responsável pode concluir este chamado.')
  }
  const atualizado: Chamado = { ...atual, status: 'Feito' }
  salvarChamadosDemo(chamados.map((item) => item.id === id ? atualizado : item))
  return atualizado
}
