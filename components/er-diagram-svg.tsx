"use client"

interface EntityBox {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
  fields: { name: string; type: string; constraint?: string }[]
}

const entities: EntityBox[] = [
  {
    id: "organizacao",
    name: "Organizacao",
    x: 40,
    y: 40,
    width: 220,
    height: 150,
    color: "#334155",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "nome", type: "VARCHAR" },
      { name: "slug", type: "VARCHAR", constraint: "UK" },
      { name: "video_guia_url", type: "TEXT" },
    ],
  },
  {
    id: "usuario",
    name: "Usuario",
    x: 320,
    y: 40,
    width: 240,
    height: 220,
    color: "#2563eb",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "organizacao_id", type: "UUID", constraint: "FK" },
      { name: "nome", type: "VARCHAR" },
      { name: "email", type: "VARCHAR", constraint: "UK" },
      { name: "ativo", type: "BOOLEAN" },
      { name: "ultimo_lead_atribuido", type: "TIMESTAMP" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "role",
    name: "Role",
    x: 620,
    y: 40,
    width: 190,
    height: 130,
    color: "#7c3aed",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "nome", type: "VARCHAR", constraint: "UK" },
      { name: "descricao", type: "TEXT" },
    ],
  },
  {
    id: "permission",
    name: "Permission",
    x: 870,
    y: 40,
    width: 210,
    height: 130,
    color: "#9333ea",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "chave", type: "VARCHAR", constraint: "UK" },
      { name: "descricao", type: "TEXT" },
    ],
  },
  {
    id: "origem",
    name: "Origem",
    x: 1140,
    y: 40,
    width: 230,
    height: 220,
    color: "#16a34a",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "organizacao_id", type: "UUID", constraint: "FK" },
      { name: "nome", type: "VARCHAR" },
      { name: "tipo_canal", type: "ENUM" },
      { name: "utm_source", type: "VARCHAR" },
      { name: "link_rastreavel", type: "TEXT" },
      { name: "ativo", type: "BOOLEAN" },
    ],
  },
  {
    id: "etapafunil",
    name: "EtapaFunil",
    x: 40,
    y: 340,
    width: 230,
    height: 220,
    color: "#a855f7",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "organizacao_id", type: "UUID", constraint: "FK" },
      { name: "nome", type: "VARCHAR" },
      { name: "ordem", type: "INTEGER" },
      { name: "tipo_responsavel", type: "ENUM" },
      { name: "sla_horas", type: "INTEGER" },
      { name: "ativo", type: "BOOLEAN" },
    ],
  },
  {
    id: "lead",
    name: "Lead",
    x: 360,
    y: 320,
    width: 300,
    height: 360,
    color: "#f59e0b",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "organizacao_id", type: "UUID", constraint: "FK" },
      { name: "origem_id", type: "UUID", constraint: "FK" },
      { name: "etapa_funil_id", type: "UUID", constraint: "FK" },
      { name: "owner_sdr_id", type: "UUID", constraint: "FK" },
      { name: "owner_closer_id", type: "UUID", constraint: "FK" },
      { name: "nome", type: "VARCHAR" },
      { name: "email", type: "VARCHAR" },
      { name: "telefone", type: "VARCHAR" },
      { name: "temperatura", type: "ENUM" },
      { name: "score", type: "INTEGER" },
      { name: "cadastro_completo", type: "BOOLEAN" },
      { name: "ultimo_contato_at", type: "TIMESTAMP" },
      { name: "proxima_acao_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "leadownership",
    name: "LeadOwnership",
    x: 720,
    y: 320,
    width: 250,
    height: 220,
    color: "#0f766e",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "lead_id", type: "UUID", constraint: "FK" },
      { name: "usuario_id", type: "UUID", constraint: "FK" },
      { name: "tipo_owner", type: "ENUM" },
      { name: "ativo", type: "BOOLEAN" },
      { name: "atribuido_por_id", type: "UUID", constraint: "FK" },
      { name: "inicio_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "leadinteracao",
    name: "LeadInteracao",
    x: 1030,
    y: 330,
    width: 260,
    height: 220,
    color: "#0891b2",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "lead_id", type: "UUID", constraint: "FK" },
      { name: "usuario_id", type: "UUID", constraint: "FK" },
      { name: "canal", type: "ENUM" },
      { name: "tipo", type: "ENUM" },
      { name: "resultado", type: "VARCHAR" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "reuniao",
    name: "Reuniao",
    x: 40,
    y: 730,
    width: 250,
    height: 230,
    color: "#0284c7",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "lead_id", type: "UUID", constraint: "FK" },
      { name: "consultor_id", type: "UUID", constraint: "FK" },
      { name: "data_hora", type: "TIMESTAMP" },
      { name: "status", type: "ENUM" },
      { name: "google_event_id", type: "VARCHAR" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "negocio",
    name: "Negocio",
    x: 360,
    y: 750,
    width: 250,
    height: 220,
    color: "#dc2626",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "lead_id", type: "UUID", constraint: "FK" },
      { name: "closer_id", type: "UUID", constraint: "FK" },
      { name: "valor_estimado", type: "NUMERIC" },
      { name: "valor_fechado", type: "NUMERIC" },
      { name: "status", type: "ENUM" },
      { name: "fechado_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "ausencia",
    name: "AusenciaUsuario",
    x: 680,
    y: 750,
    width: 260,
    height: 220,
    color: "#ea580c",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "usuario_id", type: "UUID", constraint: "FK" },
      { name: "delegado_para_id", type: "UUID", constraint: "FK" },
      { name: "tipo", type: "ENUM" },
      { name: "inicio_at", type: "TIMESTAMP" },
      { name: "fim_at", type: "TIMESTAMP" },
      { name: "ativo", type: "BOOLEAN" },
    ],
  },
  {
    id: "notificacao",
    name: "Notificacao",
    x: 1000,
    y: 750,
    width: 250,
    height: 220,
    color: "#e11d48",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "usuario_id", type: "UUID", constraint: "FK" },
      { name: "lead_id", type: "UUID", constraint: "FK" },
      { name: "tipo", type: "VARCHAR" },
      { name: "prioridade", type: "ENUM" },
      { name: "lida", type: "BOOLEAN" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "plano",
    name: "Plano",
    x: 40,
    y: 1060,
    width: 230,
    height: 200,
    color: "#059669",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "nome", type: "VARCHAR", constraint: "UK" },
      { name: "slug", type: "VARCHAR", constraint: "UK" },
      { name: "preco_centavos", type: "INTEGER" },
      { name: "ciclo_cobranca", type: "ENUM" },
      { name: "ativo", type: "BOOLEAN" },
    ],
  },
  {
    id: "planorecurso",
    name: "PlanoRecurso",
    x: 320,
    y: 1060,
    width: 240,
    height: 200,
    color: "#65a30d",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "plano_id", type: "UUID", constraint: "FK" },
      { name: "chave", type: "VARCHAR" },
      { name: "tipo_valor", type: "ENUM" },
      { name: "valor", type: "VARCHAR" },
      { name: "descricao", type: "TEXT" },
    ],
  },
  {
    id: "assinatura",
    name: "Assinatura",
    x: 620,
    y: 1060,
    width: 260,
    height: 250,
    color: "#1d4ed8",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "organizacao_id", type: "UUID", constraint: "FK" },
      { name: "plano_id", type: "UUID", constraint: "FK" },
      { name: "status", type: "ENUM" },
      { name: "trial_ends_at", type: "TIMESTAMP" },
      { name: "periodo_inicio", type: "TIMESTAMP" },
      { name: "periodo_fim", type: "TIMESTAMP" },
      { name: "provedor_subscription_id", type: "VARCHAR" },
    ],
  },
  {
    id: "fatura",
    name: "Fatura",
    x: 940,
    y: 1060,
    width: 250,
    height: 220,
    color: "#4338ca",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "assinatura_id", type: "UUID", constraint: "FK" },
      { name: "numero", type: "VARCHAR", constraint: "UK" },
      { name: "status", type: "ENUM" },
      { name: "valor_centavos", type: "INTEGER" },
      { name: "vencimento_at", type: "TIMESTAMP" },
      { name: "paga_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "pagamento",
    name: "Pagamento",
    x: 1240,
    y: 1060,
    width: 250,
    height: 220,
    color: "#0e7490",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "fatura_id", type: "UUID", constraint: "FK" },
      { name: "status", type: "ENUM" },
      { name: "metodo", type: "ENUM" },
      { name: "valor_centavos", type: "INTEGER" },
      { name: "provedor_payment_id", type: "VARCHAR" },
      { name: "processado_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "usoplano",
    name: "UsoPlano",
    x: 160,
    y: 1390,
    width: 260,
    height: 220,
    color: "#0f766e",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "organizacao_id", type: "UUID", constraint: "FK" },
      { name: "assinatura_id", type: "UUID", constraint: "FK" },
      { name: "chave", type: "VARCHAR" },
      { name: "quantidade", type: "INTEGER" },
      { name: "limite", type: "INTEGER" },
      { name: "periodo_inicio", type: "TIMESTAMP" },
    ],
  },
  {
    id: "auditlog",
    name: "AuditLog",
    x: 560,
    y: 1400,
    width: 280,
    height: 210,
    color: "#475569",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "entidade", type: "VARCHAR" },
      { name: "entidade_id", type: "UUID" },
      { name: "acao", type: "VARCHAR" },
      { name: "dados_anteriores", type: "JSONB" },
      { name: "dados_novos", type: "JSONB" },
      { name: "usuario_id", type: "UUID", constraint: "FK" },
    ],
  },
]

const relationshipPaths = [
  { label: "organizacao_id", rule: "RESTRICT", path: "M 260 100 L 320 100", labelPos: { x: 290, y: 86 } },
  { label: "organizacao_id", rule: "RESTRICT", path: "M 260 145 L 1080 145 L 1080 110 L 1140 110", labelPos: { x: 1040, y: 145 } },
  { label: "organizacao_id", rule: "RESTRICT", path: "M 150 190 L 150 340", labelPos: { x: 150, y: 265 } },
  { label: "roles", rule: "CASCADE", path: "M 560 130 L 620 110", labelPos: { x: 590, y: 105 } },
  { label: "permissions", rule: "CASCADE", path: "M 810 105 L 870 105", labelPos: { x: 840, y: 88 } },
  { label: "origem_id", rule: "RESTRICT", path: "M 1140 205 L 980 205 L 980 380 L 660 380", labelPos: { x: 980, y: 270 } },
  { label: "etapa_funil_id", rule: "RESTRICT", path: "M 270 455 L 360 455", labelPos: { x: 315, y: 435 } },
  { label: "owner_sdr_id", rule: "RESTRICT", path: "M 440 260 L 440 320", labelPos: { x: 440, y: 290 } },
  { label: "owner_closer_id", rule: "RESTRICT", path: "M 540 260 L 540 320", labelPos: { x: 540, y: 290 } },
  { label: "lead_id", rule: "RESTRICT", path: "M 660 465 L 720 435", labelPos: { x: 690, y: 435 } },
  { label: "lead_id", rule: "RESTRICT", path: "M 660 510 L 1030 440", labelPos: { x: 850, y: 505 } },
  { label: "lead_id", rule: "RESTRICT", path: "M 420 680 L 230 730", labelPos: { x: 320, y: 690 } },
  { label: "lead_id", rule: "RESTRICT", path: "M 500 680 L 500 750", labelPos: { x: 500, y: 715 } },
  { label: "usuario_id", rule: "RESTRICT", path: "M 800 540 L 800 750", labelPos: { x: 800, y: 650 } },
  { label: "usuario_id", rule: "SET NULL", path: "M 1120 550 L 1120 750", labelPos: { x: 1120, y: 650 } },
  { label: "plano_id", rule: "CASCADE", path: "M 270 1140 L 320 1140", labelPos: { x: 295, y: 1120 } },
  { label: "plano_id", rule: "RESTRICT", path: "M 270 1200 L 500 1200 L 500 1140 L 620 1140", labelPos: { x: 500, y: 1180 } },
  { label: "organizacao_id", rule: "RESTRICT", path: "M 150 190 L 150 1010 L 620 1010 L 620 1135", labelPos: { x: 150, y: 600 } },
  { label: "assinatura_id", rule: "RESTRICT", path: "M 880 1160 L 940 1160", labelPos: { x: 910, y: 1140 } },
  { label: "fatura_id", rule: "RESTRICT", path: "M 1190 1165 L 1240 1165", labelPos: { x: 1215, y: 1145 } },
  { label: "uso", rule: "RESTRICT", path: "M 700 1310 L 700 1360 L 420 1360 L 420 1460", labelPos: { x: 610, y: 1360 } },
  { label: "organizacao_id", rule: "RESTRICT", path: "M 120 190 L 120 1480 L 160 1480", labelPos: { x: 120, y: 1120 } },
  { label: "usuario_id", rule: "SET NULL", path: "M 560 170 L 1530 170 L 1530 1505 L 840 1505", labelPos: { x: 1525, y: 770 } },
]

function getConstraintBadge(constraint?: string) {
  if (!constraint) return null
  const colors: Record<string, string> = {
    PK: "#2563eb",
    FK: "#f59e0b",
    UK: "#16a34a",
  }
  return colors[constraint] || "#64748b"
}

export function ERDiagramSVG() {
  const width = 1560
  const height = 1660

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[1450px]">
        <defs>
          <marker id="one" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <line x1="5" y1="0" x2="5" y2="10" stroke="#64748b" strokeWidth="2" />
          </marker>
          <marker id="many" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
            <path d="M 0 6 L 12 0 L 12 12 Z" fill="none" stroke="#64748b" strokeWidth="1.5" />
          </marker>
        </defs>

        {relationshipPaths.map((rel, idx) => {
          const ruleColor = rel.rule === "CASCADE" ? "#ef4444" : rel.rule === "SET NULL" ? "#f59e0b" : "#22c55e"

          return (
            <g key={idx}>
              <path
                d={rel.path}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                markerEnd="url(#many)"
                markerStart="url(#one)"
              />
              <rect
                x={rel.labelPos.x - 56}
                y={rel.labelPos.y - 10}
                width="112"
                height="20"
                fill="white"
                stroke={ruleColor}
                strokeWidth="1"
                rx="4"
              />
              <text
                x={rel.labelPos.x}
                y={rel.labelPos.y + 4}
                textAnchor="middle"
                fontSize="10"
                fill="#475569"
                fontWeight="500"
              >
                {rel.label}
              </text>
            </g>
          )
        })}

        {entities.map((entity) => (
          <g key={entity.id}>
            <rect
              x={entity.x + 3}
              y={entity.y + 3}
              width={entity.width}
              height={entity.height}
              fill="#00000015"
              rx="8"
            />
            <rect
              x={entity.x}
              y={entity.y}
              width={entity.width}
              height={entity.height}
              fill="white"
              stroke={entity.color}
              strokeWidth="2"
              rx="8"
            />
            <rect x={entity.x} y={entity.y} width={entity.width} height="32" fill={entity.color} rx="8" />
            <rect x={entity.x} y={entity.y + 24} width={entity.width} height="8" fill={entity.color} />
            <text
              x={entity.x + entity.width / 2}
              y={entity.y + 21}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              {entity.name}
            </text>

            {entity.fields.map((field, idx) => {
              const constraintWidth = field.constraint ? 28 : 0
              const typeEndX = entity.x + entity.width - 12 - constraintWidth

              return (
                <g key={field.name}>
                  <text
                    x={entity.x + 10}
                    y={entity.y + 52 + idx * 22}
                    fill="#1e293b"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {field.name}
                  </text>
                  <text
                    x={typeEndX}
                    y={entity.y + 52 + idx * 22}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                  >
                    {field.type}
                  </text>
                  {field.constraint && (
                    <g>
                      <rect
                        x={entity.x + entity.width - 34}
                        y={entity.y + 40 + idx * 22}
                        width="24"
                        height="14"
                        fill={getConstraintBadge(field.constraint)}
                        rx="3"
                      />
                      <text
                        x={entity.x + entity.width - 22}
                        y={entity.y + 50 + idx * 22}
                        textAnchor="middle"
                        fill="white"
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {field.constraint}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}
