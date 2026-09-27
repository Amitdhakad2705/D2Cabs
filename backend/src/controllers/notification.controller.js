import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Same 3 handlers serve customers (their own) and admin (forAdmin = true).
function make(getScope) {
  return {
    list: asyncHandler(async (req, res) => {
      const scope = getScope(req);
      const [notifications, unread] = await Promise.all([
        Notification.find(scope).sort({ createdAt: -1 }).limit(50).lean(),
        Notification.countDocuments({ ...scope, isRead: false }),
      ]);
      res.json({ success: true, notifications, unread });
    }),
    read: asyncHandler(async (req, res) => {
      const n = await Notification.findOneAndUpdate({ _id: req.params.id, ...getScope(req) }, { isRead: true }, { new: true });
      if (!n) throw new ApiError(404, 'Notification not found.');
      res.json({ success: true });
    }),
    readAll: asyncHandler(async (req, res) => {
      await Notification.updateMany({ ...getScope(req), isRead: false }, { isRead: true });
      res.json({ success: true });
    }),
  };
}

export const customerNotifications = make((req) => ({ userId: req.user._id }));
export const adminNotifications = make(() => ({ forAdmin: true }));
