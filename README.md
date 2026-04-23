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

## Versão do Node
- Recomendado: Node.js 22 LTS (22.x)
- Alternativa compatível: Node.js 20 LTS
- Ver/instalar via NVM:
   ```bash
   nvm ls-remote --lts | tail
   nvm install --lts
   nvm use --lts
   node -v
   ```

## Variáveis de Ambiente
- Copie o exemplo e ajuste se necessário:
   ```bash
   cp .env.example .env
   ```
- Principais variáveis (padrões já funcionam com Docker Compose deste projeto):
   ```env
   # Banco local exposto pelo Docker Compose (postgres/postgres)
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/union_finance?schema=public"
   PORT=3000
   NODE_ENV=development
   ```

## Banco de Dados com Docker Compose
Este projeto fornece apenas o banco em Docker (a API roda no host com ts-node).

- Subir/derrubar containers:
   ```bash
   npm run db:up      # sobe Postgres + Adminer (UI)
   npm run db:down    # derruba serviços
   npm run db:reset   # recria volume e reinicia o banco (DADOS SERÃO APAGADOS)
   ```
- Acompanhar status/logs:
   ```bash
   npm run db:ps
   npm run db:logs
   ```
- Acesso ao Adminer (UI do banco):
   - URL: http://localhost:8080
   - System: PostgreSQL
   - Server: db
   - Username: postgres
   - Password: postgres
   - Database: union_finance

## Prisma (ORM)
- Gerar client do Prisma (após instalar deps e com DB acessível):
   ```bash
   npm run prisma:generate
   ```
- Criar/aplicar migrações em desenvolvimento:
   ```bash
   npm run db:migrate   # equivalente a: prisma migrate dev
   ```
- Empurrar o schema sem criar migrações (prototipagem):
   ```bash
   npm run db:push      # equivalente a: prisma db push
   ```
- Inspecionar dados e modelos:
   ```bash
   npm run db:studio    # abre Prisma Studio
   ```

## Fluxo de Desenvolvimento (local)
1. Pré-requisitos
    - Node.js 22 LTS (recomendado) e npm instalados
2. Instalação de dependências
    ```bash
    npm install
    ```
3. Banco de dados via Docker
    ```bash
    npm run db:up
    ```
4. Variáveis de ambiente
    ```bash
    cp .env.example .env
    # se necessário, edite DATABASE_URL
    ```
5. Preparar Prisma
    ```bash
    npm run prisma:generate
    npm run db:migrate  # cria/aplica migrações
    ```
6. Executar aplicação (dev)
    ```bash
    npm run dev
    ```
    - Health check: http://localhost:3000/health
7. Testes
    ```bash
    npm test
    ```

## Scripts Disponíveis
- build: compila TypeScript para dist (tsc)
- dev: roda o servidor com ts-node (src/server.ts)
- start: executa a build com Node (dist/server.js)
- test: executa a suíte de testes (Jest)
- prisma:generate: prisma generate
- db:migrate: prisma migrate dev
- db:push: prisma db push
- db:studio: prisma studio
- db:up | db:down | db:reset | db:logs | db:ps: utilitários Docker Compose do banco
- mmd:svg | mmd:png: exporta diagramas Mermaid de docs/*.mmd

## Endpoints
- GET /health → `{ "status": "ok", "timestamp": number }`

## Solução de Problemas
- Porta 5432 ocupada ao subir o DB:
   - Encerre outros Postgres locais ou ajuste a porta no docker-compose.yml.
- Erro ao conectar no banco (ECONNREFUSED):
   - Verifique `npm run db:ps`, aguarde o healthcheck ficar saudável e confirme `DATABASE_URL`.
- Migração falha em desenvolvimento:
   - Tente `npm run db:reset` (APAGA DADOS) e rode `npm run db:migrate` novamente.

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
