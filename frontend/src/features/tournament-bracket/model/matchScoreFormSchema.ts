import { z } from 'zod'

function parseNonNegativeInt(s: string): number | null {
  const n = Number.parseInt(s.replace(/\D/g, ''), 10)
  if (!Number.isFinite(n)) return null
  return n
}

function scoreRefine(data: { scoreA: string; scoreB: string }, ctx: z.RefinementCtx, allowDraw: boolean) {
  const a = parseNonNegativeInt(data.scoreA)
  const b = parseNonNegativeInt(data.scoreB)
  if (a === null) {
    ctx.addIssue({ code: 'custom', message: 'Введите целое число от 0 до 999', path: ['scoreA'] })
    return
  }
  if (b === null) {
    ctx.addIssue({ code: 'custom', message: 'Введите целое число от 0 до 999', path: ['scoreB'] })
    return
  }
  if (a < 0 || a > 999) {
    ctx.addIssue({ code: 'custom', message: 'Допустимо 0…999', path: ['scoreA'] })
  }
  if (b < 0 || b > 999) {
    ctx.addIssue({ code: 'custom', message: 'Допустимо 0…999', path: ['scoreB'] })
  }
  if (!allowDraw && a === b) {
    ctx.addIssue({ code: 'custom', message: 'На вылете ничья недопустима', path: ['scoreB'] })
  }
}

const scoreFields = z.object({
  scoreA: z.string(),
  scoreB: z.string(),
})

export function createMatchScoreSetFormSchema(allowDraw: boolean) {
  return scoreFields.superRefine((data, ctx) => scoreRefine(data, ctx, allowDraw))
}

/** Олимпийская сетка — без ничьих. */
export const matchScoreSetFormSchema = createMatchScoreSetFormSchema(false)

/** Круговая / швейцарка — ничья разрешена. */
export const matchScoreSetFormSchemaAllowDraw = createMatchScoreSetFormSchema(true)

export type MatchScoreFormValues = z.infer<typeof matchScoreSetFormSchema>

export function scoresFromMatchScoreForm(values: MatchScoreFormValues): { scoreA: number; scoreB: number } {
  return {
    scoreA: parseNonNegativeInt(values.scoreA) as number,
    scoreB: parseNonNegativeInt(values.scoreB) as number,
  }
}
