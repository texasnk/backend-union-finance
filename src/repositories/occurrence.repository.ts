import { Prisma, PrismaClient, TransactionType } from '@prisma/client'
import prisma from '../database/prisma'
import { RepositoryError } from '../errors/app-error'

export interface MonthlyBalanceAggregate {
    month: string
    incomes: string
    expenses: string
}

export interface MonthlyCategoryHighlightRecord {
    category: string
    total: string
}

export class OccurrenceRepository {
    constructor(private readonly client: PrismaClient = prisma) { }

    /** Aggregates monthly occurrence totals grouped by transaction type. */
    async getMonthlyBalance(month: string): Promise<MonthlyBalanceAggregate> {
        try {
            const grouped = await this.client.occurrence.groupBy({
                by: ['type'],
                where: { period: month },
                _sum: { amount: true },
            })

            const income = grouped.find((item) => item.type === TransactionType.income)?._sum.amount
            const expense = grouped.find((item) => item.type === TransactionType.expense)?._sum.amount

            return {
                month,
                incomes: income ? income.toFixed(2) : '0.00',
                expenses: expense ? expense.toFixed(2) : '0.00',
            }
        } catch (error) {
            throw new RepositoryError('Failed to aggregate monthly balance', {
                cause: error,
                details: { operation: 'occurrence.getMonthlyBalance', month },
            })
        }
    }

    /** Returns the top categories by summed occurrence amount for a month. */
    async getTopCategoryHighlights(month: string, limit = 3): Promise<MonthlyCategoryHighlightRecord[]> {
        try {
            const rows = await this.client.$queryRaw<Array<{ category: string; total: Prisma.Decimal }>>(Prisma.sql`
                SELECT
                    t.category AS category,
                    SUM(o.amount) AS total
                FROM "Occurrence" o
                INNER JOIN "Transaction" t ON t.id = o.transaction_id
                WHERE o.period = ${month}
                  AND t.category IS NOT NULL
                  AND LENGTH(TRIM(t.category)) > 0
                GROUP BY t.category
                ORDER BY SUM(o.amount) DESC, t.category ASC
                LIMIT ${limit}
            `)

            return rows.map((row) => ({
                category: row.category,
                total: row.total.toFixed(2),
            }))
        } catch (error) {
            throw new RepositoryError('Failed to aggregate category highlights', {
                cause: error,
                details: { operation: 'occurrence.getTopCategoryHighlights', month, limit },
            })
        }
    }

    /** Counts materialized occurrences whose parent transaction has no category. */
    async countUncategorizedByMonth(month: string): Promise<number> {
        try {
            const rows = await this.client.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
                SELECT COUNT(*)::bigint AS total
                FROM "Occurrence" o
                INNER JOIN "Transaction" t ON t.id = o.transaction_id
                WHERE o.period = ${month}
                  AND (t.category IS NULL OR LENGTH(TRIM(t.category)) = 0)
            `)

            const total = rows[0]?.total ?? 0
            return typeof total === 'bigint' ? Number(total) : total
        } catch (error) {
            throw new RepositoryError('Failed to count uncategorized occurrences', {
                cause: error,
                details: { operation: 'occurrence.countUncategorizedByMonth', month },
            })
        }
    }
}

export default OccurrenceRepository
