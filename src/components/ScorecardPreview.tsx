import { useMemo } from 'react'
import { scorecardMarkup, ensureScorecardStyles, PX_PER_MM } from '../scorecards/template'
import type { ScorecardModel } from '../scorecards/logic'

const A6_ASPECT = 105 / 148

/** Prévia fiel de uma súmula (mesmo HTML/CSS usado no PDF). */
export function ScorecardPreview({ model, widthMm = 105 }: { model: ScorecardModel; widthMm?: number }) {
  ensureScorecardStyles()
  const wpx = Math.round(widthMm * PX_PER_MM)
  const hpx = Math.round((widthMm / A6_ASPECT) * PX_PER_MM)
  const html = useMemo(() => scorecardMarkup(model, wpx, hpx), [model, wpx, hpx])
  // A borda externa é desenhada aqui (no PDF ela é vetorial); espelha o visual.
  return (
    <div
      className="inline-block overflow-hidden rounded-[10px] border-[1.5px] border-[#14161c] shadow-2xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
