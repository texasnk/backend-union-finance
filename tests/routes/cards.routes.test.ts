import { Router } from 'express'
import { NotFoundError } from '../../src/errors/app-error'
import { requestJson } from './support/http-test-server'

const mockCreate = jest.fn()
const mockGetById = jest.fn()

jest.mock('../../src/services/card.service', () => {
    const MockCardService = jest.fn().mockImplementation(() => ({
        create: mockCreate,
        getById: mockGetById,
    }))

    return {
        __esModule: true,
        CardService: MockCardService,
        default: MockCardService,
    }
})

describe('cards routes', () => {
    let router: Router

    beforeAll(async () => {
        const { default: apiRouter } = await import('../../src/routes')
        router = apiRouter
    })

    beforeEach(() => {
        jest.clearAllMocks()
        mockCreate.mockReset()
        mockGetById.mockReset()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('POST /cartoes returns 201 with the created id', async () => {
        mockCreate.mockResolvedValue({
            id: 'card-1',
            name: 'Visa Platinum',
            closing_day: 10,
            due_day: 20,
            created_at: new Date('2026-04-26T12:00:00.000Z'),
        })

        const response = await requestJson<{ id: string }>(router, {
            method: 'POST',
            path: '/cartoes',
            body: {
                name: 'Visa Platinum',
                closing_day: 10,
                due_day: 20,
            },
        })

        expect(response.status).toBe(201)
        expect(response.body).toEqual({ id: 'card-1' })
        expect(mockCreate).toHaveBeenCalledWith({
            name: 'Visa Platinum',
            closing_day: 10,
            due_day: 20,
        })
    })

    it('POST /cartoes returns 400 for invalid input', async () => {
        const response = await requestJson<{
            code: string
            message: string
            details: Array<{ field: string, error: string }>
        }>(router, {
            method: 'POST',
            path: '/cartoes',
            body: {
                name: '   ',
                closing_day: 0,
                due_day: 29,
            },
        })

        expect(response.status).toBe(400)
        expect(response.body).toMatchObject({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request input',
        })
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('GET /cartoes/:id returns 200 with the card payload', async () => {
        mockGetById.mockResolvedValue({
            id: 'card-1',
            name: 'Visa Platinum',
            closing_day: 10,
            due_day: 20,
            created_at: new Date('2026-04-26T12:00:00.000Z'),
        })

        const response = await requestJson<{
            id: string
            name: string
            closing_day: number
            due_day: number
        }>(router, {
            method: 'GET',
            path: '/cartoes/card-1',
        })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            id: 'card-1',
            name: 'Visa Platinum',
            closing_day: 10,
            due_day: 20,
        })
        expect(mockGetById).toHaveBeenCalledWith('card-1')
    })

    it('GET /cartoes/:id returns 404 when the card does not exist', async () => {
        mockGetById.mockRejectedValue(new NotFoundError('Card not found', {
            details: [{ field: 'id', error: 'not_found' }],
        }))

        const response = await requestJson<{
            code: string
            message: string
            details: Array<{ field: string, error: string }>
        }>(router, {
            method: 'GET',
            path: '/cartoes/missing-card',
        })

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            code: 'NOT_FOUND',
            message: 'Card not found',
            details: [{ field: 'id', error: 'not_found' }],
        })
    })

    it.each([
        ['PUT', '/cartoes'],
        ['PATCH', '/cartoes/card-1'],
        ['DELETE', '/cartoes/card-1'],
    ])('%s %s returns 404 for unsupported methods', async (method, path) => {
        const response = await requestJson(router, { method, path })

        expect([404, 405]).toContain(response.status)
    })
})
