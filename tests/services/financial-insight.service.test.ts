import { FinancialInsightService } from '../../src/services/financial-insight.service'
import { ValidationError } from '../../src/errors/app-error'
import OccurrenceRepository from '../../src/repositories/occurrence.repository'
import OpenAIFinancialAIProvider from '../../src/services/ai/openai-financial-ai.provider'

describe('FinancialInsightService', () => {
    const originalEnv = {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_MODEL: process.env.OPENAI_MODEL,
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
        OPENAI_TIMEOUT_MS: process.env.OPENAI_TIMEOUT_MS,
        AI_CACHE_TTL_MINUTES: process.env.AI_CACHE_TTL_MINUTES,
    }

    const createOccurrenceRepository = () => ({
        getMonthlyBalance: jest.fn().mockResolvedValue({
            month: '2026-04',
            incomes: '1000.00',
            expenses: '1300.00',
        }),
        getTopCategoryHighlights: jest.fn().mockResolvedValue([
            { category: 'Moradia', total: '800.00' },
            { category: 'Mercado', total: '300.00' },
        ]),
        countUncategorizedByMonth: jest.fn().mockResolvedValue(2),
    }) as unknown as OccurrenceRepository

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

    it('uses the local summary fallback when OPENAI_API_KEY is missing', async () => {
        delete process.env.OPENAI_API_KEY
        const occurrenceRepository = createOccurrenceRepository()
        const service = new FinancialInsightService(occurrenceRepository)

        await expect(service.generateMonthlyInsight('2026-04')).resolves.toEqual({
            month: '2026-04',
            summary_text:
                'Em 2026-04, as entradas somaram 1000.00, as saídas somaram 1300.00 e o saldo fechou em -300.00. A categoria com maior volume foi Moradia (800.00).',
            highlights: [
                { category: 'Moradia', total: '800.00' },
                { category: 'Mercado', total: '300.00' },
            ],
            alerts: [
                {
                    type: 'negative_balance',
                    description: 'As saídas superaram as entradas em 300.00 no mês 2026-04.',
                },
                {
                    type: 'uncategorized_occurrences',
                    description: '2 ocorrências de 2026-04 estão sem categoria.',
                },
            ],
        })
    })

    it('falls back to the local summary when the OpenAI provider returns an error', async () => {
        process.env.OPENAI_API_KEY = 'test-key'
        jest.spyOn(OpenAIFinancialAIProvider.prototype, 'generateMonthlySummary').mockRejectedValue(
            new Error('provider unavailable'),
        )

        const occurrenceRepository = createOccurrenceRepository()
        const service = new FinancialInsightService(occurrenceRepository)

        await expect(service.generateMonthlyInsight('2026-04')).resolves.toMatchObject({
            month: '2026-04',
            summary_text:
                'Em 2026-04, as entradas somaram 1000.00, as saídas somaram 1300.00 e o saldo fechou em -300.00. A categoria com maior volume foi Moradia (800.00).',
        })
    })

    it('falls back to the local summary when the OpenAI provider times out', async () => {
        process.env.OPENAI_API_KEY = 'test-key'
        jest.spyOn(OpenAIFinancialAIProvider.prototype, 'generateMonthlySummary').mockRejectedValue(
            Object.assign(new Error('request timed out'), { name: 'AbortError' }),
        )

        const occurrenceRepository = createOccurrenceRepository()
        const service = new FinancialInsightService(occurrenceRepository)

        await expect(service.generateMonthlyInsight('2026-04')).resolves.toMatchObject({
            month: '2026-04',
            summary_text:
                'Em 2026-04, as entradas somaram 1000.00, as saídas somaram 1300.00 e o saldo fechou em -300.00. A categoria com maior volume foi Moradia (800.00).',
        })
    })

    it('falls back to the local summary when the OpenAI provider returns an invalid response', async () => {
        process.env.OPENAI_API_KEY = 'test-key'
        jest.spyOn(OpenAIFinancialAIProvider.prototype, 'generateMonthlySummary').mockResolvedValue('   ')

        const occurrenceRepository = createOccurrenceRepository()
        const service = new FinancialInsightService(occurrenceRepository)

        await expect(service.generateMonthlyInsight('2026-04')).resolves.toMatchObject({
            month: '2026-04',
            summary_text:
                'Em 2026-04, as entradas somaram 1000.00, as saídas somaram 1300.00 e o saldo fechou em -300.00. A categoria com maior volume foi Moradia (800.00).',
        })
    })

    it('rejects invalid month before calling dependencies', async () => {
        const occurrenceRepository = {
            getMonthlyBalance: jest.fn(),
            getTopCategoryHighlights: jest.fn(),
            countUncategorizedByMonth: jest.fn(),
        } as unknown as OccurrenceRepository

        const service = new FinancialInsightService(occurrenceRepository)

        await expect(service.generateMonthlyInsight('2026-4')).rejects.toMatchObject<Partial<ValidationError>>({
            code: 'VALIDATION_ERROR',
            message: 'Invalid period format. Expected YYYY-MM',
            details: [{ field: 'month', error: 'invalid_format' }],
        })
        expect(occurrenceRepository.getMonthlyBalance).not.toHaveBeenCalled()
    })
})
