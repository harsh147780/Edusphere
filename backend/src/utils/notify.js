import { Notification } from '../models/Notification.js';
import { Activity } from '../models/Activity.js';

export const notify = async ({ user, title, message, type = 'info', link = '' }) => {
  if (!user) return;
  await Notification.create({ user, title, message, type, link });
};

export const notifyMany = async (userIds, payload) => {
  if (!userIds?.length) return;
  await Notification.insertMany(userIds.map((user) => ({ ...payload, user })));
};

export const logActivity = async ({ user, action, entityType = '', entityId = '', meta = {} }) => {
  if (!user) return;
  await Activity.create({ user, action, entityType, entityId: String(entityId), meta });
};
