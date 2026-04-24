import { TransactionMode, TransactionType } from '@prisma/client'
import { PaginationParamsDto } from './pagination.dto'

export interface CreateTransactionBodyDto {
    name: string
    amount: string
    type: TransactionType
    mode?: TransactionMode
    reference_date?: Date | null
    transaction_date?: Date | null
    card_id?: string | null
    category?: string | null
    note?: string | null
    total_installments?: number | null
}

export interface TransactionResponseDto {
    id: string
    name: string
    amount: string
    type: TransactionType
    mode: TransactionMode
    reference_date: Date | null
    transaction_date: Date | null
    card_id: string | null
    category: string | null
    note: string | null
    total_installments: number | null
    created_at: Date
}

export interface ListTransactionsParamsDto extends PaginationParamsDto { }
