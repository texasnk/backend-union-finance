# Fluxo dos Endpoints da API

Este documento descreve o fluxo de cada endpoint atualmente exposto pela API, os dados esperados de entrada e saída e a responsabilidade de cada rota.

## Convenções Gerais

- Base path:
  - `/transacoes`
  - `/cartoes`
  - `/saldos`
  - `/ai`
  - `/health`
- Content-Type esperado em `POST`:
  - `application/json`
- Formato padrão de erro:
  ```json
  {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request input",
    "details": [
      {
        "field": "name",
        "error": "Must not be empty"
      }
    ]
  }
  ```
- Status usados pela API:
  - `200` para consultas bem-sucedidas
  - `201` para criações bem-sucedidas
  - `400` para entrada inválida
  - `404` para recurso não encontrado
  - `500` para erro inesperado

## GET /health

### O que faz
- Verifica se a aplicação HTTP está em execução.

### Entrada esperada
- Sem body
- Sem query params

### Saída esperada
- `200 OK`
  ```json
  {
    "status": "ok",
    "timestamp": 1713890000000
  }
  ```

### Fluxo
1. A rota recebe a requisição.
2. Não há validação de entrada.
3. A aplicação retorna o status da API com timestamp atual.

## POST /transacoes

### O que faz
- Cria uma transação financeira.
- Hoje a rota persiste a transação e devolve o registro criado.

### Entrada esperada

#### Sem cartão
```json
{
  "name": "Salario",
  "amount": 5000,
  "type": "income",
  "mode": "single",
  "reference_date": "2026-04-05",
  "category": "Receita",
  "note": "Pagamento mensal",
  "total_installments": 1
}
```

#### Com cartão
```json
{
  "name": "Supermercado",
  "amount": 320.50,
  "type": "expense",
  "mode": "installment",
  "transaction_date": "2026-04-10",
  "card_id": "ck_card_123",
  "category": "Alimentacao",
  "note": "Compra do mes",
  "total_installments": 3
}
```

### Regras de entrada validadas no controller
- `name`: texto obrigatório, com trim, até 120 chars
- `amount`: número positivo com 2 casas decimais
- `type`: `income | expense`
- `mode`: `single | recurring_monthly | installment`
- Sem cartão:
  - `reference_date` obrigatória
  - `card_id` e `transaction_date` não devem existir
- Com cartão:
  - `transaction_date` obrigatória
  - `card_id` obrigatório
  - `reference_date` não deve existir
- `category`: opcional, até 60 chars
- `note`: opcional, até 280 chars
- `total_installments`: opcional, inteiro entre 1 e 12

### Saída esperada
- `201 Created`
  ```json
  {
    "id": "ck_transaction_123",
    "name": "Salario",
    "amount": "5000.00",
    "type": "income",
    "mode": "single",
    "reference_date": "2026-04-05",
    "transaction_date": null,
    "card_id": null,
    "category": "Receita",
    "note": "Pagamento mensal",
    "total_installments": 1,
    "created_at": "2026-04-23T19:00:00.000Z"
  }
  ```

### Fluxo
1. O controller valida o body com schema próprio do domínio de transações.
2. O payload é convertido para o DTO esperado pelo service.
3. O `TransactionService` delega a persistência para o `TransactionRepository`.
4. O repositório cria a transação no banco.
5. O controller serializa datas e devolve `201`.

## POST /cartoes

### O que faz
- Cria um cartão com dia de fechamento e vencimento.

### Entrada esperada
```json
{
  "name": "Cartao Principal",
  "closing_day": 10,
  "due_day": 18
}
```

### Regras de entrada validadas no controller
- `name`: obrigatório, trim, até 120 chars
- `closing_day`: inteiro entre 1 e 28
- `due_day`: inteiro entre 1 e 28

### Saída esperada
- `201 Created`
  ```json
  {
    "id": "ck_card_123"
  }
  ```

### Fluxo
1. O controller valida o body com o schema de cartões.
2. O `CardService` recebe o DTO validado.
3. O `CardRepository` persiste o cartão.
4. O controller devolve apenas o `id` criado.

## GET /cartoes/:id

### O que faz
- Busca um cartão pelo identificador.

### Entrada esperada
- Param de rota:
  - `id`: string obrigatória

### Saída esperada
- `200 OK`
  ```json
  {
    "id": "ck_card_123",
    "name": "Cartao Principal",
    "closing_day": 10,
    "due_day": 18
  }
  ```

### Possíveis erros
- `404 Not Found`
  - quando o cartão não existe

### Fluxo
1. O controller valida o param `id`.
2. O `CardService` consulta o `CardRepository`.
3. Se não existir, o service levanta `NOT_FOUND`.
4. Se existir, o controller devolve o cartão com `200`.

## GET /saldos?month=YYYY-MM

### O que faz
- Calcula o saldo mensal com base nas ocorrências materializadas do mês.

### Entrada esperada
- Query string:
  - `month`: obrigatório, formato `YYYY-MM`

### Exemplo
- `/saldos?month=2026-04`

### Saída esperada
- `200 OK`
  ```json
  {
    "month": "2026-04",
    "incomes": 5000,
    "expenses": 3200,
    "balance": 1800
  }
  ```

### Fluxo
1. O controller valida a query `month`.
2. O `BalanceService` valida o período e chama o `OccurrenceRepository`.
3. O repositório agrega ocorrências por tipo no banco.
4. O service calcula `balance = incomes - expenses`.
5. O controller converte os valores para o formato de resposta HTTP.

## GET /saldos/insights?month=YYYY-MM

### O que faz
- Gera um resumo financeiro mensal com destaques por categoria e alertas.
- Usa IA com fallback local quando necessário.

### Entrada esperada
- Query string:
  - `month`: obrigatório, formato `YYYY-MM`

### Exemplo
- `/saldos/insights?month=2026-04`

### Saída esperada
- `200 OK`
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

### Fluxo
1. O controller valida a query `month`.
2. O `FinancialInsightService` consulta:
   - saldo mensal
   - destaques por categoria
   - quantidade de ocorrências sem categoria
3. O service monta alertas determinísticos a partir dos agregados.
4. O service envia os agregados para o provider de IA.
5. Se a IA falhar, expirar timeout ou retornar conteúdo inválido, o fallback local é usado.
6. O controller devolve a resposta com `summary_text`, `highlights` e `alerts`.

## POST /ai/sugerir-categoria

### O que faz
- Sugere categorias para uma transação com base em nome, valor e tipo.
- Usa IA quando houver configuração; sem chave, usa heurística local.

### Entrada esperada
```json
{
  "name": "Uber Centro",
  "amount": 32.90,
  "type": "expense",
  "card_id": "ck_card_123"
}
```

### Regras de entrada validadas no controller
- `name`: obrigatório, trim, até 120 chars
- `amount`: número positivo com 2 casas decimais
- `type`: `income | expense`
- `card_id`: opcional

### Saída esperada
- `200 OK`
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
      }
    ]
  }
  ```

### Fluxo
1. O controller valida o body.
2. O `CategorySuggestionService` recebe o DTO já normalizado.
3. O service chama o provider de IA resiliente.
4. Se houver `OPENAI_API_KEY`, a API tenta usar OpenAI com timeout.
5. Se houver timeout, erro, resposta inválida ou ausência de chave, o fallback local devolve sugestões heurísticas.
6. O service ordena as sugestões por `confidence` descrescente.
7. O controller devolve `200`.

## Resumo de Responsabilidades

### Controllers
- Validam entrada HTTP
- Chamam services
- Montam resposta HTTP
- Não concentram regra de negócio

### Services
- Aplicam regras de domínio e orquestram providers/repositories
- Tratam fallback de IA
- Isolam lógica fora da camada HTTP

### Repositories
- Persistem e consultam dados no PostgreSQL via Prisma

### Providers de IA
- Tentam chamada externa quando configurados
- Recuam para fallback local sem quebrar o fluxo principal
