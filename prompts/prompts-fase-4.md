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