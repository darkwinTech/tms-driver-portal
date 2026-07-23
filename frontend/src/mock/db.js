import { buildSeed } from './seedData.js';

const STORAGE_KEY = 'tms_mock_db_v5';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read mock DB from localStorage, reseeding.', e);
  }
  const seed = buildSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

let db = load();

export function getDb() {
  return db;
}

export function saveDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function nextId(entity) {
  const id = db.nextIds[entity]++;
  saveDb();
  return id;
}

export function resetDb() {
  db = buildSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

// Simulates a bit of network latency so loading states are visible.
export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
