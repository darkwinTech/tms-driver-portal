import { getDb, saveDb, delay } from '../mock/db.js';
import { getSessionUser } from '../mock/session.js';

function currentUser() {
  const user = getSessionUser();
  if (!user) {
    const error = new Error('Not authenticated');
    error.response = { status: 401, data: { message: 'Not authenticated' } };
    throw error;
  }
  return user;
}

export async function listNotifications() {
  await delay(150);
  const user = currentUser();
  const db = getDb();
  const rows = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);
  return { data: rows };
}

export async function markNotificationRead(id) {
  await delay(100);
  const user = currentUser();
  const db = getDb();
  const notification = db.notifications.find((n) => n.id === Number(id) && n.userId === user.id);
  if (notification) {
    notification.isRead = true;
    saveDb();
  }
  return { data: notification };
}

export async function markAllNotificationsRead() {
  await delay(100);
  const user = currentUser();
  const db = getDb();
  db.notifications.filter((n) => n.userId === user.id).forEach((n) => { n.isRead = true; });
  saveDb();
  return { data: { message: 'All notifications marked as read' } };
}
