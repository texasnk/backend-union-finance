# FASE 4 - Prompt 1

Tarefa: Criar testes unitários com Jest 30 e ts-jest para a camada de services.

Contexto:
- Projeto Node.js + TypeScript
- Services já implementados
- Repositories devem ser mockados
- Testar regras de negócio, não HTTP/controllers

Escopo:
- listagem de cartões
- criação de transações
- cálculo de saldo, se existir service correspondente
- sugestão de categoria/insights, se existirem services correspondentes
- cenários de erro previstos pelos services

Estrutura esperada:
- tests/services/
- fixtures simples em tests/fixtures/ se necessário
- helpers/mocks apenas se reduzirem repetição

Regras:
- Usar Jest 30
- Testes unitários isolados
- Mocks explícitos dos repositories/providers
- Nomes descritivos com `describe` e `it`
- Cobrir sucesso, erro de validação, não encontrado e falha de dependência
- Não testar implementação interna desnecessariamente
- Não criar dependências externas novas
- Não inventar métodos que não existam nos services
- Não criar arquivos .js
- Criar arquivos de configurações se não existirem

Resposta:
- Código completo dos testes
- Separar por caminho de arquivo
- Não incluir explicações fora do código

# FASE 4 - Prompt 2

Tarefa: Criar testes unitários com Jest para categoria e insights.

Contexto:
- Projeto Node.js + TypeScript
- Jest 30 + ts-jest já configurados
- Usar pasta tests/
- Services de categoria e insights já existem
- A lógica possui heurística local e chamada externa OpenAI opcional
- Quando OpenAI falha, deve usar fallback local

Objetivo:
Testar:
- prioridade alta
- prioridade média
- prioridade baixa
- fallback quando OpenAI retorna erro
- fallback quando OpenAI demora/timeout
- fallback quando OpenAI retorna resposta inválida
- comportamento local quando OPENAI_API_KEY não existe

Regras:
- Mockar provider OpenAI
- Não chamar API externa real
- Não depender de chave real
- Usar fixtures simples
- Nomes de testes descritivos
- Testar comportamento, não implementação interna
- Manter padrão do projeto com Jest 30 + ts-jest
- Não criar dependências novas

Resposta:
- Código completo dos testes
- Separar por caminho de arquivo
- Não incluir explicações fora do código

# FASE 4 - Prompt 3


Tarefa: Criar testes de rota/API com Jest.

Contexto:
- Projeto Node.js + TypeScript
- API possui endpoints de card, balance e transaction
- Usar padrão atual do projeto
- Isolar dependências de repository para evitar estado global entre testes

Objetivo:
Criar testes para:
- criação de card
- listagem de card
- criação de transaction
- listagem de transaction
- consulta de balance
- métodos HTTP não permitidos

Métodos esperados:
- POST para criação
- GET para listagem/consulta
- PUT/PATCH/DELETE devem retornar status adequado quando não suportados

Regras:
- Mockar repositories/services quando necessário
- Não usar banco real
- Não depender de ordem entre testes
- Resetar mocks antes/depois de cadwa teste
- Testar status HTTP e payload mínimo
- Testar 400 para entrada inválida
- Testar 404 quando aplicável
- Testar 405 ou 404 para método não permitido, conforme implementação atual
- Não criar dependências novas
- Não inventar endpoints inexistentes

Estrutura:
- tests/routes/ ou tests/api/
- fixtures simples se necessário

Resposta:
- Código completo dos testes
- Separar por caminho de arquivo
- Não incluir explicações fora do código

-----------

# FASE 4 - Prompt 4


Tarefa: Gerar README.md completo.

Contexto:
- MVP de sistema de finanças com IA
- Node.js + TypeScript + Jest + PostgreSQL
- IA com heurística local e OpenAI opcional

Seções obrigatórias:
1. Visão geral do projeto
2. Objetivo do MVP
3. Stack utilizada
4. Instalação
5. Configuração de ambiente (.env)
6. Execução local
7. Execução de testes
8. Estrutura de pastas / arquitetura em camadas
9. Principais endpoints
10. Limitações atuais
11. Próximos passos

Regras:
- Markdown profissional e direto
- Sem marketing
- Evitar texto genérico
- Refletir arquitetura real (controllers, services, repositories, IA)
- Incluir fallback de IA sem chave OpenAI
- Não incluir explicações fora do README

Resposta:
- README inteiro

# FASE 4 - Prompt 5

Analise o código e os testes atuais do repositório.

Gere um checklist curto com:
- riscos técnicos restantes
- gaps de cobertura de teste
- melhorias prioritárias para a próxima release

Regras:
- basear a análise apenas no código/testes existentes
- não inventar problemas sem evidência
- priorizar itens acionáveis
- separar por seção
- bullets curtos
- no máximo 7 itens por seção

Resposta:
Riscos Técnicos Restantes

  - BUSINESS_RULE_VIOLATION não é traduzido para 422; hoje cai em 500 no middleware de erro, contrariando o contrato esperado em src/controllers/helpers/http.ts:30.
  - GET /ocorrencias ainda não existe na composição de rotas, apesar de o domínio já apontar esse fluxo como parte do MVP em src/routes/index.ts:7.
  - POST /transacoes retorna a transação completa, não { id, ocorrencias_criadas }, mantendo divergência de contrato entre API e escopo atual em src/controllers/transactions/transaction.controller.ts:9.
  - As regras críticas de materialização ficam concentradas no repositório Prisma; sem testes de integração, atomicidade e persistência real seguem sem validação prática em src/repositories/transaction.repository.ts:92.
  - As variáveis de IA usadas no código não estão refletidas no .env.example, aumentando risco de configuração incompleta em src/services/ai/financial-ai.factory.ts:8.

  Gaps de Cobertura de Teste

  - Não há testes de rota para POST /ai/sugerir-categoria, embora a rota exista em src/routes/ai.routes.ts:1.
  - Não há testes de rota para GET /saldos/insights, apesar da rota estar publicada em src/routes/balances.routes.ts:8.
  - Não há testes de repositório ou integração com Prisma para criação de transação, materialização de ocorrências e rollback transacional.
  - Não há testes cobrindo a tradução HTTP de BUSINESS_RULE_VIOLATION no middleware de erro.
  - Não há testes diretos para helpers de data e dinheiro, mesmo eles sendo base para competência, parcelas e saldo em src/services/helpers/date.ts:1 e src/services/helpers/money.ts:1.
  - Não há testes para o provedor resiliente em si; o fallback é validado indiretamente via services.
  - Não há testes para migrações ou compatibilidade de schema em ambiente limpo.

  Melhorias Prioritárias para a Próxima Release

  - Corrigir o mapeamento de BUSINESS_RULE_VIOLATION para 422 no middleware HTTP.
  - Implementar GET /ocorrencias com paginação e ordenação determinística.
  - Alinhar a resposta de POST /transacoes ao contrato { id, ocorrencias_criadas }.
  - Adicionar testes de rota para POST /ai/sugerir-categoria e GET /saldos/insights.
  - Adicionar testes de integração Prisma para materialização, parcelamento, recorrência e derivação por cartão.
  - Atualizar .env.example com OPENAI_MODEL, OPENAI_BASE_URL, OPENAI_TIMEOUT_MS, AI_THRESHOLD e AI_CACHE_TTL_MINUTES.
  - Cobrir helpers de data/dinheiro com casos de borda de competência, arredondamento e última parcela.
