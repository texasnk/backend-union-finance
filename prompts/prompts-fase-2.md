FASE 2 - Prompt 1
Tarefa: Gerar documento docs/escopo-mvp.md.

Contexto:
Sistema de gestão financeira com transações.

Regras de domínio:
- Transação:
  - nome: string obrigatória
  - valor: número positivo obrigatório
  - tipo: "entrada" | "saida" (define impacto no saldo)
  - data_referencia: data obrigatória (YYYY-MM-DD)

- Tipos:
  - única (default)
  - recorrente mensal (gerar ocorrências mensais)
  - parcelada:
      - total_parcelas obrigatório
      - valor dividido igualmente entre parcelas

- Materialização:
  - recorrentes e parceladas devem gerar registros mensais no momento da criação
  - limitar geração a 12 meses futuros (MVP)

- Saldo mensal:
  - soma(entradas) - soma(saidas) por mês/ano da data_referencia

Seções obrigatórias:
1. Objetivo
2. Requisitos funcionais
3. Requisitos não funcionais
4. Fora de escopo

Regras:
- Markdown direto e técnico
- Evitar texto genérico
- Ser específico nas regras de negócio
- Não incluir explicações fora do documento
- Incluir no arquivo novo prompts-fase-2.md este prompt

----

Joguei o resultado no GPT para segunda validação e depois retornei no copilot para revisar novamente com o prompt:

"Deixe o documento mais robusto com RFs, Melhor cobertura do que esta fora do MVP como frontend"


-----

FASE 2 Prompt 2
Tarefa: Gerar docs/backlog.md.

Contexto:
Produto dividido em 3 releases:

Core
Qualidade
Entrega Final
Definições:

RF: requisito funcional (feature de negócio)
RT: requisito técnico (infra, validações, melhorias internas)
Formato:

Organizar por release
Cada item deve conter:
ID (RF-001, RT-001, etc.)
Descrição curta
Critérios de aceite (formato checklist objetivo)
Regras:

Máx. 5 RF por release
RT apenas quando necessário
Critérios de aceite verificáveis (sem genérico)
Markdown em checklist
Sem explicações fora do documento

-----

Na fase 2 após o prompt solicitei para a IA me trazer insights de aplicação de IA no sistema e pedi para atualizar backlog.md e escopo-mvp.md

----


FASE 2 Prompt 3
Tarefa: Gerar diagrama Mermaid.

Contexto:
API Node.js com Express.

Componentes:
- Controller (HTTP)
- Service (regras de negócio)
- Repository (acesso a dados)
- Database (PostgreSQL)
- AI Service (geração de insights e categorias)

Fluxos obrigatórios:
1. Criação de transação
2. Cálculo de saldo mensal
3. Geração de insights via IA

Regras:
- Utilizar backlog.md e escopo-mvp.md como referencia para mais informações
- Usar flowchart
- Nomear claramente cada componente
- Indicar direção do fluxo
- Manter simples e legível
- Não incluir explicações

Resposta:
- Crie um ou mais arquivos com extensão .mmd na pasta docs com os blocos Mermaid

-----

Foi necessário solicitar a instalação de uma lib do mermaid para visualizar via svg + ajustes no .mmd

-----
