import {
    CategorySuggestionDto,
    MonthlyFinancialSummaryInputDto,
    SuggestCategoryInputDto,
} from '../../dtos/ai.dto'

export interface FinancialAIProvider {
    suggestCategory(input: SuggestCategoryInputDto): Promise<CategorySuggestionDto[]>
    generateMonthlySummary(input: MonthlyFinancialSummaryInputDto): Promise<string>
}
