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

// Layout reorganizado: 3 colunas com espacamento amplo para as linhas
const entities: EntityBox[] = [
  {
    id: "usuario",
    name: "Usuario",
    x: 50,
    y: 50,
    width: 240,
    height: 200,
    color: "#3b82f6",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "nome", type: "VARCHAR(255)" },
      { name: "email", type: "VARCHAR(255)", constraint: "UK" },
      { name: "senha_hash", type: "VARCHAR(255)" },
      { name: "perfil", type: "ENUM" },
      { name: "ativo", type: "BOOLEAN" },
      { name: "ultimo_lead_atribuido", type: "TIMESTAMP" },
    ],
  },
  {
    id: "origem",
    name: "Origem",
    x: 500,
    y: 50,
    width: 200,
    height: 140,
    color: "#22c55e",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "nome", type: "VARCHAR(100)", constraint: "UK" },
      { name: "descricao", type: "TEXT" },
      { name: "ativo", type: "BOOLEAN" },
    ],
  },
  {
    id: "etapafunil",
    name: "EtapaFunil",
    x: 910,
    y: 50,
    width: 200,
    height: 160,
    color: "#a855f7",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "nome", type: "VARCHAR(100)" },
      { name: "ordem", type: "INTEGER", constraint: "UK" },
      { name: "sla_horas", type: "INTEGER" },
      { name: "ativo", type: "BOOLEAN" },
    ],
  },
  {
    id: "lead",
    name: "Lead",
    x: 500,
    y: 320,
    width: 240,
    height: 300,
    color: "#f59e0b",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "nome", type: "VARCHAR(255)" },
      { name: "email", type: "VARCHAR(255)", constraint: "UK" },
      { name: "telefone", type: "VARCHAR(20)", constraint: "UK" },
      { name: "empresa", type: "VARCHAR(255)" },
      { name: "cargo", type: "VARCHAR(100)" },
      { name: "temperatura", type: "ENUM" },
      { name: "cadastro_completo", type: "BOOLEAN" },
      { name: "origem_id", type: "UUID", constraint: "FK" },
      { name: "owner_id", type: "UUID", constraint: "FK" },
      { name: "etapa_funil_id", type: "UUID", constraint: "FK" },
    ],
  },
  {
    id: "reuniao",
    name: "Reuniao",
    x: 50,
    y: 320,
    width: 240,
    height: 260,
    color: "#0ea5e9",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "lead_id", type: "UUID", constraint: "FK" },
      { name: "consultor_id", type: "UUID", constraint: "FK" },
      { name: "data_hora", type: "TIMESTAMP" },
      { name: "duracao_minutos", type: "INTEGER" },
      { name: "status", type: "ENUM" },
      { name: "anotacoes", type: "TEXT" },
      { name: "resumo", type: "TEXT" },
      { name: "google_event_id", type: "VARCHAR(255)" },
    ],
  },
  {
    id: "notificacao",
    name: "Notificacao",
    x: 910,
    y: 320,
    width: 200,
    height: 200,
    color: "#f43f5e",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "usuario_id", type: "UUID", constraint: "FK" },
      { name: "lead_id", type: "UUID", constraint: "FK" },
      { name: "titulo", type: "VARCHAR(100)" },
      { name: "tipo", type: "VARCHAR(50)" },
      { name: "mensagem", type: "TEXT" },
      { name: "lida", type: "BOOLEAN" },
    ],
  },
  {
    id: "duplicata",
    name: "Duplicata",
    x: 910,
    y: 580,
    width: 200,
    height: 160,
    color: "#f97316",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "lead_original_id", type: "UUID", constraint: "FK" },
      { name: "lead_duplicado_id", type: "UUID", constraint: "FK" },
      { name: "campo_match", type: "VARCHAR(50)" },
      { name: "status", type: "ENUM" },
    ],
  },
  {
    id: "auditlog",
    name: "AuditLog",
    x: 50,
    y: 650,
    width: 240,
    height: 200,
    color: "#475569",
    fields: [
      { name: "id", type: "UUID", constraint: "PK" },
      { name: "entidade", type: "VARCHAR(50)" },
      { name: "entidade_id", type: "UUID" },
      { name: "acao", type: "VARCHAR(20)" },
      { name: "dados_anteriores", type: "JSONB" },
      { name: "dados_novos", type: "JSONB" },
      { name: "usuario_id", type: "UUID", constraint: "FK" },
    ],
  },
]

function getConstraintBadge(constraint?: string) {
  if (!constraint) return null
  const colors: Record<string, string> = {
    PK: "#3b82f6",
    FK: "#f59e0b",
    UK: "#22c55e",
  }
  return colors[constraint] || "#64748b"
}

// Definicoes de paths customizados para cada relacionamento
// Cada path foi calculado para passar pelos espacos entre entidades
const relationshipPaths = [
  {
    // Usuario -> Lead (owner_id) - passa pelo gap horizontal entre colunas
    label: "owner_id",
    rule: "RESTRICT",
    path: "M 290 150 L 370 150 L 370 470 L 500 470",
    labelPos: { x: 370, y: 280 },
  },
  {
    // Origem -> Lead (origem_id) - linha vertical direta no gap
    label: "origem_id",
    rule: "RESTRICT",
    path: "M 600 190 L 600 320",
    labelPos: { x: 600, y: 255 },
  },
  {
    // EtapaFunil -> Lead (etapa_funil_id) - passa pelo gap direito
    label: "etapa_funil_id",
    rule: "RESTRICT",
    path: "M 1010 210 L 1010 260 L 820 260 L 820 400 L 740 400",
    labelPos: { x: 820, y: 260 },
  },
  {
    // Lead -> Reuniao (lead_id) - passa pelo gap horizontal central
    label: "lead_id",
    rule: "RESTRICT",
    path: "M 500 450 L 400 450 L 400 380 L 290 380",
    labelPos: { x: 400, y: 415 },
  },
  {
    // Usuario -> Reuniao (consultor_id) - linha vertical direta
    label: "consultor_id",
    rule: "RESTRICT",
    path: "M 170 250 L 170 320",
    labelPos: { x: 170, y: 285 },
  },
  {
    // Usuario -> Notificacao (usuario_id) - passa pelo topo
    label: "usuario_id",
    rule: "CASCADE",
    path: "M 290 100 L 850 100 L 850 370 L 910 370",
    labelPos: { x: 570, y: 100 },
  },
  {
    // Lead -> Notificacao (lead_id) - passa pelo gap direito
    label: "lead_id",
    rule: "CASCADE",
    path: "M 740 420 L 830 420 L 830 450 L 910 450",
    labelPos: { x: 830, y: 435 },
  },
  {
    // Lead -> Duplicata (lead_original_id) - passa pelo gap inferior direito
    label: "lead_original_id",
    rule: "RESTRICT",
    path: "M 740 550 L 830 550 L 830 660 L 910 660",
    labelPos: { x: 830, y: 605 },
  },
  {
    // Usuario -> AuditLog (usuario_id) - linha vertical esquerda
    label: "usuario_id",
    rule: "SET NULL",
    path: "M 170 250 L 170 290 L 30 290 L 30 750 L 50 750",
    labelPos: { x: 30, y: 520 },
  },
]

export function ERDiagramSVG() {
  const width = 1160
  const height: number = 900

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[1100px]">
        <defs>
          <marker id="one" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <line x1="5" y1="0" x2="5" y2="10" stroke="#64748b" strokeWidth="2" />
          </marker>
          <marker id="many" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
            <path d="M 0 6 L 12 0 L 12 12 Z" fill="none" stroke="#64748b" strokeWidth="1.5" />
          </marker>
        </defs>

        {/* Relationships - render FIRST so entities appear on top */}
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
              {/* Label background */}
              <rect
                x={rel.labelPos.x - 50}
                y={rel.labelPos.y - 10}
                width="100"
                height="20"
                fill="white"
                stroke={ruleColor}
                strokeWidth="1"
                rx="4"
              />
              <text x={rel.labelPos.x} y={rel.labelPos.y + 4} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="500">
                {rel.label}
              </text>
            </g>
          )
        })}

        {/* Entities - render AFTER relationships so they appear on top */}
        {entities.map((entity) => (
          <g key={entity.id}>
            {/* Shadow */}
            <rect
              x={entity.x + 3}
              y={entity.y + 3}
              width={entity.width}
              height={entity.height}
              fill="#00000015"
              rx="8"
            />
            {/* Main box */}
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
            {/* Header */}
            <rect
              x={entity.x}
              y={entity.y}
              width={entity.width}
              height="32"
              fill={entity.color}
              rx="8"
            />
            <rect
              x={entity.x}
              y={entity.y + 24}
              width={entity.width}
              height="8"
              fill={entity.color}
            />
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

            {/* Fields */}
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

        {/* Legend */}
        <g transform="translate(50, 870)">
          <text x="0" y="0" fontSize="12" fontWeight="bold" fill="#1e293b">
            Legenda:
          </text>
          <rect x="80" y="-10" width="24" height="14" fill="#3b82f6" rx="3" />
          <text x="108" y="0" fontSize="10" fill="#475569">PK</text>
          <rect x="140" y="-10" width="24" height="14" fill="#f59e0b" rx="3" />
          <text x="168" y="0" fontSize="10" fill="#475569">FK</text>
          <rect x="200" y="-10" width="24" height="14" fill="#22c55e" rx="3" />
          <text x="228" y="0" fontSize="10" fill="#475569">UK</text>
          <text x="280" y="0" fontSize="10" fill="#475569">|</text>
          <rect x="300" y="-10" width="10" height="14" fill="white" stroke="#22c55e" strokeWidth="1" rx="2" />
          <text x="316" y="0" fontSize="10" fill="#475569">RESTRICT</text>
          <rect x="380" y="-10" width="10" height="14" fill="white" stroke="#ef4444" strokeWidth="1" rx="2" />
          <text x="396" y="0" fontSize="10" fill="#475569">CASCADE</text>
          <rect x="460" y="-10" width="10" height="14" fill="white" stroke="#f59e0b" strokeWidth="1" rx="2" />
          <text x="476" y="0" fontSize="10" fill="#475569">SET NULL</text>
        </g>
      </svg>
    </div>
  )
}
