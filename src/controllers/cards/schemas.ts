import { z } from 'zod'
import { NameSchema } from '../schemas/common'

export const PostCardsBodySchema = z.object({
    name: NameSchema,
    closing_day: z.coerce.number().int().min(1).max(28),
    due_day: z.coerce.number().int().min(1).max(28),
}).strict()

export const CardParamsSchema = z.object({
    id: z.string().trim().min(1),
}).strict()

export const CardResponseSchema = z.object({
    id: z.string(),
    name: NameSchema,
    closing_day: z.number().int(),
    due_day: z.number().int(),
}).strict()
