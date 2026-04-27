import { Prisma, PrismaClient, TransactionMode } from '@prisma/client'
import prisma from '../database/prisma'

import { PaginatedListDto, PaginationParamsDto } from '../dtos/pagination.dto'
import { BusinessRuleViolationError, NotFoundError, RepositoryError } from '../errors/app-error'
import {
    CreateTransactionBodyDto,
    TransactionResponseDto,
} from '../dtos/transaction.dto'
import CompetenceService from '../services/competence.service'
import { centsToMoney, moneyToCents } from '../services/helpers/money'

const mapTransaction = (transaction: {
    id: string
    name: string
    amount: Prisma.Decimal
    type: string
    mode: string
    reference_date: Date | null
    transaction_date: Date | null
    card_id: string | null
    category: string | null
    note: string | null
    total_installments: number | null
    created_at: Date
}): TransactionResponseDto => ({
    id: transaction.id,
    name: transaction.name,
    amount: transaction.amount.toFixed(2),
    type: transaction.type as TransactionResponseDto['type'],
    mode: transaction.mode as TransactionResponseDto['mode'],
    reference_date: transaction.reference_date,
    transaction_date: transaction.transaction_date,
    card_id: transaction.card_id,
    category: transaction.category,
    note: transaction.note,
    total_installments: transaction.total_installments,
    created_at: transaction.created_at,
})

interface MaterializedOccurrenceInput {
    type: CreateTransactionBodyDto['type']
    amount: Prisma.Decimal
    period: string
    installment_number?: number
    total_installments?: number
}

const competenceService = new CompetenceService()

const toIsoDateOnly = (value: Date): string => value.toISOString().slice(0, 10)

const buildInstallmentAmounts = (amount: string, totalInstallments: number): string[] => {
    const totalCents = moneyToCents(amount)
    const roundedInstallmentCents = Math.floor(totalCents / totalInstallments + 0.5)
    const amounts: string[] = []
    let allocatedCents = 0

    for (let installment = 1; installment <= totalInstallments; installment += 1) {
        const cents = installment === totalInstallments
            ? totalCents - allocatedCents
            : roundedInstallmentCents

        amounts.push(centsToMoney(cents))
        allocatedCents += cents
    }

    return amounts
}

const buildOccurrences = (
    input: CreateTransactionBodyDto,
    basePeriod: string,
): MaterializedOccurrenceInput[] => {
    const mode = input.mode ?? TransactionMode.single

    if (mode === TransactionMode.single) {
        return [{
            type: input.type,
            amount: new Prisma.Decimal(input.amount),
            period: basePeriod,
        }]
    }

    if (mode === TransactionMode.recurring_monthly) {
        return Array.from({ length: 12 }, (_, index) => ({
            type: input.type,
            amount: new Prisma.Decimal(input.amount),
            period: competenceService.addMonths(basePeriod, index),
        }))
    }

    const totalInstallments = input.total_installments

    if (!totalInstallments) {
        throw new BusinessRuleViolationError('total_installments is required for installment transactions', {
            details: [{ field: 'total_installments', error: 'required' }],
        })
    }

    const installmentAmounts = buildInstallmentAmounts(input.amount, totalInstallments)

    return installmentAmounts.map((amount, index) => ({
        type: input.type,
        amount: new Prisma.Decimal(amount),
        period: competenceService.addMonths(basePeriod, index),
        installment_number: index + 1,
        total_installments: totalInstallments,
    }))
}

export class TransactionRepository {
    constructor(private readonly client: PrismaClient = prisma) { }

    async create(input: CreateTransactionBodyDto): Promise<TransactionResponseDto> {
        try {
            const transaction = await this.client.$transaction(async (tx) => {
                let basePeriod: string

                if (input.card_id) {
                    const card = await tx.card.findUnique({
                        where: { id: input.card_id },
                        select: { closing_day: true },
                    })

                    if (!card) {
                        throw new NotFoundError('Card not found', {
                            details: [{ field: 'card_id', error: 'not_found' }],
                        })
                    }

                    if (!input.transaction_date) {
                        throw new BusinessRuleViolationError('transaction_date is required when card_id is present', {
                            details: [{ field: 'transaction_date', error: 'required' }],
                        })
                    }

                    basePeriod = competenceService.deriveFromCardTransactionDate(
                        toIsoDateOnly(input.transaction_date),
                        card.closing_day,
                    )
                } else {
                    if (!input.reference_date) {
                        throw new BusinessRuleViolationError('reference_date is required when card_id is absent', {
                            details: [{ field: 'reference_date', error: 'required' }],
                        })
                    }

                    basePeriod = competenceService.deriveFromReferenceDate(toIsoDateOnly(input.reference_date))
                }

                const transactionRecord = await tx.transaction.create({
                    data: {
                        name: input.name,
                        amount: new Prisma.Decimal(input.amount),
                        type: input.type,
                        mode: input.mode,
                        reference_date: input.reference_date ?? null,
                        transaction_date: input.transaction_date ?? null,
                        card_id: input.card_id ?? null,
                        category: input.category ?? null,
                        note: input.note ?? null,
                        total_installments: input.total_installments ?? null,
                    },
                })

                const occurrences = buildOccurrences(input, basePeriod)

                await tx.occurrence.createMany({
                    data: occurrences.map((occurrence) => ({
                        transaction_id: transactionRecord.id,
                        type: occurrence.type,
                        amount: occurrence.amount,
                        period: occurrence.period,
                        installment_number: occurrence.installment_number ?? null,
                        total_installments: occurrence.total_installments ?? null,
                    })),
                })

                return transactionRecord
            })

            return mapTransaction(transaction)
        } catch (error) {
            if (
                error instanceof NotFoundError ||
                error instanceof BusinessRuleViolationError
            ) {
                throw error
            }

            throw new RepositoryError('Failed to create transaction', {
                cause: error,
                details: { operation: 'transaction.create' },
            })
        }
    }

    async findById(id: string): Promise<TransactionResponseDto | null> {
        try {
            const transaction = await this.client.transaction.findUnique({
                where: { id },
            })

            return transaction ? mapTransaction(transaction) : null
        } catch (error) {
            throw new RepositoryError('Failed to fetch transaction by id', {
                cause: error,
                details: { operation: 'transaction.findById', id },
            })
        }
    }

    async list(
        input: PaginationParamsDto = {},
    ): Promise<PaginatedListDto<PaginationParamsDto, TransactionResponseDto>> {
        try {
            const skip = input.skip ?? 0
            const limit = input.take ?? 50

            const [transactions, total] = await Promise.all([
                this.client.transaction.findMany({
                    skip,
                    take: limit,
                    orderBy: {
                        created_at: 'asc',
                    },
                }),
                this.client.transaction.count(),
            ])

            return {
                data: transactions.map(mapTransaction),
                limit,
                skip,
                total,
                filter: {
                    skip,
                    take: limit,
                },
            }
        } catch (error) {
            throw new RepositoryError('Failed to list transactions', {
                cause: error,
                details: { operation: 'transaction.list' },
            })
        }
    }
}

export default TransactionRepository
