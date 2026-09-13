import Doubt from '../models/Doubt.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const getDoubts = asyncHandler(async (req, res, next) => {
  const doubts = await Doubt.find()
    .populate('author', 'name role profileImage')
    .sort('-createdAt')
    .limit(50);
    
  res.status(200).json({ success: true, count: doubts.length, data: doubts });
});

export const getDoubtById = asyncHandler(async (req, res, next) => {
  const doubt = await Doubt.findById(req.params.id)
    .populate('author', 'name role profileImage')
    .populate('replies.author', 'name role profileImage');
    
  if (!doubt) return next(new AppError('Doubt not found', 404));
  
  // increment view count
  doubt.views += 1;
  await doubt.save();
  
  res.status(200).json({ success: true, data: doubt });
});

export const createDoubt = asyncHandler(async (req, res, next) => {
  const { title, content, tags } = req.body;
  const doubt = await Doubt.create({
    title,
    content,
    tags,
    author: req.user._id,
  });
  
  res.status(201).json({ success: true, data: doubt });
});

export const addReply = asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  const doubt = await Doubt.findById(req.params.id);
  
  if (!doubt) return next(new AppError('Doubt not found', 404));
  
  doubt.replies.push({
    author: req.user._id,
    content,
  });
  
  await doubt.save();
  res.status(201).json({ success: true, data: doubt });
});

export const upvoteDoubt = asyncHandler(async (req, res, next) => {
  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return next(new AppError('Doubt not found', 404));
  
  if (doubt.upvotes.includes(req.user._id)) {
    doubt.upvotes = doubt.upvotes.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    doubt.upvotes.push(req.user._id);
  }
  
  await doubt.save();
  res.status(200).json({ success: true, data: doubt });
});

export const acceptReply = asyncHandler(async (req, res, next) => {
  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return next(new AppError('Doubt not found', 404));
  
  // only author can accept
  if (doubt.author.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }
  
  const reply = doubt.replies.id(req.params.replyId);
  if (!reply) return next(new AppError('Reply not found', 404));
  
  reply.isAcceptedAnswer = !reply.isAcceptedAnswer;
  await doubt.save();
  
  res.status(200).json({ success: true, data: doubt });
});
