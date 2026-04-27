import { CardService } from '../../src/services/card.service'
import { NotFoundError, RepositoryError } from '../../src/errors/app-error'
import { CardResponseDto, CreateCardBodyDto } from '../../src/dtos/card.dto'
import CardRepository from '../../src/repositories/card.repository'

describe('CardService', () => {
    const createInput: CreateCardBodyDto = {
        name: 'Visa Platinum',
        closing_day: 10,
        due_day: 20,
    }

    const cardResponse: CardResponseDto = {
        id: 'card-1',
        name: 'Visa Platinum',
        closing_day: 10,
        due_day: 20,
        created_at: new Date('2026-04-26T12:00:00.000Z'),
    }

    it('creates a card using the repository contract', async () => {
        const cardRepository = {
            create: jest.fn().mockResolvedValue(cardResponse),
        } as unknown as CardRepository

        const service = new CardService(cardRepository)

        await expect(service.create(createInput)).resolves.toEqual(cardResponse)
        expect((cardRepository.create as jest.Mock)).toHaveBeenCalledWith(createInput)
    })

    it('returns a card by id when the repository finds it', async () => {
        const cardRepository = {
            findById: jest.fn().mockResolvedValue(cardResponse),
        } as unknown as CardRepository

        const service = new CardService(cardRepository)

        await expect(service.getById('card-1')).resolves.toEqual(cardResponse)
        expect((cardRepository.findById as jest.Mock)).toHaveBeenCalledWith('card-1')
    })

    it('throws not found when the repository returns null', async () => {
        const cardRepository = {
            findById: jest.fn().mockResolvedValue(null),
        } as unknown as CardRepository

        const service = new CardService(cardRepository)

        await expect(service.getById('missing-card')).rejects.toMatchObject<Partial<NotFoundError>>({
            code: 'NOT_FOUND',
            message: 'Card not found',
            details: [{ field: 'id', error: 'not_found' }],
        })
    })

    it('propagates repository failures on create', async () => {
        const repositoryError = new RepositoryError('Failed to create card')
        const cardRepository = {
            create: jest.fn().mockRejectedValue(repositoryError),
        } as unknown as CardRepository

        const service = new CardService(cardRepository)

        await expect(service.create(createInput)).rejects.toBe(repositoryError)
    })
})
