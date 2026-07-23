// Cartões de competidor (estilo Groupifier): um cartão por pessoa mostrando,
// para cada evento (rodada 1), o grupo em que compete e as tarefas de staff.

import { jsPDF } from 'jspdf'
import type { Wcif, WcifActivity } from '../wca/types'
import { eventName } from './format'
import { PX_PER_MM } from './template'
import { renderHtmlToCanvas } from './export'

const STYLE_ID = 'cc-styles'
const FONT_STACK =
  "'Inter','Helvetica Neue',Arial,'Noto Sans','Noto Sans CJK SC','PingFang SC','Hiragino Sans','Microsoft YaHei',sans-serif"

export const COMPETITOR_CARD_CSS = `
.cc, .cc * { box-sizing: border-box; margin: 0; padding: 0; }
.cc { background:#fff; color:#14161c; font-family:${FONT_STACK}; display:flex; flex-direction:column; padding:8px 10px; overflow:hidden; -webkit-font-smoothing:antialiased; }
.cc-name { font-size:16px; font-weight:800; line-height:1.1; overflow-wrap:anywhere; }
.cc-sub { font-size:10px; font-weight:600; color:#6b7180; margin-bottom:4px; }
.cc-sub b { color:#14161c; }
.cc-table { width:100%; border-collapse:collapse; }
.cc-table th, .cc-table td { border:1px solid #14161c; padding:2px 4px; font-size:11px; text-align:center; }
.cc-table th { font-weight:800; background:#f1f2f5; }
.cc-table td.ev { text-align:left; font-weight:700; white-space:nowrap; }
.cc-empty { font-size:10px; color:#6b7180; margin-top:6px; }
`

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = COMPETITOR_CARD_CSS
  document.head.appendChild(el)
}

const ROLES = [
  { code: 'competitor', label: 'Comp' },
  { code: 'staff-scrambler', label: 'Emb' },
  { code: 'staff-runner', label: 'Runner' },
  { code: 'staff-judge', label: 'Juiz' },
] as const

interface ActivityMeta {
  eventId: string
  roundNumber: number
  groupNumber: number
}

/** Índice activityId -> {eventId, roundNumber, groupNumber} p/ atividades de grupo. */
function buildActivityIndex(wcif: Wcif): Map<number, ActivityMeta> {
  const idx = new Map<number, ActivityMeta>()
  const re = /^([a-z0-9]+)-r(\d+)-g(\d+)$/
  const walk = (as: WcifActivity[]) => {
    for (const a of as) {
      const m = a.activityCode?.match(re)
      if (m) idx.set(a.id, { eventId: m[1], roundNumber: Number(m[2]), groupNumber: Number(m[3]) })
      if (a.childActivities?.length) walk(a.childActivities)
    }
  }
  for (const v of wcif.schedule?.venues ?? []) for (const r of v.rooms ?? []) walk(r.activities ?? [])
  return idx
}

export interface CompetitorCard {
  name: string
  registrantId: number
  wcaId: string | null
  columns: { code: string; label: string }[]
  rows: { eventName: string; cells: Record<string, string> }[]
}

/** Constrói os cartões (apenas rodada 1), ordenados por nome. */
export function buildCompetitorCards(wcif: Wcif): CompetitorCard[] {
  const idx = buildActivityIndex(wcif)
  const cards: CompetitorCard[] = []

  for (const person of wcif.persons) {
    if (person.registrantId == null) continue
    // eventId -> assignmentCode -> Set<groupNumber>
    const byEvent = new Map<string, Map<string, Set<number>>>()
    const usedCodes = new Set<string>()

    for (const as of person.assignments) {
      const meta = idx.get(as.activityId)
      if (!meta || meta.roundNumber !== 1) continue
      if (!ROLES.some((r) => r.code === as.assignmentCode)) continue
      usedCodes.add(as.assignmentCode)
      const ev = byEvent.get(meta.eventId) ?? new Map()
      const set = ev.get(as.assignmentCode) ?? new Set<number>()
      set.add(meta.groupNumber)
      ev.set(as.assignmentCode, set)
      byEvent.set(meta.eventId, ev)
    }

    if (byEvent.size === 0) continue
    const columns = ROLES.filter((r) => usedCodes.has(r.code))
    const rows = [...byEvent.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([evId, roleMap]) => {
        const cells: Record<string, string> = {}
        for (const col of columns) {
          const set = roleMap.get(col.code)
          cells[col.code] = set ? [...set].sort((x, y) => x - y).join(', ') : ''
        }
        return { eventName: eventName(evId), cells }
      })

    cards.push({
      name: person.name,
      registrantId: person.registrantId,
      wcaId: person.wcaId,
      columns,
      rows,
    })
  }

  return cards.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

export function competitorCardMarkup(card: CompetitorCard, wpx: number, hpx: number): string {
  const head = `<tr><th style="text-align:left">Evento</th>${card.columns.map((c) => `<th>${c.label}</th>`).join('')}</tr>`
  const body = card.rows
    .map(
      (r) =>
        `<tr><td class="ev">${esc(r.eventName)}</td>${card.columns.map((c) => `<td>${esc(r.cells[c.code] || '·')}</td>`).join('')}</tr>`,
    )
    .join('')
  return `<div class="cc" style="width:${wpx}px;height:${hpx}px">
    <div class="cc-name">${esc(card.name)}</div>
    <div class="cc-sub">ID <b>${card.registrantId}</b>${card.wcaId ? ` · ${esc(card.wcaId)}` : ''}</div>
    <table class="cc-table"><thead>${head}</thead><tbody>${body}</tbody></table>
  </div>`
}

// -------------------- PDF (grade 2×6 em A4) --------------------

const COLS = 2
const ROWS = 6
const MARGIN = 8
const GUTTER = 6
const PAGE_W = 210
const PAGE_H = 297
const CARD_W = (PAGE_W - 2 * MARGIN - (COLS - 1) * GUTTER) / COLS
const CARD_H = (PAGE_H - 2 * MARGIN - (ROWS - 1) * GUTTER) / ROWS

export async function generateCompetitorCardsPdf(wcif: Wcif): Promise<jsPDF> {
  ensureStyles()
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignora */
    }
  }
  const cards = buildCompetitorCards(wcif)
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  if (cards.length === 0) {
    doc.setFontSize(12)
    doc.text('Nenhuma atribuição encontrada. Gere os grupos primeiro.', 15, 20)
    return doc
  }
  const wpx = Math.round(CARD_W * PX_PER_MM)
  const hpx = Math.round(CARD_H * PX_PER_MM)
  const perPage = COLS * ROWS

  for (let i = 0; i < cards.length; i++) {
    const slot = i % perPage
    if (i > 0 && slot === 0) doc.addPage('a4', 'portrait')
    const col = slot % COLS
    const row = Math.floor(slot / COLS)
    const x = MARGIN + col * (CARD_W + GUTTER)
    const y = MARGIN + row * (CARD_H + GUTTER)
    const canvas = await renderHtmlToCanvas(competitorCardMarkup(cards[i], wpx, hpx))
    doc.addImage(canvas, 'PNG', x, y, CARD_W, CARD_H, undefined, 'FAST')
    doc.setDrawColor(20)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, CARD_W, CARD_H, 1.6, 1.6, 'S')
  }
  return doc
}

export async function downloadCompetitorCardsPdf(wcif: Wcif, filename: string): Promise<void> {
  const doc = await generateCompetitorCardsPdf(wcif)
  doc.save(filename)
}
