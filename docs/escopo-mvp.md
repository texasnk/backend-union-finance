# Escopo do MVP — Gestão Financeira

Documento de especificação funcional e técnica do MVP para um núcleo de gestão financeira baseado em transações com materialização mensal de ocorrências e cálculo de saldo por competência.

## 1. Objetivo
Fornecer um backend REST que permita registrar transações financeiras, materializar ocorrências mensais conforme regras de modalidade e cartão de crédito, consultar ocorrências por mês/tipo e calcular saldo mensal por competência (`YYYY-MM`).

## 2. Glossário e Premissas
- Competência: identificação do mês no formato `YYYY-MM` de acordo com a TZ America/Sao_Paulo.
- Ocorrência: item mensal materializado derivado de uma transação (pode representar a transação inteira, uma parcela ou uma recorrência do mês).
- Modalidade: `unica` | `recorrente_mensal` | `parcelada`.
- Tipo: `entrada` (crédito) | `saida` (débito).
- Cartão: meio de pagamento com regras de fechamento/vencimento que determinam a competência de lançamentos.
- TZ: todas as validações, derivações e comparações de datas consideram America/Sao_Paulo.

## 3. Requisitos Funcionais (RF)

### RF1 — Criar transação
- Campos obrigatórios na criação (sem `cartao_id`):
  - `nome`: string não vazia (trim), até 120 caracteres
  - `valor`: número positivo (> 0), 2 casas decimais
  - `tipo`: `entrada` | `saida`
  - `data_referencia`: data `YYYY-MM-DD` (considerar TZ na validação)
- Com `cartao_id`:
  - `data_transacao`: data `YYYY-MM-DD` obrigatória; `data_referencia` é derivada pela regra do cartão.
- Campos opcionais: `categoria` (até 60), `observacao` (até 280) — se adotado.
- Modalidade: `unica` | `recorrente_mensal` | `parcelada` (default `unica`).
  - Para `parcelada`: `total_parcelas` obrigatório (1–12).
- Efeito: ao criar a transação, materializar imediatamente as ocorrências conforme RF2.

### RF2 — Materialização de ocorrências (no ato da criação)
- Representação: ocorrência mensal com `valor` e `competencia` (`YYYY-MM`).
- `unica`:
  - Gera 1 ocorrência na competência de `data_referencia` (ou derivada de cartão) com `valor` integral.
- `recorrente_mensal`:
  - Gera ocorrências mensais iniciando na competência de `data_referencia` (ou derivada de cartão).
  - Limite: no máximo 12 competências consecutivas, incluindo a inicial.
  - Cada ocorrência replica `valor` e `tipo` da transação.
- `parcelada`:
  - Campo obrigatório: `total_parcelas` (1 a 12).
  - Divide `valor` igualmente com 2 casas (arredondamento half-up); a última parcela é ajustada para fechar o total.
  - Gera `total_parcelas` competências consecutivas a partir da competência de `data_referencia` (ou derivada de cartão).
  - Cada ocorrência informa `n_parcela` e `total_parcelas`.

### RF3 — Cartão de crédito (opcional)
- Configuração do cartão: `dia_fechamento` (1–28) e `dia_vencimento` (1–28).
- Derivação de competência (TZ America/Sao_Paulo):
  - Se `day(data_transacao) > dia_fechamento` ⇒ competência = mês seguinte; caso contrário ⇒ mês atual.
- Com `cartao_id`:
  - `data_referencia` é derivada; parceladas têm 1ª parcela na competência derivada e demais nos meses subsequentes (até 12).
- Sem `cartao_id`: `data_referencia` é informada pelo usuário (regra geral acima).

### RF4 — Consultar ocorrências
- Listar ocorrências com filtros opcionais: `mes` (`YYYY-MM`) e `tipo`.
- Paginação obrigatória com `limit` e `offset` (ver NF e RF6 para defaults/limites).
- Retornar por ocorrência: `id`, `nome` (via transação), `tipo`, `valor`, `competencia` (`YYYY-MM`), `n_parcela`/`total_parcelas` quando aplicável.

### RF5 — Calcular saldo mensal
- Para uma competência `YYYY-MM`:
  - `saldo = soma(entradas) - soma(saidas)` considerando as ocorrências materializadas no mês.
- Resposta: `{ mes: YYYY-MM, entradas: number, saidas: number, saldo: number }` com 2 casas decimais.

### RF6 — Paginação, ordenação e filtros
- `limit` default = 50, máximo = 200; `offset` default = 0.
- Ordenação padrão de ocorrências: `competencia` ASC, depois `id` ASC (estável e determinística).
- Filtros combináveis: `mes`, `tipo`. Quando `mes` não é informado, retornar página sobre todas as competências existentes (ordenadas ascendente).

### RF7 — Contratos de API (REST)
- POST `/transacoes`
  - Corpo (sem cartão): `{ nome, valor, tipo, modalidade?, data_referencia, categoria?, observacao?, total_parcelas? }`
  - Corpo (com cartão): `{ nome, valor, tipo, modalidade?, data_transacao, cartao_id, categoria?, observacao?, total_parcelas? }`
  - Respostas:
    - 201: `{ id, ocorrencias_criadas: number }`
    - 400: erro de validação; 404: `cartao_id` inexistente; 422: regra de negócio.
- GET `/ocorrencias?mes=YYYY-MM&tipo=entrada|saida&limit=50&offset=0`
  - 200: `{ total: number, items: Ocorrencia[] }`
- GET `/saldos?mes=YYYY-MM`
  - 200: `{ mes, entradas, saidas, saldo }`
- GET `/saldos/insights?mes=YYYY-MM`
  - 200: `{ mes, resumo_texto, destaques: [{ categoria, total }], alertas: [{ tipo, descricao }] }`
- POST `/cartoes`
  - Corpo: `{ nome, dia_fechamento: 1-28, dia_vencimento: 1-28 }`
  - 201: `{ id }`; 400: validação.
- GET `/cartoes/:id`
  - 200: `{ id, nome, dia_fechamento, dia_vencimento }`; 404 se inexistente.
\
- POST `/ai/sugerir-categoria`
  - Corpo: `{ nome, valor, tipo, cartao_id? }`
  - 200: `{ sugestoes: [{ categoria: string, confidence: number }] }`; 400: validação

### RF8 — Padronização de respostas de erro
- Estrutura padrão: `{ code: string, message: string, details?: { field: string, error: string }[] }`
- Códigos sugeridos: `VALIDATION_ERROR`, `NOT_FOUND`, `BUSINESS_RULE_VIOLATION`, `INTERNAL_ERROR`.

### RF9 — Sugestão de categoria (IA)
- Objetivo: sugerir categoria para uma transação com base em `nome`, `valor` e `tipo`.
- Endpoint dedicado: POST `/ai/sugerir-categoria` (ver RF7) retorna lista de `{ categoria, confidence }` ordenada por confiança.
- Integração opcional no POST `/transacoes` via query `autocategorizar=true`:
  - Se `confidence ≥ threshold` (default 0.8, configurável), preencher `categoria` automaticamente antes da materialização.
  - Caso contrário, manter `categoria` ausente; transação segue normal.
- Restrições:
  - Latência adicional p95 no POST `/transacoes` ≤ 200ms em ambiente local com cache habilitado.
  - Quando o provedor de IA não estiver configurado, usar fallback determinístico (stub) sem erro.

### RF10 — Insights mensais (IA)
- Objetivo: fornecer resumo textual e destaques por categoria para uma competência.
- Endpoint: GET `/saldos/insights?mes=YYYY-MM` (ver RF7).
- Cálculo:
  - Agregações de valores por tipo e categoria são feitas localmente (SQL).
  - O `resumo_texto` pode ser gerado por IA, mas deve refletir exatamente os números retornados.
- Restrições:
  - Cache por competência com TTL mínimo de 15 minutos.
  - Latência p95 ≤ 400ms em ambiente local com ~10k ocorrências.

## 4. Modelo de Dados (proposta)
- Tabela `cartoes`
  - `id` PK, `nome` varchar(120), `dia_fechamento` tinyint check 1–28, `dia_vencimento` tinyint check 1–28, `created_at` timestamptz
- Tabela `transacoes`
  - `id` PK
  - `nome` varchar(120) not null
  - `valor` decimal(14,2) check > 0
  - `tipo` enum('entrada','saida') not null
  - `modalidade` enum('unica','recorrente_mensal','parcelada') not null default 'unica'
  - `data_referencia` date null (quando sem cartão)
  - `data_transacao` date null (obrigatória quando com cartão)
  - `categoria` varchar(60) null
  - `observacao` varchar(280) null
  - `cartao_id` fk `cartoes.id` null
  - `total_parcelas` smallint null check between 1 and 12 (obrigatória quando `parcelada`)
  - `created_at` timestamptz not null default now()
- Tabela `ocorrencias`
  - `id` PK
  - `transacao_id` fk `transacoes.id` not null (on delete restrict)
  - `tipo` enum('entrada','saida') not null
  - `valor` decimal(14,2) not null
  - `competencia` char(7) not null constraint formato `YYYY-MM`
  - `n_parcela` smallint null
  - `total_parcelas` smallint null
  - `created_at` timestamptz not null default now()

Índices recomendados: `ocorrencias(competencia, tipo)`, `ocorrencias(transacao_id)`, `transacoes(cartao_id)`.

## 5. Regras de Negócio e Validação
- `nome` obrigatório, trim, 1–120 chars; `categoria` ≤ 60; `observacao` ≤ 280.
- `valor` > 0, com 2 casas decimais; normalizar entrada para `decimal(14,2)`.
- `tipo` apenas `entrada` | `saida`.
- `modalidade` conforme enum; quando `parcelada`, exigir `total_parcelas` entre 1 e 12.
- Datas devem ser válidas na TZ America/Sao_Paulo.
- Materialização:
  - `recorrente_mensal`: máx. 12 competências consecutivas a partir da inicial.
  - `parcelada`: máx. 12, dividir com arredondamento half-up; última parcela recebe o ajuste para somar exatamente o total.
- Cartão:
  - `cartao_id` válido; com cartão, `data_transacao` obrigatória e `data_referencia` ignorada.
  - Competência derivada pelo `dia_fechamento` conforme RF3.

## 6. Requisitos Não Funcionais (RNF)
- Timezone: America/Sao_Paulo em todas as validações e derivações.
- Precisão monetária: operações com 2 casas decimais, arredondamento half-up; última parcela corrige diferença.
- Persistência: recomendado PostgreSQL com tipos `numeric(14,2)`; transação de banco única para criar transação + ocorrências (atomicidade).
- Observabilidade: log de requests (método, rota, status, latência) e erros de validação/servidor.
- Desempenho (MVP):
  - Listagens paginadas respondem em < 200ms para ~10k ocorrências em ambiente local.
  - Saldo mensal em < 200ms com índice adequado em `competencia`.
- Segurança básica: sem autenticação no MVP; validar e sanitizar entradas, limitar `limit` máx. 200, CORS permissivo configurável.
- Idempotência (opcional): aceitar header `Idempotency-Key` no POST `/transacoes` para evitar duplicidades em tentativas repetidas.
- IA e privacidade:
  - Provedor configurável via env (`AI_PROVIDER`, `AI_API_KEY`, `AI_THRESHOLD`, `AI_CACHE_TTL_MINUTES`).
  - Não enviar PII sensível; mascarar termos potencialmente sensíveis em prompts.
  - Cache LRU em memória para sugestões/insights; circuit breaker ao detectar falhas do provedor.

## 7. Critérios de Aceite e Testes
- Materialização:
  - `unica`: cria 1 ocorrência na competência correta com o valor integral.
  - `recorrente_mensal`: cria N ocorrências (N ≤ 12) consecutivas a partir da competência inicial.
  - `parcelada`: soma das parcelas = `valor` total; exemplo 100 em 3: 33.33, 33.33, 33.34.
- Cartão:
  - Para `dia_fechamento = 10`, `data_transacao` dia 11 ⇒ competência +1 mês; dia 10 ⇒ mês atual.
- Saldo mensal:
  - Retorna `{ entradas, saidas, saldo }` consistentes com as ocorrências do mês.
- Paginação e ordenação determinísticas: mesma consulta ⇒ mesma sequência.
- Erros de validação retornam estrutura padrão com campos e mensagens.

## 8. API — Exemplos (ilustrativos)
- Criar transação única (sem cartão):
  - Requisição: `{ "nome":"Salário", "valor":5000, "tipo":"entrada", "modalidade":"unica", "data_referencia":"2026-04-05" }`
  - Resposta 201: `{ "id":"tr_123", "ocorrencias_criadas":1 }`
- Listar ocorrências de abril/2026:
  - GET `/ocorrencias?mes=2026-04&limit=50&offset=0`
  - 200: `{ "total":120, "items":[ { "id":"oc_1", "nome":"Salário", "tipo":"entrada", "valor":5000, "competencia":"2026-04" } ] }`
- Saldo do mês:
  - GET `/saldos?mes=2026-04`
  - 200: `{ "mes":"2026-04", "entradas":5000, "saidas":3200, "saldo":1800 }`

## 9. Fora de Escopo (MVP)
- Frontend (web ou mobile), UI/UX, dashboards e relatórios visuais.
- Edição/cancelamento parcial de séries já materializadas; re-projeção retroativa.
- Recorrências não mensais (semanal, anual, customizadas).
- Multiusuário, autenticação/autorização, perfis e permissões.
- Conciliação bancária, importação automática de extratos, integração com bancos/OFX/CSV.
- Multi-moeda e câmbio; fuso horários alternativos.
- Webhooks, notificações, e-mails e lembretes de fatura/vencimento.
- Orçamentos, metas, categorias hierárquicas, tags avançadas e regras automáticas.
- APIs de auditoria, versionamento ou histórico detalhado de mudanças.

## 10. Roadmap sugerido pós-MVP (opcional)
- Autenticação básica (token) e multiusuário.
- Edição/cancelamento de séries com reconciliação segura.
- Importação de extratos (CSV/OFX) e categorização assistida.
- Dashboards e frontend web.
- Orçamentos e alertas.

---
Notas: Este documento guia o backend. Endpoints, payloads e regras aqui descritos devem ser refletidos em uma especificação OpenAPI quando iniciarmos a implementação.

