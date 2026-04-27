# Backlog do Produto

## Release: Core

- RF-001 — Criar transação com materialização por modalidade
  - [ ] POST /transacoes (sem cartão) retorna 201 com `{ id, ocorrencias_criadas }`
  - [ ] Modalidade `unica`: cria 1 ocorrência na competência informada, com `valor` integral
  - [ ] Modalidade `parcelada` (ex.: 100 em 3): cria 3 ocorrências 33.33, 33.33, 33.34 somando 100.00
  - [ ] Modalidade `recorrente_mensal`: cria no máximo 12 competências consecutivas a partir da inicial
  - [ ] Falha durante materialização reverte criação (atomicidade garantida)

- RF-002 — Listar ocorrências com filtros e paginação
  - [ ] GET /ocorrencias aceita `mes=YYYY-MM` e `tipo=entrada|saida`
  - [ ] `limit` default=50, máx=200; `offset` default=0
  - [ ] Ordenação padrão: `competencia` ASC, depois `id` ASC (determinística)
  - [ ] Resposta contém `{ total, items[] }` com campos exigidos
  - [ ] Ocorrências de parcelas incluem `n_parcela` e `total_parcelas`

- RF-003 — Calcular saldo mensal por competência
  - [ ] GET /saldos?mes=YYYY-MM retorna `{ mes, entradas, saidas, saldo }` com 2 casas
  - [ ] `saldo = soma(entradas) - soma(saidas)` baseado apenas nas ocorrências do mês
  - [ ] Considera corretamente ocorrências de parcelas e recorrências

- RF-004 — Cartão de crédito: cadastro e derivação de competência
  - [ ] POST /cartoes cria `{ id }` com `dia_fechamento` e `dia_vencimento` entre 1–28
  - [ ] POST /transacoes (com `cartao_id` e `data_transacao`) ignora `data_referencia`
  - [ ] Derivação: `day(data_transacao) > dia_fechamento` ⇒ competência mês seguinte; caso contrário ⇒ mês atual
  - [ ] Parcelada com cartão inicia na competência derivada e segue meses subsequentes
  - [ ] GET /cartoes/:id retorna `{ id, nome, dia_fechamento, dia_vencimento }`

- RF-005 — Sugestão de categoria (IA)
  - [ ] POST /ai/sugerir-categoria retorna 200 com `{ sugestoes: [{ categoria, confidence }] }`
  - [ ] POST /transacoes com `autocategorizar=true` preenche `categoria` quando `confidence ≥ AI_THRESHOLD`
  - [ ] `AI_THRESHOLD` configurável por env (default 0.8); ausência de chave ativa fallback (stub) sem erro
  - [ ] P95 de latência adicional do POST /transacoes ≤ 200ms (ambiente local) com cache

- RT-001 — Esquema e migrações de banco
  - [x] Tabelas `cartoes`, `transacoes`, `ocorrencias` criadas com PK/FK e constraints
  - [x] Índices: `ocorrencias(competencia, tipo)`, `ocorrencias(transacao_id)`, `transacoes(cartao_id)`
  - [x] Migrations aplicáveis em ambiente limpo sem erro

- RT-002 — Precisão monetária e arredondamento
  - [ ] Operações em 2 casas decimais com arredondamento half-up
  - [ ] Última parcela ajusta diferença para fechar o total

- RT-003 — Timezone e validação de datas
  - [ ] Validações e derivações em America/Sao_Paulo
  - [ ] `competencia` persistida no formato `YYYY-MM`

- RT-004 — Padrão de erros da API
  - [ ] Erros retornam `{ code, message, details[]? }`
  - [ ] Códigos usados: `VALIDATION_ERROR`, `NOT_FOUND`, `BUSINESS_RULE_VIOLATION`, `INTERNAL_ERROR`

## Release: Qualidade

- RF-006 — Insights mensais (IA)
  - [ ] GET /saldos/insights?mes=YYYY-MM retorna `{ mes, resumo_texto, destaques[], alertas[] }`
  - [ ] `destaques` lista top-3 categorias por valor absoluto e totais batem com agregação SQL de base
  - [ ] Cache por competência com TTL ≥ 15min
  - [ ] P95 ≤ 400ms (ambiente local) com ~10k ocorrências
  - [ ] `mes` inválido retorna 400 com detalhe de campo

- RT-005 — Observabilidade básica
  - [ ] Loga método, rota, status e latência de cada request
  - [ ] Erros de validação e servidor registrados com stack/contexto

- RT-006 — Orçamento de desempenho
  - [ ] GET /ocorrencias responde < 200ms com ~10k ocorrências (ambiente local)
  - [ ] GET /saldos responde < 200ms com ~10k ocorrências (ambiente local)

- RT-007 — Especificação OpenAPI
  - [ ] Arquivo docs/openapi.yaml cobre endpoints, schemas e erros
  - [ ] Validação do YAML sem warnings em validador OpenAPI 3.x

- RT-008 — Guardas de entrada e paginação
  - [ ] `limit` acima de 200 retorna 400 com detalhe de campo
  - [ ] `mes` inválido (`YYYY-MM`) retorna 400 com detalhe de campo

- RT-009 — Idempotência opcional em POST /transacoes
  - [ ] Header `Idempotency-Key` evita duplicação em repetição da mesma requisição
  - [ ] Requisições repetidas retornam 200/201 consistentes sem recriar ocorrências

- RT-015 — Configuração de IA e cache
  - [ ] Variáveis env definidas: `AI_PROVIDER`, `AI_API_KEY`, `AI_THRESHOLD`, `AI_CACHE_TTL_MINUTES`
  - [ ] Fallback stub quando `AI_API_KEY` ausente; não falha a requisição
  - [ ] Cache LRU em memória reduz chamadas repetidas (hit rate observável em log)

## Release: Entrega Final

- RT-010 — Docker e composição local
  - [ ] Dockerfile de produção constrói e executa o app
  - [ ] docker-compose sobe app + PostgreSQL com variáveis de ambiente

- RT-011 — Healthcheck e readiness
  - [ ] Endpoint `/health` retorna 200 e metadados mínimos
  - [ ] Endpoint `/ready` verifica conexão ao banco e retorna 200/503

- RT-012 — Scripts de seed e dados de exemplo
  - [ ] Script popula cartões, transações e ocorrências para demonstração
  - [ ] Reexecução do seed é idempotente

- RT-013 — Pipeline CI básico
  - [ ] Executa lint, testes e build em PRs para main
  - [ ] Falhas de testes bloqueiam merge

- RT-014 — README de entrega
  - [ ] Passo a passo de setup local (Docker e sem Docker)
  - [ ] Exemplos de cURL para principais endpoints
