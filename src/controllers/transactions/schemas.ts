import { z } from 'zod'
import {
    CategorySchema,
    isoDate,
    money,
    NameSchema,
    NoteSchema,
    OffsetSchema,
    periodYYYYMM,
    positiveMoney,
    TransactionModeSchema,
    TransactionTypeSchema,
    LimitSchema,
} from '../schemas/common'

export const PostTransactionsBodyNoCardSchema = z
    .object({
        name: NameSchema,
        amount: positiveMoney,
        type: TransactionTypeSchema,
        mode: TransactionModeSchema.default('single'),
        reference_date: isoDate,
        category: CategorySchema.optional(),
        note: NoteSchema.optional(),
        total_installments: z.coerce.number().int().min(1).max(12).optional(),
    })
    .strict()

export const PostTransactionsBodyWithCardSchema = z
    .object({
        name: NameSchema,
        amount: positiveMoney,
        type: TransactionTypeSchema,
        mode: TransactionModeSchema.default('single'),
        transaction_date: isoDate,
        card_id: z.string(),
        category: CategorySchema.optional(),
        note: NoteSchema.optional(),
        total_installments: z.coerce.number().int().min(1).max(12).optional(),
    })
    .strict()

export const PostTransactionsBodySchema = z.union([
    PostTransactionsBodyNoCardSchema.refine((body) => !('card_id' in body) && !('transaction_date' in body), {
        message: 'Without card should not include card_id/transaction_date',
    }),
    PostTransactionsBodyWithCardSchema.refine((body) => !('reference_date' in body), {
        message: 'With card must not include reference_date',
    }),
])

export const TransactionResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    amount: z.string(),
    type: TransactionTypeSchema,
    mode: TransactionModeSchema,
    reference_date: z.string().nullable(),
    transaction_date: z.string().nullable(),
    card_id: z.string().nullable(),
    category: z.string().nullable(),
    note: z.string().nullable(),
    total_installments: z.number().nullable(),
    created_at: z.string(),
}).strict()

export const GetOccurrencesQuerySchema = z
    .object({
        month: periodYYYYMM.optional(),
        type: TransactionTypeSchema.optional(),
        limit: LimitSchema,
        offset: OffsetSchema,
    })
    .strict()

export const OccurrenceItemSchema = z.object({
    id: z.string(),
    name: NameSchema,
    type: TransactionTypeSchema,
    amount: positiveMoney,
    period: periodYYYYMM,
    installment_number: z.number().int().min(1).max(12).nullable().optional(),
    total_installments: z.number().int().min(1).max(12).nullable().optional(),
}).strict()

export const GetOccurrencesResponseSchema = z.object({
    total: z.number().int().min(0),
    items: z.array(OccurrenceItemSchema),
}).strict()
