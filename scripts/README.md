# ERP System - Instruções de Setup

## Arquivos SQL

Os arquivos SQL completos estão na pasta `scripts/`:

1. `01_schema.sql` - Criação das tabelas (DDL)
2. `02_rls_policies.sql` - Políticas de segurança (RLS)
3. `03_trigger_auto_profile.sql` - Trigger para criar profile automaticamente
4. `04_complete_setup.sql` - **Setup completo em um único arquivo** (recomendado)

## Como Configurar o Banco de Dados

### Opção 1: Script Completo (Recomendado)
1. Acesse o Supabase Dashboard > SQL Editor
2. Cole o conteúdo do arquivo `scripts/04_complete_setup.sql`
3. Execute o script

### Opção 2: Scripts Separados
Execute na ordem:
1. `01_schema.sql`
2. `02_rls_policies.sql`
3. `03_trigger_auto_profile.sql`

## Variáveis de Ambiente

Configure no arquivo `.env.local`:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
\`\`\`

## Módulos Disponíveis

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | KPIs, gráficos, alertas |
| Pedidos | `/orders` | CRUD, status workflow |
| Clientes | `/customers` | CRM, histórico de compras |
| Estoque | `/inventory` | Produtos, movimentações |
| Financeiro | `/financial` | Transações, fluxo de caixa |
| Relatórios | `/reports` | Vendas, financeiro, estoque |
| Usuários | `/users` | Gestão de usuários (admin) |

## Permissões (RBAC)

| Função | Dashboard | Pedidos | Financeiro | Clientes | Estoque | Relatórios | Usuários |
|--------|-----------|---------|------------|----------|---------|------------|----------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| gerente | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| operador | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| visualizador | ✅ | 📖 | ❌ | 📖 | 📖 | ✅ | ❌ |

✅ = Acesso completo | 📖 = Apenas leitura | ❌ = Sem acesso

## Fluxo de Pedidos

Quando um pedido é **faturado**:
1. Cria automaticamente uma transação financeira (entrada/vendas)
2. Atualiza o estoque dos produtos
3. Registra no log de auditoria

## Tecnologias

- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Supabase (Auth, Database, RLS)
- Recharts
- Zod
