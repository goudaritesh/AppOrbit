import { Router } from 'express';
import {
  getDoubts,
  getDoubtById,
  createDoubt,
  addReply,
  upvoteDoubt,
  acceptReply,
} from '../controllers/doubtController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.route('/')
  .get(getDoubts)
  .post(protect, createDoubt);

router.route('/:id')
  .get(getDoubtById);

router.post('/:id/replies', protect, addReply);
router.post('/:id/upvote', protect, upvoteDoubt);
router.post('/:id/replies/:replyId/accept', protect, acceptReply);

export default router;
