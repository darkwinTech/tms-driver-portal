import { store, nextId } from '../store.js';

export async function findByUserId(userId) {
  return store.notifications.filter((n) => n.userId === Number(userId));
}

export async function create(data) {
  const notification = { id: nextId('notification'), ...data };
  store.notifications.push(notification);
  return notification;
}

export async function markAllReadForUser(userId) {
  store.notifications
    .filter((n) => n.userId === Number(userId))
    .forEach((n) => { n.isRead = true; });
}

