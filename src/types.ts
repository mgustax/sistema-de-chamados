export type StatusChamado = 'Aberto' | 'Aceito' | 'Feito'
export type TipoUsuario = 'morador' | 'funcionario'

export interface Usuario {
  id: string
  auth_id: string
  nome: string
  email: string
  perfil: TipoUsuario
  categoria: string | null
  bloco: string | null
  apartamento: string | null
}

export interface LocalCondominio {
  id: string
  nome: string
}

export interface Chamado {
  id: string
  descricao: string
  categoria: string
  status: StatusChamado
  data_abertura: string
  morador_id: string
  local_id: string
  atendente_id: string | null
  local?: LocalCondominio | null
  morador?: Pick<Usuario, 'id' | 'nome' | 'bloco' | 'apartamento'> | null
  atendente?: Pick<Usuario, 'id' | 'nome'> | null
}

export interface ChamadoInput {
  descricao: string
  categoria: string
  local_id: string
}

export const CATEGORIAS = [
  'Elétrica',
  'Hidráulica',
  'Elevador',
  'Limpeza',
  'Estrutura',
  'Outro',
] as const
