import { TransactionMode, TransactionType } from '@prisma/client'
import { Router } from 'express'
import { requestJson } from './support/http-test-server'

const mockCreate = jest.fn()

jest.mock('../../src/services/transaction.service', () => {
    const MockTransactionService = jest.fn().mockImplementation(() => ({
        create: mockCreate,
    }))

    return {
        __esModule: true,
        TransactionService: MockTransactionService,
        default: MockTransactionService,
    }
})

describe('transactions routes', () => {
    let router: Router

    beforeAll(async () => {
        const { default: apiRouter } = await import('../../src/routes')
        router = apiRouter
    })

    beforeEach(() => {
        jest.clearAllMocks()
        mockCreate.mockReset()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('POST /transacoes returns 201 with the created transaction payload', async () => {
        mockCreate.mockResolvedValue({
            id: 'tx-1',
            name: 'Salario',
            amount: '5000.00',
            type: TransactionType.income,
            mode: TransactionMode.single,
            reference_date: new Date('2026-04-05T00:00:00.000Z'),
            transaction_date: null,
            card_id: null,
            category: 'Renda',
            note: 'Pagamento mensal',
            total_installments: null,
            created_at: new Date('2026-04-26T12:00:00.000Z'),
        })

        const response = await requestJson<{
            id: string
            name: string
            amount: string
            type: TransactionType
            mode: TransactionMode
            reference_date: string | null
            transaction_date: string | null
            card_id: string | null
            category: string | null
            note: string | null
            total_installments: number | null
            created_at: string
        }>(router, {
            method: 'POST',
            path: '/transacoes',
            body: {
                name: 'Salario',
                amount: 5000,
                type: 'income',
                mode: 'single',
                reference_date: '2026-04-05',
                category: 'Renda',
                note: 'Pagamento mensal',
            },
        })

        expect(response.status).toBe(201)
        expect(response.body).toEqual({
            id: 'tx-1',
            name: 'Salario',
            amount: '5000.00',
            type: 'income',
            mode: 'single',
            reference_date: '2026-04-05',
            transaction_date: null,
            card_id: null,
            category: 'Renda',
            note: 'Pagamento mensal',
            total_installments: null,
            created_at: '2026-04-26T12:00:00.000Z',
        })
        expect(mockCreate).toHaveBeenCalledWith({
            name: 'Salario',
            amount: '5000.00',
            type: 'income',
            mode: 'single',
            reference_date: new Date('2026-04-05T00:00:00.000Z'),
            transaction_date: null,
            card_id: null,
            category: 'Renda',
            note: 'Pagamento mensal',
            total_installments: null,
        })
    })

    it('POST /transacoes returns 400 for invalid input', async () => {
        const response = await requestJson<{
            code: string
            message: string
            details: Array<{ field: string, error: string }>
        }>(router, {
            method: 'POST',
            path: '/transacoes',
            body: {
                name: '',
                amount: 0,
                type: 'income',
                mode: 'single',
                reference_date: '2026-04-05',
            },
        })

        expect(response.status).toBe(400)
        expect(response.body).toMatchObject({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request input',
        })
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it.each([
        ['GET', '/transacoes'],
        ['PUT', '/transacoes'],
        ['PATCH', '/transacoes'],
        ['DELETE', '/transacoes'],
    ])('%s %s returns 404 for unsupported methods', async (method, path) => {
        const response = await requestJson(router, { method, path })

        expect([404, 405]).toContain(response.status)
    })
})
