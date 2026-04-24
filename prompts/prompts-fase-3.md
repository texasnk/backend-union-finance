FASE 3 - Prompt 1

# Contexto: 

Union Finance API — MVP
API REST mínima para gestão financeira: registrar entradas e saídas e consultar saldo.

#### Objetivo do Projeto

- Registrar transações (entrada/receita e saída/despesa)

- Consultar lista de transações e saldo consolidado

- Servir de base para evolução incremental do produto

#### Stack Utilizada

- Node.js + TypeScript

- PostgreSQL + Prisma ORM

- Jest (testes)

- npm (scripts/gestão de pacotes)

- ts-node (execução TS em desenvolvimento)

# Objetivo: 

Gerar schemas para a API se baseando no escopo-mvp.md e backlog.md com tipagem para typescript
- POST `/transacoes`
    - Corpo (sem cartão): `{ nome, valor, tipo, modalidade?, data_referencia, categoria?, observacao?, total_parcelas? }`
    - Corpo (com cartão): `{ nome, valor, tipo, modalidade?, data_transacao, cartao_id, categoria?, observacao?, total_parcelas? }`
    - Respostas:
        - 201: `{ id, ocorrencias_cWriadas: number }`
        - 400: erro de validação; 404: `cartao_id` inexistente; 422: regra de negócio.
- GET `/ocorrencias?mes=YYYY-MM&tipo=entrada|saida&limit=50&offset=0`
    - 200: `{ total: number, items: Ocorrencia[] }`
- GET `/saldos?mes=YYYY-MM`
    - 200: `{ mes, entradas, saidas, saldo }`
- GET `/saldos/insights?mes=YYYY-MM`
    - 200: `{ mes, resumo_texto, destaques: [{ categoria, total }], alertas: [{ tipo, descricao }] }`
- POST `/cartoes`
    - Corpo: `{ nome, dia_fechamento: 1-28, dia_vencimento: 1-28 }`
    - 201: `{ id }`; 400: validação.
- GET `/cartoes/:id`
    - 200: `{ id, nome, dia_fechamento, dia_vencimento }`; 404 se inexistente. \
- POST `/ai/sugerir-categoria`
    - Corpo: `{ nome, valor, tipo, cartao_id? }`
    - 200: `{ sugestoes: [{ categoria: string, confidence: number }] }`; 400: validação

Estilo: codigo limpo e docstrings curtas.
Resposta: Apenas codigo do schema e outros se necessário no /prisma

----

Solicitações feitas após o prompt:

- Configuração do prisma para esse projeto;

- Criação de um docker-compose para rodar um banco postgres local;

- Alteração no readme com instruções de uso

- E que o backlog.md fosse revisado

----

FASE 3 - Prompt 2

Revise as alterações atuais do repositório e proponha uma estratégia de commits pequenos, claros e seguros.

Objetivo:
- analisar o diff atual
- agrupar mudanças relacionadas
- sugerir commits separados seguindo Conventional Commits
- evitar misturar refactor, fix, feat, test, docs e chore no mesmo commit sem necessidade

Instruções:
1. Inspecione os arquivos alterados e identifique agrupamentos lógicos de mudança.
2. Proponha a menor quantidade de commits que ainda preserve clareza e rastreabilidade.
3. Separe commits por intenção, não apenas por arquivo.
4. Não invente mudanças que não existem no diff.
5. Aponte quando houver alterações acopladas demais e sugira como quebrá-las.
6. Use Conventional Commits simples, por exemplo:
   - feat:
   - fix:
   - refactor:
   - test:
   - docs:
   - chore:
7. Prefira mensagens curtas, objetivas e em inglês.
8. Se houver risco de um commit quebrar build/testes isoladamente, sinalize.
9. Se o diff estiver ruim para separar, proponha:
   - ordem recomendada de staging
   - arquivos ou trechos que devem ir em cada commit
10. Não execute commit automaticamente.

Formato da resposta:
- Resumo curto do que mudou
- Proposta de commits
  - Commit 1
    - type(scope): message
    - arquivos/trechos
    - motivo do agrupamento
  - Commit 2
    - type(scope): message
    - arquivos/trechos
    - motivo do agrupamento
- Riscos ou acoplamentos detectados
- Sequência recomendada de git add para criar os commits

Critérios:
- commits devem ser independentes sempre que possível
- cada commit deve ter propósito único
- evitar commits gigantes ou genéricos
- evitar mensagem vaga como "update files" ou "fix stuff"



--------------------

FASE 3 - Prompt 3

Read README.md, BACKLOG.md, and ESCOPO-MVP.md from this repository and generate a single AGENTS.md file in English.

Goal:
Create an operational instruction file for coding agents working in this project.

Rules:
- Extract only implementation-relevant information.
- Do not copy large sections verbatim.
- Merge duplicated information.
- If sources conflict, prefer the most specific operational rule.
- Do not invent technologies, architecture, or business rules not explicitly present.
- Omit uncertain information instead of guessing.

Output requirements:
- Return only AGENTS.md content.
- Output must be in English.
- Use short bullet points.
- Use imperative language.
- Keep it concise and practical.
- Avoid explanations, commentary, or markdown outside the file.

Focus sections only if supported by source files:
- Project purpose
- MVP scope
- Tech stack
- Architecture
- Folder conventions
- Domain rules
- Validation rules
- API guidelines
- Database rules
- Testing rules
- Constraints
- Anti-patterns
- Agent execution rules

Writing constraints:
- Prefer short sentences.
- Remove repetition.
- Prioritize actionable instructions.
- Maximum density, minimum prose.

Important:
Write AGENTS.md as a working contract for AI agents that will edit code in this repository.

-------------------

FASE 3 - Prompt 4

Tarefa: Implementar persistência inicial para a primeira release.

Contexto:
- Projeto Node.js + TypeScript
- Usar o schema atual do projeto
- Usar requisitos definidos em docs/backlog.md
- Sem dependências externas novas

Objetivo:
Criar camada de repositories para operações básicas de persistência de:
- transações
- cartões

Escopo:
- criação de registros
- consulta por ID
- listagem
- consulta filtrada quando prevista no schema/backlog

Estrutura esperada:
- src/dtos/
- src/repositories/
- src/errors/ ou src/shared/errors/
- arquivos auxiliares somente se necessários

Regras:
- TypeScript tipado
- DTOs explícitos para input/output
- Tratamento de erro padronizado
- Não misturar regra de negócio complexa no repository
- Repository deve focar em acesso a dados
- Não criar dependências externas
- Não inventar campos fora do schema
- Se faltar informação no schema/backlog, sinalizar antes do código

Resposta:
- Fornecer o código completo
- Separar por caminho de arquivo
- Não incluir explicações longas

---------


FASE 3 - Prompt 5
Tarefa: Implementar camada de services para regras de negócio.

Contexto:
- Projeto Node.js + TypeScript
- Repositories já existem
- Separar regra de negócio da camada HTTP/API
- Sem dependências externas novas
- Utilizar backlog.md e escopo-mvp.md

Objetivo:
Criar services para:
- cálculo de saldo mensal
- derivação de competência a partir da data de referência
- sugestão de categoria usando componente de IA
- geração de resumo financeiro assistido por IA

Estrutura esperada:
- src/services/
- src/dtos/ quando necessário
- src/errors/ ou helpers compartilhados se necessário

Regras:
- Services devem orquestrar repositories e regras de domínio
- Controllers não devem conter regra de negócio
- IA deve ser isolada por interface/adapter, sem acoplar provider específico
- Não inventar campos fora do schema/backlog
- Usar TypeScript tipado
- Tratar erros de negócio e infraestrutura
- Retornar código completo separado por caminho de arquivo

Resposta:
- Apenas código
- Arquivos separados por caminho

-------

FASE 3 - Prompt 6
Tarefa: Implementar services de IA com fallback local.

Contexto:
- Projeto Node.js + TypeScript
- Deve rodar sem custo quando não houver OPENAI_API_KEY
- Sem dependências externas novas, salvo se já existirem no projeto

Objetivo:
Criar services para:
- sugestão de categorias
- geração de insights/resumos financeiros

Regras:
- Se OPENAI_API_KEY não existir, usar heurística local
- Se OPENAI_API_KEY existir, tentar chamada opcional à LLM
- Toda chamada externa deve ter timeout
- Em timeout, erro ou resposta inválida, usar fallback local
- Nunca quebrar fluxo principal por falha da IA
- Não expor chave em logs
- Tipar entradas e saídas com DTOs/interfaces
- Isolar provider LLM em adapter/interface
- Manter regra fora da camada HTTP

Resposta:
- Código completo em src/services/ e arquivos auxiliares necessários
- Separar por caminho de arquivo
- Não incluir explicações longas

-------

FASE 3 - Prompt 7
Tarefa: Criar controllers e rotas HTTP para a API.

Contexto:
- Projeto Node.js + TypeScript
- Models, DTOs, repositories e services já existem
- Camada de insights e sugestão de categoria já existe
- Usar os services existentes; não duplicar regra de negócio

Objetivo:
Criar endpoints POST/GET para:
- transações
- cartões
- saldo mensal
- insights financeiros
- sugestão de categoria

Estrutura esperada:
- src/controllers/
- src/routes/
- arquivos auxiliares apenas se necessários

Regras:
- Controllers devem apenas validar entrada básica, chamar services e montar resposta HTTP
- Não colocar regra de negócio no controller
- Usar DTOs existentes
- Retornar status HTTP corretos:
  - 201 para criação
  - 200 para consultas
  - 400 para entrada inválida
  - 404 para recurso inexistente
  - 500 para erro inesperado
- Tratamento explícito de 404
- Separar endpoints por domínio/pasta
- Não inventar campos fora dos DTOs/models existentes
- Não criar dependências externas novas

Resposta:
- Código completo
- Separar por caminho de arquivo
- Não incluir explicações fora do código


----


Foi necessário apenas correções nos schemas após implementar as controllers e pedi para deixa-los em arquivos separados