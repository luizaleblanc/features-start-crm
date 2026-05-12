# Start CRM - Documentação e Modelagem de Dados (DER)

Esta feature compõe a documentação interativa e visual da arquitetura de banco de dados (PostgreSQL) do **Start CRM**. Ela serve como uma fonte única de verdade para a engenharia, consolidando o Diagrama Entidade-Relacionamento (DER), o dicionário de dados, decisões de negócios e o fluxo de migrações.

**Acesse a demonstração interativa:** (https://v0-erd-do-start-crm.vercel.app/)

## Sobre a Feature

A página de documentação foi desenvolvida para eliminar ambiguidades técnicas entre Engenheiros de Software, Gestores, Arquitetos e Product Managers, garantindo que a estrutura de dados reflita perfeitamente as regras de negócio do Start CRM.

### Principais Componentes e Funcionalidades

* **Diagrama ER Visual (SVG):** Um diagrama construído de forma nativa que ilustra as 8 entidades principais do sistema (`Usuario`, `Origem`, `EtapaFunil`, `Lead`, `Reuniao`, `Notificacao`, `Duplicata`, `AuditLog`) e seus relacionamentos, cardinalidades e constraints.
* **Dicionário de Entidades:** Detalhamento profundo de cada tabela, listando campos, tipos de dados (ex: `UUID`, `TIMESTAMP`, `JSONB`), constraints (`PK`, `FK`, `UK`) e descrições técnicas.
* **Decisões de Negócio:** Aba dedicada ao mapeamento de lógicas core, como o algoritmo de distribuição de leads (*round-robin*), alertas SLA por cores, tratamento de leads parciais e deduplicação via `ON CONFLICT`.
* **Gestão de Relacionamentos (FKs):** Documentação explicativa justificando o uso de `ON DELETE RESTRICT` como padrão para evitar perda acidental de histórico comercial e dados órfãos.
* **Trilha de Auditoria (AuditLog):** Estrutura projetada para imutabilidade. Explicação do uso de `TRIGGERS` no PostgreSQL que bloqueiam operações de `UPDATE` e `DELETE`, garantindo histórico confiável em conformidade com políticas de segurança.
* **Estratégia de Performance e Migração:** Documentação clara dos 7 índices de otimização selecionados baseados na frequência de consultas e o passo a passo exato (7 scripts) para a execução segura das migrações do banco.

## Tecnologias Utilizadas para o Diagrama
* React & Next.js, com biblioteca Mermaid.js (Nativa do Ecosssistema JS)
* Tailwind CSS (Estilização)
* SVG (Para a renderização nativa e customizada do diagrama ER)
* Lucide Icons
* Componentes UI baseados no Radix/shadcn

---
*Esta documentação reflete o estado atual da modelagem de banco PostgreSQL projetado para a arquitetura do Start CRM.*
