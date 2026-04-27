import { CardResponseDto, CreateCardBodyDto } from '../dtos/card.dto'
import { NotFoundError } from '../errors/app-error'
import CardRepository from '../repositories/card.repository'

export class CardService {
    constructor(private readonly cardRepository: CardRepository = new CardRepository()) { }

    /** Creates a card using the repository contract already defined for the domain. */
    async create(input: CreateCardBodyDto): Promise<CardResponseDto> {
        return this.cardRepository.create(input)
    }

    /** Returns a card by id or raises a not-found error for HTTP translation. */
    async getById(id: string): Promise<CardResponseDto> {
        const card = await this.cardRepository.findById(id)

        if (!card) {
            throw new NotFoundError('Card not found', {
                details: [{ field: 'id', error: 'not_found' }],
            })
        }

        return card
    }
}

export default CardService
