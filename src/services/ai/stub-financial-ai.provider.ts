import {
    CategorySuggestionDto,
    MonthlyFinancialSummaryInputDto,
    SuggestCategoryInputDto,
} from '../../dtos/ai.dto'
import { FinancialAIProvider } from './ai-provider'
import { MemoryCache } from './memory-cache'

const DEFAULT_CATEGORY_SUGGESTIONS: Record<'income' | 'expense', CategorySuggestionDto[]> = {
    income: [
        { category: 'Receita', confidence: 0.6 },
        { category: 'Transferencia', confidence: 0.45 },
        { category: 'Outros', confidence: 0.3 },
    ],
    expense: [
        { category: 'Despesas gerais', confidence: 0.55 },
        { category: 'Transporte', confidence: 0.4 },
        { category: 'Outros', confidence: 0.3 },
    ],
}

const CATEGORY_RULES: Array<{ match: RegExp; suggestion: CategorySuggestionDto }> = [
    { match: /salario|salary|folha|pagamento/i, suggestion: { category: 'Salario', confidence: 0.98 } },
    { match: /mercado|supermercado|padaria|ifood|restaurante|lanchonete/i, suggestion: { category: 'Alimentacao', confidence: 0.93 } },
    { match: /uber|99|taxi|combustivel|posto|estacionamento/i, suggestion: { category: 'Transporte', confidence: 0.91 } },
    { match: /aluguel|condominio|energia|agua|internet|telefone/i, suggestion: { category: 'Moradia', confidence: 0.9 } },
    { match: /farmacia|medic|hospital|consulta/i, suggestion: { category: 'Saude', confidence: 0.9 } },
    { match: /netflix|spotify|cinema|show|lazer/i, suggestion: { category: 'Lazer', confidence: 0.88 } },
    { match: /pix|ted|transferencia/i, suggestion: { category: 'Transferencia', confidence: 0.82 } },
]

export class LocalHeuristicFinancialAIProvider implements FinancialAIProvider {
    constructor(
        private readonly suggestionsCache: MemoryCache<CategorySuggestionDto[]>,
        private readonly summaryCache: MemoryCache<string>,
    ) { }

    /** Produces deterministic category suggestions with in-memory caching. */
    async suggestCategory(input: SuggestCategoryInputDto): Promise<CategorySuggestionDto[]> {
        const cacheKey = JSON.stringify(input)
        const cached = this.suggestionsCache.get(cacheKey)

        if (cached) {
            return cached
        }

        const normalizedName = input.name.trim()
        const matches = CATEGORY_RULES
            .filter((rule) => rule.match.test(normalizedName))
            .map((rule) => rule.suggestion)

        const defaults = DEFAULT_CATEGORY_SUGGESTIONS[input.type]
        const suggestions = [...matches, ...defaults]
            .filter((item, index, collection) => collection.findIndex((candidate) => candidate.category === item.category) === index)
            .slice(0, 3)

        this.suggestionsCache.set(cacheKey, suggestions)

        return suggestions
    }

    /** Generates a deterministic monthly summary aligned with local aggregates. */
    async generateMonthlySummary(input: MonthlyFinancialSummaryInputDto): Promise<string> {
        const cacheKey = JSON.stringify(input)
        const cached = this.summaryCache.get(cacheKey)

        if (cached) {
            return cached
        }

        const leadHighlight = input.highlights[0]
        const highlightText = leadHighlight
            ? ` A categoria com maior volume foi ${leadHighlight.category} (${leadHighlight.total}).`
            : ''

        const summary =
            `Em ${input.month}, as entradas somaram ${input.incomes}, as saídas somaram ${input.expenses} e o saldo fechou em ${input.balance}.` +
            highlightText

        this.summaryCache.set(cacheKey, summary)

        return summary
    }
}

export const StubFinancialAIProvider = LocalHeuristicFinancialAIProvider
