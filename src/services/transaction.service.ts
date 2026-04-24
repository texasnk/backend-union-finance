import { CreateTransactionBodyDto, TransactionResponseDto } from '../dtos/transaction.dto'
import TransactionRepository from '../repositories/transaction.repository'

export class TransactionService {
    constructor(private readonly transactionRepository: TransactionRepository = new TransactionRepository()) { }

    /** Creates a transaction using the existing persistence contract. */
    async create(input: CreateTransactionBodyDto): Promise<TransactionResponseDto> {
        return this.transactionRepository.create(input)
    }
}

export default TransactionService
