# Start CRM - Documentação e Modelagem de Dados (DER)

Esta feature compõe a documentação interativa e visual da arquitetura de banco de dados (PostgreSQL) do **Start CRM**. Ela serve como uma fonte única de verdade para a engenharia, consolidando o Diagrama Entidade-Relacionamento (DER), o dicionário de dados, decisões de negócios e o fluxo de migrações.

**Acesse a demonstração interativa:** (https://v0-erd-do-start-crm.vercel.app/)

## Sobre a Feature

A página de documentação foi desenvolvida para eliminar ambiguidades técnicas entre Engenheiros de Software, Gestores, Arquitetos e Product Managers, garantindo que a estrutura de dados reflita perfeitamente as regras de negócio do Start CRM.

### Principais Componentes e Funcionalidades

* **Diagrama ER Visual (SVG):** Um diagrama construído de forma nativa que ilustra o modelo consolidado do CRM SaaS: tenant, planos, assinaturas, cobrança, RBAC, usuários, origens, funil, leads, ownership, interações, reuniões, negócios, ausências, alertas, duplicatas e auditoria.
* **Dicionário de Entidades:** Detalhamento profundo de cada tabela, listando campos, tipos de dados (ex: `UUID`, `TIMESTAMP`, `JSONB`), constraints (`PK`, `FK`, `UK`) e descrições técnicas.
* **Decisões de Negócio:** Aba dedicada ao mapeamento de lógicas core, como captura de UTM, cadastro progressivo, RBAC, ownership exclusivo, Kanban, alertas SLA, delegação por férias/atestado, deduplicação sem merge automático, planos SaaS e cobrança recorrente.
* **Gestão de Relacionamentos (FKs):** Documentação explicativa justificando o uso de `ON DELETE RESTRICT` como padrão para evitar perda acidental de histórico comercial e dados órfãos.
* **Trilha de Auditoria (AuditLog):** Estrutura projetada para imutabilidade. Explicação do uso de `TRIGGERS` no PostgreSQL que bloqueiam operações de `UPDATE` e `DELETE`, garantindo histórico confiável em conformidade com políticas de segurança.
* **Estratégia de Performance e Migração:** Documentação clara dos índices priorizados para Kanban, ownership, deduplicação, SLA, timeline e auditoria, além da ordem recomendada de migrações.

### Modelo Consolidado

A modelagem atual expande a primeira versão do DER para cobrir o funcionamento real esperado do Start CRM:

* **Vendas e acompanhamento:** `Lead`, `LeadInteracao`, `LeadEventoFunil`, `Reuniao` e `Negocio`.
* **SaaS e monetização:** `Plano`, `PlanoRecurso`, `Assinatura`, `Fatura`, `Pagamento` e `UsoPlano`.
* **SDRs, Closers e Admin:** `Usuario`, `Role`, `Permission`, `LeadOwnership` e regras de RBAC.
* **Canais de entrada:** `Origem` com `tipo_canal`, UTMs e links rastreáveis.
* **Conflitos e deduplicação:** `Duplicata` com decisão humana e preservação de histórico.
* **Férias e delegação:** `AusenciaUsuario` para pausar round-robin, escalar alertas e registrar substituições temporárias.
* **SLA e alertas:** `RegraSLA` e `Notificacao` como base para alertas in-app e relatórios por e-mail.
* **Auditoria:** `AuditLog` imutável para transferências, merges, alterações de etapa e ações sensíveis.

### Camada SaaS

O Start CRM também será vendido como software por assinatura. Por isso, a modelagem separa o domínio operacional do CRM da monetização do próprio produto:

* **Catálogo comercial:** `Plano` define nome, preço, ciclo de cobrança e disponibilidade.
* **Feature gating e quotas:** `PlanoRecurso` define recursos e limites, como usuários máximos, leads máximos, storage e automações.
* **Contrato do cliente:** `Assinatura` vincula uma `Organizacao` ao plano contratado, com trial, status e período vigente.
* **Cobrança:** `Fatura` registra valores emitidos, vencimentos e status financeiro.
* **Conciliação:** `Pagamento` registra tentativas, aprovações, falhas e IDs do provedor externo.
* **Medição de consumo:** `UsoPlano` mede uso por período para bloquear limites, sugerir upgrade e permitir cobrança futura por consumo.

## Tecnologias Utilizadas para o Diagrama
* React & Next.js, com biblioteca Mermaid.js (Nativa do Ecosssistema JS)
* Tailwind CSS (Estilização)
* SVG (Para a renderização nativa e customizada do diagrama ER)
* Lucide Icons
* Componentes UI baseados no Radix/shadcn

---
*Esta documentação reflete o modelo consolidado de banco PostgreSQL projetado para a arquitetura do Start CRM.*
