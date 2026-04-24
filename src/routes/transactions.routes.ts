import { Router } from 'express'
import TransactionController from '../controllers/transactions/transaction.controller'
import { asyncHandler } from '../controllers/helpers/http'

const transactionController = new TransactionController()
const transactionsRouter = Router()

transactionsRouter.post('/', asyncHandler((req, res) => transactionController.create(req, res)))

export default transactionsRouter
