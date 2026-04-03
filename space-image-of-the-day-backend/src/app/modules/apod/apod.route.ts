import { Router } from 'express';
import { ApodController } from './apod.controller.js';

const router = Router();

router.get('/', ApodController.getApod);
router.get('/random', ApodController.getRandomApod);

export const ApodRoutes = router;
