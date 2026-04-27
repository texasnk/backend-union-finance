export interface PaginationParamsDto {
    skip?: number
    take?: number
}

export interface PaginatedListDto<F, T = F> {
    data: T[]
    limit: number
    skip: number
    total: number
    filter: F
}
