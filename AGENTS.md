# AGENTS.md

## Project Purpose
- Build a REST backend for personal finance management.
- Register financial transactions.
- Materialize monthly occurrences from transactions.
- Query occurrences by month and type.
- Calculate monthly balance by `YYYY-MM`.

## MVP Scope
- Implement `POST /transacoes`.
- Implement `GET /ocorrencias`.
- Implement `GET /saldos`.
- Implement `POST /cartoes`.
- Implement `GET /cartoes/:id`.
- Implement `POST /ai/sugerir-categoria`.
- Keep `GET /saldos/insights` in scope for backlog-driven work.
- Expose `GET /health`.
- Exclude frontend, auth, multi-user, CSV/OFX import, non-monthly recurrences, multi-currency, webhooks, and advanced budgeting.

## Tech Stack
- Use Node.js with TypeScript.
- Prefer Node.js 22 LTS. Accept Node.js 20 LTS.
- Use Express for HTTP.
- Use PostgreSQL with Prisma ORM.
- Use npm scripts for local workflows.
- Use ts-node for local development.
- Use Jest for tests.

## Architecture
- Keep the app as a REST API backend.
- Run the API on the host in development.
- Run PostgreSQL with Docker Compose in development.
- Use Prisma for schema, migrations, and database access.
- Keep transaction creation and occurrence materialization atomic in one database transaction.

## Folder Conventions
- Keep database schema and migrations under `prisma/`.
- Keep runtime database client code under `src/database/`.
- Keep product docs under `docs/`.
- Keep prompts under `prompts/` only if explicitly requested by the task.
- Treat `.env.example`, `docker-compose.yml`, and `prisma.config.ts` as operational setup files.

## Domain Rules
- Treat `competencia` as a month key in `YYYY-MM`.
- Treat all date validation and derivation in `America/Sao_Paulo`.
- Support transaction modes: `unica`, `recorrente_mensal`, `parcelada`.
- Support transaction types: `entrada`, `saida`.
- Materialize occurrences immediately when creating a transaction.
- For `unica`, create exactly 1 occurrence in the target competence.
- For `recorrente_mensal`, create at most 12 consecutive monthly occurrences.
- For `parcelada`, require `total_parcelas` between 1 and 12.
- For `parcelada`, split value with 2 decimal places, half-up rounding, and adjust the last installment to close the total exactly.
- For card transactions, require `data_transacao` and ignore user-provided `data_referencia`.
- Derive card competence from `dia_fechamento`.
- If `day(data_transacao) > dia_fechamento`, use next month.
- Otherwise, use current month.
- Start card installments from the derived competence.

## Validation Rules
- Require `nome` as trimmed non-empty text up to 120 chars.
- Limit `categoria` to 60 chars.
- Limit `observacao` to 280 chars.
- Require `valor > 0`.
- Keep money at 2 decimal places.
- Accept only valid `YYYY-MM-DD` dates.
- Accept only valid `YYYY-MM` competence values.
- Accept `dia_fechamento` and `dia_vencimento` only in `1..28`.
- Require valid `cartao_id` when present.
- Reject `limit > 200`.
- Default `limit` to `50`.
- Default `offset` to `0`.

## API Guidelines
- Keep payloads and field names aligned with the product docs.
- Return `201` for successful transaction creation with `{ id, ocorrencias_criadas }`.
- Return `200` for list and balance queries.
- Return `200` for category suggestion requests.
- Return `404` for missing `cartao_id` or missing card lookup.
- Return `400` for validation errors.
- Return `422` for business rule violations.
- Return errors as `{ code, message, details? }`.
- Use error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `BUSINESS_RULE_VIOLATION`, `INTERNAL_ERROR`.
- Order occurrences by `competencia ASC`, then `id ASC`.
- Keep pagination deterministic.
- Return occurrence items with transaction `nome`, `tipo`, `valor`, `competencia`, and installment fields when applicable.

## Database Rules
- Keep tables for cards, transactions, and occurrences.
- Keep PK/FK relationships between cards, transactions, and occurrences.
- Keep indexes on occurrences by competence/type and transaction id.
- Keep index on transactions by card id.
- Store money with fixed decimal precision.
- Store competence as `YYYY-MM`.
- Keep migrations runnable on a clean environment.
- Prefer PostgreSQL numeric types for money.
- Restrict deleting a transaction when occurrences depend on it.

## Testing Rules
- Test single transaction materialization.
- Test recurring monthly materialization up to 12 months.
- Test installment splitting and last-installment adjustment.
- Test card competence derivation around the closing day boundary.
- Test monthly balance using materialized occurrences only.
- Test pagination defaults, limits, and deterministic ordering.
- Test standard error response shape.
- Test validation failures for invalid `mes`, `limit`, dates, and card fields.

## Constraints
- Keep all timezone-sensitive logic in `America/Sao_Paulo`.
- Keep monetary operations consistent with half-up rounding.
- Keep transaction creation atomic.
- Keep list and balance queries compatible with local performance goals for about 10k occurrences.
- Do not add authentication for the MVP unless explicitly requested.
- Treat AI fallback as non-breaking when provider config is absent.
- Use env-driven AI config only when implementing AI features.

## Anti-Patterns
- Do not invent endpoints outside the documented scope.
- Do not add unsupported recurrence types.
- Do not introduce frontend concerns into backend code.
- Do not mix month competence with full dates in persisted occurrence fields.
- Do not bypass occurrence materialization by computing balances directly from transactions.
- Do not rely on unspecified business rules.
- Do not guess missing API contracts or payload fields.

## Agent Execution Rules
- Read `README.md`, `docs/backlog.md`, and `docs/escopo-mvp.md` before changing domain behavior.
- Prefer the most specific operational rule when docs differ.
- Omit uncertain behavior instead of guessing.
- Preserve existing stack choices and local workflows.
- Use existing npm scripts for setup, Prisma, and database tasks.
- Keep changes small and intention-revealing.
- Separate `feat`, `fix`, `refactor`, `test`, `docs`, and `chore` changes when possible.
- Update docs only when implementation changes require it.
- Do not mark backlog items done unless implementation exists and has been validated.
- Keep generated or local-only artifacts out of commits unless explicitly requested.
