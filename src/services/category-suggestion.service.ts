import { CategorySuggestionDto, SuggestCategoryInputDto } from '../dtos/ai.dto'
import { BusinessRuleViolationError } from '../errors/app-error'
import { FinancialAIProvider } from './ai/ai-provider'
import { createFinancialAIProvider } from './ai/financial-ai.factory'

const DEFAULT_AI_THRESHOLD = 0.8

/** Reads the minimum confidence required for automatic category assignment. */
const getAiThreshold = (): number => {
    const rawThreshold = process.env.AI_THRESHOLD
    const threshold = rawThreshold ? Number(rawThreshold) : DEFAULT_AI_THRESHOLD

    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
        return DEFAULT_AI_THRESHOLD
    }

    return threshold
}

export class CategorySuggestionService {
    constructor(private readonly aiProvider: FinancialAIProvider = createFinancialAIProvider()) { }

    /** Returns category suggestions ordered by descending confidence. */
    async suggest(input: SuggestCategoryInputDto): Promise<CategorySuggestionDto[]> {
        if (!input.name.trim()) {
            throw new BusinessRuleViolationError('name must not be empty', {
                details: [{ field: 'name', error: 'required' }],
            })
        }

        const suggestions = await this.aiProvider.suggestCategory(input)

        return [...suggestions].sort((left, right) => right.confidence - left.confidence)
    }

    /** Returns the top category only when it passes the configured autofill threshold. */
    async suggestAutofillCategory(input: SuggestCategoryInputDto): Promise<string | null> {
        const suggestions = await this.suggest(input)
        const bestSuggestion = suggestions[0]

        if (!bestSuggestion) {
            return null
        }

        return bestSuggestion.confidence >= getAiThreshold() ? bestSuggestion.category : null
    }
}

export default CategorySuggestionService
