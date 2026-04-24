import { PaginationParamsDto } from './pagination.dto'

export interface CreateCardBodyDto {
    name: string
    closing_day: number
    due_day: number
}

export interface CardResponseDto {
    id: string
    name: string
    closing_day: number
    due_day: number
    created_at: Date
}

export interface CardsParamsDto extends PaginationParamsDto { }
