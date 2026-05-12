"use client"

import { useState } from "react"
import { ERDiagramSVG } from "@/components/er-diagram-svg"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Database,
  Key,
  Table2,
  Shield,
  Zap,
  FileCode2,
  Info,
  CheckCircle2,
  ArrowRight,
  Lock,
  Clock,
  Users,
  Target,
  Calendar,
  Bell,
  Copy,
  FileText,
  Layers,
  AlertCircle,
} from "lucide-react"

// Todas as decisoes de negocio extraidas dos documentos anexados
const businessDecisions = {
  temperatura: {
    status: "DEFINIDO",
    decision: "FRIO | MORNO | QUENTE - Classificacao de interesse do lead",
    details: "Valor padrao: FRIO ao entrar. Muda conforme interacoes.",
  },
  cadastro_completo: {
    status: "DEFINIDO",
    decision: "Boolean indicando se lead tem dados minimos preenchidos",
    details: "Se false, lead vai para Lista de Tratamento Parcial apos ~1 dia de evasao",
  },
  sla_horas: {
    status: "DEFINIDO",
    decision: "Tempo maximo configuravel por etapa pelo admin",
    details:
      "SLA visual com cores: VERDE (contato inicial) -> AMARELO (1 dia) -> LARANJA (2 dias) -> VERMELHO (3+ dias)",
  },
  google_event_id: {
    status: "DEFINIDO",
    decision: "Entra na fase 1 do projeto com integracao Google Calendar",
    details:
      "Entra como NULL inicialmente. Preenchido apos API do Google retornar o ID. Permite PATCH mesmo com SDR offline.",
  },
  round_robin: {
    status: "DEFINIDO",
    decision: "Atribuicao automatica de leads por tempo",
    details:
      "Verifica campo ativo na tabela Usuario. SDR que recebeu lead a mais tempo (ultimo_lead_atribuido) e o proximo da fila.",
  },
  delegacao: {
    status: "DEFINIDO",
    decision: "Manual pelo admin em casos de ferias/atestado",
    details:
      "Owner sinaliza 1 semana antes (ferias) ou admin age diretamente (atestado). E-mail disparado para registro documental.",
  },
  lead_parcial: {
    status: "DEFINIDO",
    decision: "Leads incompletos vao para lista unica de tratamento",
    details:
      "Admin designa aos SDRs para contato. Se nao responder, vai para lista de inativos (visivel apenas para admin).",
  },
  importacao_excel: {
    status: "DEFINIDO",
    decision: "Biblioteca exceljs com bulk insertion",
    details: "Deduplicacao via ON CONFLICT do PostgreSQL usando telefone e email. Relatorio com sucessos/erros.",
  },
}

const entities = [
  {
    name: "Usuario",
    icon: Users,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    description:
      "Representa os usuarios do sistema (SDRs, Closers e Admins). Campo ultimo_lead_atribuido e essencial para o algoritmo round-robin.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico gerado automaticamente" },
      { name: "nome", type: "VARCHAR(255)", constraint: "", desc: "Nome completo do usuario" },
      { name: "email", type: "VARCHAR(255)", constraint: "UK", desc: "Email unico para login" },
      {
        name: "senha_hash",
        type: "VARCHAR(255)",
        constraint: "",
        desc: "Hash bcrypt da senha (nunca armazenar texto puro)",
      },
      { name: "perfil", type: "ENUM", constraint: "", desc: "perfil_usuario: ADMIN | SDR | CLOSER" },
      {
        name: "ativo",
        type: "BOOLEAN",
        constraint: "",
        desc: "Se false, usuario nao entra na fila de round-robin e nao recebe leads",
      },
      {
        name: "ultimo_lead_atribuido",
        type: "TIMESTAMP",
        constraint: "",
        desc: "Data/hora do ultimo lead recebido - DECISIVO no algoritmo round-robin",
      },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de criacao do registro" },
      { name: "updated_at", type: "TIMESTAMP", constraint: "", desc: "Atualizado automaticamente pelo ORM" },
    ],
    businessRules: [
      "SDRs veem apenas seus proprios leads",
      "Closers veem leads QUENTES de todos os SDRs",
      "Admins tem acesso total e configuram o sistema",
      "Usuario inativo (ativo=false) nao entra na fila de round-robin",
      "Round-robin seleciona o SDR com ultimo_lead_atribuido mais antigo",
    ],
  },
  {
    name: "Origem",
    icon: Target,
    color: "bg-green-500",
    textColor: "text-green-600",
    description:
      "Canais de captacao de leads: redes sociais, site, indicacao, eventos. Toda entrada de lead deve ter origem valida.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      {
        name: "nome",
        type: "VARCHAR(100)",
        constraint: "UK",
        desc: "Nome unico da origem (ex: 'Instagram', 'Site', 'Indicacao')",
      },
      { name: "descricao", type: "TEXT", constraint: "", desc: "Descricao opcional do canal" },
      {
        name: "ativo",
        type: "BOOLEAN",
        constraint: "",
        desc: "Se false, origem nao aparece na selecao de novos leads",
      },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de criacao" },
    ],
    businessRules: [
      "Todo lead DEVE ter uma origem valida associada",
      "Origens inativas nao aparecem para selecao em novos leads",
      "Nao pode deletar origem enquanto tiver leads associados (ON DELETE RESTRICT)",
      "Usado para relatorios de conversao por canal",
    ],
  },
  {
    name: "EtapaFunil",
    icon: Layers,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    description:
      "Etapas do pipeline de vendas com SLA configuravel. Ordem define posicionamento visual no Kanban. SLA dispara alertas visuais.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "nome", type: "VARCHAR(100)", constraint: "", desc: "Nome da etapa (ex: 'Qualificacao', 'Proposta')" },
      { name: "ordem", type: "INTEGER", constraint: "UK", desc: "Posicao no funil (1, 2, 3...) - define visual do Kanban" },
      {
        name: "sla_horas",
        type: "INTEGER",
        constraint: "",
        desc: "Tempo maximo em horas para lead ficar nesta etapa - configuravel pelo admin",
      },
      { name: "ativo", type: "BOOLEAN", constraint: "", desc: "Se false, etapa nao e usada no sistema" },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de criacao" },
    ],
    businessRules: [
      "Ordem define a sequencia visual das colunas no Kanban",
      "SLA dispara alertas visuais com cores progressivas",
      "Cores SLA: VERDE (ok) -> AMARELO (1 dia) -> LARANJA (2 dias) -> VERMELHO (3+ dias)",
      "Admin pode modificar tempo maximo por etapa",
      "Nao pode deletar etapa com leads posicionados (ON DELETE RESTRICT)",
    ],
  },
  {
    name: "Lead",
    icon: FileText,
    color: "bg-amber-500",
    textColor: "text-amber-600",
    description:
      "Entidade central do sistema - potenciais clientes no funil de vendas. Email e telefone sao chaves de deduplicacao.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "nome", type: "VARCHAR(255)", constraint: "", desc: "Nome do contato" },
      { name: "email", type: "VARCHAR(255)", constraint: "UK", desc: "Email unico - usado para deduplicacao" },
      { name: "telefone", type: "VARCHAR(20)", constraint: "UK", desc: "Telefone unico - usado para deduplicacao" },
      { name: "empresa", type: "VARCHAR(255)", constraint: "", desc: "Nome da empresa do lead" },
      { name: "cargo", type: "VARCHAR(100)", constraint: "", desc: "Cargo do contato na empresa" },
      {
        name: "temperatura",
        type: "ENUM",
        constraint: "",
        desc: "temperatura_lead: FRIO | MORNO | QUENTE - padrao FRIO na entrada",
      },
      {
        name: "cadastro_completo",
        type: "BOOLEAN",
        constraint: "",
        desc: "Se false, lead vai para Lista de Tratamento Parcial apos ~1 dia",
      },
      { name: "origem_id", type: "UUID", constraint: "FK", desc: "Referencia a tabela Origem - canal de entrada" },
      {
        name: "owner_id",
        type: "UUID",
        constraint: "FK",
        desc: "SDR responsavel - atribuido automaticamente por round-robin",
      },
      { name: "etapa_funil_id", type: "UUID", constraint: "FK", desc: "Etapa atual no pipeline de vendas" },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de entrada no sistema" },
      { name: "updated_at", type: "TIMESTAMP", constraint: "", desc: "Ultima atualizacao" },
    ],
    businessRules: [
      "Email e telefone sao chaves de deduplicacao na importacao Excel (ON CONFLICT)",
      "Round-robin atribui owner_id automaticamente ao SDR mais antigo sem lead",
      "cadastro_completo = false move lead para Lista de Tratamento Parcial apos ~1 dia",
      "Leads inativos (sem resposta) vao para lista separada - visivel apenas para admin",
      "Temperatura QUENTE permite visibilidade para Closers",
      "SDR pode enviar leads para lista inativa, mas so admin visualiza",
    ],
  },
  {
    name: "Reuniao",
    icon: Calendar,
    color: "bg-sky-500",
    textColor: "text-sky-600",
    description:
      "Reunioes agendadas com integracao Google Calendar. Duracao padrao de 60 minutos. google_event_id preenchido apos retorno da API.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead associado a reuniao" },
      { name: "consultor_id", type: "UUID", constraint: "FK", desc: "Usuario (SDR/Closer) que conduz a reuniao" },
      { name: "data_hora", type: "TIMESTAMP", constraint: "", desc: "Data e hora agendada (fuso GMT-3)" },
      { name: "duracao_minutos", type: "INTEGER", constraint: "", desc: "Duracao padrao: 60 minutos" },
      {
        name: "status",
        type: "ENUM",
        constraint: "",
        desc: "status_reuniao: AGENDADA | REALIZADA | CANCELADA | REMARCADA",
      },
      { name: "anotacoes", type: "TEXT", constraint: "", desc: "Notas feitas DURANTE a reuniao - historico do lead" },
      { name: "resumo", type: "TEXT", constraint: "", desc: "Resumo feito APOS a reuniao - historico do lead" },
      {
        name: "google_event_id",
        type: "VARCHAR(255)",
        constraint: "",
        desc: "ID retornado pela API do Google Calendar - entra NULL, preenchido apos retorno",
      },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de criacao" },
      { name: "updated_at", type: "TIMESTAMP", constraint: "", desc: "Ultima atualizacao - ORM automatico" },
    ],
    businessRules: [
      "Validacao impede agendar reuniao no passado",
      "google_event_id entra como NULL - preenchido apos resposta da API Google",
      "REMARCADA: dispara evento de atualizacao no Google Calendar e exibe status AGENDADA",
      "CANCELADA: envia lembrete com horario previsto e data de cancelamento",
      "anotacoes e resumo sao armazenados no historico do lead",
      "Implementacao assincrona para nao bloquear a criacao do evento",
      "PATCH funciona mesmo com SDR offline (google_event_id ja salvo)",
    ],
  },
  {
    name: "Notificacao",
    icon: Bell,
    color: "bg-rose-500",
    textColor: "text-rose-600",
    description:
      "Alertas de atribuicao de leads (round-robin) e violacao de SLA. Campos titulo e mensagem adicionados para melhor gerencia.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "usuario_id", type: "UUID", constraint: "FK", desc: "Usuario que recebe a notificacao" },
      { name: "lead_id", type: "UUID", constraint: "FK", desc: "Lead relacionado (opcional)" },
      { name: "titulo", type: "VARCHAR(100)", constraint: "", desc: "Titulo curto - ex: 'Novo lead atribuido'" },
      {
        name: "tipo",
        type: "VARCHAR(50)",
        constraint: "",
        desc: "Tipo: 'atribuicao', 'sla', 'sistema', 'alteracao'",
      },
      {
        name: "mensagem",
        type: "TEXT",
        constraint: "",
        desc: "Conteudo detalhado - ex: 'Lead alterado pelo admin'",
      },
      { name: "lida", type: "BOOLEAN", constraint: "", desc: "Marca se foi visualizada pelo usuario" },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data de criacao" },
    ],
    businessRules: [
      "POST: Disparado automaticamente quando round-robin finaliza atribuicao",
      "GET: Limitado a 15 notificacoes (mais antiga no topo, mais nova no final)",
      "PATCH: Marca como 'lida' ao abrir. Mantem 'nao lida' se apenas fechou",
      "CASCADE: Notificacoes deletadas junto com usuario ou lead",
      "titulo mostra lead novo atribuido",
      "mensagem detalha se foi alteracao ou designacao pelo admin",
    ],
  },
  {
    name: "Duplicata",
    icon: Copy,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    description:
      "Deteccao e tratamento de leads duplicados. Usa ON CONFLICT do PostgreSQL com email/telefone como criterios.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      { name: "lead_original_id", type: "UUID", constraint: "FK", desc: "Lead que foi mantido como original" },
      {
        name: "lead_duplicado_id",
        type: "UUID",
        constraint: "FK",
        desc: "Lead identificado como duplicata",
      },
      {
        name: "campo_match",
        type: "VARCHAR(50)",
        constraint: "",
        desc: "Campo que gerou match: 'email' ou 'telefone'",
      },
      {
        name: "status",
        type: "ENUM",
        constraint: "",
        desc: "status_duplicata: PENDENTE | MESCLADO | IGNORADO",
      },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data da deteccao" },
    ],
    businessRules: [
      "Importacao Excel usa ON CONFLICT do PostgreSQL para detectar",
      "Criterios de exclusao: telefone e email",
      "Admin decide se mescla dados ou ignora a duplicata",
      "RESTRICT impede deletar leads enquanto duplicata estiver PENDENTE",
      "class-validator usado para verificar campos invalidos como email",
    ],
  },
  {
    name: "AuditLog",
    icon: Shield,
    color: "bg-slate-700",
    textColor: "text-slate-600",
    description:
      "Historico IMUTAVEL de todas as alteracoes no sistema. Trigger impede UPDATE e DELETE. Apenas INSERT permitido.",
    fields: [
      { name: "id", type: "UUID", constraint: "PK", desc: "Identificador unico" },
      {
        name: "entidade",
        type: "VARCHAR(50)",
        constraint: "",
        desc: "Nome da tabela alterada: 'Lead', 'Reuniao', etc",
      },
      { name: "entidade_id", type: "UUID", constraint: "", desc: "ID do registro que foi alterado" },
      { name: "acao", type: "VARCHAR(20)", constraint: "", desc: "Tipo de operacao: CREATE | UPDATE | DELETE" },
      {
        name: "dados_anteriores",
        type: "JSONB",
        constraint: "",
        desc: "Snapshot completo ANTES da alteracao",
      },
      { name: "dados_novos", type: "JSONB", constraint: "", desc: "Snapshot completo APOS a alteracao" },
      {
        name: "usuario_id",
        type: "UUID",
        constraint: "FK",
        desc: "Quem executou a acao (SET NULL se usuario deletado)",
      },
      { name: "created_at", type: "TIMESTAMP", constraint: "", desc: "Data/hora exata da acao" },
    ],
    businessRules: [
      "TRIGGER impede UPDATE e DELETE nesta tabela - apenas INSERT permitido",
      "Garante confianca no historico - registros nao podem ser adulterados",
      "Protecao contra erros humanos e ma fe",
      "Serve como PROVA em disputas comerciais",
      "Conformidade com LGPD e requisitos de auditoria",
      "SET NULL em usuario_id para manter historico mesmo se usuario for deletado",
    ],
  },
]

const enums = [
  {
    name: "temperatura_lead",
    table: "Lead",
    field: "temperatura",
    values: [
      {
        value: "FRIO",
        desc: "Lead com baixo interesse, requer nurturing. Valor PADRAO na entrada.",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        value: "MORNO",
        desc: "Lead com interesse moderado, em avaliacao ativa.",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        value: "QUENTE",
        desc: "Lead pronto para fechar, alta prioridade. Visivel para Closers.",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    ],
  },
  {
    name: "status_reuniao",
    table: "Reuniao",
    field: "status",
    values: [
      {
        value: "AGENDADA",
        desc: "Reuniao confirmada para data futura.",
        color: "bg-sky-100 text-sky-800 border-sky-200",
      },
      {
        value: "REALIZADA",
        desc: "Reuniao concluida - SDR marca apos finalizar.",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      {
        value: "CANCELADA",
        desc: "Cancelada - sistema envia lembrete com horario previsto.",
        color: "bg-slate-100 text-slate-800 border-slate-200",
      },
      {
        value: "REMARCADA",
        desc: "Reagendada - exibe novo horario e muda para AGENDADA.",
        color: "bg-violet-100 text-violet-800 border-violet-200",
      },
    ],
  },
  {
    name: "perfil_usuario",
    table: "Usuario",
    field: "perfil",
    values: [
      {
        value: "ADMIN",
        desc: "Acesso total: configura sistema, ve todos os leads, designa manualmente.",
        color: "bg-purple-100 text-purple-800 border-purple-200",
      },
      {
        value: "SDR",
        desc: "Prospecta e qualifica leads. Ve apenas seus proprios leads.",
        color: "bg-teal-100 text-teal-800 border-teal-200",
      },
      {
        value: "CLOSER",
        desc: "Fecha negocios. Ve leads QUENTES de todos os SDRs.",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      },
    ],
  },
  {
    name: "status_duplicata",
    table: "Duplicata",
    field: "status",
    values: [
      {
        value: "PENDENTE",
        desc: "Aguardando decisao do admin sobre o que fazer.",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "MESCLADO",
        desc: "Dados unificados no lead original.",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "IGNORADO",
        desc: "Duplicata descartada ou mantida separada.",
        color: "bg-gray-100 text-gray-800 border-gray-200",
      },
    ],
  },
]

const foreignKeys = [
  {
    from: "Lead",
    to: "Origem",
    field: "origem_id",
    rule: "RESTRICT",
    color: "text-green-600",
    reason: "Origem nao pode ser deletada enquanto tiver leads associados. Preserva integridade dos relatorios.",
  },
  {
    from: "Lead",
    to: "Usuario",
    field: "owner_id",
    rule: "RESTRICT",
    color: "text-green-600",
    reason:
      "SDR nao pode ser removido com leads sob sua responsabilidade. Forca transferencia antes da remocao.",
  },
  {
    from: "Lead",
    to: "EtapaFunil",
    field: "etapa_funil_id",
    rule: "RESTRICT",
    color: "text-green-600",
    reason: "Etapa nao pode ser deletada com leads posicionados nela. Preserva estado do Kanban.",
  },
  {
    from: "Reuniao",
    to: "Lead",
    field: "lead_id",
    rule: "RESTRICT",
    color: "text-green-600",
    reason: "Lead com reunioes nao pode ser deletado. Preserva historico comercial.",
  },
  {
    from: "Reuniao",
    to: "Usuario",
    field: "consultor_id",
    rule: "RESTRICT",
    color: "text-green-600",
    reason: "Consultor com reunioes registradas nao pode ser removido. Preserva rastreabilidade.",
  },
  {
    from: "Notificacao",
    to: "Usuario",
    field: "usuario_id",
    rule: "CASCADE",
    color: "text-red-600",
    reason: "Notificacoes sao deletadas junto com o usuario. Notificacoes nao tem valor sem destinatario.",
  },
  {
    from: "Notificacao",
    to: "Lead",
    field: "lead_id",
    rule: "CASCADE",
    color: "text-red-600",
    reason: "Notificacoes do lead sao removidas com ele. Evita notificacoes orfas.",
  },
  {
    from: "Duplicata",
    to: "Lead (original)",
    field: "lead_original_id",
    rule: "RESTRICT",
    color: "text-green-600",
    reason: "Nao pode deletar lead enquanto tiver duplicatas pendentes de decisao.",
  },
  {
    from: "Duplicata",
    to: "Lead (duplicado)",
    field: "lead_duplicado_id",
    rule: "RESTRICT",
    color: "text-green-600",
    reason: "Nao pode deletar lead duplicado sem resolver o status primeiro.",
  },
  {
    from: "AuditLog",
    to: "Usuario",
    field: "usuario_id",
    rule: "SET NULL",
    color: "text-amber-600",
    reason: "Mantem registro de auditoria mesmo se usuario for deletado. Preserva historico com autor NULL.",
  },
]

const indexes = [
  {
    name: "idx_lead_etapa_funil_id",
    table: "Lead",
    columns: "etapa_funil_id",
    reason: "Busca todos os leads de uma etapa para renderizar o Kanban",
    frequency: "Muito alta - cada visualizacao do Kanban",
  },
  {
    name: "idx_lead_owner_id",
    table: "Lead",
    columns: "owner_id",
    reason: "Lista os leads do SDR logado - query mais frequente do sistema",
    frequency: "Muito alta - toda navegacao do SDR",
  },
  {
    name: "idx_lead_temperatura",
    table: "Lead",
    columns: "temperatura",
    reason: "Filtra leads por classificacao (frio/morno/quente) no dia a dia comercial",
    frequency: "Alta - filtros e visualizacao de Closers",
  },
  {
    name: "idx_lead_cadastro_completo",
    table: "Lead",
    columns: "cadastro_completo",
    reason: "Identifica rapidamente leads incompletos para Lista de Tratamento Parcial",
    frequency: "Media - rotina de tratamento",
  },
  {
    name: "idx_reuniao_lead_id",
    table: "Reuniao",
    columns: "lead_id",
    reason: "Busca todas as reunioes ao abrir o detalhe do lead",
    frequency: "Alta - visualizacao de historico",
  },
  {
    name: "idx_reuniao_data_hora",
    table: "Reuniao",
    columns: "data_hora",
    reason: "Consulta agenda de reunioes por periodo (calendario diario/semanal)",
    frequency: "Alta - visualizacao de agenda",
  },
  {
    name: "idx_auditlog_entidade",
    table: "AuditLog",
    columns: "(entidade, entidade_id)",
    reason: "Busca historico de alteracoes de um registro especifico",
    frequency: "Media - auditoria e disputas",
  },
]

const migrationOrder = [
  {
    step: 1,
    name: "001_create_enums.sql",
    desc: "Cria os 4 tipos ENUM nativos do PostgreSQL",
    details: "temperatura_lead, status_reuniao, perfil_usuario, status_duplicata",
  },
  {
    step: 2,
    name: "002_create_base_tables.sql",
    desc: "Cria tabelas que NAO dependem de outras",
    details: "Usuario, Origem, EtapaFunil - podem ser criadas em paralelo",
  },
  {
    step: 3,
    name: "003_create_lead.sql",
    desc: "Cria tabela Lead com suas 3 FKs",
    details: "Depende de: Usuario, Origem, EtapaFunil",
  },
  {
    step: 4,
    name: "004_create_dependent_tables.sql",
    desc: "Cria tabelas que dependem de Lead",
    details: "Reuniao, Notificacao, Duplicata",
  },
  {
    step: 5,
    name: "005_create_auditlog.sql",
    desc: "Cria AuditLog e o TRIGGER de imutabilidade",
    details: "Trigger bloqueia UPDATE e DELETE na tabela",
  },
  {
    step: 6,
    name: "006_create_indexes.sql",
    desc: "Cria os 7 indices de performance",
    details: "So pode rodar APOS tabelas existirem",
  },
  {
    step: 7,
    name: "007_seed_data.sql",
    desc: "Popula dados de demonstracao",
    details: "Admin, SDRs, Origens, Etapas, Leads de exemplo",
  },
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
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Start CRM - Schema do Banco de Dados</h1>
              <p className="text-sm text-slate-500">Documentação Técnica</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden gap-1 sm:flex">
            8 Entidades | 4 ENUMs | PostgreSQL
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Tabs defaultValue="diagrama" className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger
              value="diagrama"
              className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
            >
              <Table2 className="h-4 w-4" />
              Diagrama ER
            </TabsTrigger>
            <TabsTrigger
              value="entidades"
              className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
            >
              <Database className="h-4 w-4" />
              Entidades
            </TabsTrigger>
            <TabsTrigger
              value="decisoes"
              className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Decisoes de Negocio
            </TabsTrigger>
            <TabsTrigger
              value="enums"
              className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
            >
              <Layers className="h-4 w-4" />
              ENUMs
            </TabsTrigger>
            <TabsTrigger
              value="fks"
              className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
            >
              <Key className="h-4 w-4" />
              Foreign Keys
            </TabsTrigger>
            <TabsTrigger
              value="indices"
              className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
            >
              <Zap className="h-4 w-4" />
              Indices
            </TabsTrigger>
            <TabsTrigger
              value="migracoes"
              className="gap-2 rounded-lg border border-slate-200 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
            >
              <FileCode2 className="h-4 w-4" />
              Migracoes
            </TabsTrigger>
          </TabsList>

          {/* Diagrama ER */}
          <TabsContent value="diagrama" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-5 w-5 text-blue-600" />
                  Diagrama Entidade-Relacionamento
                </CardTitle>
                <CardDescription>
                  Visualizacao completa das 8 tabelas, campos, tipos, constraints e relacionamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ERDiagramSVG />
              </CardContent>
            </Card>

            {/* Legenda Detalhada */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">PK</Badge>
                    <span className="text-sm text-slate-600">Primary Key - identificador unico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500">FK</Badge>
                    <span className="text-sm text-slate-600">Foreign Key - referencia a outra tabela</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">UK</Badge>
                    <span className="text-sm text-slate-600">Unique Key - valor unico na tabela</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cardinalidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">1:N</span>
                    <span className="text-sm text-slate-600">Um para Muitos (todos os relacionamentos)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">|</span>
                    <span className="text-sm text-slate-600">Lado "um" do relacionamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{"<"}</span>
                    <span className="text-sm text-slate-600">Lado "muitos" do relacionamento</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Regras ON DELETE</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      RESTRICT
                    </Badge>
                    <span className="text-sm text-slate-600">Bloqueia delecao</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-red-500 text-red-600">
                      CASCADE
                    </Badge>
                    <span className="text-sm text-slate-600">Deleta junto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      SET NULL
                    </Badge>
                    <span className="text-sm text-slate-600">Define como NULL</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Entidades */}
          <TabsContent value="entidades" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>8 Entidades no Schema</AlertTitle>
              <AlertDescription>
                Clique em cada entidade para ver detalhes completos dos campos e regras de negocio.
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="space-y-3">
              {entities.map((entity) => (
                <AccordionItem
                  key={entity.name}
                  value={entity.name}
                  className="rounded-lg border border-slate-200 bg-white px-4"
                >
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

                    {/* Campos */}
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

                    {/* Regras de Negocio */}
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

          {/* Decisoes de Negocio */}
          <TabsContent value="decisoes" className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Todas as Decisoes Foram Definidas</AlertTitle>
              <AlertDescription className="text-green-700">
                As decisoes de negocio foram extraidas dos documentos anexados e estao consolidadas abaixo.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(businessDecisions).map(([key, value]) => (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
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

          {/* ENUMs */}
          <TabsContent value="enums" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Por que usar ENUMs nativos do PostgreSQL?</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    <strong>Integridade:</strong> O banco garante que apenas valores validos sejam inseridos
                  </li>
                  <li>
                    <strong>Legibilidade:</strong> Armazena texto real em vez de numeros (0, 1, 2)
                  </li>
                  <li>
                    <strong>Consistencia:</strong> Todos os sistemas recebem os mesmos valores
                  </li>
                </ul>
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

          {/* Foreign Keys */}
          <TabsContent value="fks" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>ON DELETE RESTRICT como Padrao</AlertTitle>
              <AlertDescription>
                Para um CRM onde dados tem valor historico e comercial, RESTRICT e a escolha mais segura. Preserva
                historico, forca decisoes conscientes e evita dados orfaos.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600" />
                  Todas as Foreign Keys (10)
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

            {/* Trigger de Imutabilidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-slate-600" />
                  Trigger de Imutabilidade do AuditLog
                </CardTitle>
                <CardDescription>
                  Este trigger garante que registros de auditoria NUNCA podem ser alterados ou deletados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
                  <code>{triggerCode}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Indices */}
          <TabsContent value="indices" className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Indices Aceleram Leitura, Mas Tem Custo</AlertTitle>
              <AlertDescription>
                Cada INSERT ou UPDATE precisa atualizar todos os indices da tabela. Por isso, criamos apenas os 7
                indices essenciais para as consultas mais frequentes.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  Indices de Performance (7)
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

          {/* Migracoes */}
          <TabsContent value="migracoes" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ordem Obrigatoria</AlertTitle>
              <AlertDescription>
                As migracoes DEVEM ser executadas nesta ordem exata. Cada arquivo depende dos anteriores.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode2 className="h-5 w-5 text-blue-600" />
                  Scripts de Migracao (7 arquivos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {migrationOrder.map((migration) => (
                    <div
                      key={migration.step}
                      className="flex items-start gap-4 rounded-lg border border-slate-200 p-4"
                    >
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

            {/* Seed Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Checklist do Seed de Demonstracao</CardTitle>
                <CardDescription>Dados necessarios para demonstracao funcional do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { item: "1 Admin + alguns SDRs/Closers", desc: "Demonstrar perfis diferentes" },
                    { item: "Origens reais", desc: "Instagram, Site, Indicacao, Eventos" },
                    { item: "Etapas do funil", desc: "Com ordem definida e SLA preenchido" },
                    { item: "Leads em estados variados", desc: "Todas etapas, temperaturas, cadastro_completo" },
                    { item: "Reunioes em status diferentes", desc: "AGENDADA, REALIZADA, CANCELADA" },
                    { item: "Registros no AuditLog", desc: "Demonstrar rastreamento funcionando" },
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
