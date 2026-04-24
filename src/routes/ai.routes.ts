import { Router } from 'express'
import AIController from '../controllers/ai/ai.controller'
import { asyncHandler } from '../controllers/helpers/http'

const aiController = new AIController()
const aiRouter = Router()

aiRouter.post('/sugerir-categoria', asyncHandler((req, res) => aiController.suggestCategory(req, res)))

export default aiRouter
