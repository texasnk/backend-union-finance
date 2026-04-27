import { Router } from 'express'
import { requestJson } from './support/http-test-server'

const mockCalculateMonthlyBalance = jest.fn()
const mockGenerateMonthlyInsight = jest.fn()

jest.mock('../../src/services/balance.service', () => {
    const MockBalanceService = jest.fn().mockImplementation(() => ({
        calculateMonthlyBalance: mockCalculateMonthlyBalance,
    }))

    return {
        __esModule: true,
        BalanceService: MockBalanceService,
        default: MockBalanceService,
    }
})

jest.mock('../../src/services/financial-insight.service', () => {
    const MockFinancialInsightService = jest.fn().mockImplementation(() => ({
        generateMonthlyInsight: mockGenerateMonthlyInsight,
    }))

    return {
        __esModule: true,
        FinancialInsightService: MockFinancialInsightService,
        default: MockFinancialInsightService,
    }
})

describe('balances routes', () => {
    let router: Router

    beforeAll(async () => {
        const { default: apiRouter } = await import('../../src/routes')
        router = apiRouter
    })

    beforeEach(() => {
        jest.clearAllMocks()
        mockCalculateMonthlyBalance.mockReset()
        mockGenerateMonthlyInsight.mockReset()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('GET /saldos returns 200 with the monthly balance', async () => {
        mockCalculateMonthlyBalance.mockResolvedValue({
            month: '2026-04',
            incomes: 5000,
            expenses: 1234.56,
            balance: 3765.44,
        })

        const response = await requestJson<{
            month: string
            incomes: number
            expenses: number
            balance: number
        }>(router, {
            method: 'GET',
            path: '/saldos?month=2026-04',
        })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            month: '2026-04',
            incomes: 5000,
            expenses: 1234.56,
            balance: 3765.44,
        })
        expect(mockCalculateMonthlyBalance).toHaveBeenCalledWith('2026-04')
    })

    it('GET /saldos returns 400 for invalid month input', async () => {
        const response = await requestJson<{
            code: string
            message: string
            details: Array<{ field: string, error: string }>
        }>(router, {
            method: 'GET',
            path: '/saldos?month=2026-4',
        })

        expect(response.status).toBe(400)
        expect(response.body).toMatchObject({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request input',
        })
        expect(mockCalculateMonthlyBalance).not.toHaveBeenCalled()
    })

    it.each([
        ['POST', '/saldos?month=2026-04'],
        ['PUT', '/saldos?month=2026-04'],
        ['PATCH', '/saldos?month=2026-04'],
        ['DELETE', '/saldos?month=2026-04'],
    ])('%s %s returns 404 for unsupported methods', async (method, path) => {
        const response = await requestJson(router, { method, path })

        expect([404, 405]).toContain(response.status)
    })
})
