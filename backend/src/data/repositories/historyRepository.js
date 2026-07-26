import { store, nextId } from '../store.js';

export async function findByRequestId(requestId) {
  return store.history.filter((h) => h.requestId === Number(requestId));
}

export async function create(data) {
  const entry = { id: nextId('history'), ...data };
  store.history.push(entry);
  return entry;
}

