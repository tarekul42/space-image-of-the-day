import express from 'express';
import * as apodController from './apod.controller.js';
const router = express.Router();
router.get('/', apodController.getApodByDate);
router.get('/random', apodController.getRandomApod);
router.get('/history', apodController.getApodHistory);
export default router;
