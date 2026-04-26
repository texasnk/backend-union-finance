import { TransactionType } from '@prisma/client'
import { CategorySuggestionService } from '../../src/services/category-suggestion.service'
import { BusinessRuleViolationError } from '../../src/errors/app-error'
import { FinancialAIProvider } from '../../src/services/ai/ai-provider'

describe('CategorySuggestionService', () => {
    const originalThreshold = process.env.AI_THRESHOLD

    afterEach(() => {
        if (originalThreshold === undefined) {
            delete process.env.AI_THRESHOLD
            return
        }

        process.env.AI_THRESHOLD = originalThreshold
    })

    it('returns suggestions ordered by descending confidence', async () => {
        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn().mockResolvedValue([
                { category: 'Lazer', confidence: 0.43 },
                { category: 'Mercado', confidence: 0.91 },
                { category: 'Transporte', confidence: 0.65 },
            ]),
            generateMonthlySummary: jest.fn(),
        }

        const service = new CategorySuggestionService(aiProvider)

        await expect(
            service.suggest({
                name: 'Compra mercado',
                amount: '150.00',
                type: TransactionType.expense,
            }),
        ).resolves.toEqual([
            { category: 'Mercado', confidence: 0.91 },
            { category: 'Transporte', confidence: 0.65 },
            { category: 'Lazer', confidence: 0.43 },
        ])
    })

    it('rejects empty names before calling the AI provider', async () => {
        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn(),
            generateMonthlySummary: jest.fn(),
        }

        const service = new CategorySuggestionService(aiProvider)

        await expect(
            service.suggest({
                name: '   ',
                amount: '80.00',
                type: TransactionType.expense,
            }),
        ).rejects.toMatchObject<Partial<BusinessRuleViolationError>>({
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'name must not be empty',
            details: [{ field: 'name', error: 'required' }],
        })
        expect(aiProvider.suggestCategory).not.toHaveBeenCalled()
    })

    it('returns the best category when confidence is above the threshold', async () => {
        process.env.AI_THRESHOLD = '0.75'

        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn().mockResolvedValue([
                { category: 'Mercado', confidence: 0.76 },
                { category: 'Lazer', confidence: 0.55 },
            ]),
            generateMonthlySummary: jest.fn(),
        }

        const service = new CategorySuggestionService(aiProvider)

        await expect(
            service.suggestAutofillCategory({
                name: 'Mercado Central',
                amount: '200.00',
                type: TransactionType.expense,
            }),
        ).resolves.toBe('Mercado')
    })

    it('returns null when there are no suggestions above the threshold', async () => {
        process.env.AI_THRESHOLD = '0.80'

        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn().mockResolvedValue([
                { category: 'Transporte', confidence: 0.79 },
            ]),
            generateMonthlySummary: jest.fn(),
        }

        const service = new CategorySuggestionService(aiProvider)

        await expect(
            service.suggestAutofillCategory({
                name: 'Uber',
                amount: '40.00',
                type: TransactionType.expense,
            }),
        ).resolves.toBeNull()
    })

    it('propagates provider failures', async () => {
        const dependencyError = new Error('provider unavailable')
        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn().mockRejectedValue(dependencyError),
            generateMonthlySummary: jest.fn(),
        }

        const service = new CategorySuggestionService(aiProvider)

        await expect(
            service.suggest({
                name: 'Padaria',
                amount: '25.00',
                type: TransactionType.expense,
            }),
        ).rejects.toBe(dependencyError)
    })
})
