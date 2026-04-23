/**
 * API Schemas (Zod) for Union Finance MVP
 * Short docstrings; clean code. Types exported via z.infer.
 */
import { z } from 'zod'

// Basic primitives
/** YYYY-MM period string */
export const periodYYYYMM = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Invalid format: expected YYYY-MM' })

/** ISO date (YYYY-MM-DD) in America/Sao_Paulo (validated as date shape only) */
export const isoDate = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'Invalid date: expected YYYY-MM-DD' })

/** Non-empty trimmed string with max length */
const trimmedString = (max: number) =>
    z
        .string()
        .transform((s) => s.trim())
        .refine((s) => s.length > 0, { message: 'Must not be empty' })
        .refine((s) => s.length <= max, { message: `Maximum of ${max} characters` })

/** Monetary value: positive, 2 decimals, half-up expectation */
export const money = z
    .number({ error: 'Amount is required' })
    .positive('Must be greater than zero')
    .refine((n) => Number.isFinite(n), { message: 'Invalid number' })
    .refine((n) => Math.round(n * 100) === n * 100, { message: 'Must have 2 decimal places' })

// Enums
export const TransactionTypeEnum = z.enum(['income', 'expense'])
export const TransactionModeEnum = z.enum(['single', 'recurring_monthly', 'installment'])

// Reusable fields
export const Name = trimmedString(120)
export const Category = z.string().transform((s) => s.trim()).refine((s) => s.length <= 60, {
    message: 'Maximum of 60 characters',
})
export const Note = z.string().transform((s) => s.trim()).refine((s) => s.length <= 280, {
    message: 'Maximum of 280 characters',
})

// Pagination and filters
export const Limit = z.coerce
    .number()
    .int('Must be an integer')
    .min(1, 'Minimum 1')
    .max(200, 'Maximum 200')
    .default(50)
export const Offset = z.coerce.number().int('Must be an integer').min(0, 'Minimum 0').default(0)

// Errors (standard shape)
export const ErrorDetail = z.object({ field: z.string(), error: z.string() }).strict()
export const ErrorResponse = z
    .object({ code: z.string(), message: z.string(), details: z.array(ErrorDetail).optional() })
    .strict()

// POST /transactions
/** Body without card */
export const PostTransactionsBodyNoCard = z
    .object({
        name: Name,
        amount: money,
        type: TransactionTypeEnum,
        mode: TransactionModeEnum.default('single'),
        reference_date: isoDate,
        category: Category.optional(),
        note: Note.optional(),
        total_installments: z.coerce.number().int().min(1).max(12).optional(),
    })
    .strict()

/** Body with card */
export const PostTransactionsBodyWithCard = z
    .object({
        name: Name,
        amount: money,
        type: TransactionTypeEnum,
        mode: TransactionModeEnum.default('single'),
        transaction_date: isoDate,
        card_id: z.string(),
        category: Category.optional(),
        note: Note.optional(),
        total_installments: z.coerce.number().int().min(1).max(12).optional(),
    })
    .strict()

/** Union body (either with or without card) */
export const PostTransactionsBody = z.union([
    PostTransactionsBodyNoCard.refine((b) => !('card_id' in (b as any)) && !('transaction_date' in (b as any)), {
        message: 'Without card should not include card_id/transaction_date',
    }),
    PostTransactionsBodyWithCard.refine((b) => !('reference_date' in (b as any)), {
        message: 'With card must not include reference_date',
    }),
])

/** 201 response */
export const PostTransactions201 = z.object({ id: z.string(), created_occurrences: z.number().int().min(0) }).strict()

// GET /occurrences
export const GetOccurrencesQuery = z
    .object({ month: periodYYYYMM.optional(), type: TransactionTypeEnum.optional(), limit: Limit, offset: Offset })
    .strict()

export const OccurrenceItem = z
    .object({
        id: z.string(),
        name: Name, // via transaction
        type: TransactionTypeEnum,
        amount: money,
        period: periodYYYYMM,
        installment_number: z.number().int().min(1).max(12).nullable().optional(),
        total_installments: z.number().int().min(1).max(12).nullable().optional(),
    })
    .strict()

export const GetOccurrences200 = z
    .object({ total: z.number().int().min(0), items: z.array(OccurrenceItem) })
    .strict()

// GET /balances
export const GetBalancesQuery = z.object({ month: periodYYYYMM }).strict()
export const GetBalances200 = z
    .object({ month: periodYYYYMM, incomes: money.default(0), expenses: money.default(0), balance: money })
    .strict()

// GET /balances/insights
export const GetBalancesInsightsQuery = z.object({ month: periodYYYYMM }).strict()
export const CategoryHighlight = z.object({ category: z.string(), total: money }).strict()
export const AlertItem = z.object({ type: z.string(), description: z.string() }).strict()
export const GetBalancesInsights200 = z
    .object({
        month: periodYYYYMM,
        summary_text: z.string(),
        highlights: z.array(CategoryHighlight),
        alerts: z.array(AlertItem),
    })
    .strict()

// POST /cards
export const PostCardsBody = z
    .object({
        name: Name,
        closing_day: z.coerce.number().int().min(1).max(28),
        due_day: z.coerce.number().int().min(1).max(28),
    })
    .strict()
export const PostCards201 = z.object({ id: z.string() }).strict()

// GET /cards/:id
export const GetCard200 = z
    .object({ id: z.string(), name: Name, closing_day: z.number().int(), due_day: z.number().int() })
    .strict()

// POST /ai/suggest-category
export const PostAiSuggestCategoryBody = z
    .object({ name: Name, amount: money, type: TransactionTypeEnum, card_id: z.string().optional() })
    .strict()
export const CategorySuggestion = z
    .object({ category: z.string(), confidence: z.number().min(0).max(1) })
    .strict()
export const PostAiSuggestCategory200 = z.object({ suggestions: z.array(CategorySuggestion) }).strict()

// Export types
export type TPostTransactionsBody = z.infer<typeof PostTransactionsBody>
export type TPostTransactions201 = z.infer<typeof PostTransactions201>
export type TGetOccurrencesQuery = z.infer<typeof GetOccurrencesQuery>
export type TOccurrenceItem = z.infer<typeof OccurrenceItem>
export type TGetOccurrences200 = z.infer<typeof GetOccurrences200>
export type TGetBalancesQuery = z.infer<typeof GetBalancesQuery>
export type TGetBalances200 = z.infer<typeof GetBalances200>
export type TGetBalancesInsightsQuery = z.infer<typeof GetBalancesInsightsQuery>
export type TGetBalancesInsights200 = z.infer<typeof GetBalancesInsights200>
export type TPostCardsBody = z.infer<typeof PostCardsBody>
export type TPostCards201 = z.infer<typeof PostCards201>
export type TGetCard200 = z.infer<typeof GetCard200>
export type TPostAiSuggestCategoryBody = z.infer<typeof PostAiSuggestCategoryBody>
export type TPostAiSuggestCategory200 = z.infer<typeof PostAiSuggestCategory200>
export type TErrorResponse = z.infer<typeof ErrorResponse>
