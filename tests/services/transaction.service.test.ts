import { TransactionMode, TransactionType } from '@prisma/client'
import { TransactionService } from '../../src/services/transaction.service'
import { RepositoryError } from '../../src/errors/app-error'
import {
    CreateTransactionBodyDto,
    TransactionResponseDto,
} from '../../src/dtos/transaction.dto'
import TransactionRepository from '../../src/repositories/transaction.repository'

describe('TransactionService', () => {
    const createInput: CreateTransactionBodyDto = {
        name: 'Supermercado',
        amount: '100.00',
        type: TransactionType.expense,
        mode: TransactionMode.single,
        reference_date: new Date('2026-04-05T00:00:00.000Z'),
        category: 'Mercado',
        note: 'Compra do mês',
    }

    const createdTransaction: TransactionResponseDto = {
        id: 'tx-1',
        name: 'Supermercado',
        amount: '100.00',
        type: TransactionType.expense,
        mode: TransactionMode.single,
        reference_date: new Date('2026-04-05T00:00:00.000Z'),
        transaction_date: null,
        card_id: null,
        category: 'Mercado',
        note: 'Compra do mês',
        total_installments: null,
        created_at: new Date('2026-04-26T12:00:00.000Z'),
    }

    it('creates a transaction through the repository', async () => {
        const transactionRepository = {
            create: jest.fn().mockResolvedValue(createdTransaction),
        } as unknown as TransactionRepository

        const service = new TransactionService(transactionRepository)

        await expect(service.create(createInput)).resolves.toEqual(createdTransaction)
        expect((transactionRepository.create as jest.Mock)).toHaveBeenCalledWith(createInput)
    })

    it('propagates repository failures', async () => {
        const repositoryError = new RepositoryError('Failed to create transaction')
        const transactionRepository = {
            create: jest.fn().mockRejectedValue(repositoryError),
        } as unknown as TransactionRepository

        const service = new TransactionService(transactionRepository)

        await expect(service.create(createInput)).rejects.toBe(repositoryError)
    })
})
