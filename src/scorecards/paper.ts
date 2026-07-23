// Tamanhos de folha e disposição das súmulas (estilo Groupifier):
// as súmulas ocupam a folha inteira e linhas de corte tracejadas ("serrilhadas")
// separam as súmulas entre si.

export type PaperId = 'a4' | 'a5' | 'a6' | 'a7' | 'letter'

export interface CardRect {
  x: number
  y: number
  w: number
  h: number
}
export interface CutLine {
  x1: number
  y1: number
  x2: number
  y2: number
}
export interface PageLayout {
  paperId: PaperId
  pageW: number
  pageH: number
  perPage: number
  cards: CardRect[]
  cutLines: CutLine[]
}

interface PaperDef {
  label: string
  w: number
  h: number
  cols: number
  rows: number
  margin: number
  gutter: number
}

export const PAPERS: Record<PaperId, PaperDef> = {
  a4: { label: 'A4 — 4 súmulas por página', w: 210, h: 297, cols: 2, rows: 2, margin: 6, gutter: 8 },
  a5: { label: 'A5 — 1 súmula grande por página', w: 148, h: 210, cols: 1, rows: 1, margin: 7, gutter: 0 },
  a6: { label: 'A6 — 1 súmula por página', w: 105, h: 148, cols: 1, rows: 1, margin: 5, gutter: 0 },
  a7: { label: 'A7 — 1 súmula pequena por página', w: 74, h: 105, cols: 1, rows: 1, margin: 4, gutter: 0 },
  letter: { label: 'Carta (Letter) — 4 súmulas por página', w: 215.9, h: 279.4, cols: 2, rows: 2, margin: 7, gutter: 8 },
}

export const PAPER_OPTIONS = (Object.keys(PAPERS) as PaperId[]).map((id) => ({
  id,
  label: PAPERS[id].label,
}))

export function layoutFor(paperId: PaperId): PageLayout {
  const p = PAPERS[paperId]
  const cellW = (p.w - 2 * p.margin - (p.cols - 1) * p.gutter) / p.cols
  const cellH = (p.h - 2 * p.margin - (p.rows - 1) * p.gutter) / p.rows

  const cards: CardRect[] = []
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      cards.push({
        x: p.margin + c * (cellW + p.gutter),
        y: p.margin + r * (cellH + p.gutter),
        w: cellW,
        h: cellH,
      })
    }
  }

  // Linhas de corte tracejadas no centro de cada calha, atravessando a folha.
  const inset = 3
  const cutLines: CutLine[] = []
  for (let c = 1; c < p.cols; c++) {
    const x = p.margin + c * cellW + (c - 0.5) * p.gutter
    cutLines.push({ x1: x, y1: inset, x2: x, y2: p.h - inset })
  }
  for (let r = 1; r < p.rows; r++) {
    const y = p.margin + r * cellH + (r - 0.5) * p.gutter
    cutLines.push({ x1: inset, y1: y, x2: p.w - inset, y2: y })
  }

  return { paperId, pageW: p.w, pageH: p.h, perPage: p.cols * p.rows, cards, cutLines }
}
