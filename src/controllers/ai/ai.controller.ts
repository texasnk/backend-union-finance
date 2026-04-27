import { Request, Response } from 'express'
import CategorySuggestionService from '../../services/category-suggestion.service'
import { parseInput } from '../helpers/http'
import { PostAiSuggestCategoryBodySchema, PostAiSuggestCategoryResponseSchema } from './schemas'

export class AIController {
    constructor(private readonly categorySuggestionService: CategorySuggestionService = new CategorySuggestionService()) { }

    /** Returns category suggestions without leaking provider failures to the main HTTP flow. */
    async suggestCategory(req: Request, res: Response): Promise<void> {
        const body = parseInput(PostAiSuggestCategoryBodySchema, req.body)
        const suggestions = await this.categorySuggestionService.suggest({
            name: body.name,
            amount: body.amount.toFixed(2),
            type: body.type,
            card_id: body.card_id ?? null,
        })

        res.status(200).json(PostAiSuggestCategoryResponseSchema.parse({ suggestions }))
    }
}

export default AIController
