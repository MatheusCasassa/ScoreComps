// Template HTML/CSS de uma súmula (estilo alinhado ao Groupifier).
// Renderizado no DOM e rasterizado (html2canvas) para compor o PDF.

import type { ScorecardModel, ScorecardRow } from './logic'
import { INTER_FONT_CSS } from './interFont'

/** px por mm a 96dpi (base de renderização). */
export const PX_PER_MM = 96 / 25.4 // ≈ 3.7795

const STYLE_ID = 'sc-styles'

// "InterSC" é a Inter embutida em base64 (interFont.ts): garante que o
// html2canvas renderize os pesos negrito corretos. Depois vêm os fallbacks
// (incluindo fontes CJK do sistema para nomes com caracteres chineses).
const FONT_STACK =
  "'InterSC','Inter','Helvetica Neue',Arial,'Noto Sans','Noto Sans CJK SC'," +
  "'PingFang SC','Hiragino Sans','Microsoft YaHei',sans-serif"

// Larguras fixas das colunas (px no tamanho de projeto ~397px de largura).
const NUM_W = 34
const SIG_W = 40 // colunas de assinatura padronizadas (S, J, C, D)
const ROW_H = 42

export const SCORECARD_CSS =
  INTER_FONT_CSS +
  `
.sc, .sc * { box-sizing: border-box; margin: 0; padding: 0; }
.sc {
  --ink: #14161c;
  --thin: 1px solid var(--ink);
  --thick: 1.8px solid var(--ink);
  position: relative;
  background: #fff;
  color: var(--ink);
  font-family: ${FONT_STACK};
  /* A borda externa é desenhada em VETOR no PDF (crisp e sempre completa),
     não aqui — a borda rasterizada some no reescalonamento em alguns offsets. */
  border: none;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 7px 8px 8px;
  line-height: 1.1;
  -webkit-font-smoothing: antialiased;
}

/* Cabeçalho: ID | Competição/Evento | Grupo */
.sc-head { display: grid; grid-template-columns: 46px 1fr 46px; border: var(--thick); border-radius: 6px; overflow: hidden; }
.sc-head > div { padding: 3px 5px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.sc-id { border-right: var(--thin); }
.sc-grp { border-left: var(--thin); }
.sc-lbl { font-size: 8.5px; font-weight: 600; letter-spacing: .04em; color: #6b7180; text-transform: uppercase; }
.sc-big { font-size: 20px; font-weight: 700; }
.sc-mid { gap: 1px; }
.sc-comp { font-size: 13px; font-weight: 700; text-align: center; line-height: 1.05; }
.sc-event { font-size: 10.5px; font-weight: 500; color: #2b2f3a; text-align: center; }

/* Nome do competidor — usa a LARGURA TOTAL do cartão (inclui o vão do ID/Grupo) */
.sc-name { padding: 4px 5px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.sc-name-main { font-weight: 700; width: 100%; overflow-wrap: anywhere; line-height: 1.08; }
.sc-wca { font-size: 9.5px; font-weight: 600; color: #6b7180; margin-top: 1px; }

/* Faixa de configuração (DNF / cumulativo + penalidade) — largura total */
.sc-cfg { text-align: center; padding: 3px 4px 5px; }
.sc-cfg .dnf { font-size: 12.5px; font-weight: 700; }
.sc-cfg .pen { font-size: 10px; font-weight: 500; color: #3a3f4b; margin-top: 1px; }

/* Cabeçalho de colunas (rótulos alinhados às caixas, sem divisórias) */
.sc-colhead { display: flex; align-items: center; padding-bottom: 2px; }
.sc-colhead .num-sp { width: ${NUM_W}px; text-align: center; }
.sc-colhead .labels { flex: 1; display: grid; }
.sc-colhead .labels > span { text-align: center; font-size: 12.5px; font-weight: 700; }
.sc-colhead .lbl-hash { font-size: 14px; font-weight: 700; }

/* Linha de solve: número grande à esquerda + tira de caixas */
.sc-solve { display: flex; align-items: stretch; height: ${ROW_H}px; margin-bottom: 5px; }
.sc-solve .num { width: ${NUM_W}px; display: flex; align-items: center; justify-content: center; font-size: 21px; font-weight: 700; }
.sc-solve .boxes { flex: 1; display: grid; border: var(--thick); border-radius: 4px; overflow: hidden; }
.sc-solve .cell { position: relative; }
.sc-solve .cell:not(:last-child) { border-right: var(--thin); }
.sc-solve .cell.d { display: flex; align-items: center; justify-content: center; }
.sc-solve .cell.d .dmark { font-size: 24px; font-weight: 700; color: var(--ink); opacity: .25; line-height: 1; }

/* Textos intermediários */
.sc-cut, .sc-extras-label { text-align: center; padding: 2px 4px 4px; }
.sc-cut { font-size: 11px; font-weight: 600; color: #2b2f3a; }
.sc-extras-label { font-size: 12px; font-weight: 700; }

.sc-spacer { flex: 1 1 auto; min-height: 0; }
`

export function ensureScorecardStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = SCORECARD_CSS
  document.head.appendChild(el)
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

// "Peso visual" do nome (CJK ocupa ~2x a largura de um caractere latino).
function nameWeight(name: string): number {
  let w = 0
  for (const ch of name) w += /[⺀-鿿가-힣豈-﫿]/.test(ch) ? 2 : 1
  return w
}

// Tamanho de fonte que faz o nome preencher ~toda a largura do cartão.
// Calibrado para Inter bold (~0.53 de avanço por caractere) numa faixa útil.
function nameFontPx(name: string): number {
  const w = Math.max(nameWeight(name), 1)
  const px = 690 / w
  return Math.round(Math.max(11.5, Math.min(22, px)) * 10) / 10
}

// Colunas das caixas (grid-template-columns).
const COLS_NORMAL = `${SIG_W}px 1fr ${SIG_W}px ${SIG_W}px` // S | tempo | J | C
const COLS_EXTRA = `${SIG_W}px 1fr ${SIG_W}px ${SIG_W}px ${SIG_W}px` // S | tempo | D | J | C

function solveHtml(row: ScorecardRow): string {
  if (row.isExtra) {
    return `<div class="sc-solve extra"><div class="num">${esc(row.label)}</div><div class="boxes" style="grid-template-columns:${COLS_EXTRA}"><div class="cell s"></div><div class="cell time"></div><div class="cell d"><span class="dmark">D</span></div><div class="cell j"></div><div class="cell c"></div></div></div>`
  }
  return `<div class="sc-solve"><div class="num">${esc(row.label)}</div><div class="boxes" style="grid-template-columns:${COLS_NORMAL}"><div class="cell s"></div><div class="cell time"></div><div class="cell j"></div><div class="cell c"></div></div></div>`
}

/** Gera o HTML de uma súmula. `widthPx`/`heightPx` = tamanho de projeto. */
export function scorecardMarkup(m: ScorecardModel, widthPx: number, heightPx: number): string {
  const L = m.layout

  const cfgInner =
    (L.dnfText ? `<div class="dnf">${esc(L.dnfText)}</div>` : L.isFmc ? `<div class="dnf">Menor nº de movimentos</div>` : '') +
    (L.penaltyText ? `<div class="pen">${esc(L.penaltyText)}</div>` : '')
  const cfg = cfgInner ? `<div class="sc-cfg">${cfgInner}</div>` : ''

  const block1 = L.block1.map(solveHtml).join('')
  const cutBlock =
    L.block2.length > 0
      ? `<div class="sc-cut">${esc(L.cutoffText)}</div>${L.block2.map(solveHtml).join('')}`
      : ''
  const extras = L.extras.map(solveHtml).join('')

  return `<div class="sc" style="width:${widthPx}px;height:${heightPx}px">
    <div class="sc-head">
      <div class="sc-id"><span class="sc-lbl">ID</span><span class="sc-big">${esc(m.competitorId)}</span></div>
      <div class="sc-mid"><div class="sc-comp">${esc(m.competitionName)}</div><div class="sc-event">${esc(m.eventName)}</div></div>
      <div class="sc-grp"><span class="sc-lbl">Grupo</span><span class="sc-big">${esc(m.group)}</span></div>
    </div>
    <div class="sc-name">
      <div class="sc-name-main" style="font-size:${nameFontPx(m.competitorName)}px">${esc(m.competitorName)}</div>
      ${m.wcaId ? `<div class="sc-wca">${esc(m.wcaId)}</div>` : ''}
    </div>
    ${cfg}
    <div class="sc-colhead">
      <span class="num-sp lbl-hash">#</span>
      <span class="labels" style="grid-template-columns:${COLS_NORMAL}"><span>S</span><span></span><span>J</span><span>C</span></span>
    </div>
    ${block1}
    ${cutBlock}
    <div class="sc-extras-label">${esc(L.extrasText)}</div>
    ${extras}
    <div class="sc-spacer"></div>
  </div>`
}
