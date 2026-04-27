import { PrismaClient } from '@prisma/client'
import prisma from '../database/prisma'
import { PaginatedListDto, PaginationParamsDto } from '../dtos/pagination.dto'
import { CardResponseDto, CreateCardBodyDto } from '../dtos/card.dto'
import { RepositoryError } from '../errors/app-error'

const mapCard = (card: {
    id: string
    name: string
    closing_day: number
    due_day: number
    created_at: Date
}): CardResponseDto => ({
    id: card.id,
    name: card.name,
    closing_day: card.closing_day,
    due_day: card.due_day,
    created_at: card.created_at,
})

export class CardRepository {
    constructor(private readonly client: PrismaClient = prisma) { }

    async create(input: CreateCardBodyDto): Promise<CardResponseDto> {
        try {
            const card = await this.client.card.create({
                data: {
                    name: input.name,
                    closing_day: input.closing_day,
                    due_day: input.due_day,
                },
            })

            return mapCard(card)
        } catch (error) {
            throw new RepositoryError('Failed to create card', {
                cause: error,
                details: { operation: 'card.create' },
            })
        }
    }

    async findById(id: string): Promise<CardResponseDto | null> {
        try {
            const card = await this.client.card.findUnique({
                where: { id },
            })

            return card ? mapCard(card) : null
        } catch (error) {
            throw new RepositoryError('Failed to fetch card by id', {
                cause: error,
                details: { operation: 'card.findById', id },
            })
        }
    }

    async list(input: PaginationParamsDto = {}): Promise<PaginatedListDto<PaginationParamsDto, CardResponseDto>> {
        try {
            const skip = input.skip ?? 0
            const limit = input.take ?? 50

            const [cards, total] = await Promise.all([
                this.client.card.findMany({
                    skip,
                    take: limit,
                    orderBy: {
                        created_at: 'asc',
                    },
                }),
                this.client.card.count(),
            ])

            return {
                data: cards.map(mapCard),
                limit,
                skip,
                total,
                filter: {
                    skip,
                    take: limit,
                },
            }
        } catch (error) {
            throw new RepositoryError('Failed to list cards', {
                cause: error,
                details: { operation: 'card.list' },
            })
        }
    }
}

export default CardRepository
