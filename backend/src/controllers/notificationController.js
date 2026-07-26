import { notificationRepository } from '../data/index.js';
export async function list(req, res) {
  const rows = (await notificationRepository.findByUserId(req.user.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);
  res.json(rows);
}
export async function markAllRead(req, res) {
  await notificationRepository.markAllReadForUser(req.user.id);
  res.json({ message: 'All notifications marked as read' });
}
