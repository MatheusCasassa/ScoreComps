// Exportação para PDF: cada súmula é renderizada em HTML/CSS, rasterizada
// em alta resolução (html2canvas) e posicionada na página com marcas de corte.

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { ScorecardModel } from './logic'
import { scorecardMarkup, ensureScorecardStyles, PX_PER_MM } from './template'
import { layoutFor, type PaperId, type CutLine } from './paper'

const RENDER_SCALE = 3.2 // ~300 dpi na impressão

// A súmula é sempre desenhada num tamanho de projeto constante (A6) e depois
// ESCALADA para o retângulo alvo. Assim a aparência é idêntica em qualquer
// tamanho de folha — só muda a escala, nunca o layout.
const DESIGN_W_MM = 105
const DESIGN_H_MM = 148

/** Rasteriza um HTML solto (raiz = 1 elemento) em canvas de alta resolução. */
export async function renderHtmlToCanvas(html: string): Promise<HTMLCanvasElement> {
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;z-index:-1;'
  host.innerHTML = html
  document.body.appendChild(host)
  const el = host.firstElementChild as HTMLElement
  try {
    return await html2canvas(el, {
      scale: RENDER_SCALE,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    })
  } finally {
    document.body.removeChild(host)
  }
}

async function renderCardCanvas(model: ScorecardModel): Promise<HTMLCanvasElement> {
  const wpx = Math.round(DESIGN_W_MM * PX_PER_MM)
  const hpx = Math.round(DESIGN_H_MM * PX_PER_MM)
  return renderHtmlToCanvas(scorecardMarkup(model, wpx, hpx))
}

/** Borda externa do cartão, em vetor (crisp e idêntica em todas as súmulas). */
function drawCardBorder(doc: jsPDF, r: { x: number; y: number; w: number; h: number }): void {
  doc.setDrawColor(20)
  doc.setLineWidth(0.4)
  doc.setLineDashPattern([], 0)
  doc.roundedRect(r.x, r.y, r.w, r.h, 2.6, 2.6, 'S')
}

/** Linhas de corte tracejadas ("serrilhadas") entre as súmulas. */
function drawCutLines(doc: jsPDF, lines: CutLine[]): void {
  if (lines.length === 0) return
  doc.setDrawColor(150)
  doc.setLineWidth(0.25)
  doc.setLineDashPattern([1.4, 1.4], 0)
  for (const l of lines) doc.line(l.x1, l.y1, l.x2, l.y2)
  doc.setLineDashPattern([], 0)
}

export interface ExportOptions {
  paperId: PaperId
  cutLines?: boolean
}

/** Gera o documento PDF (assíncrono por causa da rasterização). */
export async function generateScorecardsPdf(
  models: ScorecardModel[],
  opts: ExportOptions,
): Promise<jsPDF> {
  ensureScorecardStyles()
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignora */
    }
  }

  const layout = layoutFor(opts.paperId)
  const doc = new jsPDF({
    unit: 'mm',
    format: [layout.pageW, layout.pageH],
    orientation: 'portrait',
  })

  for (let i = 0; i < models.length; i++) {
    const slot = i % layout.perPage
    if (i > 0 && slot === 0) doc.addPage([layout.pageW, layout.pageH], 'portrait')
    const rect = layout.cards[slot]
    const canvas = await renderCardCanvas(models[i])
    doc.addImage(canvas, 'PNG', rect.x, rect.y, rect.w, rect.h, undefined, 'FAST')
    drawCardBorder(doc, rect)

    // Desenha as linhas de corte ao completar cada página (ou na última).
    const lastOnPage = slot === layout.perPage - 1 || i === models.length - 1
    if (lastOnPage && opts.cutLines !== false) drawCutLines(doc, layout.cutLines)
  }
  return doc
}

export async function downloadScorecardsPdf(
  models: ScorecardModel[],
  opts: ExportOptions,
  filename: string,
): Promise<void> {
  const doc = await generateScorecardsPdf(models, opts)
  doc.save(filename)
}

/** URL de blob para pré-visualização em nova aba. */
export async function scorecardsBlobUrl(
  models: ScorecardModel[],
  opts: ExportOptions,
): Promise<string> {
  const doc = await generateScorecardsPdf(models, opts)
  return doc.output('bloburl') as unknown as string
}
