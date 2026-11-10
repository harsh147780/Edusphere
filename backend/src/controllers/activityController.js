import { Activity } from '../models/Activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageParams, paged } from '../utils/paginate.js';

export const listActivity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req, 20);
  const q = {};
  if (req.query.user) q.user = req.query.user;
  const [items, total] = await Promise.all([
    Activity.find(q).populate('user', 'name role email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Activity.countDocuments(q)
  ]);
  res.json(paged(items, total, page, limit));
});
