import { Request, Response } from 'express'
import TransactionService from '../../services/transaction.service'
import { parseInput } from '../helpers/http'
import { PostTransactionsBodySchema, TransactionResponseSchema } from './schemas'

export class TransactionController {
    constructor(private readonly transactionService: TransactionService = new TransactionService()) { }

    /** Handles transaction creation and returns the persisted transaction payload. */
    async create(req: Request, res: Response): Promise<void> {
        const body = parseInput(PostTransactionsBodySchema, req.body)
        const transaction = await this.transactionService.create({
            name: body.name,
            amount: body.amount.toFixed(2),
            type: body.type,
            mode: body.mode,
            reference_date: 'reference_date' in body ? new Date(`${body.reference_date}T00:00:00.000Z`) : null,
            transaction_date: 'transaction_date' in body ? new Date(`${body.transaction_date}T00:00:00.000Z`) : null,
            card_id: 'card_id' in body ? body.card_id : null,
            category: body.category ?? null,
            note: body.note ?? null,
            total_installments: body.total_installments ?? null,
        })

        res.status(201).json(TransactionResponseSchema.parse({
            ...transaction,
            reference_date: transaction.reference_date ? transaction.reference_date.toISOString().slice(0, 10) : null,
            transaction_date: transaction.transaction_date ? transaction.transaction_date.toISOString().slice(0, 10) : null,
            created_at: transaction.created_at.toISOString(),
        }))
    }
}

export default TransactionController
