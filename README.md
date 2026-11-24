# Meu Chamado

Interface web para cadastro e acompanhamento de chamados de manutenção em condomínios. O projeto foi desenvolvido para uma demonstração ao vivo de CRUD com persistência no PostgreSQL do Supabase.

## Stack

- React 18, TypeScript e Vite
- Supabase Auth + `@supabase/supabase-js`
- PostgreSQL com Row-Level Security (RLS)
- CSS responsivo, fonte Inter local e ícones Lucide

## Rodar localmente

Pré-requisitos: Node.js 20 ou superior e um projeto no Supabase.

```bash
npm install
copy .env.example .env
npm run dev
```

No PowerShell, `Copy-Item .env.example .env` faz a mesma cópia. Preencha no `.env`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICAVEL
```

Use somente a chave publicável (`anon`/publishable) no frontend. Nunca coloque `service_role` no Vite: qualquer variável `VITE_*` é enviada ao navegador.

### Conta de demonstração sem banco

É possível testar o painel do morador e todo o CRUD sem configurar o Supabase. Na tela de entrada, clique em **Entrar com conta de teste** ou use:

```text
E-mail: morador@teste.local
Senha:  Teste@123
```

Nesse modo, os chamados são armazenados somente no `localStorage` do navegador. Eles não são enviados ao Supabase e podem ser apagados ao limpar os dados do site. O modo de demonstração não substitui os testes de autenticação, RLS ou concorrência no banco real.

No Supabase SQL Editor, execute [supabase/schema.sql](supabase/schema.sql) para criar o contrato de referência, o gatilho de perfil, índices e políticas RLS. Em **Authentication > URL Configuration**, inclua a URL local e a URL da Vercel nos redirects permitidos.

## Contrato do banco e ponto de validação

O repositório recebido não continha arquivos, commits ou documentos e não havia credenciais para consultar o Supabase. Por isso não foi possível confirmar um esquema existente. A implementação assume os nomes citados no enunciado e documenta explicitamente o contrato adotado:

| Tabela | Campos usados pela aplicação |
| --- | --- |
| `Usuario` | `id`, `auth_id`, `nome`, `email`, `perfil`, `categoria`, `bloco`, `apartamento` |
| `Local` | `id`, `nome`, `ativo` |
| `Chamado` | `id`, `descricao`, `categoria`, `status`, `data_abertura`, `morador_id`, `local_id`, `atendente_id` |

As chaves estrangeiras esperadas se chamam `Chamado_morador_id_fkey`, `Chamado_local_id_fkey` e `Chamado_atendente_id_fkey`, pois esses nomes são usados nos relacionamentos do PostgREST em `src/services/chamados.ts`.

Antes de conectar a um banco já criado, a equipe deve conferir:

1. se as tabelas usam maiúsculas e aspas (`"Usuario"`, `"Local"`, `"Chamado"`) ou nomes em minúsculas;
2. os nomes reais das colunas e constraints de chave estrangeira;
3. os valores oficiais de `perfil`, `categoria` e `status`;
4. se `auth_id` é o vínculo definido com `auth.users.id`;
5. quais campos de perfil são obrigatórios no modelo acadêmico.

Se os nomes divergirem, ajuste apenas os tipos e consultas centralizados. O cadastro público sempre grava `perfil = 'morador'` por gatilho; funcionários devem ser promovidos separadamente pelo SQL Editor ou por uma futura tela administrativa. Exemplo:

```sql
update public."Usuario"
set perfil = 'funcionario', categoria = 'Elétrica'
where email = 'funcionario@exemplo.com';
```

## Fluxos implementados

- Login e cadastro de morador com Supabase Auth, incluindo confirmação por e-mail.
- Perfil criado por gatilho, ignorando tentativas do cliente de criar funcionário.
- Morador: lista, busca, filtro, detalhes, criação, edição e exclusão com confirmação.
- Chamado novo sempre nasce `Aberto` e sem atendente.
- Equipe: fila limitada à categoria, chamados assumidos e conclusão do atendimento.
- Aceite atômico por `UPDATE ... WHERE status = 'Aberto' AND atendente_id IS NULL`; apenas uma atualização concorrente retorna uma linha.
- RLS por perfil e trigger de validação das transições de estado.
- Estados de carregamento, vazio, erro, sucesso e configuração pendente.
- Layout lateral no desktop e cartões/cabeçalho adaptados para celular.

As operações de banco relacionadas aos chamados estão centralizadas em [src/services/chamados.ts](src/services/chamados.ts), facilitando a apresentação do fluxo.

## Verificações e build

```bash
npm run lint
npm run build
npm run preview
```

Sem as credenciais do projeto, o build e o fluxo de configuração pendente podem ser verificados localmente, mas os fluxos reais de autenticação e CRUD precisam ser validados com o Supabase da equipe. Um roteiro recomendado para a apresentação:

1. criar/entrar com um morador;
2. abrir um chamado e confirmar que aparece na lista e no Table Editor;
3. editar e excluir um chamado ainda aberto;
4. entrar como funcionário da categoria correspondente;
5. aceitar o chamado e marcá-lo como feito;
6. voltar ao morador e confirmar o novo status.

## Publicar na Vercel

Importe o repositório na Vercel com framework **Vite**, build `npm run build` e diretório de saída `dist`. Cadastre as duas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. O `vercel.json` já redireciona rotas da SPA para `index.html`.
