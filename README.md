# Union Finance API

## 1. Visão geral do projeto

Backend REST para gestão financeira pessoal com materialização de ocorrências mensais, cálculo de saldo por competência e recursos de apoio por IA.

O projeto foi estruturado para manter regras de domínio no backend:

- transações são persistidas com suporte a modalidade única, recorrente mensal e parcelada
- ocorrências mensais são materializadas no momento da criação da transação
- saldos são calculados a partir das ocorrências já materializadas
- cartões de crédito influenciam a competência inicial por regra de fechamento
- sugestões de categoria e insights mensais usam IA opcional com fallback local determinístico

## 2. Objetivo do MVP

Entregar uma API capaz de:

- cadastrar transações financeiras
- materializar ocorrências mensais de forma atômica
- cadastrar e consultar cartões
- consultar saldo mensal por competência
- gerar sugestões de categoria
- gerar insights mensais com resumo textual e destaques por categoria

O escopo funcional previsto no MVP inclui `POST /transacoes`, `GET /ocorrencias`, `GET /saldos`, `POST /cartoes`, `GET /cartoes/:id`, `POST /ai/sugerir-categoria`, `GET /saldos/insights` e `GET /health`.

No estado atual do repositório, `GET /ocorrencias` ainda não está exposto como rota HTTP.

## 3. Stack utilizada

- Node.js 22 LTS recomendado, com compatibilidade prevista para Node.js 20 LTS
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- Jest
- Zod para validação de entrada e saída
- Docker Compose para banco local

## 4. Instalação

Pré-requisitos:

- Node.js 22.x ou 20.x
- npm
- Docker
- Docker Compose plugin com suporte a `docker compose`

Passos:

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
```

Notas:

- `npm install` já executa `prisma generate` via `postinstall`
- o projeto usa PostgreSQL em container e a API roda no host
- o banco local padrão expõe a porta `5432`

## 5. Configuração de ambiente (.env)

Arquivo base:

```bash
cp .env.example .env
```

Variáveis mínimas para execução local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/union_finance?schema=public"
PORT=3000
NODE_ENV=development
```

Variáveis opcionais de IA:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TIMEOUT_MS=4000
AI_THRESHOLD=0.8
AI_CACHE_TTL_MINUTES=15
```

Comportamento da IA:

- sem `OPENAI_API_KEY`, a API usa um provedor heurístico local
- com `OPENAI_API_KEY`, a API tenta usar OpenAI e mantém fallback local resiliente em caso de erro, timeout ou resposta inválida
- `AI_THRESHOLD` define a confiança mínima para preenchimento automático de categoria em fluxos internos do serviço

Exemplo de ambiente com fallback local apenas:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/union_finance?schema=public"
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=
AI_THRESHOLD=0.8
AI_CACHE_TTL_MINUTES=15
```

Exemplo de ambiente com OpenAI habilitado:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/union_finance?schema=public"
PORT=3000
NODE_ENV=development
OPENAI_API_KEY="your-api-key"
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TIMEOUT_MS=4000
AI_THRESHOLD=0.8
AI_CACHE_TTL_MINUTES=15
```

## 6. Execução local

Fluxo recomendado em máquina limpa:

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
npm run dev
```

Validação de cada etapa:

- após `npm install`, o client Prisma deve ser gerado sem erro
- após `npm run db:up`, o PostgreSQL deve aparecer em `npm run db:ps`
- após `npm run db:migrate`, as migrations devem ser aplicadas no banco local
- após `npm run dev`, a API deve responder em `http://localhost:3000/health`

Executar a API em desenvolvimento:

```bash
npm run dev
```

Executar a build local:

```bash
npm run build
npm run start
```

Health check:

```bash
curl http://localhost:3000/health
```

Infraestrutura local disponível:

- API: `http://localhost:3000`
- Adminer: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

Credenciais padrão do Adminer:

- System: `PostgreSQL`
- Server: `db`
- Username: `postgres`
- Password: `postgres`
- Database: `union_finance`

Scripts operacionais disponíveis:

- `npm run dev`: sobe a API com `ts-node`
- `npm run build`: compila TypeScript
- `npm run start`: executa a versão compilada
- `npm run db:up`: sobe PostgreSQL e Adminer
- `npm run db:down`: derruba os serviços
- `npm run db:reset`: recria o banco local
- `npm run db:ps`: lista status dos containers
- `npm run db:logs`: exibe logs do banco
- `npm run db:studio`: abre Prisma Studio

## 7. Workflow de desenvolvimento

Fluxo comum para desenvolvimento local:

```bash
npm install
npm run db:up
npm run db:migrate
npm run dev
```

Comandos úteis durante implementação:

- `npm test`: executa a suíte Jest
- `npm run db:ps`: verifica se o banco está ativo
- `npm run db:logs`: inspeciona falhas de inicialização do PostgreSQL
- `npm run db:studio`: inspeciona dados via Prisma Studio
- `npm run db:reset`: recria o banco quando o ambiente local fica inconsistente

## 8. Execução de testes

Rodar toda a suíte:

```bash
npm test
```

A suíte cobre principalmente:

- rotas HTTP de transações, cartões e saldos
- cálculo de saldo mensal
- materialização de ocorrências por modalidade
- derivação de competência para cartão
- fallback de IA para sugestão de categoria e insights

Limitações atuais da suíte:

- predominância de testes unitários e de rota com mocks
- ausência de testes de integração com Prisma/PostgreSQL real
- ausência de cobertura HTTP para `POST /ai/sugerir-categoria`
- ausência de cobertura HTTP para `GET /saldos/insights`

## 9. Estrutura de pastas / arquitetura em camadas

Arquitetura em camadas:

- `src/controllers/`
  - recebe requisições HTTP
  - valida entrada com Zod
  - converte payloads para DTOs
  - serializa respostas e erros
- `src/services/`
  - concentra regras de domínio e orquestração
  - inclui serviços de saldo, cartão, transação, sugestão de categoria e insight financeiro
  - inclui lógica de competência, datas e dinheiro
- `src/repositories/`
  - encapsula persistência com Prisma
  - aplica transações de banco e agregações por ocorrência
- `src/services/ai/`
  - abstração do provedor de IA
  - implementação OpenAI
  - fallback heurístico local com cache em memória
  - camada resiliente que alterna para fallback quando o provedor remoto falha
- `src/database/`
  - instanciação do cliente Prisma
- `src/routes/`
  - composição das rotas Express
- `src/dtos/`
  - contratos internos entre camadas
- `prisma/`
  - schema e migrations
- `tests/`
  - testes de rotas e serviços
- `docs/`
  - escopo, backlog e diagramas de fluxo

Dependências entre camadas:

- `routes` conectam URLs aos controllers
- `controllers` validam entrada e convertem contratos HTTP para DTOs internos
- `services` concentram regras de domínio e orquestração
- `repositories` encapsulam persistência e queries Prisma
- `services/ai` isola o comportamento de IA e o fallback local

Regras críticas de domínio hoje:

- materialização de ocorrências no repositório de transações
- derivação de competência no `CompetenceService`
- agregação de saldo e insights a partir de ocorrências materializadas
- fallback resiliente de IA na factory/provedores

Fluxo principal de criação de transação:

1. controller valida o payload
2. service delega a operação de domínio
3. repository abre transação no banco
4. repository calcula a competência base
5. repository materializa ocorrências conforme a modalidade
6. commit persiste transação e ocorrências de forma atômica

## 10. Principais endpoints

### `GET /health`

Verifica se a API está em execução.

Resposta:

```json
{
  "status": "ok",
  "timestamp": 1713890000000
}
```

### `POST /transacoes`

Cria uma transação e materializa ocorrências no banco.

Campos obrigatórios sem cartão:

- `name`
- `amount`
- `type`
- `reference_date`

Campos obrigatórios com cartão:

- `name`
- `amount`
- `type`
- `transaction_date`
- `card_id`

Campos opcionais:

- `mode`
- `category`
- `note`
- `total_installments`

Exemplo sem cartão:

```json
{
  "name": "Salario",
  "amount": 5000,
  "type": "income",
  "mode": "single",
  "reference_date": "2026-04-05",
  "category": "Renda",
  "note": "Pagamento mensal"
}
```

Exemplo com cartão:

```json
{
  "name": "Supermercado",
  "amount": 320.5,
  "type": "expense",
  "mode": "installment",
  "transaction_date": "2026-04-10",
  "card_id": "card_123",
  "total_installments": 3
}
```

Resposta atual:

```json
{
  "id": "tx_123",
  "name": "Salario",
  "amount": "5000.00",
  "type": "income",
  "mode": "single",
  "reference_date": "2026-04-05",
  "transaction_date": null,
  "card_id": null,
  "category": "Renda",
  "note": "Pagamento mensal",
  "total_installments": null,
  "created_at": "2026-04-26T12:00:00.000Z"
}
```

Observação:

- o escopo do MVP prevê retorno resumido `{ id, ocorrencias_criadas }`
- o código atual retorna o registro completo da transação criada

Erro de validação esperado:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request input",
  "details": [
    {
      "field": "name",
      "error": "Too small: expected string to have >=1 characters"
    }
  ]
}
```

### `POST /cartoes`

Cria um cartão com regras de fechamento e vencimento.

Exemplo:

```json
{
  "name": "Visa Platinum",
  "closing_day": 10,
  "due_day": 20
}
```

Resposta:

```json
{
  "id": "card_123"
}
```

### `GET /cartoes/:id`

Consulta um cartão por identificador.

Resposta:

```json
{
  "id": "card_123",
  "name": "Visa Platinum",
  "closing_day": 10,
  "due_day": 20
}
```

Erro quando não encontrado:

```json
{
  "code": "NOT_FOUND",
  "message": "Card not found",
  "details": [
    {
      "field": "id",
      "error": "not_found"
    }
  ]
}
```

### `GET /saldos?month=YYYY-MM`

Calcula o saldo do mês a partir das ocorrências materializadas.

Resposta:

```json
{
  "month": "2026-04",
  "incomes": 5000,
  "expenses": 1234.56,
  "balance": 3765.44
}
```

### `GET /saldos/insights?month=YYYY-MM`

Gera um resumo financeiro mensal com agregações locais e texto produzido por IA.

Resposta:

```json
{
  "month": "2026-04",
  "summary_text": "Em 2026-04, as entradas somaram 5000.00, as saídas somaram 3200.00 e o saldo fechou em 1800.00.",
  "highlights": [
    {
      "category": "Alimentacao",
      "total": 1200
    }
  ],
  "alerts": [
    {
      "type": "uncategorized_occurrences",
      "description": "2 ocorrências de 2026-04 estão sem categoria."
    }
  ]
}
```

### `POST /ai/sugerir-categoria`

Retorna sugestões de categoria ordenadas por confiança.

Exemplo:

```json
{
  "name": "Uber viagem trabalho",
  "amount": 38.9,
  "type": "expense"
}
```

Resposta:

```json
{
  "suggestions": [
    {
      "category": "Transporte",
      "confidence": 0.91
    },
    {
      "category": "Despesas gerais",
      "confidence": 0.55
    },
    {
      "category": "Outros",
      "confidence": 0.3
    }
  ]
}
```

### `GET /ocorrencias`

Previsto no escopo do MVP para consulta paginada por competência e tipo, mas ainda não implementado como rota HTTP no código atual.

## 11. Uso da IA

Recursos que usam IA hoje:

- `POST /ai/sugerir-categoria`
- `GET /saldos/insights`

Modo sem OpenAI:

- quando `OPENAI_API_KEY` está ausente ou vazio, a aplicação usa heurísticas locais
- sugestões de categoria continuam funcionando com respostas determinísticas
- insights mensais continuam funcionando com resumo textual local baseado nas agregações

Modo com OpenAI:

- quando `OPENAI_API_KEY` está configurado, a aplicação tenta usar OpenAI
- o modelo padrão é `gpt-4.1-mini`
- o timeout padrão é `4000ms`
- a URL padrão é `https://api.openai.com/v1`

Fallback resiliente:

- se OpenAI falhar, exceder timeout ou retornar payload inválido, a aplicação cai automaticamente para o provedor heurístico local
- o fallback é tratado como comportamento padrão para não quebrar fluxos não críticos

Cache:

- o cache de IA é mantido em memória local do processo
- o TTL padrão é `15` minutos, configurável por `AI_CACHE_TTL_MINUTES`
- o cache não é compartilhado entre múltiplas instâncias

Threshold de categoria:

- `AI_THRESHOLD` controla a confiança mínima para preenchimento automático de categoria nos fluxos internos do serviço
- o valor padrão é `0.8`
- isso afeta principalmente decisões de autofill, não o formato de resposta de `POST /ai/sugerir-categoria`

## 12. Estado atual vs. escopo do MVP

Itens alinhados ao escopo:

- criação de transações com materialização
- criação e consulta de cartões
- cálculo de saldo mensal
- sugestão de categoria por IA
- insights mensais por IA
- health check

Divergências atuais:

- `GET /ocorrencias` ainda não foi exposto como endpoint HTTP
- `POST /transacoes` ainda responde com a transação completa
- o código HTTP atual usa nomes de campos em inglês, enquanto a especificação funcional do produto descreve contratos em português

## 13. Limitações atuais

- `GET /ocorrencias` ainda não foi exposto em `src/routes`
- `POST /transacoes` ainda não segue o formato de resposta final previsto no escopo do MVP
- os contratos HTTP atuais usam nomes de campos em inglês, enquanto a documentação funcional do produto descreve nomes em português
- `.env.example` ainda não documenta explicitamente todas as variáveis opcionais de IA já suportadas pelo código
- não há autenticação, autorização ou isolamento por usuário
- o cache de IA é apenas em memória local do processo
- não existe endpoint de readiness com verificação de banco
- não há OpenAPI publicada no repositório

## 14. Solução de problemas

- `npm run db:up` falha:
  verifique se Docker e `docker compose` estão instalados e disponíveis no PATH
- porta `5432` ocupada:
  pare outro PostgreSQL local ou ajuste o mapeamento no `docker-compose.yml`
- `npm run db:migrate` falha por conexão:
  confirme o `DATABASE_URL` e valide se o banco aparece em `npm run db:ps`
- API não sobe após mudanças de schema:
  rode `npm run db:migrate` novamente e confirme se o client Prisma foi gerado sem erro
- ambiente local inconsistente:
  use `npm run db:reset` para recriar o banco de desenvolvimento

## 15. Próximos passos

- implementar `GET /ocorrencias` com paginação determinística e filtros por `month` e `type`
- alinhar os contratos HTTP ao padrão funcional definido para o MVP
- ajustar `POST /transacoes` para retornar `{ id, ocorrencias_criadas }`
- documentar e padronizar todas as variáveis de ambiente de IA em `.env.example`
- adicionar especificação OpenAPI para contratos e erros
- incluir observabilidade básica de request, erro e latência
- evoluir o fallback de IA e o cache para cenários multi-instância

## 16. Licença

Este projeto está licenciado sob a MIT License. Consulte o arquivo [LICENSE](https://github.com/texasnk/backend-union-finance/blob/main/LICENSE) para o texto completo.
