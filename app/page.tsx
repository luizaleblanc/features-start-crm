"use client"

import { ERDiagramSVG } from "@/components/er-diagram-svg"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  FileCode2,
  FileText,
  Key,
  Layers,
  Lock,
  Shield,
  Table2,
  Target,
  Users,
  Zap,
} from "lucide-react"

const businessDecisions = {
  origem_utm: {
    status: "RESOLVIDO",
    decision: "Origem do lead deve ser persistida e preenchida automaticamente via UTM sempre que possivel.",
    details:
      "Canais sem UTM usam link rastreavel; input manual pelo SDR e fallback, com origem default 'nao informado'.",
  },
  cadastro_progressivo: {
    status: "RESOLVIDO",
    decision: "Cadastro usa stepper progressivo e salva lead parcial se o usuario abandona a Fase 1.",
    details:
      "Fase 1 captura nome, contato e origem. Fase 2 captura qualificacao, interesse, disponibilidade e perfil.",
  },
  rbac: {
    status: "RESOLVIDO",
    decision: "RBAC deixa de depender de um unico enum de perfil e passa a usar Role e Permission.",
    details:
      "SDR ve seus leads; Closer ve leads atribuidos ou qualificados; Admin ve todos e pode reatribuir ownership.",
  },
  ownership_exclusivo: {
    status: "RESOLVIDO",
    decision: "Lead tem responsaveis atuais separados para SDR e Closer, com historico em LeadOwnership.",
    details:
      "Toda transferencia encerra o ownership anterior, cria um novo registro e gera evento imutavel no AuditLog.",
  },
  funil_kanban: {
    status: "RESOLVIDO",
    decision: "Kanban operacional entra no MVP; dashboard gerencial fica para V2.",
    details:
      "Movimentacao de cards respeita owner, tipo de responsavel da etapa e permissoes RBAC. Polling de 30s no MVP.",
  },
  sla_alertas: {
    status: "RESOLVIDO",
    decision: "Alertas urgentes sao in-app; e-mail fica para resumo diario ou semanal.",
    details:
      "Gatilhos iniciais: lead sem contato ha N dias, reuniao sem confirmacao e lead reativado apos inatividade.",
  },
  ausencias_delegacao: {
    status: "RESOLVIDO",
    decision: "Ferias, atestado e indisponibilidade ficam em AusenciaUsuario.",
    details:
      "Round-robin ignora usuarios ausentes. Alertas escalam para delegado ou admin quando o owner nao responde.",
  },
  duplicidade_merge: {
    status: "RESOLVIDO",
    decision: "Duplicidade bloqueia cadastro e nao faz merge automatico.",
    details:
      "Match primario por e-mail e telefone; camada adicional por nome + CPF pode ser usada. Historico nao e descartado.",
  },
  catalogo_saas: {
    status: "RESOLVIDO",
    decision: "Planos do SaaS ficam em catalogo proprio, separado das regras comerciais dos clientes do CRM.",
    details:
      "Plano define preco, ciclo de cobranca, limites e recursos. Organizacao consome o produto por uma assinatura ativa.",
  },
  assinatura_tenant: {
    status: "RESOLVIDO",
    decision: "Organizacao possui uma assinatura vigente, com trial, status, periodo atual e plano contratado.",
    details:
      "Upgrade e downgrade criam historico na assinatura e devem preservar billing, limites e auditoria.",
  },
  limites_de_uso: {
    status: "RESOLVIDO",
    decision: "Limites comerciais do SaaS sao medidos em UsoPlano, nao em campos soltos na Organizacao.",
    details:
      "Usuarios, leads, storage, automacoes e notificacoes podem ser limitados por plano e medidos por periodo.",
  },
  cobranca_pagamentos: {
    status: "RESOLVIDO",
    decision: "Fatura e Pagamento documentam cobranca recorrente, tentativas, falhas e conciliacao com provedor externo.",
    details:
      "O CRM deve conseguir bloquear recursos por inadimplencia sem apagar dados ou quebrar historico operacional.",
  },
}

const entities = [
  {
    name: "Organizacao",
    icon: Database,
    color: "bg-slate-700",
    textColor: "text-slate-700",
    description:
      "Tenant do CRM. Centraliza configuracoes por cliente, como video-guia, canais ativos, regras de SLA e escopo de dados.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico da organizacao" },
      { name: "nome", type: "VARCHAR(255)", constraint: "", desc: "Nome comercial do tenant" },
      { name: "slug", type: "VARCHAR(100)", constraint: "UK", desc: "Identificador amigavel para URLs e contexto" },
      { name: "video_guia_url", type: "TEXT", constraint: "", desc: "Video configuravel para orientar o cadastro" },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de criacao" },
    ],
    businessRules: [
      "Todo dado operacional deve pertencer a uma organizacao",
      "Configuracoes de funil, SLA e origem sao isoladas por tenant",
      "Video-guia e opcional e administrado pelo proprio tenant",
    ],
  },
  {
    name: "Usuario",
    icon: Users,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    description:
      "Identidade de SDRs, Closers e Admins. Papeis e permissoes ficam no RBAC, nao em um enum fixo no usuario.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "organizacao_id", type: "UUID", constraint: "FK", desc: "Tenant ao qual o usuario pertence" },
      { name: "nome", type: "VARCHAR(255)", constraint: "", desc: "Nome completo" },
      { name: "email", type: "VARCHAR(255)", constraint: "UK", desc: "Login unico por organizacao" },
      { name: "senha_hash", type: "VARCHAR(255)", constraint: "", desc: "Senha criptografada" },
      { name: "telefone", type: "VARCHAR(20)", constraint: "", desc: "Contato operacional" },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se pode acessar e receber atribuicoes" },
      {
        name: "ultimo_lead_atribuido",
        type: "TIMESTAMP",
        constraint: "",
        desc: "Base do round-robin entre usuarios elegiveis",
      },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de criacao" },
    ],
    businessRules: [
      "Usuario ativo pode entrar na fila de atribuicao, exceto se estiver ausente",
      "RBAC define se o usuario atua como SDR, Closer, Admin ou combinacoes futuras",
      "A remocao de usuario exige transferencia de leads ativos antes da exclusao",
    ],
  },
  {
    name: "Role",
    icon: Shield,
    color: "bg-violet-500",
    textColor: "text-violet-600",
    description: "Papel de acesso do RBAC, como SDR, CLOSER e ADMIN.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "nome", type: "VARCHAR(100)", constraint: "UK", desc: "Nome do papel" },
      { name: "descricao", type: "TEXT", constraint: "", desc: "Descricao funcional do papel" },
    ],
    businessRules: [
      "Papeis padrao: SDR, CLOSER e ADMIN",
      "Usuario pode ter mais de um papel se a operacao exigir",
      "Papeis controlam acesso; ownership controla responsabilidade comercial",
    ],
  },
  {
    name: "Permission",
    icon: Key,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    description: "Permissao granular usada pelo RBAC para acoes sensiveis do CRM.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "chave", type: "VARCHAR(150)", constraint: "UK", desc: "Ex: lead.move, lead.reassign, lead.view_all" },
      { name: "descricao", type: "TEXT", constraint: "", desc: "Descricao da permissao" },
    ],
    businessRules: [
      "Permissoes controlam mover card, reatribuir lead, fechar negocio e ver todos os leads",
      "Novas permissoes podem ser adicionadas sem migrar perfil do usuario",
      "Admin recebe permissoes globais por padrao",
    ],
  },
  {
    name: "Origem",
    icon: Target,
    color: "bg-green-500",
    textColor: "text-green-600",
    description:
      "Canal de entrada do lead, enriquecido com UTM e links rastreaveis para ROI e rastreabilidade de campanhas.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "organizacao_id", type: "UUID", constraint: "FK", desc: "Tenant dono da origem" },
      { name: "nome", type: "VARCHAR(100)", constraint: "", desc: "Nome do canal ou campanha" },
      { name: "tipo_canal", type: "ENUM", constraint: "", desc: "WHATSAPP | LINKEDIN | LP | ADS | MANUAL | INDICACAO" },
      { name: "utm_source", type: "VARCHAR(100)", constraint: "", desc: "Origem de campanha" },
      { name: "utm_medium", type: "VARCHAR(100)", constraint: "", desc: "Meio da campanha" },
      { name: "utm_campaign", type: "VARCHAR(150)", constraint: "", desc: "Campanha de captacao" },
      { name: "link_rastreavel", type: "TEXT", constraint: "", desc: "URL unica para canais sem UTM nativo" },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se pode ser usada em novos leads" },
    ],
    businessRules: [
      "Origem do lead e obrigatoria; fallback e 'nao informado'",
      "UTM deve ser capturada automaticamente no entry point",
      "Input manual pelo SDR e ultimo recurso e deve gerar alerta de saneamento",
    ],
  },
  {
    name: "EtapaFunil",
    icon: Layers,
    color: "bg-fuchsia-500",
    textColor: "text-fuchsia-600",
    description:
      "Coluna do Kanban com SLA, ordem e regra de quem pode movimentar cards naquela etapa.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "organizacao_id", type: "UUID", constraint: "FK", desc: "Tenant dono do funil" },
      { name: "nome", type: "VARCHAR(100)", constraint: "", desc: "Nome da etapa" },
      { name: "ordem", type: "INTEGER", constraint: "", desc: "Ordem visual no Kanban" },
      { name: "tipo_responsavel", type: "ENUM", constraint: "", desc: "SDR | CLOSER | ADMIN | AMBOS" },
      { name: "sla_horas", type: "INTEGER", constraint: "", desc: "Tempo maximo recomendado na etapa" },
      { name: "permite_owner_mover", type: "BOOLEAN", constraint: "", desc: "Owner pode mover card" },
      { name: "permite_admin_mover", type: "BOOLEAN", constraint: "", desc: "Admin pode mover card" },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se aparece no funil" },
    ],
    businessRules: [
      "Owner move apenas leads sob sua responsabilidade quando a etapa permitir",
      "Admin pode corrigir fluxo e movimentar manualmente quando necessario",
      "Etapas de fechamento podem exigir permissao de Closer ou Admin",
    ],
  },
  {
    name: "Lead",
    icon: FileText,
    color: "bg-amber-500",
    textColor: "text-amber-600",
    description:
      "Entidade central do CRM. Guarda contato, origem, etapa, temperatura, score e responsaveis atuais.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "organizacao_id", type: "UUID", constraint: "FK", desc: "Tenant dono do lead" },
      { name: "origem_id", type: "UUID", constraint: "FK", desc: "Canal/campanha de captacao" },
      { name: "etapa_funil_id", type: "UUID", constraint: "FK", desc: "Etapa atual do Kanban" },
      { name: "owner_sdr_id", type: "UUID", constraint: "FK", desc: "SDR responsavel atual" },
      { name: "owner_closer_id", type: "UUID", constraint: "FK", desc: "Closer responsavel atual, se houver" },
      { name: "nome", type: "VARCHAR(255)", constraint: "", desc: "Nome do lead" },
      { name: "email", type: "VARCHAR(255)", constraint: "", desc: "E-mail para contato e deduplicacao" },
      { name: "telefone", type: "VARCHAR(20)", constraint: "", desc: "Telefone para contato e deduplicacao" },
      { name: "cpf", type: "VARCHAR(14)", constraint: "", desc: "Opcional para matching adicional" },
      { name: "empresa", type: "VARCHAR(255)", constraint: "", desc: "Empresa do lead" },
      { name: "cargo", type: "VARCHAR(100)", constraint: "", desc: "Cargo do contato" },
      { name: "temperatura", type: "ENUM", constraint: "", desc: "FRIO | MORNO | QUENTE" },
      { name: "score", type: "INTEGER", constraint: "", desc: "Pontuacao recalculada por interacoes" },
      { name: "cadastro_completo", type: "BOOLEAN", constraint: "", desc: "Se passou pelas fases minimas do cadastro" },
      { name: "dropoff_step", type: "VARCHAR(50)", constraint: "", desc: "Etapa onde abandonou o formulario" },
      { name: "primeiro_contato_at", type: "TIMESTAMP", constraint: "", desc: "Primeiro contato efetivo" },
      { name: "ultimo_contato_at", type: "TIMESTAMP", constraint: "", desc: "Ultimo contato registrado" },
      { name: "proxima_acao_at", type: "TIMESTAMP", constraint: "", desc: "Proxima acao planejada" },
    ],
    businessRules: [
      "Lead parcial nunca e descartado; entra em fila de tratamento",
      "Owner SDR e owner Closer reduzem conflito entre personas",
      "Temperatura e score mudam apos interacoes, nao apenas no cadastro",
      "Duplicidade por e-mail/telefone bloqueia cadastro e exige decisao humana",
    ],
  },
  {
    name: "LeadOwnership",
    icon: Clock,
    color: "bg-teal-600",
    textColor: "text-teal-600",
    description:
      "Historico de atribuicoes e reatribuicoes do lead para SDRs e Closers.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead atribuido" },
      { name: "usuario_id", type: "UUID", constraint: "FK", desc: "Responsavel atribuido" },
      { name: "tipo_owner", type: "ENUM", constraint: "", desc: "SDR | CLOSER" },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se e o ownership vigente" },
      { name: "motivo", type: "VARCHAR(100)", constraint: "", desc: "ROUND_ROBIN | MANUAL | FERIAS | ESCALONAMENTO" },
      { name: "atribuido_por_id", type: "UUID", constraint: "FK", desc: "Usuario que fez a transferencia" },
      { name: "inicio_at", type: "TIMESTAMP", constraint: "", desc: "Inicio da responsabilidade" },
      { name: "fim_at", type: "TIMESTAMP", constraint: "", desc: "Fim da responsabilidade" },
    ],
    businessRules: [
      "Apenas um ownership ativo por tipo de owner",
      "Transferencias nunca sobrescrevem historico",
      "Toda mudanca gera AuditLog",
    ],
  },
  {
    name: "LeadInteracao",
    icon: Bell,
    color: "bg-cyan-600",
    textColor: "text-cyan-600",
    description:
      "Registro operacional de contatos, notas e eventos relevantes na jornada do lead.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead relacionado" },
      { name: "usuario_id", type: "UUID", constraint: "FK", desc: "Quem registrou ou executou a interacao" },
      { name: "canal", type: "ENUM", constraint: "", desc: "WHATSAPP | LINKEDIN | EMAIL | LIGACAO | MANUAL" },
      { name: "tipo", type: "ENUM", constraint: "", desc: "CONTATO | NOTA | RETORNO | QUALIFICACAO" },
      { name: "conteudo", type: "TEXT", constraint: "", desc: "Resumo ou observacao" },
      { name: "resultado", type: "VARCHAR(100)", constraint: "", desc: "Atendeu, sem resposta, interessado etc." },
      { name: "temperatura_antes", type: "ENUM", constraint: "", desc: "Snapshot antes da interacao" },
      { name: "temperatura_depois", type: "ENUM", constraint: "", desc: "Snapshot apos recalculo" },
    ],
    businessRules: [
      "Interacoes alimentam score, temperatura e historico do lead",
      "SLA usa ultimo_contato_at derivado das interacoes",
      "Notas nao substituem AuditLog; elas documentam operacao comercial",
    ],
  },
  {
    name: "LeadEventoFunil",
    icon: Layers,
    color: "bg-indigo-500",
    textColor: "text-indigo-600",
    description: "Historico de mudancas de etapa do lead no Kanban.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead movimentado" },
      { name: "etapa_origem_id", type: "UUID", constraint: "FK", desc: "Etapa anterior" },
      { name: "etapa_destino_id", type: "UUID", constraint: "FK", desc: "Nova etapa" },
      { name: "movido_por_id", type: "UUID", constraint: "FK", desc: "Usuario que moveu" },
      { name: "motivo", type: "TEXT", constraint: "", desc: "Motivo opcional da movimentacao" },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data da movimentacao" },
    ],
    businessRules: [
      "Permite medir tempo por etapa e gargalos do funil",
      "Movimentacao deve validar RBAC e ownership",
      "Admin consegue auditar quem moveu e quando",
    ],
  },
  {
    name: "Reuniao",
    icon: Calendar,
    color: "bg-sky-500",
    textColor: "text-sky-600",
    description:
      "Agenda controlada pelo CRM, com Google Calendar como espelho unidirecional no MVP.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead associado" },
      { name: "consultor_id", type: "UUID", constraint: "FK", desc: "SDR ou Closer responsavel pela reuniao" },
      { name: "data_hora", type: "TIMESTAMP", constraint: "", desc: "Inicio da reuniao" },
      { name: "duracao_minutos", type: "INTEGER", constraint: "", desc: "Duracao prevista" },
      { name: "status", type: "ENUM", constraint: "", desc: "AGENDADA | REALIZADA | CANCELADA | REMARCADA" },
      { name: "google_event_id", type: "VARCHAR(255)", constraint: "", desc: "ID do evento criado no Google" },
      { name: "resumo", type: "TEXT", constraint: "", desc: "Resumo apos a reuniao" },
    ],
    businessRules: [
      "CRM cria evento no Calendar; alteracoes diretas no Calendar nao sincronizam no MVP",
      "Reuniao sem confirmacao pode gerar alerta",
      "Consultor precisa ter permissao e relacao operacional com o lead",
    ],
  },
  {
    name: "Negocio",
    icon: Target,
    color: "bg-red-600",
    textColor: "text-red-600",
    description:
      "Representa a oportunidade comercial e o fechamento associado ao lead.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead convertido em oportunidade" },
      { name: "closer_id", type: "UUID", constraint: "FK", desc: "Closer responsavel" },
      { name: "valor_estimado", type: "NUMERIC(12,2)", constraint: "", desc: "Valor potencial" },
      { name: "valor_fechado", type: "NUMERIC(12,2)", constraint: "", desc: "Valor contratado" },
      { name: "status", type: "ENUM", constraint: "", desc: "ABERTO | GANHO | PERDIDO" },
      { name: "perdido_motivo", type: "TEXT", constraint: "", desc: "Motivo de perda" },
      { name: "fechado_at", type: "TIMESTAMP", constraint: "", desc: "Data do fechamento" },
    ],
    businessRules: [
      "Separa acompanhamento de lead de gestao de venda",
      "Somente Closer ou Admin pode fechar negocio, conforme RBAC",
      "Negocio ganho alimenta metricas gerenciais da V2",
    ],
  },
  {
    name: "AusenciaUsuario",
    icon: Clock,
    color: "bg-orange-600",
    textColor: "text-orange-600",
    description:
      "Controle de ferias, atestado e indisponibilidade para round-robin, alertas e delegacao.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "usuario_id", type: "UUID", constraint: "FK", desc: "Usuario ausente" },
      { name: "delegado_para_id", type: "UUID", constraint: "FK", desc: "Responsavel temporario" },
      { name: "tipo", type: "ENUM", constraint: "", desc: "FERIAS | ATESTADO | INDISPONIVEL" },
      { name: "inicio_at", type: "TIMESTAMP", constraint: "", desc: "Inicio da ausencia" },
      { name: "fim_at", type: "TIMESTAMP", constraint: "", desc: "Fim previsto" },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se a ausencia esta vigente" },
    ],
    businessRules: [
      "Round-robin ignora usuarios com ausencia ativa",
      "Alertas escalam para delegado ou admin",
      "Reatribuicao temporaria gera LeadOwnership com motivo FERIAS ou ESCALONAMENTO",
    ],
  },
  {
    name: "RegraSLA",
    icon: Zap,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    description: "Configuracao de SLA e gatilhos de alerta por etapa, temperatura ou tenant.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "organizacao_id", type: "UUID", constraint: "FK", desc: "Tenant dono da regra" },
      { name: "etapa_funil_id", type: "UUID", constraint: "FK", desc: "Etapa opcional da regra" },
      { name: "temperatura", type: "ENUM", constraint: "", desc: "Temperatura opcional" },
      { name: "limite_horas", type: "INTEGER", constraint: "", desc: "Prazo maximo sem acao" },
      { name: "prioridade", type: "ENUM", constraint: "", desc: "BAIXA | MEDIA | ALTA | CRITICA" },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se a regra esta ativa" },
    ],
    businessRules: [
      "Admin configura prazos sem alterar codigo",
      "Regra pode ser geral, por etapa ou por temperatura",
      "Lead quente parado pode gerar alerta critico",
    ],
  },
  {
    name: "Notificacao",
    icon: Bell,
    color: "bg-rose-500",
    textColor: "text-rose-600",
    description: "Alerta in-app gerado por atribuicao, SLA, reuniao ou escalonamento.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "usuario_id", type: "UUID", constraint: "FK", desc: "Destinatario" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead relacionado, quando aplicavel" },
      { name: "tipo", type: "VARCHAR(50)", constraint: "", desc: "ATRIBUICAO | SLA | REUNIAO | ESCALONAMENTO" },
      { name: "prioridade", type: "ENUM", constraint: "", desc: "BAIXA | MEDIA | ALTA | CRITICA" },
      { name: "titulo", type: "VARCHAR(100)", constraint: "", desc: "Titulo curto" },
      { name: "mensagem", type: "TEXT", constraint: "", desc: "Mensagem operacional" },
      { name: "lida", type: "BOOLEAN", constraint: "", desc: "Se foi visualizada" },
    ],
    businessRules: [
      "Canal primario de alerta urgente e in-app",
      "E-mail e resumo consolidado, nao canal urgente do MVP",
      "Se owner esta ausente, alerta vai para delegado ou admin",
    ],
  },
  {
    name: "Duplicata",
    icon: Copy,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    description:
      "Conflito de lead detectado por e-mail, telefone ou criterios adicionais como nome + CPF.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_original_id", type: "UUID", constraint: "FK", desc: "Lead preservado como principal" },
      { name: "lead_duplicado_id", type: "UUID", constraint: "FK", desc: "Lead conflitante" },
      { name: "campo_match", type: "VARCHAR(50)", constraint: "", desc: "email | telefone | nome_cpf | fuzzy" },
      { name: "score_match", type: "INTEGER", constraint: "", desc: "Confianca do match" },
      { name: "status", type: "ENUM", constraint: "", desc: "PENDENTE | MESCLADO | IGNORADO" },
      { name: "resolvido_por_id", type: "UUID", constraint: "FK", desc: "Usuario que resolveu" },
    ],
    businessRules: [
      "Sistema bloqueia conflito e pede decisao humana",
      "Merge nao pode descartar historico de interacoes ou ownership",
      "Duplicata pendente impede exclusao dos leads envolvidos",
    ],
  },
  {
    name: "Plano",
    icon: Target,
    color: "bg-emerald-600",
    textColor: "text-emerald-600",
    description:
      "Catalogo comercial do SaaS. Define preco, ciclo de cobranca, limites padrao e posicionamento do produto.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "nome", type: "VARCHAR(100)", constraint: "UK", desc: "Nome publico do plano" },
      { name: "slug", type: "VARCHAR(100)", constraint: "UK", desc: "Identificador estavel para checkout e regras" },
      { name: "descricao", type: "TEXT", constraint: "", desc: "Descricao comercial" },
      { name: "preco_centavos", type: "INTEGER", constraint: "", desc: "Preco base em centavos" },
      { name: "moeda", type: "CHAR(3)", constraint: "", desc: "BRL, USD etc." },
      { name: "ciclo_cobranca", type: "ENUM", constraint: "", desc: "MENSAL | ANUAL" },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se pode ser contratado" },
    ],
    businessRules: [
      "Plano e global do SaaS, nao pertence a uma organizacao especifica",
      "Mudanca de preco nao altera faturas ja emitidas",
      "Plano inativo permanece para assinaturas historicas, mas nao aparece no checkout",
    ],
  },
  {
    name: "PlanoRecurso",
    icon: Zap,
    color: "bg-lime-600",
    textColor: "text-lime-600",
    description:
      "Recursos e limites incluidos em cada plano, usados para feature gating e controle de quota.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "plano_id", type: "UUID", constraint: "FK", desc: "Plano ao qual o recurso pertence" },
      { name: "chave", type: "VARCHAR(100)", constraint: "", desc: "Ex: users.max, leads.max, automations.enabled" },
      { name: "tipo_valor", type: "ENUM", constraint: "", desc: "BOOLEAN | INTEGER | TEXT" },
      { name: "valor", type: "VARCHAR(255)", constraint: "", desc: "Valor configurado para o recurso" },
      { name: "descricao", type: "TEXT", constraint: "", desc: "Descricao do recurso ou limite" },
    ],
    businessRules: [
      "Controle de acesso do produto deve consultar recursos do plano alem do RBAC",
      "Limites numericos devem ser medidos em UsoPlano",
      "Recursos booleanos liberam ou bloqueiam modulos do SaaS",
    ],
  },
  {
    name: "Assinatura",
    icon: Clock,
    color: "bg-blue-700",
    textColor: "text-blue-700",
    description:
      "Contrato recorrente entre Organizacao e Plano. Controla trial, status, periodo vigente e provedor de billing.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "organizacao_id", type: "UUID", constraint: "FK", desc: "Tenant assinante" },
      { name: "plano_id", type: "UUID", constraint: "FK", desc: "Plano contratado" },
      { name: "status", type: "ENUM", constraint: "", desc: "TRIAL | ATIVA | PAST_DUE | CANCELADA | EXPIRADA" },
      { name: "trial_ends_at", type: "TIMESTAMP", constraint: "", desc: "Fim do periodo de teste" },
      { name: "periodo_inicio", type: "TIMESTAMP", constraint: "", desc: "Inicio do ciclo atual" },
      { name: "periodo_fim", type: "TIMESTAMP", constraint: "", desc: "Fim do ciclo atual" },
      { name: "provedor", type: "VARCHAR(50)", constraint: "", desc: "Stripe, Asaas, Pagar.me etc." },
      { name: "provedor_subscription_id", type: "VARCHAR(255)", constraint: "", desc: "ID externo da assinatura" },
    ],
    businessRules: [
      "Uma organizacao deve ter no maximo uma assinatura ativa por produto",
      "Status PAST_DUE pode bloquear criacao de novos leads sem apagar dados existentes",
      "Upgrade e downgrade preservam historico financeiro e geram AuditLog",
    ],
  },
  {
    name: "Fatura",
    icon: FileText,
    color: "bg-indigo-700",
    textColor: "text-indigo-700",
    description:
      "Cobranca emitida para uma assinatura em determinado periodo.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "assinatura_id", type: "UUID", constraint: "FK", desc: "Assinatura cobrada" },
      { name: "numero", type: "VARCHAR(50)", constraint: "UK", desc: "Numero fiscal ou sequencial interno" },
      { name: "status", type: "ENUM", constraint: "", desc: "ABERTA | PAGA | VENCIDA | CANCELADA" },
      { name: "valor_centavos", type: "INTEGER", constraint: "", desc: "Valor total" },
      { name: "vencimento_at", type: "TIMESTAMP", constraint: "", desc: "Data de vencimento" },
      { name: "paga_at", type: "TIMESTAMP", constraint: "", desc: "Data de quitacao" },
      { name: "provedor_invoice_id", type: "VARCHAR(255)", constraint: "", desc: "ID externo no gateway" },
    ],
    businessRules: [
      "Fatura vencida alimenta status PAST_DUE da assinatura",
      "Fatura nao deve ser deletada apos emissao",
      "Valor da fatura deve registrar o preco aplicado no momento da emissao",
    ],
  },
  {
    name: "Pagamento",
    icon: Key,
    color: "bg-cyan-700",
    textColor: "text-cyan-700",
    description:
      "Tentativa ou confirmacao de pagamento de uma fatura.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "fatura_id", type: "UUID", constraint: "FK", desc: "Fatura relacionada" },
      { name: "status", type: "ENUM", constraint: "", desc: "PENDENTE | APROVADO | FALHOU | ESTORNADO" },
      { name: "metodo", type: "ENUM", constraint: "", desc: "CARTAO | PIX | BOLETO | TRANSFERENCIA" },
      { name: "valor_centavos", type: "INTEGER", constraint: "", desc: "Valor pago ou tentado" },
      { name: "provedor_payment_id", type: "VARCHAR(255)", constraint: "", desc: "ID externo no gateway" },
      { name: "erro_codigo", type: "VARCHAR(100)", constraint: "", desc: "Codigo de falha quando houver" },
      { name: "processado_at", type: "TIMESTAMP", constraint: "", desc: "Momento da resposta do gateway" },
    ],
    businessRules: [
      "Uma fatura pode ter multiplas tentativas de pagamento",
      "Pagamento aprovado quita fatura e regulariza assinatura",
      "Falhas devem gerar notificacao administrativa e trilha de auditoria",
    ],
  },
  {
    name: "UsoPlano",
    icon: Database,
    color: "bg-teal-700",
    textColor: "text-teal-700",
    description:
      "Metrica de consumo da organizacao dentro de um periodo de assinatura.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "organizacao_id", type: "UUID", constraint: "FK", desc: "Tenant medido" },
      { name: "assinatura_id", type: "UUID", constraint: "FK", desc: "Assinatura vigente no periodo" },
      { name: "chave", type: "VARCHAR(100)", constraint: "", desc: "Ex: users.count, leads.count, storage.mb" },
      { name: "quantidade", type: "INTEGER", constraint: "", desc: "Consumo atual" },
      { name: "limite", type: "INTEGER", constraint: "", desc: "Limite contratado no plano" },
      { name: "periodo_inicio", type: "TIMESTAMP", constraint: "", desc: "Inicio da janela de medicao" },
      { name: "periodo_fim", type: "TIMESTAMP", constraint: "", desc: "Fim da janela de medicao" },
    ],
    businessRules: [
      "Limites sao avaliados antes de criar usuarios, leads ou automacoes",
      "Exceder limite pode bloquear novas criacoes ou sugerir upgrade",
      "Uso por periodo permite relatorios e cobranca futura por consumo",
    ],
  },
  {
    name: "AuditLog",
    icon: Lock,
    color: "bg-slate-600",
    textColor: "text-slate-600",
    description:
      "Historico imutavel de acoes sensiveis, usado para rastrear transferencias, merges e mudancas de funil.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "entidade", type: "VARCHAR(50)", constraint: "", desc: "Tabela ou agregado alterado" },
      { name: "entidade_id", type: "UUID", constraint: "", desc: "Registro afetado" },
      { name: "acao", type: "VARCHAR(20)", constraint: "", desc: "CREATE | UPDATE | DELETE | TRANSFER | MERGE" },
      { name: "dados_anteriores", type: "JSONB", constraint: "", desc: "Snapshot antes" },
      { name: "dados_novos", type: "JSONB", constraint: "", desc: "Snapshot depois" },
      { name: "usuario_id", type: "UUID", constraint: "FK", desc: "Autor da acao, quando houver" },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data/hora da acao" },
    ],
    businessRules: [
      "Apenas INSERT permitido",
      "Toda transferencia de ownership gera log",
      "Merge de duplicata preserva historico e registra decisao",
    ],
  },
]

const enums = [
  {
    name: "temperatura_lead",
    table: "Lead",
    field: "temperatura",
    values: [
      { value: "FRIO", desc: "Baixo interesse ou lead recem-captado.", color: "bg-blue-100 text-blue-800 border-blue-200" },
      { value: "MORNO", desc: "Interesse moderado e qualificacao em andamento.", color: "bg-amber-100 text-amber-800 border-amber-200" },
      { value: "QUENTE", desc: "Alta intencao; prioridade para Closer e alertas.", color: "bg-red-100 text-red-800 border-red-200" },
    ],
  },
  {
    name: "tipo_canal",
    table: "Origem / LeadInteracao",
    field: "tipo_canal | canal",
    values: [
      { value: "WHATSAPP", desc: "Entrada ou interacao por WhatsApp.", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "LINKEDIN", desc: "Prospeccao ou origem via LinkedIn.", color: "bg-sky-100 text-sky-800 border-sky-200" },
      { value: "LP", desc: "Landing page ou formulario externo.", color: "bg-purple-100 text-purple-800 border-purple-200" },
      { value: "ADS", desc: "Midia paga com UTM.", color: "bg-orange-100 text-orange-800 border-orange-200" },
      { value: "MANUAL", desc: "Criacao manual pelo time.", color: "bg-slate-100 text-slate-800 border-slate-200" },
    ],
  },
  {
    name: "tipo_owner",
    table: "LeadOwnership",
    field: "tipo_owner",
    values: [
      { value: "SDR", desc: "Responsavel por prospeccao e qualificacao.", color: "bg-teal-100 text-teal-800 border-teal-200" },
      { value: "CLOSER", desc: "Responsavel por negociacao e fechamento.", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    ],
  },
  {
    name: "status_negocio",
    table: "Negocio",
    field: "status",
    values: [
      { value: "ABERTO", desc: "Oportunidade em negociacao.", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      { value: "GANHO", desc: "Venda fechada.", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "PERDIDO", desc: "Venda perdida com motivo registrado.", color: "bg-red-100 text-red-800 border-red-200" },
    ],
  },
  {
    name: "status_duplicata",
    table: "Duplicata",
    field: "status",
    values: [
      { value: "PENDENTE", desc: "Aguardando decisao do admin ou SDR autorizado.", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      { value: "MESCLADO", desc: "Historicos unificados no lead principal.", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "IGNORADO", desc: "Conflito analisado e descartado.", color: "bg-gray-100 text-gray-800 border-gray-200" },
    ],
  },
  {
    name: "ciclo_cobranca",
    table: "Plano",
    field: "ciclo_cobranca",
    values: [
      { value: "MENSAL", desc: "Cobranca recorrente mensal.", color: "bg-sky-100 text-sky-800 border-sky-200" },
      { value: "ANUAL", desc: "Cobranca recorrente anual, geralmente com desconto.", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    ],
  },
  {
    name: "status_assinatura",
    table: "Assinatura",
    field: "status",
    values: [
      { value: "TRIAL", desc: "Periodo de teste ativo.", color: "bg-purple-100 text-purple-800 border-purple-200" },
      { value: "ATIVA", desc: "Assinatura regular e liberada.", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "PAST_DUE", desc: "Pagamento pendente ou falhou.", color: "bg-orange-100 text-orange-800 border-orange-200" },
      { value: "CANCELADA", desc: "Cancelada pelo cliente ou admin.", color: "bg-slate-100 text-slate-800 border-slate-200" },
      { value: "EXPIRADA", desc: "Trial ou contrato encerrado sem renovacao.", color: "bg-red-100 text-red-800 border-red-200" },
    ],
  },
  {
    name: "status_pagamento",
    table: "Pagamento",
    field: "status",
    values: [
      { value: "PENDENTE", desc: "Pagamento aguardando confirmacao.", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      { value: "APROVADO", desc: "Pagamento confirmado pelo gateway.", color: "bg-green-100 text-green-800 border-green-200" },
      { value: "FALHOU", desc: "Tentativa recusada ou erro de processamento.", color: "bg-red-100 text-red-800 border-red-200" },
      { value: "ESTORNADO", desc: "Valor devolvido ao cliente.", color: "bg-slate-100 text-slate-800 border-slate-200" },
    ],
  },
]

const foreignKeys = [
  { from: "Usuario", to: "Organizacao", field: "organizacao_id", rule: "RESTRICT", reason: "Usuario pertence a um tenant e nao deve ficar orfao." },
  { from: "Origem", to: "Organizacao", field: "organizacao_id", rule: "RESTRICT", reason: "Origem e configuracao do tenant." },
  { from: "EtapaFunil", to: "Organizacao", field: "organizacao_id", rule: "RESTRICT", reason: "Funil e SLA sao especificos por tenant." },
  { from: "Lead", to: "Organizacao", field: "organizacao_id", rule: "RESTRICT", reason: "Lead sempre pertence a uma organizacao." },
  { from: "Lead", to: "Origem", field: "origem_id", rule: "RESTRICT", reason: "Origem preserva relatorios de ROI por canal." },
  { from: "Lead", to: "EtapaFunil", field: "etapa_funil_id", rule: "RESTRICT", reason: "Etapa preserva estado operacional do Kanban." },
  { from: "Lead", to: "Usuario", field: "owner_sdr_id", rule: "RESTRICT", reason: "SDR ativo nao pode ser removido sem transferencia." },
  { from: "Lead", to: "Usuario", field: "owner_closer_id", rule: "SET NULL", reason: "Closer pode ser atribuido depois, sem bloquear lead em qualificacao." },
  { from: "LeadOwnership", to: "Lead", field: "lead_id", rule: "RESTRICT", reason: "Historico de ownership nao deve ser apagado com facilidade." },
  { from: "LeadOwnership", to: "Usuario", field: "usuario_id", rule: "RESTRICT", reason: "Responsavel historico precisa continuar rastreavel." },
  { from: "LeadInteracao", to: "Lead", field: "lead_id", rule: "RESTRICT", reason: "Interacoes fazem parte do historico comercial." },
  { from: "LeadEventoFunil", to: "Lead", field: "lead_id", rule: "RESTRICT", reason: "Mudancas de etapa compoem a auditoria operacional." },
  { from: "Reuniao", to: "Lead", field: "lead_id", rule: "RESTRICT", reason: "Reunioes preservam historico do lead." },
  { from: "Negocio", to: "Lead", field: "lead_id", rule: "RESTRICT", reason: "Venda deve permanecer ligada ao lead de origem." },
  { from: "AusenciaUsuario", to: "Usuario", field: "usuario_id", rule: "RESTRICT", reason: "Ausencias explicam atribuicoes e escalonamentos." },
  { from: "Notificacao", to: "Usuario", field: "usuario_id", rule: "CASCADE", reason: "Notificacao in-app nao tem valor sem destinatario." },
  { from: "Duplicata", to: "Lead", field: "lead_original_id", rule: "RESTRICT", reason: "Conflitos precisam ser resolvidos antes de remover leads." },
  { from: "PlanoRecurso", to: "Plano", field: "plano_id", rule: "CASCADE", reason: "Recursos sao parte do catalogo do plano." },
  { from: "Assinatura", to: "Organizacao", field: "organizacao_id", rule: "RESTRICT", reason: "Historico de assinatura pertence ao tenant." },
  { from: "Assinatura", to: "Plano", field: "plano_id", rule: "RESTRICT", reason: "Plano contratado precisa continuar rastreavel mesmo se sair do catalogo." },
  { from: "Fatura", to: "Assinatura", field: "assinatura_id", rule: "RESTRICT", reason: "Faturas preservam historico financeiro." },
  { from: "Pagamento", to: "Fatura", field: "fatura_id", rule: "RESTRICT", reason: "Tentativas de pagamento nao devem ficar sem fatura." },
  { from: "UsoPlano", to: "Organizacao", field: "organizacao_id", rule: "RESTRICT", reason: "Consumo precisa estar vinculado ao tenant." },
  { from: "UsoPlano", to: "Assinatura", field: "assinatura_id", rule: "RESTRICT", reason: "Uso deve ser auditavel por ciclo de assinatura." },
  { from: "AuditLog", to: "Usuario", field: "usuario_id", rule: "SET NULL", reason: "Historico sobrevive mesmo se o usuario for removido." },
]

const indexes = [
  { name: "idx_lead_org_etapa", table: "Lead", columns: "(organizacao_id, etapa_funil_id)", reason: "Renderiza Kanban por tenant e etapa.", frequency: "Muito alta" },
  { name: "idx_lead_owner_sdr", table: "Lead", columns: "owner_sdr_id", reason: "Lista leads do SDR logado.", frequency: "Muito alta" },
  { name: "idx_lead_owner_closer", table: "Lead", columns: "owner_closer_id", reason: "Lista oportunidades do Closer.", frequency: "Alta" },
  { name: "idx_lead_temperatura", table: "Lead", columns: "temperatura", reason: "Filtra leads por intencao de compra.", frequency: "Alta" },
  { name: "idx_lead_cadastro_completo", table: "Lead", columns: "cadastro_completo", reason: "Localiza leads parciais para tratamento.", frequency: "Media" },
  { name: "idx_lead_contato", table: "Lead", columns: "(email, telefone, cpf)", reason: "Apoia deduplicacao e busca rapida.", frequency: "Alta" },
  { name: "idx_lead_ultimo_contato", table: "Lead", columns: "ultimo_contato_at", reason: "Motor de SLA encontra leads parados.", frequency: "Alta" },
  { name: "idx_ownership_lead_ativo", table: "LeadOwnership", columns: "(lead_id, ativo)", reason: "Busca responsavel vigente e historico.", frequency: "Alta" },
  { name: "idx_interacao_lead_created", table: "LeadInteracao", columns: "(lead_id, created_at)", reason: "Timeline do lead.", frequency: "Alta" },
  { name: "idx_funil_evento_lead", table: "LeadEventoFunil", columns: "(lead_id, created_at)", reason: "Tempo por etapa e auditoria de Kanban.", frequency: "Media" },
  { name: "idx_ausencia_periodo", table: "AusenciaUsuario", columns: "(usuario_id, inicio_at, fim_at)", reason: "Round-robin ignora ausentes.", frequency: "Alta" },
  { name: "idx_assinatura_org_status", table: "Assinatura", columns: "(organizacao_id, status)", reason: "Valida acesso do tenant e bloqueios por inadimplencia.", frequency: "Muito alta" },
  { name: "idx_fatura_assinatura_status", table: "Fatura", columns: "(assinatura_id, status)", reason: "Lista cobrancas abertas, pagas e vencidas.", frequency: "Alta" },
  { name: "idx_pagamento_fatura_status", table: "Pagamento", columns: "(fatura_id, status)", reason: "Concilia tentativas de pagamento por fatura.", frequency: "Alta" },
  { name: "idx_usoplano_org_chave", table: "UsoPlano", columns: "(organizacao_id, chave, periodo_inicio)", reason: "Checa quota antes de liberar criacoes.", frequency: "Muito alta" },
  { name: "idx_auditlog_entidade", table: "AuditLog", columns: "(entidade, entidade_id)", reason: "Historico de alteracoes de um registro.", frequency: "Media" },
]

const migrationOrder = [
  { step: 1, name: "001_create_core_enums.sql", desc: "Cria enums de CRM e SaaS billing.", details: "Temperatura, canal, owner, negocio, ausencia, prioridade, duplicata, assinatura e pagamento." },
  { step: 2, name: "002_create_tenant_and_rbac.sql", desc: "Cria Organizacao, Usuario, Role, Permission e tabelas de ligacao RBAC.", details: "Permissoes entram antes das regras de funil." },
  { step: 3, name: "003_create_saas_billing.sql", desc: "Cria Plano, PlanoRecurso, Assinatura, Fatura, Pagamento e UsoPlano.", details: "Billing entra cedo para tenant ja nascer com plano, trial e limites." },
  { step: 4, name: "004_create_origin_and_pipeline.sql", desc: "Cria Origem, EtapaFunil e RegraSLA.", details: "Configura canais, UTM, Kanban e SLA por tenant." },
  { step: 5, name: "005_create_lead.sql", desc: "Cria Lead enriquecido.", details: "Inclui owners atuais, temperatura, score, parcialidade e datas operacionais." },
  { step: 6, name: "006_create_lead_history.sql", desc: "Cria LeadOwnership, LeadInteracao e LeadEventoFunil.", details: "Historico antes de vendas, alertas e merges." },
  { step: 7, name: "007_create_sales_calendar_alerts.sql", desc: "Cria Reuniao, Negocio, AusenciaUsuario e Notificacao.", details: "Agenda, fechamento, ferias/delegacao e alertas in-app." },
  { step: 8, name: "008_create_duplicates_and_audit.sql", desc: "Cria Duplicata e AuditLog imutavel.", details: "Resolve conflitos com rastreabilidade total." },
  { step: 9, name: "009_create_indexes.sql", desc: "Cria indices de Kanban, billing, ownership, deduplicacao, SLA e auditoria.", details: "Executar apos todas as tabelas existirem." },
  { step: 10, name: "010_seed_reference_data.sql", desc: "Popula tenant demo, planos, recursos, roles, permissions, etapas, origens e regras SLA.", details: "Base para demonstracao operacional e comercial do CRM." },
]

const triggerCode = `-- Trigger de Imutabilidade do AuditLog
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria nao podem ser modificados ou deletados';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- Unica operacao permitida: INSERT`

export default function SchemaDocumentationPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Start CRM - Schema do Banco de Dados</h1>
              <p className="text-sm text-slate-500">Documentacao tecnica consolidada</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden gap-1 sm:flex">
            {entities.length} Entidades | {enums.length} ENUMs | PostgreSQL
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Tabs defaultValue="diagrama" className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              { value: "diagrama", label: "Diagrama ER", icon: Table2 },
              { value: "entidades", label: "Entidades", icon: Database },
              { value: "decisoes", label: "Decisoes", icon: CheckCircle2 },
              { value: "enums", label: "ENUMs", icon: Layers },
              { value: "fks", label: "Foreign Keys", icon: Key },
              { value: "indices", label: "Indices", icon: Zap },
              { value: "migracoes", label: "Migracoes", icon: FileCode2 },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="diagrama" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-5 w-5 text-blue-600" />
                  Diagrama Entidade-Relacionamento Consolidado
                </CardTitle>
                <CardDescription>
                  Modelo para CRM SaaS: planos, assinatura, billing, SDRs, Closers, Admin, RBAC, funil, ownership, SLA e auditoria.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ERDiagramSVG />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">PK</Badge>
                    <span className="text-sm text-slate-600">Primary Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500">FK</Badge>
                    <span className="text-sm text-slate-600">Foreign Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">UK</Badge>
                    <span className="text-sm text-slate-600">Unique Key</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Camadas do Modelo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>SaaS: planos, assinatura, faturas, pagamentos e quotas.</p>
                  <p>Base: tenant, usuarios, RBAC e canais.</p>
                  <p>Operacao: lead, funil, ownership, interacoes e vendas.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Regras ON DELETE</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    RESTRICT para historico comercial
                  </Badge>
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    SET NULL para autores opcionais
                  </Badge>
                  <Badge variant="outline" className="border-red-500 text-red-600">
                    CASCADE apenas em dados descartaveis
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="entidades" className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>{entities.length} Entidades no Schema Consolidado</AlertTitle>
              <AlertDescription>
                O modelo separa monetizacao SaaS, permissao, responsabilidade comercial e historico operacional.
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="space-y-3">
              {entities.map((entity) => (
                <AccordionItem key={entity.name} value={entity.name} className="rounded-lg border border-slate-200 bg-white px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${entity.color}`}>
                        <entity.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{entity.name}</p>
                        <p className="text-sm text-slate-500">{entity.fields.length} campos</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <p className="mb-4 text-sm text-slate-600">{entity.description}</p>

                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left">
                            <th className="pb-2 font-medium">Campo</th>
                            <th className="pb-2 font-medium">Tipo</th>
                            <th className="pb-2 font-medium">Constraint</th>
                            <th className="pb-2 font-medium">Descricao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entity.fields.map((field) => (
                            <tr key={field.name} className="border-b border-slate-100">
                              <td className="py-2 font-mono text-slate-800">{field.name}</td>
                              <td className="py-2 text-slate-600">{field.type}</td>
                              <td className="py-2">
                                {field.constraint && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      field.constraint === "PK"
                                        ? "border-blue-500 text-blue-600"
                                        : field.constraint === "FK"
                                          ? "border-amber-500 text-amber-600"
                                          : "border-green-500 text-green-600"
                                    }
                                  >
                                    {field.constraint}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 text-slate-500">{field.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Regras de Negocio
                      </h4>
                      <ul className="space-y-1">
                        {entity.businessRules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <ArrowRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-slate-400" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="decisoes" className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Decisoes Arquiteturais Consolidadas</AlertTitle>
              <AlertDescription className="text-green-700">
                Sintese das decisoes registradas no documento arquitetural e dos requisitos de CRM operacional.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(businessDecisions).map(([key, value]) => (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base font-mono">{key}</CardTitle>
                      <Badge className="bg-green-500">{value.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 font-medium text-slate-800">{value.decision}</p>
                    <p className="text-sm text-slate-500">{value.details}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="enums" className="space-y-4">
            <Alert>
              <Layers className="h-4 w-4" />
              <AlertTitle>ENUMs de Dominio</AlertTitle>
              <AlertDescription>
                Os ENUMs abaixo documentam valores estaveis do negocio. Estados configuraveis por tenant devem ficar em tabelas.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              {enums.map((enumType) => (
                <Card key={enumType.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Layers className="h-4 w-4 text-purple-600" />
                      <span className="font-mono">{enumType.name}</span>
                    </CardTitle>
                    <CardDescription>
                      Tabela: <strong>{enumType.table}</strong> | Campo: <strong>{enumType.field}</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {enumType.values.map((val) => (
                      <div key={val.value} className={`rounded-lg border p-3 ${val.color}`}>
                        <p className="font-mono font-semibold">{val.value}</p>
                        <p className="mt-1 text-sm opacity-80">{val.desc}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fks" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Relacionamentos com Historico Preservado</AlertTitle>
              <AlertDescription>
                O padrao e RESTRICT em dados comerciais. CASCADE fica restrito a dados descartaveis, como notificacoes in-app.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600" />
                  Foreign Keys ({foreignKeys.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="pb-2 font-medium">De</th>
                        <th className="pb-2 font-medium">Para</th>
                        <th className="pb-2 font-medium">Campo</th>
                        <th className="pb-2 font-medium">ON DELETE</th>
                        <th className="pb-2 font-medium">Justificativa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foreignKeys.map((fk, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-3 font-medium">{fk.from}</td>
                          <td className="py-3">{fk.to}</td>
                          <td className="py-3 font-mono text-slate-600">{fk.field}</td>
                          <td className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                fk.rule === "RESTRICT"
                                  ? "border-green-500 text-green-600"
                                  : fk.rule === "CASCADE"
                                    ? "border-red-500 text-red-600"
                                    : "border-amber-500 text-amber-600"
                              }
                            >
                              {fk.rule}
                            </Badge>
                          </td>
                          <td className="py-3 text-slate-500">{fk.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-slate-600" />
                  Trigger de Imutabilidade do AuditLog
                </CardTitle>
                <CardDescription>
                  Garante que registros de auditoria nao podem ser alterados ou deletados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
                  <code>{triggerCode}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indices" className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Indices Priorizados Por Fluxo Operacional</AlertTitle>
              <AlertDescription>
                Os indices priorizam billing, quotas, Kanban, ownership, deduplicacao, SLA, timeline e auditoria.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  Indices de Performance ({indexes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {indexes.map((idx) => (
                    <div key={idx.name} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">{idx.name}</code>
                        <Badge variant="outline">{idx.table}</Badge>
                        <Badge variant="secondary">{idx.frequency}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        <strong>Colunas:</strong> {idx.columns}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{idx.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migracoes" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ordem Obrigatoria</AlertTitle>
              <AlertDescription>
                A criacao deve respeitar dependencias: tenant/RBAC, billing SaaS, configuracoes, lead, historicos, operacao e auditoria.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode2 className="h-5 w-5 text-blue-600" />
                  Scripts de Migracao ({migrationOrder.length} arquivos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {migrationOrder.map((migration) => (
                    <div key={migration.step} className="flex items-start gap-4 rounded-lg border border-slate-200 p-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {migration.step}
                      </div>
                      <div className="flex-1">
                        <code className="text-sm font-mono font-semibold text-slate-800">{migration.name}</code>
                        <p className="mt-1 text-sm text-slate-600">{migration.desc}</p>
                        <p className="mt-1 text-xs text-slate-400">{migration.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checklist do Seed de Demonstracao</CardTitle>
                <CardDescription>Dados necessarios para validar o fluxo completo do CRM.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { item: "Tenant demo", desc: "Organizacao com video-guia e configuracoes iniciais" },
                    { item: "Planos SaaS", desc: "Free trial, Starter, Pro e Enterprise com recursos e limites" },
                    { item: "Assinatura demo", desc: "Trial ativo, fatura aberta e pagamento aprovado de exemplo" },
                    { item: "Roles e permissions", desc: "SDR, CLOSER, ADMIN e permissoes granulares" },
                    { item: "Usuarios", desc: "Admin, SDRs, Closers e usuario ausente" },
                    { item: "Origens reais", desc: "WhatsApp, LinkedIn, LP, ADS e manual com UTMs" },
                    { item: "Etapas do funil", desc: "Pipeline com responsavel e SLA por etapa" },
                    { item: "Leads variados", desc: "Parciais, frios, mornos, quentes e duplicados" },
                    { item: "Interacoes e reunioes", desc: "Timeline, agenda e Google event id" },
                    { item: "AuditLog", desc: "Transferencias, merges e mudancas de etapa" },
                  ].map((check, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{check.item}</p>
                        <p className="text-xs text-slate-500">{check.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
