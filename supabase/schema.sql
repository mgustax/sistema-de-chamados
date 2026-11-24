-- Contrato de referência do Meu Chamado.
-- Valide os nomes com o modelo acadêmico antes de aplicar em um banco existente.

create table if not exists public."Usuario" (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil text not null default 'morador' check (perfil in ('morador', 'funcionario')),
  categoria text,
  bloco text,
  apartamento text,
  criado_em timestamptz not null default now(),
  constraint funcionario_com_categoria check (perfil <> 'funcionario' or categoria is not null)
);

create table if not exists public."Local" (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);

create table if not exists public."Chamado" (
  id uuid primary key default gen_random_uuid(),
  descricao text not null check (char_length(descricao) between 3 and 800),
  categoria text not null,
  status text not null default 'Aberto' check (status in ('Aberto', 'Aceito', 'Feito')),
  data_abertura timestamptz not null default now(),
  morador_id uuid not null,
  local_id uuid not null,
  atendente_id uuid,
  constraint "Chamado_morador_id_fkey" foreign key (morador_id) references public."Usuario"(id) on delete restrict,
  constraint "Chamado_local_id_fkey" foreign key (local_id) references public."Local"(id) on delete restrict,
  constraint "Chamado_atendente_id_fkey" foreign key (atendente_id) references public."Usuario"(id) on delete restrict,
  constraint chamado_atendimento_consistente check (
    (status = 'Aberto' and atendente_id is null) or
    (status in ('Aceito', 'Feito') and atendente_id is not null)
  )
);

create index if not exists chamado_morador_idx on public."Chamado" (morador_id, data_abertura desc);
create index if not exists chamado_fila_idx on public."Chamado" (categoria, status, data_abertura);
create index if not exists chamado_atendente_idx on public."Chamado" (atendente_id, status);

-- O cadastro público ignora qualquer tentativa de informar perfil e sempre cria morador.
create or replace function public.criar_perfil_de_morador()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."Usuario" (auth_id, nome, email, perfil, bloco, apartamento)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), split_part(new.email, '@', 1)),
    new.email,
    'morador',
    nullif(new.raw_user_meta_data ->> 'bloco', ''),
    nullif(new.raw_user_meta_data ->> 'apartamento', '')
  );
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario_auth on auth.users;
create trigger ao_criar_usuario_auth
  after insert on auth.users
  for each row execute procedure public.criar_perfil_de_morador();

-- Funções auxiliares SECURITY DEFINER evitam recursão nas políticas de Usuario.
create or replace function public.meu_usuario_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public."Usuario" where auth_id = auth.uid() limit 1 $$;

create or replace function public.meu_perfil()
returns text language sql stable security definer set search_path = public
as $$ select perfil from public."Usuario" where auth_id = auth.uid() limit 1 $$;

create or replace function public.minha_categoria()
returns text language sql stable security definer set search_path = public
as $$ select categoria from public."Usuario" where auth_id = auth.uid() limit 1 $$;

revoke all on function public.meu_usuario_id() from public;
revoke all on function public.meu_perfil() from public;
revoke all on function public.minha_categoria() from public;
grant execute on function public.meu_usuario_id() to authenticated;
grant execute on function public.meu_perfil() to authenticated;
grant execute on function public.minha_categoria() to authenticated;

alter table public."Usuario" enable row level security;
alter table public."Local" enable row level security;
alter table public."Chamado" enable row level security;

create policy "usuario_le_proprio_ou_equipe_le_nomes"
on public."Usuario" for select to authenticated
using (auth_id = auth.uid() or public.meu_perfil() = 'funcionario');

create policy "usuario_atualiza_proprio_perfil"
on public."Usuario" for update to authenticated
using (auth_id = auth.uid())
with check (auth_id = auth.uid());

create policy "autenticados_listam_locais"
on public."Local" for select to authenticated
using (ativo = true);

create policy "morador_le_os_proprios_chamados"
on public."Chamado" for select to authenticated
using (
  morador_id = public.meu_usuario_id()
  or (
    public.meu_perfil() = 'funcionario'
    and (atendente_id = public.meu_usuario_id() or (status = 'Aberto' and categoria = public.minha_categoria()))
  )
);

create policy "morador_cria_chamado_aberto"
on public."Chamado" for insert to authenticated
with check (
  public.meu_perfil() = 'morador'
  and morador_id = public.meu_usuario_id()
  and status = 'Aberto'
  and atendente_id is null
);

create policy "participantes_atualizam_chamado"
on public."Chamado" for update to authenticated
using (
  (public.meu_perfil() = 'morador' and morador_id = public.meu_usuario_id() and status = 'Aberto')
  or
  (public.meu_perfil() = 'funcionario' and (
    (status = 'Aberto' and atendente_id is null and categoria = public.minha_categoria())
    or atendente_id = public.meu_usuario_id()
  ))
)
with check (
  morador_id is not null and (
    (public.meu_perfil() = 'morador' and morador_id = public.meu_usuario_id())
    or (public.meu_perfil() = 'funcionario' and atendente_id = public.meu_usuario_id())
  )
);

create policy "morador_exclui_chamado_aberto"
on public."Chamado" for delete to authenticated
using (public.meu_perfil() = 'morador' and morador_id = public.meu_usuario_id() and status = 'Aberto');

-- Reforço de integridade: bloqueia alterações de campos/estados fora do fluxo esperado.
create or replace function public.validar_alteracao_chamado()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_usuario uuid := public.meu_usuario_id();
  v_perfil text := public.meu_perfil();
  v_categoria text := public.minha_categoria();
begin
  if v_perfil = 'morador' then
    if old.morador_id <> v_usuario or old.status <> 'Aberto'
      or new.morador_id <> old.morador_id
      or new.status <> old.status
      or new.atendente_id is distinct from old.atendente_id
      or new.data_abertura <> old.data_abertura then
      raise exception 'O morador só pode editar o conteúdo de chamado próprio e aberto';
    end if;
  elsif v_perfil = 'funcionario' then
    if new.descricao <> old.descricao or new.categoria <> old.categoria
      or new.local_id <> old.local_id or new.morador_id <> old.morador_id
      or new.data_abertura <> old.data_abertura then
      raise exception 'A equipe não pode alterar o conteúdo do chamado';
    end if;

    if not (
      (old.status = 'Aberto' and old.atendente_id is null and old.categoria = v_categoria
        and new.status = 'Aceito' and new.atendente_id = v_usuario)
      or
      (old.status = 'Aceito' and old.atendente_id = v_usuario
        and new.status = 'Feito' and new.atendente_id = v_usuario)
    ) then
      raise exception 'Transição de status não permitida';
    end if;
  else
    raise exception 'Perfil sem permissão para alterar chamados';
  end if;
  return new;
end;
$$;

drop trigger if exists validar_alteracao_chamado on public."Chamado";
create trigger validar_alteracao_chamado
  before update on public."Chamado"
  for each row execute procedure public.validar_alteracao_chamado();

grant select on public."Usuario" to authenticated;
grant update (nome, bloco, apartamento) on public."Usuario" to authenticated;
grant select on public."Local" to authenticated;
grant select, insert, update, delete on public."Chamado" to authenticated;

-- Locais iniciais opcionais para a demonstração.
insert into public."Local" (nome) values
  ('Área da piscina'), ('Corredor do bloco A'), ('Corredor do bloco B'),
  ('Elevador social'), ('Garagem'), ('Hall de entrada'), ('Salão de festas')
on conflict (nome) do nothing;
