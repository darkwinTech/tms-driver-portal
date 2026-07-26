import { store, nextId } from '../store.js';

export async function findAll(predicate) {
  return predicate ? store.drivers.filter(predicate) : store.drivers.slice();
}

export async function findById(id) {
  return store.drivers.find((d) => d.id === Number(id)) || null;
}

export async function findByRequestId(requestId) {
  return store.drivers.filter((d) => d.requestId === Number(requestId));
}

export async function create(data) {
  const driver = { id: nextId('driver'), ...data };
  store.drivers.push(driver);
  return driver;
}

export async function bulkCreate(rows) {
  return Promise.all(rows.map((row) => create(row)));
}

export async function update(id, patch) {
  const row = await findById(id);
  if (!row) return null;
  Object.assign(row, patch);
  return row;
}

export async function removeByRequestId(requestId) {
  store.drivers = store.drivers.filter((d) => d.requestId !== Number(requestId));
}

