import { z } from 'zod'
import { money, nonNegativeMoney, periodYYYYMM } from '../schemas/common'

export const GetBalancesQuerySchema = z.object({
    month: periodYYYYMM,
}).strict()

export const GetBalancesResponseSchema = z.object({
    month: periodYYYYMM,
    incomes: nonNegativeMoney.default(0),
    expenses: nonNegativeMoney.default(0),
    balance: money,
}).strict()

export const GetBalancesInsightsQuerySchema = z.object({
    month: periodYYYYMM,
}).strict()

export const CategoryHighlightSchema = z.object({
    category: z.string(),
    total: nonNegativeMoney,
}).strict()

export const AlertItemSchema = z.object({
    type: z.string(),
    description: z.string(),
}).strict()

export const GetBalancesInsightsResponseSchema = z.object({
    month: periodYYYYMM,
    summary_text: z.string(),
    highlights: z.array(CategoryHighlightSchema),
    alerts: z.array(AlertItemSchema),
}).strict()
