import { Router } from 'express'
import CardController from '../controllers/cards/card.controller'
import { asyncHandler } from '../controllers/helpers/http'

const cardController = new CardController()
const cardsRouter = Router()

cardsRouter.post('/', asyncHandler((req, res) => cardController.create(req, res)))
cardsRouter.get('/:id', asyncHandler((req, res) => cardController.getById(req, res)))

export default cardsRouter
