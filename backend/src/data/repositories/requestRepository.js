import { store, nextId } from '../store.js';

export async function findAll(predicate) {
  return predicate ? store.requests.filter(predicate) : store.requests.slice();
}

export async function findById(id) {
  return store.requests.find((r) => r.id === Number(id)) || null;
}

export async function create(data) {
  const request = { id: nextId('request'), ...data };
  store.requests.push(request);
  return request;
}

export async function update(id, patch) {
  const row = await findById(id);
  if (!row) return null;
  Object.assign(row, patch);
  return row;
}

export function getRequestTypes() {
  return store.requestTypes;
}

export function getRequestStatuses() {
  return store.requestStatuses;
}



