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

