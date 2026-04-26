import { BalanceService } from '../../src/services/balance.service'
import { InfrastructureError, ValidationError } from '../../src/errors/app-error'
import OccurrenceRepository from '../../src/repositories/occurrence.repository'


describe('BalanceService', () => {
    it('calculates monthly balance from repository aggregates', async () => {
        const occurrenceRepository = {
            getMonthlyBalance: jest.fn().mockResolvedValue({
                month: '2026-04',
                incomes: '1500.55',
                expenses: '499.45',
            }),
        } as unknown as OccurrenceRepository

        const service = new BalanceService(occurrenceRepository)

        await expect(service.calculateMonthlyBalance('2026-04')).resolves.toEqual({
            month: '2026-04',
            incomes: 1500.55,
            expenses: 499.45,
            balance: 1001.1,
        })
        expect((occurrenceRepository.getMonthlyBalance as jest.Mock)).toHaveBeenCalledWith('2026-04')
    })

    it('rejects invalid month format before calling the repository', async () => {
        const occurrenceRepository = {
            getMonthlyBalance: jest.fn(),
        } as unknown as OccurrenceRepository

        const service = new BalanceService(occurrenceRepository)

        await expect(service.calculateMonthlyBalance('2026-4')).rejects.toMatchObject<Partial<ValidationError>>({
            code: 'VALIDATION_ERROR',
            message: 'Invalid period format. Expected YYYY-MM',
            details: [{ field: 'month', error: 'invalid_format' }],
        })
        expect((occurrenceRepository.getMonthlyBalance as jest.Mock)).not.toHaveBeenCalled()
    })

    it('wraps unexpected dependency failures as infrastructure errors', async () => {
        const dependencyError = new Error('database offline')
        const occurrenceRepository = {
            getMonthlyBalance: jest.fn().mockRejectedValue(dependencyError),
        } as unknown as OccurrenceRepository

        const service = new BalanceService(occurrenceRepository)

        await expect(service.calculateMonthlyBalance('2026-04')).rejects.toMatchObject<Partial<InfrastructureError>>({
            code: 'INTERNAL_ERROR',
            message: 'Failed to calculate monthly balance',
            cause: dependencyError,
            details: { operation: 'balance.calculateMonthlyBalance', month: '2026-04' },
        })
    })
})
