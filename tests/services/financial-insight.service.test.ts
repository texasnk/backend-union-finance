import { FinancialInsightService } from '../../src/services/financial-insight.service'
import { ValidationError } from '../../src/errors/app-error'
import OccurrenceRepository from '../../src/repositories/occurrence.repository'
import { FinancialAIProvider } from '../../src/services/ai/ai-provider'

describe('FinancialInsightService', () => {
    it('builds the monthly insight from balance, highlights, alerts, and AI summary', async () => {
        const occurrenceRepository = {
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
        } as unknown as OccurrenceRepository

        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn(),
            generateMonthlySummary: jest.fn().mockResolvedValue('Resumo gerado'),
        }

        const service = new FinancialInsightService(occurrenceRepository, aiProvider)

        await expect(service.generateMonthlyInsight('2026-04')).resolves.toEqual({
            month: '2026-04',
            summary_text: 'Resumo gerado',
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
        expect(occurrenceRepository.getMonthlyBalance).toHaveBeenCalledWith('2026-04')
        expect(occurrenceRepository.getTopCategoryHighlights).toHaveBeenCalledWith('2026-04')
        expect(occurrenceRepository.countUncategorizedByMonth).toHaveBeenCalledWith('2026-04')
        expect(aiProvider.generateMonthlySummary).toHaveBeenCalledWith({
            month: '2026-04',
            incomes: '1000.00',
            expenses: '1300.00',
            balance: '-300.00',
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

    it('returns no alerts when the month is balanced and categorized', async () => {
        const occurrenceRepository = {
            getMonthlyBalance: jest.fn().mockResolvedValue({
                month: '2026-05',
                incomes: '2200.00',
                expenses: '1200.00',
            }),
            getTopCategoryHighlights: jest.fn().mockResolvedValue([
                { category: 'Salario', total: '2200.00' },
            ]),
            countUncategorizedByMonth: jest.fn().mockResolvedValue(0),
        } as unknown as OccurrenceRepository

        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn(),
            generateMonthlySummary: jest.fn().mockResolvedValue('Resumo sem alertas'),
        }

        const service = new FinancialInsightService(occurrenceRepository, aiProvider)

        await expect(service.generateMonthlyInsight('2026-05')).resolves.toEqual({
            month: '2026-05',
            summary_text: 'Resumo sem alertas',
            highlights: [{ category: 'Salario', total: '2200.00' }],
            alerts: [],
        })
    })

    it('rejects invalid month before calling dependencies', async () => {
        const occurrenceRepository = {
            getMonthlyBalance: jest.fn(),
            getTopCategoryHighlights: jest.fn(),
            countUncategorizedByMonth: jest.fn(),
        } as unknown as OccurrenceRepository

        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn(),
            generateMonthlySummary: jest.fn(),
        }

        const service = new FinancialInsightService(occurrenceRepository, aiProvider)

        await expect(service.generateMonthlyInsight('2026-5')).rejects.toMatchObject<Partial<ValidationError>>({
            code: 'VALIDATION_ERROR',
            message: 'Invalid period format. Expected YYYY-MM',
            details: [{ field: 'month', error: 'invalid_format' }],
        })
        expect(occurrenceRepository.getMonthlyBalance).not.toHaveBeenCalled()
        expect(aiProvider.generateMonthlySummary).not.toHaveBeenCalled()
    })

    it('propagates AI summary failures', async () => {
        const dependencyError = new Error('summary unavailable')
        const occurrenceRepository = {
            getMonthlyBalance: jest.fn().mockResolvedValue({
                month: '2026-06',
                incomes: '1000.00',
                expenses: '500.00',
            }),
            getTopCategoryHighlights: jest.fn().mockResolvedValue([]),
            countUncategorizedByMonth: jest.fn().mockResolvedValue(0),
        } as unknown as OccurrenceRepository

        const aiProvider: FinancialAIProvider = {
            suggestCategory: jest.fn(),
            generateMonthlySummary: jest.fn().mockRejectedValue(dependencyError),
        }

        const service = new FinancialInsightService(occurrenceRepository, aiProvider)

        await expect(service.generateMonthlyInsight('2026-06')).rejects.toBe(dependencyError)
    })
})
