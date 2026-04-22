# FASE 1 - Prompt 1

FASE 1 - Prompt 1
Tarefa: Gerar um arquivo .gitignore. e um arquivo de prompts para histórico

Escopo:
- Node.js + TypeScript + Jest + Postgres
- Arquivos de ambiente (.env*)
- Diretórios de build (dist, build)
- Dependências (node_modules)
- Cache de testes (coverage, .nyc_output)
- Logs
- Arquivos do sistema operacional
- Configurações locais de IDE (VSCode, JetBrains)

Regras para gitignore:
- Organizar por seções com comentários curtos
- Não incluir explicações fora do arquivo
- Saída deve ser apenas o conteúdo do .gitignore
Regras para o arquivo de prompts:
- Coloque a fase atual + número do prompt
- Deve ser estruturado em .MD


## Resultado
- `.gitignore` criado na raiz do repositório
- Este arquivo registra o histórico do prompt

## Observações
- Saída do chat solicitada: apenas o conteúdo do `.gitignore`


# FASE 1 - Prompt 2

FASE 1 - Prompt 2
Tarefa: Gerar um README.md inicial para um MVP de API financeira.

Contexto:
- API para gestão financeira (entradas, saídas, saldo)
- Node.js + TypeScript + Jest + PostgreSQL + npm + Prisma + ts-node

Seções obrigatórias:
1. Título e descrição curta
2. Objetivo do projeto
3. Stack utilizada
4. Como rodar localmente (instalação, env, execução, testes)
5. Scripts disponíveis
6. Roadmap (lista de próximas features por versão)

Regras:
- Markdown simples e direto
- Sem explicações fora do README
- Evitar texto genérico ou marketing
- Ser conciso (foco em uso prático)
Regras para o arquivo de prompts:
- Coloque a fase atual + número do prompt
- Deve ser estruturado em .MD

## Resultado
- `README.md` criado na raiz com as seções solicitadas
- Este arquivo registra o histórico do prompt


# FASE 1 - Prompt 3

FASE 1 - Prompt 3
Tarefa: Criar endpoint GET /health em Node.js + TypeScript usando Express.

Estrutura:
- src/app.ts
- src/server.ts

Resposta:
- JSON: { status: "ok", timestamp: number }

Incluir:
- Tipagem básica
- Scripts necessários no package.json

Regras:
- Código limpo e direto
- Retornar apenas código (arquivos separados por nome)
- Ajustar readme.md com mais informações
Regras para o arquivo de prompts:
- Coloque a fase atual + número do prompt no arquivo de prompts.md

## Resultado
- `src/app.ts` e `src/server.ts` criados com endpoint `/health`
- `package.json` e `tsconfig.json` adicionados
- `README.md` atualizado com execução e endpoint


# FASE 1 - Prompt 4

FASE 1 - Prompt 4
Analise src/app.ts e src/server.ts.

Considere:
- API HTTP em Node.js + TypeScript
- Possível uso de Express/Fastify

Responda em checklist objetivo:

1) Riscos técnicos (código/arquitetura)
2) Possíveis falhas em produção
3) Testes mínimos necessários

Regras:
- Seja específico (evite genérico)
- Máx. 6 itens por seção
- Foco em problemas reais, não boas práticas genéricas
- Não incluir explicações longas


## Resultado
- Checklist de riscos técnicos, falhas em produção e testes mínimos registrado na conversa

CONVERSA:
Riscos Técnicos

PORT não validado: parseInt(process.env.PORT) pode virar NaN e quebrar listen.
Sem encerramento gracioso: ausência de handlers para SIGTERM/SIGINT e server.close().
Health sem dependências: /health não verifica DB/Prisma; risco de “ok” com backend indisponível.
Ausência de handler 404/erros: respostas variam (HTML) e sem JSON consistente.
Sem middlewares básicos para API futura (ex.: express.json()), quebrando POSTs quando adicionados.
Log somente via console.log, sem níveis/estrutura para observabilidade mínima.
Possíveis Falhas em Produção

EADDRINUSE ao subir se porta ocupada; sem retry/backoff nem mensagem clara.
PORT inválido (ex.: “abc”) causa falha ao iniciar (listen com NaN).
Falta de readiness real: orquestrador libera tráfego com /health ok mesmo com DB offline.
Interrupções/rollouts: sem graceful shutdown, conexões pendentes podem ser derrubadas/bruscamente encerradas.
Respostas 404/erros em HTML podem quebrar clientes que esperam JSON (monitoramento/ALB health parsing).
Sem limite de payload/parsers: possibilidade de overhead quando endpoints forem adicionados.

Testes Mínimos Necessários

GET /health: status 200, content-type JSON, shape {status:'ok', timestamp:number} e timestamp recente.
App factory: createApp() cria instância isolada (sem efeitos globais).
Server boot: sobe na porta do PORT definido e responde /health.
Porta inválida: definir PORT=abc e validar que o start falha de forma controlada/mensagens claras.
404: rota inexistente retorna 404; definir expectativa atual (HTML) para explicitar necessidade de handler JSON.
Shutdown: simular SIGTERM e garantir que server.close é chamado (quando implementado).

