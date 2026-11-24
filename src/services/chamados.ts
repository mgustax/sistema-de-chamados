import { exigirSupabaseConfigurado, supabase } from '../lib/supabase'
import {
  criarChamadoDemo,
  editarChamadoDemo,
  excluirChamadoDemo,
  listarChamadosDemo,
  LOCAIS_DEMO,
  modoDemoAtivo,
} from '../lib/demo'
import type { Chamado, ChamadoInput, LocalCondominio, StatusChamado } from '../types'

const CAMPOS_CHAMADO = `
  *,
  local:Local!Chamado_local_id_fkey(id, nome),
  morador:Usuario!Chamado_morador_id_fkey(id, nome, bloco, apartamento),
  atendente:Usuario!Chamado_atendente_id_fkey(id, nome)
`

function verificar(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

/** Todas as leituras e mutações de chamados ficam centralizadas neste módulo. */
export async function listarLocais(): Promise<LocalCondominio[]> {
  if (modoDemoAtivo()) return LOCAIS_DEMO
  exigirSupabaseConfigurado()
  const { data, error } = await supabase.from('Local').select('id, nome').order('nome')
  verificar(error)
  return (data ?? []) as LocalCondominio[]
}

export async function listarMeusChamados(moradorId: string): Promise<Chamado[]> {
  if (modoDemoAtivo()) {
    return listarChamadosDemo()
      .filter((chamado) => chamado.morador_id === moradorId)
      .sort((a, b) => b.data_abertura.localeCompare(a.data_abertura))
  }
  exigirSupabaseConfigurado()
  const { data, error } = await supabase
    .from('Chamado')
    .select(CAMPOS_CHAMADO)
    .eq('morador_id', moradorId)
    .order('data_abertura', { ascending: false })
  verificar(error)
  return (data ?? []) as unknown as Chamado[]
}

export async function buscarChamado(id: string): Promise<Chamado> {
  if (modoDemoAtivo()) {
    const chamado = listarChamadosDemo().find((item) => item.id === id)
    if (!chamado) throw new Error('Chamado não encontrado.')
    return chamado
  }
  exigirSupabaseConfigurado()
  const { data, error } = await supabase
    .from('Chamado')
    .select(CAMPOS_CHAMADO)
    .eq('id', id)
    .single()
  verificar(error)
  return data as unknown as Chamado
}

export async function criarChamado(
  moradorId: string,
  chamado: ChamadoInput,
): Promise<Chamado> {
  if (modoDemoAtivo()) return criarChamadoDemo(chamado)
  exigirSupabaseConfigurado()
  const { data, error } = await supabase
    .from('Chamado')
    .insert({
      ...chamado,
      morador_id: moradorId,
      status: 'Aberto' satisfies StatusChamado,
      atendente_id: null,
    })
    .select(CAMPOS_CHAMADO)
    .single()
  verificar(error)
  return data as unknown as Chamado
}

export async function editarChamado(
  id: string,
  moradorId: string,
  chamado: ChamadoInput,
): Promise<Chamado> {
  if (modoDemoAtivo()) return editarChamadoDemo(id, chamado)
  exigirSupabaseConfigurado()
  const { data, error } = await supabase
    .from('Chamado')
    .update(chamado)
    .eq('id', id)
    .eq('morador_id', moradorId)
    .eq('status', 'Aberto')
    .select(CAMPOS_CHAMADO)
    .single()
  verificar(error)
  return data as unknown as Chamado
}

export async function excluirChamado(id: string, moradorId: string): Promise<void> {
  if (modoDemoAtivo()) {
    const chamado = listarChamadosDemo().find((item) => item.id === id)
    if (!chamado || chamado.morador_id !== moradorId) throw new Error('Chamado não encontrado.')
    excluirChamadoDemo(id)
    return
  }
  exigirSupabaseConfigurado()
  const { error } = await supabase
    .from('Chamado')
    .delete()
    .eq('id', id)
    .eq('morador_id', moradorId)
    .eq('status', 'Aberto')
  verificar(error)
}

export async function listarFilaDaEquipe(
  funcionarioId: string,
  categoria: string,
): Promise<Chamado[]> {
  exigirSupabaseConfigurado()
  const [disponiveis, assumidos] = await Promise.all([
    supabase
      .from('Chamado')
      .select(CAMPOS_CHAMADO)
      .eq('status', 'Aberto')
      .eq('categoria', categoria)
      .order('data_abertura', { ascending: true }),
    supabase
      .from('Chamado')
      .select(CAMPOS_CHAMADO)
      .eq('atendente_id', funcionarioId)
      .order('data_abertura', { ascending: false }),
  ])
  verificar(disponiveis.error)
  verificar(assumidos.error)
  const unicos = new Map<string, Chamado>()
  for (const item of [...(disponiveis.data ?? []), ...(assumidos.data ?? [])]) {
    const chamado = item as unknown as Chamado
    unicos.set(chamado.id, chamado)
  }
  return [...unicos.values()]
}

/**
 * UPDATE condicional: somente uma requisição consegue trocar o registro que ainda
 * está Aberto e sem atendente. A segunda recebe uma lista vazia.
 */
export async function aceitarChamado(id: string, funcionarioId: string): Promise<Chamado> {
  exigirSupabaseConfigurado()
  const { data, error } = await supabase
    .from('Chamado')
    .update({ atendente_id: funcionarioId, status: 'Aceito' satisfies StatusChamado })
    .eq('id', id)
    .eq('status', 'Aberto')
    .is('atendente_id', null)
    .select(CAMPOS_CHAMADO)
    .maybeSingle()
  verificar(error)
  if (!data) {
    throw new Error('Este chamado acabou de ser assumido por outra pessoa da equipe.')
  }
  return data as unknown as Chamado
}

export async function marcarComoFeito(id: string, funcionarioId: string): Promise<Chamado> {
  exigirSupabaseConfigurado()
  const { data, error } = await supabase
    .from('Chamado')
    .update({ status: 'Feito' satisfies StatusChamado })
    .eq('id', id)
    .eq('status', 'Aceito')
    .eq('atendente_id', funcionarioId)
    .select(CAMPOS_CHAMADO)
    .single()
  verificar(error)
  return data as unknown as Chamado
}
