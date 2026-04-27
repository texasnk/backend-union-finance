import { TransactionType } from '@prisma/client'
import { CategorySuggestionService } from '../../src/services/category-suggestion.service'
import OpenAIFinancialAIProvider from '../../src/services/ai/openai-financial-ai.provider'

describe('CategorySuggestionService', () => {
    const originalEnv = {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_MODEL: process.env.OPENAI_MODEL,
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
        OPENAI_TIMEOUT_MS: process.env.OPENAI_TIMEOUT_MS,
        AI_THRESHOLD: process.env.AI_THRESHOLD,
        AI_CACHE_TTL_MINUTES: process.env.AI_CACHE_TTL_MINUTES,
    }

    afterEach(() => {
        jest.restoreAllMocks()

        for (const [key, value] of Object.entries(originalEnv)) {
            if (value === undefined) {
                delete process.env[key]
                continue
            }

            process.env[key] = value
        }
    })

    it('returns high, medium, and low confidence category suggestions in descending order', async () => {
        delete process.env.OPENAI_API_KEY

        const service = new CategorySuggestionService()

        await expect(
            service.suggest({
                name: 'Salario transferencia',
                amount: '5000.00',
                type: TransactionType.income,
            }),
        ).resolves.toEqual([
            { category: 'Salario', confidence: 0.98 },
            { category: 'Transferencia', confidence: 0.82 },
            { category: 'Receita', confidence: 0.6 },
        ])
    })

    it('uses the local heuristic when OPENAI_API_KEY is missing', async () => {
        delete process.env.OPENAI_API_KEY
        process.env.AI_THRESHOLD = '0.80'

        const service = new CategorySuggestionService()

        await expect(
            service.suggestAutofillCategory({
                name: 'Uber viagem trabalho',
                amount: '38.90',
                type: TransactionType.expense,
            }),
        ).resolves.toBe('Transporte')
    })

    it('falls back to the local heuristic when the OpenAI provider returns an error', async () => {
        process.env.OPENAI_API_KEY = 'test-key'
        jest.spyOn(OpenAIFinancialAIProvider.prototype, 'suggestCategory').mockRejectedValue(
            new Error('provider unavailable'),
        )

        const service = new CategorySuggestionService()

        await expect(
            service.suggest({
                name: 'Mercado Central',
                amount: '150.00',
                type: TransactionType.expense,
            }),
        ).resolves.toEqual([
            { category: 'Alimentacao', confidence: 0.93 },
            { category: 'Despesas gerais', confidence: 0.55 },
            { category: 'Transporte', confidence: 0.4 },
        ])
    })

    it('falls back to the local heuristic when the OpenAI provider times out', async () => {
        process.env.OPENAI_API_KEY = 'test-key'
        jest.spyOn(OpenAIFinancialAIProvider.prototype, 'suggestCategory').mockRejectedValue(
            Object.assign(new Error('request timed out'), { name: 'AbortError' }),
        )

        const service = new CategorySuggestionService()

        await expect(
            service.suggest({
                name: 'Spotify premium',
                amount: '21.90',
                type: TransactionType.expense,
            }),
        ).resolves.toEqual([
            { category: 'Lazer', confidence: 0.88 },
            { category: 'Despesas gerais', confidence: 0.55 },
            { category: 'Transporte', confidence: 0.4 },
        ])
    })

    it('falls back to the local heuristic when the OpenAI provider returns an invalid response', async () => {
        process.env.OPENAI_API_KEY = 'test-key'
        jest.spyOn(OpenAIFinancialAIProvider.prototype, 'suggestCategory').mockResolvedValue([])

        const service = new CategorySuggestionService()

        await expect(
            service.suggest({
                name: 'Farmacia do bairro',
                amount: '67.40',
                type: TransactionType.expense,
            }),
        ).resolves.toEqual([
            { category: 'Saude', confidence: 0.9 },
            { category: 'Despesas gerais', confidence: 0.55 },
            { category: 'Transporte', confidence: 0.4 },
        ])
    })
})
