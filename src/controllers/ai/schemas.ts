import { z } from 'zod'
import { NameSchema, positiveMoney, TransactionTypeSchema } from '../schemas/common'

export const PostAiSuggestCategoryBodySchema = z.object({
    name: NameSchema,
    amount: positiveMoney,
    type: TransactionTypeSchema,
    card_id: z.string().optional(),
}).strict()

export const CategorySuggestionSchema = z.object({
    category: z.string(),
    confidence: z.number().min(0).max(1),
}).strict()

export const PostAiSuggestCategoryResponseSchema = z.object({
    suggestions: z.array(CategorySuggestionSchema),
}).strict()
