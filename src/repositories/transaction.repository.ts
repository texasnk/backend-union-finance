import { Prisma, PrismaClient } from '@prisma/client'
import prisma from '../database/prisma'

import { PaginatedListDto, PaginationParamsDto } from '../dtos/pagination.dto'
import { RepositoryError } from '../errors/app-error'
import {
    CreateTransactionBodyDto,
    TransactionResponseDto,
} from '../dtos/transaction.dto'

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

export class TransactionRepository {
    constructor(private readonly client: PrismaClient = prisma) { }

    async create(input: CreateTransactionBodyDto): Promise<TransactionResponseDto> {
        try {
            const transaction = await this.client.transaction.create({
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

            return mapTransaction(transaction)
        } catch (error) {
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
