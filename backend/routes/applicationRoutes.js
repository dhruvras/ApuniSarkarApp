import express from 'express';
import {
  createApplication,
  getMyApplications,
  getApplicationStats,
  getApplicationById,
  advanceApplicationStage,
} from '../controllers/applicationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createApplication);
router.get('/', getMyApplications);
router.get('/stats/summary', getApplicationStats);
router.get('/:id', getApplicationById);
router.patch('/:id/advance', advanceApplicationStage);

export default router;

