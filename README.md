# Union Finance API — MVP

API REST mínima para gestão financeira: registrar entradas e saídas e consultar saldo.

## Objetivo do Projeto
- Registrar transações (entrada/receita e saída/despesa)
- Consultar lista de transações e saldo consolidado
- Servir de base para evolução incremental do produto

## Stack Utilizada
- Node.js + TypeScript
- PostgreSQL + Prisma ORM
- Jest (testes)
- npm (scripts/gestão de pacotes)
- ts-node (execução TS em desenvolvimento)

## Como Rodar Localmente
1. Pré-requisitos
   - Node.js e npm instalados
   - PostgreSQL em execução e um banco disponível
2. Instalação
   ```bash
   npm install
   ```
3. Variáveis de ambiente (.env)
   - Crie um arquivo `.env` na raiz com ao menos:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/union_finance?schema=public"
   PORT=3000
   NODE_ENV=development
   ```
4. Preparar Prisma
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. Executar aplicação (dev)
   ```bash
   npm run dev
   ```
   - Health check: http://localhost:3000/health
6. Testes
   ```bash
   npm test
   ```

## Scripts Disponíveis
- build: compila TypeScript para `dist` (tsc)
- dev: roda o servidor com `ts-node` (`src/server.ts`)
- start: executa a build com Node (`dist/server.js`)
- test: executa a suíte de testes (Jest)
- test:watch: Jest em modo observação
- prisma:generate: `prisma generate`
- db:migrate: `prisma migrate dev`
- db:push: `prisma db push`
- db:studio: `prisma studio`

## Endpoints
- GET /health → `{ "status": "ok", "timestamp": number }`

## Roadmap
- v0.1.0 (MVP)
  - Endpoints: criar/listar transações, consultar saldo
  - Tipos: entrada/saída, valor, descrição, data
- v0.2.0
  - Autenticação básica (usuários, JWT)
  - Validações e paginação
- v0.3.0
  - Filtros por período/categoria, ordenação
  - Importação/Exportação CSV
- v0.4.0
  - Relatórios simples (mensal, anual)
  - Tags/categorias de transações
- v0.5.0
  - Webhooks e idempotência para integrações
  - Observabilidade (logs estruturados, métricas)
