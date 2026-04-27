import { Router } from 'express'
import aiRouter from './ai.routes'
import balancesRouter from './balances.routes'
import cardsRouter from './cards.routes'
import transactionsRouter from './transactions.routes'

const apiRouter = Router()

apiRouter.use('/transacoes', transactionsRouter)
apiRouter.use('/cartoes', cardsRouter)
apiRouter.use('/saldos', balancesRouter)
apiRouter.use('/ai', aiRouter)

export default apiRouter
