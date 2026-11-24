import type { Chamado, ChamadoInput, LocalCondominio, Usuario } from '../types'

export const DEMO_EMAIL = 'morador@teste.local'
export const DEMO_SENHA = 'Teste@123'
const CHAVE_SESSAO = 'meu-chamado:demo-sessao'
const CHAVE_CHAMADOS = 'meu-chamado:demo-chamados'

export const USUARIO_DEMO: Usuario = {
  id: 'demo-morador-001',
  auth_id: 'demo-auth-001',
  nome: 'Marina Oliveira',
  email: DEMO_EMAIL,
  perfil: 'morador',
  categoria: null,
  bloco: 'Bloco B',
  apartamento: '204',
}

export const LOCAIS_DEMO: LocalCondominio[] = [
  { id: 'local-1', nome: 'Apartamento 204' },
  { id: 'local-2', nome: 'Garagem' },
  { id: 'local-3', nome: 'Hall de entrada' },
  { id: 'local-4', nome: 'Área da piscina' },
  { id: 'local-5', nome: 'Elevador social' },
]

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
    },
    {
      id: 'demo-chamado-002',
      descricao: 'Lâmpada queimada próxima à vaga 32',
      categoria: 'Elétrica',
      status: 'Aceito',
      data_abertura: diasAtras(3),
      morador_id: USUARIO_DEMO.id,
      local_id: 'local-2',
      atendente_id: 'demo-funcionario-001',
      local: LOCAIS_DEMO[1],
      atendente: { id: 'demo-funcionario-001', nome: 'Carlos Mendes' },
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
      atendente: { id: 'demo-funcionario-002', nome: 'Ana Souza' },
    },
  ]
}

export function modoDemoAtivo() {
  return localStorage.getItem(CHAVE_SESSAO) === 'ativa'
}

export function iniciarModoDemo() {
  localStorage.setItem(CHAVE_SESSAO, 'ativa')
  if (!localStorage.getItem(CHAVE_CHAMADOS)) salvarChamadosDemo(chamadosIniciais())
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
