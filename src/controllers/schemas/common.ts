import { z } from 'zod'

/** Shared YYYY-MM period schema. */
export const periodYYYYMM = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Invalid format: expected YYYY-MM' })

/** Shared ISO date schema for YYYY-MM-DD input values. */
export const isoDate = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'Invalid date: expected YYYY-MM-DD' })

/** Builds a trimmed, non-empty string with a max length constraint. */
export const trimmedString = (max: number) =>
    z
        .string()
        .transform((value) => value.trim())
        .refine((value) => value.length > 0, { message: 'Must not be empty' })
        .refine((value) => value.length <= max, { message: `Maximum of ${max} characters` })

/** Shared money schema that accepts signed values with up to two decimal places. */
export const money = z
    .number({ error: 'Amount is required' })
    .refine((value) => Number.isFinite(value), { message: 'Invalid number' })
    .refine((value) => Math.round(value * 100) === value * 100, { message: 'Must have 2 decimal places' })

/** Shared money schema for request payloads that require values strictly greater than zero. */
export const positiveMoney = money.refine((value) => value > 0, { message: 'Must be greater than zero' })

/** Shared money schema for aggregates that may be zero but never negative. */
export const nonNegativeMoney = money.refine((value) => value >= 0, { message: 'Must be zero or greater' })

export const TransactionTypeSchema = z.enum(['income', 'expense'])
export const TransactionModeSchema = z.enum(['single', 'recurring_monthly', 'installment'])

export const NameSchema = trimmedString(120)
export const CategorySchema = z.string().transform((value) => value.trim()).refine((value) => value.length <= 60, {
    message: 'Maximum of 60 characters',
})
export const NoteSchema = z.string().transform((value) => value.trim()).refine((value) => value.length <= 280, {
    message: 'Maximum of 280 characters',
})

export const LimitSchema = z.coerce
    .number()
    .int('Must be an integer')
    .min(1, 'Minimum 1')
    .max(200, 'Maximum 200')
    .default(50)

export const OffsetSchema = z.coerce.number().int('Must be an integer').min(0, 'Minimum 0').default(0)
