import { store, nextId } from '../store.js';

export async function findAll(predicate) {
  return predicate ? store.users.filter(predicate) : store.users.slice();
}

export async function findById(id) {
  return store.users.find((u) => u.id === Number(id)) || null;
}

export async function findByEmail(email) {
  const normalized = String(email).toLowerCase().trim();
  return store.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function create(data) {
  const user = { id: nextId('user'), ...data };
  store.users.push(user);
  return user;
}




