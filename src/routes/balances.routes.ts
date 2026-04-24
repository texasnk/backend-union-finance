import { Router } from 'express'
import BalanceController from '../controllers/balances/balance.controller'
import { asyncHandler } from '../controllers/helpers/http'

const balanceController = new BalanceController()
const balancesRouter = Router()

balancesRouter.get('/', asyncHandler((req, res) => balanceController.getMonthlyBalance(req, res)))
balancesRouter.get('/insights', asyncHandler((req, res) => balanceController.getMonthlyInsight(req, res)))

export default balancesRouter
