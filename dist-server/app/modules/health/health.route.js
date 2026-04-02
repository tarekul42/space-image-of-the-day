import express from 'express';
import * as healthController from './health.controller.js';
const router = express.Router();
router.get('/', healthController.checkHealth);
export default router;
