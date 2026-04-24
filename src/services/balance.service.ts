import { MonthlyBalanceDto } from '../dtos/balance.dto'
import { AppError, InfrastructureError } from '../errors/app-error'
import OccurrenceRepository from '../repositories/occurrence.repository'
import { subtractMoney } from './helpers/money'
import { assertPeriod } from './helpers/date'

export class BalanceService {
    constructor(private readonly occurrenceRepository: OccurrenceRepository = new OccurrenceRepository()) { }

    /** Calculates monthly balance using only materialized occurrences for the target period. */
    async calculateMonthlyBalance(month: string): Promise<MonthlyBalanceDto> {
        try {
            const normalizedMonth = assertPeriod(month)
            const aggregate = await this.occurrenceRepository.getMonthlyBalance(normalizedMonth)

            return {
                month: normalizedMonth,
                incomes: Number(aggregate.incomes),
                expenses: Number(aggregate.expenses),
                balance: Number(subtractMoney(aggregate.incomes, aggregate.expenses)),
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error
            }

            throw new InfrastructureError('Failed to calculate monthly balance', {
                cause: error,
                details: { operation: 'balance.calculateMonthlyBalance', month },
            })
        }
    }
}

export default BalanceService
