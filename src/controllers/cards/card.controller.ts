import { Request, Response } from 'express'
import CardService from '../../services/card.service'
import { parseInput } from '../helpers/http'
import { CardParamsSchema, CardResponseSchema, PostCardsBodySchema } from './schemas'

export class CardController {
    constructor(private readonly cardService: CardService = new CardService()) { }

    /** Handles card creation and returns the created identifier. */
    async create(req: Request, res: Response): Promise<void> {
        const body = parseInput(PostCardsBodySchema, req.body)
        const card = await this.cardService.create(body)

        res.status(201).json({ id: card.id })
    }

    /** Returns a card by identifier and translates absence into 404. */
    async getById(req: Request, res: Response): Promise<void> {
        const params = parseInput(CardParamsSchema, req.params)
        const card = await this.cardService.getById(params.id)

        res.status(200).json(CardResponseSchema.parse({
            id: card.id,
            name: card.name,
            closing_day: card.closing_day,
            due_day: card.due_day,
        }))
    }
}

export default CardController
