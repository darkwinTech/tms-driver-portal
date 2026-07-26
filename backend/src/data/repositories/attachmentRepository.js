import { store, nextId } from '../store.js';

export async function findByRequestId(requestId) {
  return store.attachments.filter((a) => a.requestId === Number(requestId));
}

export async function findById(id) {
  return store.attachments.find((a) => a.id === Number(id)) || null;
}

export async function create(data) {
  const attachment = { id: nextId('attachment'), ...data };
  store.attachments.push(attachment);
  return attachment;
}
