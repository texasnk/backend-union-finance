import {
    CategorySuggestionDto,
    MonthlyFinancialSummaryInputDto,
    SuggestCategoryInputDto,
} from '../../dtos/ai.dto'
import { FinancialAIProvider } from './ai-provider'

export class ResilientFinancialAIProvider implements FinancialAIProvider {
    constructor(
        private readonly fallback: FinancialAIProvider,
        private readonly primary?: FinancialAIProvider,
    ) { }

    /** Uses the primary provider when available and falls back locally on failure or invalid output. */
    async suggestCategory(input: SuggestCategoryInputDto): Promise<CategorySuggestionDto[]> {
        if (!this.primary) {
            return this.fallback.suggestCategory(input)
        }

        try {
            const suggestions = await this.primary.suggestCategory(input)

            if (Array.isArray(suggestions) && suggestions.length > 0) {
                return suggestions
            }
        } catch {
            // Fallback is mandatory for non-critical AI flows.
        }

        return this.fallback.suggestCategory(input)
    }

    /** Uses the primary provider when available and falls back locally on failure or invalid output. */
    async generateMonthlySummary(input: MonthlyFinancialSummaryInputDto): Promise<string> {
        if (!this.primary) {
            return this.fallback.generateMonthlySummary(input)
        }

        try {
            const summary = await this.primary.generateMonthlySummary(input)

            if (summary.trim()) {
                return summary
            }
        } catch {
            // Fallback is mandatory for non-critical AI flows.
        }

        return this.fallback.generateMonthlySummary(input)
    }
}

export default ResilientFinancialAIProvider
